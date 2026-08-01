import { NextRequest, NextResponse } from "next/server"
import { getStripe, isStripeAvailable } from "@/lib/stripe/server"
import { STRIPE_CONFIG, getPlanById } from "@/lib/stripe/config"
import { requireAuth } from "@/lib/api-auth"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const checkoutItemSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  quantity: z.number().int().min(1).max(100),
  image: z.string().max(1000).optional(),
})

const checkoutSchema = z.object({
  type: z.enum(["membership", "marketplace"]),
  items: z.array(checkoutItemSchema).max(100).optional(),
  planId: z.string().min(1).max(100).optional(),
  orderId: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  successUrl: z.string().max(1000).optional(),
  cancelUrl: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "stripe-checkout" })
  if (limited) return limited

  if (!isStripeAvailable()) {
    return NextResponse.json(
      { error: "Stripe no está configurado. Contacta al administrador." },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Solicitud de checkout inválida" }, { status: 400 })
    }
    const { type, items, planId, orderId, source, successUrl, cancelUrl } = parsed.data

    const stripe = getStripe()
    const userId = auth.auth.userId
    const metadata: Record<string, string> = {
      userId,
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
        client_reference_id: userId,
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
        client_reference_id: userId,
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
