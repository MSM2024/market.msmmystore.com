import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith("sk_live_TU") || key.startsWith("sk_test_TU")) return null
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" })
}

interface CheckoutItem {
  name: string
  price: number
  quantity: number
  image?: string
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  try {
    const { items, orderId, successUrl, cancelUrl } = await request.json() as {
      items: CheckoutItem[]
      orderId: string
      successUrl: string
      cancelUrl: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl || `${request.nextUrl.origin}/marketplace/pedidos?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/marketplace/pedidos?canceled=true`,
      metadata: {
        orderId: orderId || "",
      },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error("Checkout error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
