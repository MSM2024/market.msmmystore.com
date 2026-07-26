import { NextRequest, NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import type {
  ProductWithStore,
  MarketplaceOrder,
  OrderItem,
} from "@/lib/marketplace/types"
import { ORDER_STATUS_LABELS, formatPrice } from "@/lib/marketplace/constants"
import { MarketplaceBridgeSchema, SearchOrdersSchema } from "@/lib/eliana/core/validation"

// ================================================================
// ELIANA ↔ MARKETPLACE BRIDGE API
// Connects ELIANA's conversation engine with Marketplace data
// ================================================================

function getSupabase() {
  if (!isSupabaseAvailable()) return null
  return getSupabaseClient()
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", message: "ELIANA_API_KEY not configured" },
    { status: 401 },
  )
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELIANA_API_KEY
  const authHeader = request.headers.get("authorization")

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return unauthorized()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request", message: "Request body must be valid JSON" },
      { status: 400 },
    )
  }

  // Zod validation
  const parsed = MarketplaceBridgeSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues
    const firstError = issues[0]?.message || "Datos inválidos"
    return NextResponse.json(
      { error: "Validation error", message: firstError },
      { status: 400 },
    )
  }

  const { action, data = {} } = parsed.data

  try {
    switch (action) {
      case "getCustomerContext":
        return await handleGetCustomerContext(data)
      case "searchProducts":
        return await handleSearchProducts(data)
      case "getProductDetails":
        return await handleGetProductDetails(data)
      case "handoff":
        return await handleHandoff(data)
      case "searchOrders":
        return await handleSearchOrders(data)
      default:
        return NextResponse.json(
          { error: "Unknown action", message: `Action "${action}" is not supported` },
          { status: 400 },
        )
    }
  } catch (err) {
    console.error(`ELIANA bridge error [${action}]:`, err)
    return NextResponse.json(
      { error: "Internal error", message: "Something went wrong processing this request" },
      { status: 500 },
    )
  }
}

// --- getCustomerContext ---
// Returns customer's purchase history and preferences
// Accepts userId (Supabase) or sessionId (localStorage-based anonymous)
async function handleGetCustomerContext(data: Record<string, unknown>) {
  const userId = data.userId as string | undefined
  const sessionId = data.sessionId as string | undefined

  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Missing identifier", message: "Provide userId or sessionId" },
      { status: 400 },
    )
  }

  interface CustomerPreferences {
    currencies: string[]
    deliveryCountries: string[]
  }

  interface CustomerContext {
    userId: string | null
    sessionId: string | null
    orders: unknown[]
    recentProducts: unknown[]
    preferences: CustomerPreferences
    summary: string
  }

  const context: CustomerContext = {
    userId: userId || null,
    sessionId: sessionId || null,
    orders: [],
    recentProducts: [],
    preferences: {
      currencies: ["USD", "CUP", "EUR"],
      deliveryCountries: [],
    },
    summary: "",
  }

  if (userId) {
    const supabase = getSupabase()
    if (supabase) {
      const { data: orders } = await supabase
        .from("marketplace_orders")
        .select("*, items:marketplace_order_items(product_name, quantity, unit_price)")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (orders) {
        context.orders = orders.map((o: MarketplaceOrder & { items?: OrderItem[] }) => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
          total: o.total_amount,
          currency: o.currency,
          itemCount: o.items?.length || 0,
          items: o.items?.map((i: OrderItem) => ({
            name: i.product_name,
            quantity: i.quantity,
            price: i.unit_price,
          })),
          createdAt: o.created_at,
        }))

        const countries = new Set<string>()
        for (const o of orders) {
          if (o.shipping_country) countries.add(o.shipping_country)
        }
        context.preferences.deliveryCountries = [...countries]
      }

      const { data: favorites } = await supabase
        .from("marketplace_favorites")
        .select("product_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (favorites && favorites.length > 0) {
        const productIds = favorites.map((f: { product_id: string }) => f.product_id)
        const { data: products } = await supabase
          .from("marketplace_products")
          .select("id, name, slug, final_price, currency")
          .in("id", productIds)

        context.recentProducts = products || []
      }

      const orderCount = (context.orders as unknown[]).length
      context.summary = orderCount > 0
        ? `Customer has ${orderCount} order(s). Preferred shipping to: ${context.preferences.deliveryCountries.join(", ") || "unknown"}.`
        : "New customer with no order history."
    }
  } else {
    context.summary = `Anonymous session ${sessionId}. No order history available server-side.`
  }

  return NextResponse.json({ ok: true, context: context as unknown as Record<string, unknown> })
}

// --- searchProducts ---
// Search marketplace products by query, with optional filters
async function handleSearchProducts(data: Record<string, unknown>) {
  const query = (data.query as string || "").trim()
  const limit = Math.min(Number(data.limit) || 10, 25)
  const offset = Number(data.offset) || 0
  const categoryId = data.categoryId as string | undefined
  const minPrice = data.minPrice as number | undefined
  const maxPrice = data.maxPrice as number | undefined
  const country = data.country as string | undefined
  const freeShipping = data.freeShipping as boolean | undefined
  const sort = (data.sort as string) || "newest"

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      products: [],
      total: 0,
      message: "Database not available — returning empty results",
    })
  }

  let dbQuery = supabase
    .from("marketplace_products")
    .select(
      "*, store:marketplace_stores(id,name,slug,logo_url,country,average_rating), category:marketplace_categories(id,name,slug,icon)",
      { count: "exact" },
    )
    .eq("status", "published")

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`,
    )
  }
  if (categoryId) dbQuery = dbQuery.eq("category_id", categoryId)
  if (country) dbQuery = dbQuery.eq("shipping_from_country", country)
  if (minPrice != null) dbQuery = dbQuery.gte("final_price", minPrice)
  if (maxPrice != null) dbQuery = dbQuery.lte("final_price", maxPrice)
  if (freeShipping) dbQuery = dbQuery.eq("free_shipping", true)

  switch (sort) {
    case "price_asc": dbQuery = dbQuery.order("final_price", { ascending: true }); break
    case "price_desc": dbQuery = dbQuery.order("final_price", { ascending: false }); break
    case "rating": dbQuery = dbQuery.order("average_rating", { ascending: false }); break
    case "popular": dbQuery = dbQuery.order("sales_count", { ascending: false }); break
    default: dbQuery = dbQuery.order("created_at", { ascending: false })
  }

  dbQuery = dbQuery.range(offset, offset + limit - 1)

  const { data: products, error, count } = await dbQuery

  if (error) {
    console.error("ELIANA searchProducts:", error)
    return NextResponse.json(
      { error: "Search failed", message: error.message },
      { status: 500 },
    )
  }

  const results = ((products || []) as ProductWithStore[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.short_description,
    price: p.final_price,
    currency: p.currency,
    formattedPrice: formatPrice(p.final_price, p.currency),
    rating: p.average_rating,
    reviewCount: p.review_count,
    salesCount: p.sales_count,
    freeShipping: p.free_shipping,
    stock: p.stock,
    store: p.store
      ? { id: p.store.id, name: p.store.name, slug: p.store.slug, rating: p.store.average_rating }
      : null,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : null,
    imageUrl: (p as unknown as { image_url?: string }).image_url || null,
  }))

  return NextResponse.json({
    ok: true,
    products: results,
    total: count || 0,
    limit,
    offset,
    hasMore: (count || 0) > offset + limit,
  })
}

// --- getProductDetails ---
// Get full details for a specific product by id or slug
async function handleGetProductDetails(data: Record<string, unknown>) {
  const productId = data.productId as string | undefined
  const slug = data.slug as string | undefined

  if (!productId && !slug) {
    return NextResponse.json(
      { error: "Missing identifier", message: "Provide productId or slug" },
      { status: 400 },
    )
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not available", message: "Cannot fetch product details" },
      { status: 503 },
    )
  }

  let dbQuery = supabase
    .from("marketplace_products")
    .select(
      "*, store:marketplace_stores(id,name,slug,logo_url,cover_url,country,city,whatsapp,email,average_rating,review_count,return_policy,shipping_policy), category:marketplace_categories(id,name,slug,icon)",
    )

  if (productId) {
    dbQuery = dbQuery.eq("id", productId)
  } else {
    dbQuery = dbQuery.eq("slug", slug)
  }

  const { data: product, error } = await dbQuery.single()

  if (error || !product) {
    return NextResponse.json(
      { error: "Not found", message: `Product not found by ${productId ? "ID" : "slug"}` },
      { status: 404 },
    )
  }

  const p = product as ProductWithStore

  const [variantsRes, imagesRes] = await Promise.all([
    supabase
      .from("marketplace_product_variants")
      .select("*")
      .eq("product_id", p.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("marketplace_product_images")
      .select("*")
      .eq("product_id", p.id)
      .order("sort_order"),
  ])

  return NextResponse.json({
    ok: true,
    product: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.short_description,
      sku: p.sku,
      price: p.base_price,
      finalPrice: p.final_price,
      currency: p.currency,
      formattedPrice: formatPrice(p.final_price, p.currency),
      taxRate: p.tax_rate,
      serviceFee: p.service_fee,
      freeShipping: p.free_shipping,
      estimatedShipping: p.estimated_shipping,
      estimatedDeliveryDays: p.estimated_delivery_days,
      stock: p.stock,
      tags: p.tags,
      rating: p.average_rating,
      reviewCount: p.review_count,
      salesCount: p.sales_count,
      favoriteCount: p.favorite_count,
      returnPolicy: p.return_policy,
      returnDays: p.return_days,
      countriesDeliverTo: p.countries_deliver_to,
      shippingFromCountry: p.shipping_from_country,
      store: p.store
        ? {
            id: p.store.id,
            name: p.store.name,
            slug: p.store.slug,
            country: p.store.country,
            city: p.store.city,
            rating: p.store.average_rating,
            reviewCount: p.store.review_count,
            whatsapp: p.store.whatsapp,
            email: p.store.email,
            returnPolicy: p.store.return_policy,
            shippingPolicy: p.store.shipping_policy,
          }
        : null,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null,
      variants: (variantsRes.data || []).map((v: Record<string, unknown>) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price_override,
        stock: v.stock,
        attributes: v.attributes,
        imageUrl: v.image_url,
      })),
      images: (imagesRes.data || []).map((i: Record<string, unknown>) => ({
        id: i.id,
        url: i.url,
        altText: i.alt_text,
        isPrimary: i.is_primary,
        sortOrder: i.sort_order,
      })),
    },
  })
}

// --- handoff ---
// Route conversation from ELIANA to marketplace support
// Persists to eliana_handoffs table, falls back to in-memory payload
async function handleHandoff(data: Record<string, unknown>) {
  const reason = (data.reason as string) || "general"
  const customerMessage = (data.customerMessage as string) || ""
  const customerId = data.customerId as string | undefined
  const sessionId = data.sessionId as string | undefined
  const conversationHistory = data.conversationHistory as unknown[] | undefined
  const conversationId = data.conversationId as string | undefined

  const REASON_MAP: Record<string, string> = {
    purchase_help: "Customer needs help completing a purchase",
    order_issue: "Customer has an issue with an existing order",
    refund_request: "Customer is requesting a refund or return",
    product_question: "Customer has questions about a specific product",
    seller_dispute: "Customer has a dispute with a seller",
    general: "General marketplace support inquiry",
  }

  const handoffId = `HO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const timestamp = new Date().toISOString()

  const handoffPayload = {
    handoffId,
    reason,
    reasonDescription: REASON_MAP[reason] || reason,
    conversationId: conversationId || null,
    customerMessage,
    customerId: customerId || null,
    sessionId: sessionId || null,
    conversationHistory: conversationHistory || [],
    timestamp,
    status: "pending",
    instructions: [
      "Assign to a marketplace support agent",
      "Review conversation history before responding",
      "Update status to 'resolved' once handled",
    ],
  }

  const supabase = getSupabase()
  if (supabase) {
    const { data: inserted, error } = await supabase
      .from("eliana_handoffs")
      .insert({
        conversation_id: conversationId || null,
        reason,
        status: "pending",
        priority: "high",
        summary: JSON.stringify({ customerMessage, customerId, sessionId }),
        metadata: {
          handoffId,
          customerMessage,
          customerId: customerId || null,
          sessionId: sessionId || null,
          timestamp,
          conversationHistory: conversationHistory || [],
        },
      })
      .select("id")
      .single()

    if (error) {
      console.error("ELIANA handoff insert failed:", error)
      return NextResponse.json({
        ok: true,
        handoff: handoffPayload,
        warning: "Handoff created in-memory only (DB write failed)",
        message: `Handoff created. Reason: ${REASON_MAP[reason] || reason}. The conversation has been routed to marketplace support.`,
      })
    }

    return NextResponse.json({
      ok: true,
      handoff: { ...handoffPayload, supabaseId: inserted.id },
      message: `Handoff persisted. Reason: ${REASON_MAP[reason] || reason}. The conversation has been routed to marketplace support.`,
    })
  }

  return NextResponse.json({
    ok: true,
    handoff: handoffPayload,
    warning: "Handoff created in-memory only (Supabase not available)",
    message: `Handoff created. Reason: ${REASON_MAP[reason] || reason}. The conversation has been routed to marketplace support.`,
  })
}

// --- searchOrders ---
// Query a user's orders with items, status, and timeline
async function handleSearchOrders(data: Record<string, unknown>) {
  const parsed = SearchOrdersSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos inválidos"
    return NextResponse.json(
      { error: "Validation error", message: firstError },
      { status: 400 },
    )
  }

  const { userId, orderNumber } = parsed.data

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      orders: [],
      total: 0,
      message: "Database not available — returning empty results",
    })
  }

  let dbQuery = supabase
    .from("marketplace_orders")
    .select(
      "*, items:marketplace_order_items(*), store:marketplace_stores(id, name, slug)",
      { count: "exact" },
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })

  if (orderNumber) {
    dbQuery = dbQuery.ilike("order_number", `%${orderNumber}%`)
  }

  dbQuery = dbQuery.limit(20)

  const { data: orders, error, count } = await dbQuery

  if (error) {
    console.error("ELIANA searchOrders:", error)
    return NextResponse.json(
      { error: "Query failed", message: error.message },
      { status: 500 },
    )
  }

  const results = (orders || []).map(
    (o: MarketplaceOrder & { items?: OrderItem[]; store?: { id: string; name: string; slug: string } }) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
      store: o.store ? { id: o.store.id, name: o.store.name, slug: o.store.slug } : null,
      subtotal: o.subtotal,
      shippingCost: o.shipping_cost,
      taxAmount: o.tax_amount,
      totalAmount: o.total_amount,
      currency: o.currency,
      deliveryMode: o.delivery_mode,
      shippingName: o.shipping_name,
      shippingAddress: o.shipping_address,
      shippingCity: o.shipping_city,
      shippingCountry: o.shipping_country,
      buyerNotes: o.buyer_notes,
      sellerNotes: o.seller_notes,
      items: (o.items || []).map((i: OrderItem) => ({
        id: i.id,
        productName: i.product_name,
        productImage: i.product_image,
        variantName: i.variant_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
        itemStatus: i.item_status,
      })),
      timeline: {
        createdAt: o.created_at,
        confirmedAt: o.confirmed_at,
        paidAt: o.paid_at,
        shippedAt: o.shipped_at,
        deliveredAt: o.delivered_at,
        completedAt: o.completed_at,
        cancelledAt: o.cancelled_at,
      },
    }),
  )

  return NextResponse.json({
    ok: true,
    orders: results,
    total: count || 0,
    hasMore: (count || 0) > 20,
  })
}
