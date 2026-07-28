import type { StripePlan, StripeConfig } from "./types"

export const STRIPE_PLANS: StripePlan[] = [
  {
    id: "free",
    name: "ZAFIRO Free",
    description: "Acceso básico al ecosistema ZAFIRO",
    price: 0,
    interval: "month",
    features: [
      "Acceso al feed de conocimiento",
      "10 preguntas por día",
      "ELIANA básico",
      "Perfil público",
      "100 PTS/día",
      "Unirte a círculos",
    ],
    priceId: null,
  },
  {
    id: "pro",
    name: "ZAFIRO Pro",
    description: "ELIANA avanzado con Gemini y analytics",
    price: 9.99,
    interval: "month",
    features: [
      "Todo lo de Free",
      "Preguntas ilimitadas",
      "ELIANA avanzado con Gemini",
      "Analytics de conocimiento",
      "500 PTS/día",
      "Prioridad en soporte",
      "Modo oscuro premium",
      "Exportar datos",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || null,
  },
  {
    id: "cuba_plus",
    name: "ZAFIRO Cuba Plus",
    description: "Acceso completo con contenido exclusivo Cuba",
    price: 14.99,
    interval: "month",
    features: [
      "Todo lo de Pro",
      "Acceso a contenido exclusivo Cuba",
      "ELIANA con contexto completo",
      "1000 PTS/día",
      "Sponsor destacado 1 mes",
      "Analytics avanzados",
      "API access",
      "Badge Cuba Plus exclusivo",
      "Soporte prioritario 24/7",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS || null,
  },
]

export const STRIPE_CONFIG: StripeConfig = {
  plans: STRIPE_PLANS,
  checkout: {
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://zafiro.msmmystore.com"}/memberships?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://zafiro.msmmystore.com"}/memberships?canceled=true`,
  },
  portal: {
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://zafiro.msmmystore.com"}/settings`,
  },
}

export function getPlanByPriceId(priceId: string): StripePlan | undefined {
  return STRIPE_PLANS.find((p) => p.priceId === priceId)
}

export function getPlanById(planId: string): StripePlan | undefined {
  return STRIPE_PLANS.find((p) => p.id === planId)
}

export function getAnnualPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.8 * 100) / 100
}

export const MARKETPLACE_FEE_PERCENT = 5
export const MSM_SERVICE_FEE_PERCENT = 2.5
