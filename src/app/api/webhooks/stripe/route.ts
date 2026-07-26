import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith("sk_live_TU") || key.startsWith("sk_test_TU")) return null
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" })
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature") || ""

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      console.log("✅ Checkout completed:", session.id, "amount:", session.amount_total)
      // TODO: Update order status in Supabase
      break
    }
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent
      console.log("✅ Payment succeeded:", intent.id)
      break
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent
      console.log("❌ Payment failed:", intent.id)
      break
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      console.log("💸 Refund processed:", charge.id)
      break
    }
    default:
      console.log("Unhandled event type:", event.type)
  }

  return NextResponse.json({ received: true })
}
