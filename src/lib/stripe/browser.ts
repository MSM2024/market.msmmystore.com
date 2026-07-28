"use client"

import { loadStripe, type Stripe } from "@stripe/stripe-js"

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (stripePromise) return stripePromise

  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    stripePromise = Promise.resolve(null)
    return stripePromise
  }

  stripePromise = loadStripe(key)
  return stripePromise
}
