import { NextResponse } from "next/server"
import { getStripe, isStripeAvailable } from "@/lib/stripe/server"
import { STRIPE_CONFIG } from "@/lib/stripe/config"
import { requireAuth } from "@/lib/api-auth"

export async function POST() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const auth = authResult.auth

  if (!isStripeAvailable()) {
    return NextResponse.json(
      { error: "Stripe no está configurado" },
      { status: 503 }
    )
  }

  try {
    const stripe = getStripe()
    const customers = await stripe.customers.list({ email: auth.email, limit: 1 })
    const customerId = customers.data[0]?.id

    if (!customerId) {
      return NextResponse.json(
        { error: "No se encontró un cliente de facturación para esta cuenta" },
        { status: 400 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: STRIPE_CONFIG.portal.returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe portal error:", err)
    return NextResponse.json(
      { error: "Error al crear sesión del portal" },
      { status: 500 }
    )
  }
}
