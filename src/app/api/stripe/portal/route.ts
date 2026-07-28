import { NextRequest, NextResponse } from "next/server"
import { getStripe, isStripeAvailable } from "@/lib/stripe/server"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json(
      { error: "Stripe no está configurado" },
      { status: 503 }
    )
  }

  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId es requerido" },
        { status: 400 }
      )
    }

    const stripe = getStripe()
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
