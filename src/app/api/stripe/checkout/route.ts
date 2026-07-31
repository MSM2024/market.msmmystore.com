import { NextRequest, NextResponse } from "next/server"
import { getStripe, isStripeAvailable } from "@/lib/stripe/server"
import { STRIPE_CONFIG, getPlanById } from "@/lib/stripe/config"

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json(
      { error: "Stripe no está configurado. Contacta al administrador." },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { type, items, planId, userId, orderId, source, successUrl, cancelUrl } = body as {
      type: "membership" | "marketplace"
      items?: Array<{ name: string; price: number; quantity: number; image?: string }>
      planId?: string
      userId?: string
      orderId?: string
      source?: string
      successUrl?: string
      cancelUrl?: string
    }

    const stripe = getStripe()
    const metadata: Record<string, string> = {
      userId: userId || "",
      orderId: orderId || "",
      source: source || (type === "membership" ? "membership" : "marketplace"),
    }

    if (type === "membership") {
      if (!planId) {
        return NextResponse.json({ error: "planId es requerido" }, { status: 400 })
      }

      const plan = getPlanById(planId)
      if (!plan || !plan.priceId) {
        return NextResponse.json(
          { error: "Plan no encontrado o no configurado en Stripe" },
          { status: 400 }
        )
      }

      metadata.planId = planId

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: plan.priceId, quantity: 1 }],
        success_url: successUrl || STRIPE_CONFIG.checkout.successUrl,
        cancel_url: cancelUrl || STRIPE_CONFIG.checkout.cancelUrl,
        metadata,
        subscription_data: {
          metadata,
        },
      })

      return NextResponse.json({ url: session.url, sessionId: session.id })
    }

    if (type === "marketplace") {
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "No hay items" }, { status: 400 })
      }

      const lineItems = items.map((item) => ({
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

      const defaultSuccess = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/marketplace/pedidos?success=true&session_id={CHECKOUT_SESSION_ID}`
      const defaultCancel = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/marketplace/pedidos?canceled=true`
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        success_url: successUrl || defaultSuccess,
        cancel_url: cancelUrl || defaultCancel,
        metadata,
      })

      return NextResponse.json({ url: session.url, sessionId: session.id })
    }

    return NextResponse.json({ error: "Tipo de checkout inválido" }, { status: 400 })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json(
      { error: "Error al crear sesión de pago" },
      { status: 500 }
    )
  }
}
