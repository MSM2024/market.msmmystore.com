import { NextRequest, NextResponse } from "next/server"
import { getStripe, getWebhookSecret, isStripeAvailable } from "@/lib/stripe/server"
import { isEventProcessed, markEventProcessed } from "@/lib/stripe/idempotency"
import { getPlanByPriceId, getPlanById } from "@/lib/stripe/config"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import type Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    const webhookSecret = getWebhookSecret()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (await isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err)
    return NextResponse.json({ error: "Event processing failed" }, { status: 500 })
  }

  await markEventProcessed(event.id, event.type)

  return NextResponse.json({ received: true })
}

async function getDb() {
  return getSupabaseAdminClient()
}

async function updateProfilePlan(userId: string, planId: string, subscriptionId?: string, status?: string) {
  const db = await getDb()
  if (!db) return

  const updates: Record<string, string | null> = {
    plan: planId,
    updated_at: new Date().toISOString(),
  }
  if (subscriptionId) updates.stripe_subscription_id = subscriptionId
  if (status) updates.stripe_subscription_status = status

  await db.from("profiles").update(updates).eq("id", userId)
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
      break

    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription)
      break

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break

    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge)
      break

    default:
      console.log(`Unhandled webhook event type: ${event.type}`)
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const source = session.metadata?.source || "marketplace"
  const userId = session.metadata?.userId

  if (!userId) return

  if (source === "membership") {
    const priceId = session.metadata?.priceId || session.metadata?.planId
    const plan = priceId ? getPlanByPriceId(priceId) || getPlanById(priceId) : null

    if (plan) {
      await updateProfilePlan(userId, plan.id, session.subscription as string, "active")
      console.log(`Membership activated: ${plan.id} for user ${userId}`)
    }
  }

  if (source === "marketplace" && session.metadata?.orderId) {
    const db = await getDb()
    if (db) {
      await db.from("marketplace_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", session.metadata.orderId)
      console.log(`Marketplace order paid: ${session.metadata.orderId}`)
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  console.log(`Checkout expired: ${session.id}`)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = priceId ? getPlanByPriceId(priceId) : null
  const planId = plan?.id || subscription.metadata?.planId || "unknown"

  await updateProfilePlan(userId, planId, subscription.id, subscription.status)
  console.log(`Subscription ${subscription.id}: status=${subscription.status} user=${userId} plan=${planId}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId
  if (!userId) return

  await updateProfilePlan(userId, "free", subscription.id, "canceled")
  console.log(`Subscription deleted: ${subscription.id} user=${userId} → plan reset to free`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const raw = invoice as unknown as Record<string, unknown>
  const subscriptionId = typeof raw.subscription === "string" ? raw.subscription : null
  let userId = typeof raw.metadata === "object" && raw.metadata ? (raw.metadata as Record<string, string>).userId : null

  const db = await getDb()
  if (!db) return

  if (!userId && subscriptionId) {
    const { data } = await db
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle()
    userId = data?.id || null
  }

  console.log(`Invoice paid: ${invoice.id} subscription=${subscriptionId} amount=${invoice.amount_paid}`)

  if (subscriptionId && userId) {
    await db.from("payments").upsert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: "paid",
      created_at: new Date().toISOString(),
    }, { onConflict: "stripe_invoice_id" })
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const raw = invoice as unknown as Record<string, unknown>
  const subscriptionId = typeof raw.subscription === "string" ? raw.subscription : null
  let userId = typeof raw.metadata === "object" && raw.metadata ? (raw.metadata as Record<string, string>).userId : null

  const db = await getDb()
  if (!db) return

  if (!userId && subscriptionId) {
    const { data } = await db
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle()
    userId = data?.id || null
  }

  if (!userId) return

  await db.from("profiles").update({
    stripe_subscription_status: "past_due",
    updated_at: new Date().toISOString(),
  }).eq("id", userId)
  console.log(`Invoice payment failed: ${invoice.id} user=${userId} → past_due`)
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`Charge refunded: ${charge.id} amount=${charge.amount_refunded}`)
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null
  if (paymentIntentId) {
    const db = await getDb()
    if (db) {
      await db.from("payments").update({ status: "refunded" }).eq("stripe_payment_intent_id", paymentIntentId)
    }
  }
}
