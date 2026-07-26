// ================================================================
// PRICING ENGINE — Motor de precios configurable
// Fórmula: precio_proveedor + envío + impuesto + comisión + cargo_MSM + margen + reserva
// ================================================================

import type { MarketplaceProduct, MarketplaceCategory, MarketplaceProvider } from "./types"
import { getFlag } from "./feature-flags"

export interface PricingBreakdown {
  provider_price: number
  shipping_cost: number
  tax_amount: number
  payment_processing_fee: number
  msm_service_fee: number
  seller_margin: number
  operational_reserve: number
  final_price: number
  currency: string
}

export interface PricingRule {
  type: 'percentage' | 'fixed' | 'manual' | 'tiered'
  value: number
  min?: number
  max?: number
  tiers?: Array<{ min: number; max: number; value: number }>
}

// --- Calcular precio final ---
export async function calculateFinalPrice(
  providerPrice: number,
  options: {
    shipping?: number
    taxRate?: number
    margin?: number
    marginRule?: PricingRule
    storeCommissionRate?: number
    categoryCommissionRate?: number
    providerCommissionRate?: number
    currency?: string
    applyReserve?: boolean
  } = {}
): Promise<PricingBreakdown> {
  const {
    shipping = 0,
    taxRate = 0,
    margin = 0,
    marginRule,
    storeCommissionRate,
    categoryCommissionRate,
    providerCommissionRate,
    currency = "USD",
    applyReserve = true,
  } = options

  const serviceFeeRate = await getFlag<number>("SERVICE_FEE_RATE")
  const defaultCommission = await getFlag<number>("DEFAULT_COMMISSION_RATE")

  // 1. Precio del proveedor
  const baseProviderPrice = providerPrice

  // 2. Envío
  const shippingCost = shipping

  // 3. Impuesto
  const taxAmount = baseProviderPrice * (taxRate / 100)

  // 4. Comisión de procesamiento de pago (estimada 2.9% + $0.30 para Stripe)
  const paymentProcessingFee = (baseProviderPrice + shippingCost + taxAmount) * 0.029 + 0.30

  // 5. Cargo de servicio MSM
  const msmServiceFee = (baseProviderPrice + shippingCost + taxAmount) * (serviceFeeRate / 100)

  // 6. Margen del vendedor
  let sellerMargin = margin
  if (marginRule) {
    sellerMargin = calculateMarginFromRule(baseProviderPrice, marginRule)
  }
  const sellerMarginAmount = baseProviderPrice * (sellerMargin / 100)

  // 7. Reserva operativa (2% del subtotal)
  const operationalReserve = applyReserve ? (baseProviderPrice + shippingCost + taxAmount) * 0.02 : 0

  // 8. Precio final
  const finalPrice = baseProviderPrice + shippingCost + taxAmount + paymentProcessingFee + msmServiceFee + sellerMarginAmount + operationalReserve

  return {
    provider_price: baseProviderPrice,
    shipping_cost: shippingCost,
    tax_amount: taxAmount,
    payment_processing_fee: paymentProcessingFee,
    msm_service_fee: msmServiceFee,
    seller_margin: sellerMarginAmount,
    operational_reserve: operationalReserve,
    final_price: Math.round(finalPrice * 100) / 100,
    currency,
  }
}

// --- Calcular margen desde regla ---
function calculateMarginFromRule(price: number, rule: PricingRule): number {
  if (rule.type === "manual") return rule.value

  if (rule.type === "percentage") {
    let margin = rule.value
    if (rule.min !== undefined) margin = Math.max(margin, rule.min)
    if (rule.max !== undefined) margin = Math.min(margin, rule.max)
    return margin
  }

  if (rule.type === "fixed") {
    return price > 0 ? (rule.value / price) * 100 : 0
  }

  if (rule.type === "tiered" && rule.tiers) {
    for (const tier of rule.tiers) {
      if (price >= tier.min && price <= tier.max) {
        return tier.value
      }
    }
    return rule.tiers[rule.tiers.length - 1]?.value || 0
  }

  return rule.value
}

// --- Calcular descuento de cupón ---
export async function calculateCouponDiscount(
  subtotal: number,
  couponType: string,
  couponValue: number,
  maxDiscount: number = 0,
  productIds: string[] = [],
  applicableProducts: string[] = [],
  applicableCategories: string[] = []
): Promise<{ discount: number; finalSubtotal: number }> {
  let discount = 0

  switch (couponType) {
    case "percentage":
      discount = subtotal * (couponValue / 100)
      if (maxDiscount > 0) discount = Math.min(discount, maxDiscount)
      break
    case "fixed_amount":
      discount = Math.min(couponValue, subtotal)
      break
    case "free_shipping":
      // Se maneja aparte en el cálculo de envío
      discount = 0
      break
    case "buy_x_get_y":
      // Lógica especial: comprar X llevar Y gratis
      // Por simplicidad, aplicar un descuento porcentual basado en el ratio
      discount = subtotal * (couponValue / 100)
      break
  }

  return {
    discount: Math.round(discount * 100) / 100,
    finalSubtotal: Math.round((subtotal - discount) * 100) / 100,
  }
}

// --- Calcular comisiones para un pedido ---
export async function calculateOrderCommissions(
  subtotal: number,
  shippingCost: number,
  storeCommissionRate?: number,
  providerCost?: number
): Promise<{
  marketplace_fee: number
  seller_commission: number
  provider_cost: number
  payment_processing: number
  net_profit: number
}> {
  const defaultCommission = await getFlag<number>("DEFAULT_COMMISSION_RATE")
  const serviceFeeRate = await getFlag<number>("SERVICE_FEE_RATE")

  const commissionRate = storeCommissionRate || defaultCommission
  const totalBase = subtotal + shippingCost

  const marketplaceFee = totalBase * (commissionRate / 100)
  const sellerCommission = totalBase * (serviceFeeRate / 100)
  const providerCostAmount = providerCost || 0
  const paymentProcessing = totalBase * 0.029 + 0.30

  const netProfit = marketplaceFee - sellerCommission - providerCostAmount - paymentProcessing

  return {
    marketplace_fee: Math.round(marketplaceFee * 100) / 100,
    seller_commission: Math.round(sellerCommission * 100) / 100,
    provider_cost: Math.round(providerCostAmount * 100) / 100,
    payment_processing: Math.round(paymentProcessing * 100) / 100,
    net_profit: Math.round(netProfit * 100) / 100,
  }
}

// --- Verificar si un cupón es válido ---
export function isCouponValid(
  coupon: {
    is_active: boolean
    valid_from: string
    valid_until: string | null
    current_uses: number
    max_uses_total: number
    min_order_amount: number
  },
  subtotal: number
): { valid: boolean; reason?: string } {
  if (!coupon.is_active) return { valid: false, reason: "Cupón desactivado" }

  const now = new Date()
  if (new Date(coupon.valid_from) > now) return { valid: false, reason: "Cupón aún no activo" }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return { valid: false, reason: "Cupón expirado" }

  if (coupon.max_uses_total > 0 && coupon.current_uses >= coupon.max_uses_total) {
    return { valid: false, reason: "Cupón agotado" }
  }

  if (subtotal < coupon.min_order_amount) {
    return { valid: false, reason: `Mínimo de compra: $${coupon.min_order_amount}` }
  }

  return { valid: true }
}
