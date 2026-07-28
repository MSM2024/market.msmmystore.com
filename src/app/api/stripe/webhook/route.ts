import { NextRequest, NextResponse } from "next/server"
import { getStripe, getWebhookSecret, isStripeAvailable } from "@/lib/stripe/server"
import { isEventProcessed, markEventProcessed } from "@/lib/stripe/idempotency"
import { getPlanByPriceId } from "@/lib/stripe/config"
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

  if (isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  markEventProcessed(event.id)

  try {
    await handleEvent(event)
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err)
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
      break

    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
      break

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
      break

    case "customer.subscription.created":
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

    case "invoice.payment_action_required":
      await handleInvoiceActionRequired(event.data.object as Stripe.Invoice)
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

  console.log(`✅ Checkout completed: ${session.id} | source: ${source} | amount: ${session.amount_total}`)

  if (source === "membership" && session.metadata?.planId && userId) {
    const plan = getPlanByPriceId(
      (session.subscription as unknown as Stripe.Subscription)?.items?.data?.[0]?.price?.id || ""
    )
    if (plan) {
      console.log(`📦 Membership activated: ${plan.name} for user ${userId}`)
    }
  }

  if (source === "marketplace" && session.metadata?.orderId) {
    console.log(`🛒 Marketplace order paid: ${session.metadata.orderId}`)
  }

  if (source === "academia") {
    console.log(`🎓 Academy enrollment paid for user ${userId}`)
  }

  if (source === "inventa") {
    console.log(`💡 Inventa submission paid for user ${userId}`)
  }

  if (source === "cultura") {
    console.log(`🎭 Cultura event paid for user ${userId}`)
  }

  if (source === "solver") {
    console.log(`🔧 Solver Link service paid for user ${userId}`)
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  console.log(`⏰ Checkout expired: ${session.id} | source: ${session.metadata?.source}`)
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  console.log(`💰 Payment succeeded: ${intent.id} | amount: ${intent.amount} | currency: ${intent.currency}`)
}

async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent): Promise<void> {
  console.log(`❌ Payment failed: ${intent.id} | error: ${intent.last_payment_error?.message}`)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId
  const planId = subscription.metadata?.planId
  const status = subscription.status

  console.log(`🔄 Subscription ${subscription.id}: status=${status} | user=${userId} | plan=${planId}`)

  if (status === "active" && userId && planId) {
    console.log(`✅ Subscription active for user ${userId}: plan ${planId}`)
  }

  if (status === "past_due" && userId) {
    console.log(`⚠️ Subscription past due for user ${userId}`)
  }

  if (status === "incomplete_expired" && userId) {
    console.log(`⏰ Subscription expired incomplete for user ${userId}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId
  console.log(`❌ Subscription deleted: ${subscription.id} | user=${userId}`)

  if (userId) {
    console.log(`🔄 Membership deactivated for user ${userId}`)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null
  console.log(`💰 Invoice paid: ${invoice.id} | subscription: ${subscriptionId} | amount: ${invoice.amount_paid}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null
  console.log(`❌ Invoice payment failed: ${invoice.id} | subscription: ${subscriptionId}`)
}

async function handleInvoiceActionRequired(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null
  console.log(`⚠️ Invoice payment action required: ${invoice.id} | subscription: ${subscriptionId}`)
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`💸 Charge refunded: ${charge.id} | amount: ${charge.amount_refunded} | reason: ${charge.refunds?.data?.[0]?.reason}`)
}
