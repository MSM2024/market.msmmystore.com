import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. " +
      "Add it to .env.local and restart the server."
    )
  }

  stripeInstance = new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
    appInfo: {
      name: "MSM Zafiro",
      version: "1.0.0",
      url: "https://zafiro.msmmystore.com",
    },
  })

  return stripeInstance
}

export function isStripeAvailable(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  return !!(key && !key.startsWith("sk_live_TU") && !key.startsWith("sk_test_TU") && key.length > 10)
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.")
  }
  return secret
}

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(body, signature, secret)
}
