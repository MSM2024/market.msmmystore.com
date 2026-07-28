export interface StripePlan {
  id: string
  name: string
  description: string
  price: number
  interval: "month" | "year"
  features: string[]
  priceId: string | null
}

export interface StripeConfig {
  plans: StripePlan[]
  checkout: {
    successUrl: string
    cancelUrl: string
  }
  portal: {
    returnUrl: string
  }
}

export type StripeEventType =
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "charge.refunded"

export interface MembershipActivation {
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: "active" | "canceled" | "past_due"
  currentPeriodEnd: string
}

export interface CheckoutMetadata {
  userId?: string
  planId?: string
  orderId?: string
  source?: "membership" | "marketplace" | "academia" | "inventa" | "cultura" | "solver"
}
