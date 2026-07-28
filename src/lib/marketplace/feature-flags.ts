// ================================================================
// MARKETPLACE FEATURE FLAGS — Configuración del sistema
// ================================================================

import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

export interface FeatureFlag {
  key: string
  value: unknown
  description: string
}

// Cache en memoria para flags del marketplace
let flagsCache: Record<string, unknown> | null = null
let lastFetch = 0
const CACHE_TTL = 30_000 // 30 segundos

const DEFAULT_FLAGS: Record<string, unknown> = {
  MARKETPLACE_ENABLED: true,
  AMAZON_PROVIDER_ENABLED: false,
  WALMART_PROVIDER_ENABLED: false,
  SAMS_PROVIDER_ENABLED: false,
  HOME_DEPOT_PROVIDER_ENABLED: false,
  SHEIN_PROVIDER_ENABLED: false,
  CUBA_DELIVERY_ENABLED: false,
  INTERNATIONAL_DELIVERY_ENABLED: false,
  DEFAULT_COMMISSION_RATE: 10,
  MIN_SELLER_COMMISSION: 5,
  MAX_SELLER_COMMISSION: 50,
  SERVICE_FEE_RATE: 2.5,
  AUTO_APPROVE_PRODUCTS: false,
  AUTO_APPROVE_STORES: false,
  MIN_PRODUCT_PRICE: 0.01,
  MAX_PRODUCT_PRICE: 999999.99,
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_PRODUCT_VARIANTS: 50,
  ALLOW_PRICE_MANUAL_OVERRIDE: true,
  ENABLE_COUPONS: true,
  ENABLE_REVIEWS: true,
  ENABLE_FAVORITES: true,
  ENABLE_DISPUTES: true,
  SELLER_CAN_REPLY_REVIEWS: true,
  DISPUTE_SELLER_DEADLINE_HOURS: 72,
  ORDER_AUTO_COMPLETE_DAYS: 14,
  PAYMENT_UNDER_REVIEW_HOURS: 24,
  LOW_STOCK_THRESHOLD_DEFAULT: 5,
}

function getSupabase() {
  if (!isSupabaseAvailable()) return null
  return getSupabaseClient()
}

export async function fetchFeatureFlags(): Promise<Record<string, unknown>> {
  const now = Date.now()
  if (flagsCache && now - lastFetch < CACHE_TTL) return flagsCache

  const supabase = getSupabase()
  if (!supabase) {
    flagsCache = DEFAULT_FLAGS
    return DEFAULT_FLAGS
  }

  try {
    const { data, error } = await supabase
      .from("marketplace_config")
      .select("key, value")

    if (error || !data) {
      flagsCache = DEFAULT_FLAGS
      return DEFAULT_FLAGS
    }

    const flags: Record<string, unknown> = {}
    for (const row of data) {
      const val = row.value as { value: unknown }
      flags[row.key] = val?.value ?? false
    }

    // Merge con defaults para keys que no existan en BD
    for (const [key, value] of Object.entries(DEFAULT_FLAGS)) {
      if (!(key in flags)) flags[key] = value
    }

    flagsCache = flags
    lastFetch = now
    return flags
  } catch {
    flagsCache = DEFAULT_FLAGS
    return DEFAULT_FLAGS
  }
}

export async function getFlag<T = unknown>(key: string): Promise<T> {
  const flags = await fetchFeatureFlags()
  return (flags[key] as T) ?? (DEFAULT_FLAGS[key] as T)
}

export async function isMarketplaceEnabled(): Promise<boolean> {
  return getFlag<boolean>("MARKETPLACE_ENABLED")
}

export async function isProviderEnabled(provider: string): Promise<boolean> {
  return getFlag<boolean>(`${provider.toUpperCase()}_PROVIDER_ENABLED`)
}

export async function isCubaDeliveryEnabled(): Promise<boolean> {
  return getFlag<boolean>("CUBA_DELIVERY_ENABLED")
}

export async function isInternationalDeliveryEnabled(): Promise<boolean> {
  return getFlag<boolean>("INTERNATIONAL_DELIVERY_ENABLED")
}

export async function getCommissionRate(): Promise<number> {
  return getFlag<number>("DEFAULT_COMMISSION_RATE")
}

export async function getServiceFeeRate(): Promise<number> {
  return getFlag<number>("SERVICE_FEE_RATE")
}

export function clearFlagsCache(): void {
  flagsCache = null
  lastFetch = 0
}
