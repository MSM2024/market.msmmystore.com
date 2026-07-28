import { NextRequest, NextResponse } from "next/server"
import { getStripe, isStripeAvailable } from "@/lib/stripe/server"
import { STRIPE_PLANS, STRIPE_CONFIG, getPlanById } from "@/lib/stripe/config"

export async function GET() {
  if (!isStripeAvailable()) {
    return NextResponse.json(
      { error: "Stripe no está configurado" },
      { status: 503 }
    )
  }

  try {
    const stripe = getStripe()
    const plans = STRIPE_PLANS.filter((p) => p.priceId).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      priceId: plan.priceId,
    }))

    return NextResponse.json({ plans })
  } catch (err) {
    console.error("Stripe billing error:", err)
    return NextResponse.json(
      { error: "Error al obtener planes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json(
      { error: "Stripe no está configurado" },
      { status: 503 }
    )
  }

  try {
    const { action, subscriptionId, planId, customerId } = await request.json()

    const stripe = getStripe()

    switch (action) {
      case "subscribe": {
        if (!planId || !customerId) {
          return NextResponse.json(
            { error: "planId y customerId son requeridos" },
            { status: 400 }
          )
        }

        const plan = getPlanById(planId)
        if (!plan?.priceId) {
          return NextResponse.json(
            { error: "Plan no encontrado" },
            { status: 400 }
          )
        }

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: plan.priceId, quantity: 1 }],
          success_url: STRIPE_CONFIG.checkout.successUrl,
          cancel_url: STRIPE_CONFIG.checkout.cancelUrl,
          metadata: { planId, source: "membership" },
          subscription_data: {
            metadata: { planId, source: "membership" },
          },
        })

        return NextResponse.json({ url: session.url, sessionId: session.id })
      }

      case "cancel": {
        if (!subscriptionId) {
          return NextResponse.json(
            { error: "subscriptionId es requerido" },
            { status: 400 }
          )
        }

        const canceled = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })

        return NextResponse.json({
          subscription: {
            id: canceled.id,
            status: canceled.status,
            cancelAt: canceled.cancel_at,
          },
        })
      }

      case "reactivate": {
        if (!subscriptionId) {
          return NextResponse.json(
            { error: "subscriptionId es requerido" },
            { status: 400 }
          )
        }

        const reactivated = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        })

        return NextResponse.json({
          subscription: {
            id: reactivated.id,
            status: reactivated.status,
            cancelAt: reactivated.cancel_at,
          },
        })
      }

      case "upgrade": {
        if (!subscriptionId || !planId) {
          return NextResponse.json(
            { error: "subscriptionId y planId son requeridos" },
            { status: 400 }
          )
        }

        const newPlan = getPlanById(planId)
        if (!newPlan?.priceId) {
          return NextResponse.json(
            { error: "Plan no encontrado" },
            { status: 400 }
          )
        }

        const currentSub = await stripe.subscriptions.retrieve(subscriptionId)
        const currentItemId = currentSub.items.data[0]?.id

        if (!currentItemId) {
          return NextResponse.json(
            { error: "No se encontró el item de suscripción actual" },
            { status: 400 }
          )
        }

        const updated = await stripe.subscriptions.update(subscriptionId, {
          items: [{ id: currentItemId, price: newPlan.priceId }],
          proration_behavior: "create_prorations",
          metadata: { planId, source: "membership" },
        })

        return NextResponse.json({
          subscription: {
            id: updated.id,
            status: updated.status,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: "Acción inválida" },
          { status: 400 }
        )
    }
  } catch (err) {
    console.error("Stripe billing action error:", err)
    return NextResponse.json(
      { error: "Error al procesar la acción" },
      { status: 500 }
    )
  }
}
