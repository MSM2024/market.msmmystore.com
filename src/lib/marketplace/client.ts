'use client'

import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import type {
  MarketplaceProduct, MarketplaceStore, MarketplaceCategory,
  MarketplaceProvider, MarketplaceOrder, OrderItem, MarketplaceReview,
  ProductWithStore, StoreWithStats, OrderWithItems,
} from "./types"

// ================================================================
// MARKETPLACE DATA CLIENT — Supabase CRUD operations
// ================================================================

function getClient() {
  return getSupabaseClient()
}

function hasDb(): boolean {
  return isSupabaseAvailable() && !!getClient()
}

// --- Categories ---
export async function fetchCategories(): Promise<MarketplaceCategory[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) { console.error("fetchCategories:", error); return [] }
  return data || []
}

// --- Providers ---
export async function fetchProviders(): Promise<MarketplaceProvider[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_providers")
    .select("*")
    .order("name")
  if (error) { console.error("fetchProviders:", error); return [] }
  return data || []
}

export async function fetchActiveProviders(): Promise<MarketplaceProvider[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_providers")
    .select("*")
    .eq("status", "active")
    .order("name")
  if (error) { console.error("fetchActiveProviders:", error); return [] }
  return data || []
}

// --- Stores ---
export async function fetchStores(filters?: {
  status?: string
  country?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ stores: StoreWithStats[]; total: number }> {
  if (!hasDb()) return { stores: [], total: 0 }

  let query = getClient()!
    .from("marketplace_stores")
    .select("*", { count: "exact" })

  if (filters?.status) query = query.eq("status", filters.status)
  else query = query.eq("status", "active")
  if (filters?.country) query = query.eq("country", filters.country)
  if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  if (filters?.limit) query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1)

  query = query.order("average_rating", { ascending: false })

  const { data, error, count } = await query
  if (error) { console.error("fetchStores:", error); return { stores: [], total: 0 } }
  return { stores: (data || []) as StoreWithStats[], total: count || 0 }
}

export async function fetchStoreBySlug(slug: string): Promise<StoreWithStats | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_stores")
    .select("*")
    .eq("slug", slug)
    .single()
  if (error) { console.error("fetchStoreBySlug:", error); return null }
  return data as StoreWithStats
}

export async function fetchStoreById(id: string): Promise<StoreWithStats | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_stores")
    .select("*")
    .eq("id", id)
    .single()
  if (error) { console.error("fetchStoreById:", error); return null }
  return data as StoreWithStats
}

export async function createStore(store: Partial<MarketplaceStore>): Promise<MarketplaceStore | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_stores")
    .insert(store)
    .select()
    .single()
  if (error) { console.error("createStore:", error); return null }
  return data
}

export async function updateStore(id: string, updates: Partial<MarketplaceStore>): Promise<MarketplaceStore | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_stores")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) { console.error("updateStore:", error); return null }
  return data
}

// --- Products ---
export async function fetchProducts(filters?: {
  status?: string
  category_id?: string
  store_id?: string
  country?: string
  search?: string
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popular"
  min_price?: number
  max_price?: number
  free_shipping?: boolean
  limit?: number
  offset?: number
}): Promise<{ products: ProductWithStore[]; total: number }> {
  if (!hasDb()) return { products: [], total: 0 }

  let query = getClient()!
    .from("marketplace_products")
    .select("*, store:marketplace_stores(id,name,slug,logo_url,country,city,average_rating), category:marketplace_categories(id,name,slug,icon)", { count: "exact" })

  if (filters?.status) query = query.eq("status", filters.status)
  else query = query.eq("status", "published")
  if (filters?.category_id) query = query.eq("category_id", filters.category_id)
  if (filters?.store_id) query = query.eq("store_id", filters.store_id)
  if (filters?.country) query = query.eq("shipping_from_country", filters.country)
  if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`)
  if (filters?.min_price) query = query.gte("final_price", filters.min_price)
  if (filters?.max_price) query = query.lte("final_price", filters.max_price)
  if (filters?.free_shipping) query = query.eq("free_shipping", true)

  // Sort
  switch (filters?.sort) {
    case "price_asc": query = query.order("final_price", { ascending: true }); break
    case "price_desc": query = query.order("final_price", { ascending: false }); break
    case "rating": query = query.order("average_rating", { ascending: false }); break
    case "popular": query = query.order("sales_count", { ascending: false }); break
    default: query = query.order("created_at", { ascending: false })
  }

  const limit = filters?.limit || 24
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) { console.error("fetchProducts:", error); return { products: [], total: 0 } }
  return { products: (data || []) as ProductWithStore[], total: count || 0 }
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithStore | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_products")
    .select("*, store:marketplace_stores(id,name,slug,logo_url,cover_url,country,city,whatsapp,email,average_rating,review_count,return_policy,shipping_policy), category:marketplace_categories(id,name,slug,icon)")
    .eq("slug", slug)
    .single()
  if (error) { console.error("fetchProductBySlug:", error); return null }
  return data as ProductWithStore
}

export async function fetchProductVariants(productId: string) {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_product_variants")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order")
  if (error) return []
  return data || []
}

export async function fetchProductImages(productId: string) {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order")
  if (error) return []
  return data || []
}

export async function createProduct(product: Partial<MarketplaceProduct>): Promise<MarketplaceProduct | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_products")
    .insert(product)
    .select()
    .single()
  if (error) { console.error("createProduct:", error); return null }
  return data
}

export async function updateProduct(id: string, updates: Partial<MarketplaceProduct>): Promise<MarketplaceProduct | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_products")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) { console.error("updateProduct:", error); return null }
  return data
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_products")
    .delete()
    .eq("id", id)
  if (error) { console.error("deleteProduct:", error); return false }
  return true
}

// --- Cart (Supabase-backed when logged in, localStorage fallback) ---
const CART_KEY = "zafiro_marketplace_cart"

export interface LocalCartItem {
  productId: string
  variantId?: string
  name: string
  image: string
  price: number
  quantity: number
  storeId: string
  storeName: string
  stock: number
}

export function getLocalCart(): LocalCartItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]") } catch { return [] }
}

export function saveLocalCart(items: LocalCartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToLocalCart(item: LocalCartItem): LocalCartItem[] {
  const cart = getLocalCart()
  const existing = cart.find(c => c.productId === item.productId && c.variantId === item.variantId)
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, existing.stock)
  } else {
    cart.push(item)
  }
  saveLocalCart(cart)
  return cart
}

export function removeFromLocalCart(productId: string, variantId?: string): LocalCartItem[] {
  const cart = getLocalCart().filter(c => !(c.productId === productId && c.variantId === variantId))
  saveLocalCart(cart)
  return cart
}

export function updateLocalCartQuantity(productId: string, quantity: number, variantId?: string): LocalCartItem[] {
  const cart = getLocalCart()
  const item = cart.find(c => c.productId === productId && c.variantId === variantId)
  if (item) {
    if (quantity <= 0) return removeFromLocalCart(productId, variantId)
    item.quantity = Math.min(quantity, item.stock)
  }
  saveLocalCart(cart)
  return cart
}

export function clearLocalCart() {
  saveLocalCart([])
}

export function getCartTotal(items: LocalCartItem[]): { subtotal: number; itemCount: number } {
  return items.reduce((acc, item) => ({
    subtotal: acc.subtotal + item.price * item.quantity,
    itemCount: acc.itemCount + item.quantity,
  }), { subtotal: 0, itemCount: 0 })
}

// --- Orders ---
export async function createOrder(order: Partial<MarketplaceOrder>, items: Partial<OrderItem>[]): Promise<MarketplaceOrder | null> {
  if (!hasDb()) return null

  const { data: orderData, error: orderError } = await getClient()!
    .from("marketplace_orders")
    .insert(order)
    .select()
    .single()
  if (orderError) { console.error("createOrder:", orderError); return null }

  if (items.length > 0) {
    const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderData.id }))
    await getClient()!.from("marketplace_order_items").insert(itemsWithOrderId)
  }

  return orderData as MarketplaceOrder
}

export async function fetchOrders(userId: string): Promise<OrderWithItems[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_orders")
    .select("*, items:marketplace_order_items(*), store:marketplace_stores(id,name,slug)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
  if (error) { console.error("fetchOrders:", error); return [] }
  return (data || []) as OrderWithItems[]
}

export async function fetchStoreOrders(storeId: string): Promise<OrderWithItems[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_orders")
    .select("*, items:marketplace_order_items(*)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
  if (error) { console.error("fetchStoreOrders:", error); return [] }
  return (data || []) as OrderWithItems[]
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) { console.error("updateOrderStatus:", error); return false }
  return true
}

// --- Reviews ---
export async function fetchProductReviews(productId: string): Promise<MarketplaceReview[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
  if (error) return []
  return data || []
}

export async function createReview(review: Partial<MarketplaceReview>): Promise<MarketplaceReview | null> {
  if (!hasDb()) return null
  const { data, error } = await getClient()!
    .from("marketplace_reviews")
    .insert(review)
    .select()
    .single()
  if (error) { console.error("createReview:", error); return null }
  return data
}

// --- Favorites ---
export async function fetchFavorites(userId: string): Promise<string[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_favorites")
    .select("product_id")
    .eq("user_id", userId)
  if (error) return []
  return (data || []).map((f: { product_id: string }) => f.product_id)
}

export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  if (!hasDb()) return false
  const { data: existing } = await getClient()!
    .from("marketplace_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()

  if (existing) {
    await getClient()!.from("marketplace_favorites").delete().eq("id", existing.id)
    return false
  } else {
    await getClient()!.from("marketplace_favorites").insert({ user_id: userId, product_id: productId })
    return true
  }
}

// --- Admin operations ---
export async function adminFetchPendingStores(): Promise<StoreWithStats[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_stores")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
  if (error) return []
  return (data || []) as StoreWithStats[]
}

export async function adminFetchPendingProducts(): Promise<ProductWithStore[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_products")
    .select("*, store:marketplace_stores(id,name)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
  if (error) return []
  return (data || []) as ProductWithStore[]
}

export async function adminApproveStore(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_stores")
    .update({ status: "active", approved_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("adminApproveStore:", error); return false }
  return true
}

export async function adminRejectStore(id: string, reason: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_stores")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id)
  if (error) { console.error("adminRejectStore:", error); return false }
  return true
}

export async function adminApproveProduct(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_products")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("adminApproveProduct:", error); return false }
  return true
}

export async function adminRejectProduct(id: string, reason: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_products")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id)
  if (error) { console.error("adminRejectProduct:", error); return false }
  return true
}

export async function adminSuspendStore(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_stores")
    .update({ status: "suspended", suspended_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return false
  return true
}

// --- Margin Config (Supabase feature flags + localStorage fallback) ---
import { fetchFeatureFlags, saveFeatureFlag } from "@/lib/marketplace/feature-flags"

const MARGIN_CONFIG_KEY = "zafiro_marketplace_margins"

export interface MarginConfig {
  globalCommission: number
  msmServiceFee: number
  minSellerMargin: number
  maxSellerMargin: number
  paymentProcessingFee: number
  paymentFixedFee: number
  operationalReserve: number
}

const DEFAULT_MARGIN_CONFIG: MarginConfig = {
  globalCommission: 10,
  msmServiceFee: 2.5,
  minSellerMargin: 5,
  maxSellerMargin: 50,
  paymentProcessingFee: 2.9,
  paymentFixedFee: 0.30,
  operationalReserve: 2,
}

const MARGIN_FLAG_KEYS: Record<keyof MarginConfig, string> = {
  globalCommission: "DEFAULT_COMMISSION_RATE",
  msmServiceFee: "SERVICE_FEE_RATE",
  minSellerMargin: "MIN_SELLER_COMMISSION",
  maxSellerMargin: "MAX_SELLER_COMMISSION",
  paymentProcessingFee: "PAYMENT_PROCESSING_FEE",
  paymentFixedFee: "PAYMENT_FIXED_FEE",
  operationalReserve: "OPERATIONAL_RESERVE",
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export async function loadMarginConfig(): Promise<MarginConfig> {
  let local = DEFAULT_MARGIN_CONFIG
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(MARGIN_CONFIG_KEY)
      if (raw) local = { ...DEFAULT_MARGIN_CONFIG, ...JSON.parse(raw) }
    } catch { /* localStorage no disponible */ }
  }

  const flags = await fetchFeatureFlags()
  const merged: MarginConfig = { ...local }
  for (const key of Object.keys(MARGIN_FLAG_KEYS) as (keyof MarginConfig)[]) {
    const n = toNumber(flags[MARGIN_FLAG_KEYS[key]])
    if (n !== null) merged[key] = n
  }
  return merged
}

export async function saveMarginConfig(config: MarginConfig): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem(MARGIN_CONFIG_KEY, JSON.stringify(config))
  }
  let savedToDb = true
  for (const key of Object.keys(MARGIN_FLAG_KEYS) as (keyof MarginConfig)[]) {
    const ok = await saveFeatureFlag(MARGIN_FLAG_KEYS[key], config[key])
    if (!ok) savedToDb = false
  }
  return savedToDb
}

// --- Admin provider status ---
export async function adminToggleProviderStatus(id: string, newStatus: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_providers")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("adminToggleProviderStatus:", error); return false }
  return true
}

// --- Admin dispute actions ---
export async function adminResolveDispute(id: string, refundAmount: number): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_disputes")
    .update({ status: "resolved", refund_amount: refundAmount, resolved_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("adminResolveDispute:", error); return false }
  return true
}

export async function adminRejectDispute(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_disputes")
    .update({ status: "closed", resolved_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("adminRejectDispute:", error); return false }
  return true
}

export async function adminEscalateDispute(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("marketplace_disputes")
    .update({ status: "escalated" })
    .eq("id", id)
  if (error) { console.error("adminEscalateDispute:", error); return false }
  return true
}

// --- Dashboard stats ---
export async function fetchSellerStats(storeId: string): Promise<{
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  monthRevenue: number
}> {
  if (!hasDb()) return { totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0, monthRevenue: 0 }

  const [productsRes, ordersRes] = await Promise.all([
    getClient()!
      .from("marketplace_products")
      .select("id,status", { count: "exact" })
      .eq("store_id", storeId),
    getClient()!
      .from("marketplace_orders")
      .select("id,status,total_amount,created_at")
      .eq("store_id", storeId),
  ])

  const products = productsRes.data || []
  const orders = ordersRes.data || []
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  return {
    totalProducts: products.length,
    activeProducts: products.filter((p: { status: string }) => p.status === "published").length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o: { status: string }) => ["pending_confirmation", "pending_payment", "paid"].includes(o.status)).length,
    totalRevenue: orders.filter((o: { status: string }) => ["paid", "completed", "delivered"].includes(o.status)).reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0),
    monthRevenue: orders.filter((o: { status: string; created_at: string }) => ["paid", "completed", "delivered"].includes(o.status) && o.created_at >= monthStart).reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0),
  }
}

export async function fetchAdminMarketplaceStats(): Promise<{
  totalStores: number
  pendingStores: number
  activeStores: number
  totalProducts: number
  pendingProducts: number
  totalOrders: number
  totalRevenue: number
}> {
  if (!hasDb()) return { totalStores: 0, pendingStores: 0, activeStores: 0, totalProducts: 0, pendingProducts: 0, totalOrders: 0, totalRevenue: 0 }

  const [stores, products, orders] = await Promise.all([
    getClient()!.from("marketplace_stores").select("id,status"),
    getClient()!.from("marketplace_products").select("id,status"),
    getClient()!.from("marketplace_orders").select("id,status,total_amount"),
  ])

  const storeData = stores.data || []
  const productData = products.data || []
  const orderData = orders.data || []

  return {
    totalStores: storeData.length,
    pendingStores: storeData.filter((s: { status: string }) => s.status === "pending_review").length,
    activeStores: storeData.filter((s: { status: string }) => s.status === "active").length,
    totalProducts: productData.length,
    pendingProducts: productData.filter((p: { status: string }) => p.status === "pending_review").length,
    totalOrders: orderData.length,
    totalRevenue: orderData.filter((o: { status: string }) => ["paid", "completed", "delivered"].includes(o.status)).reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0),
  }
}
