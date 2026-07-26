// ================================================================
// MARKETPLACE TYPES — Interfaces para todo el módulo
// ================================================================

// --- Categorías ---
export interface MarketplaceCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  image_url: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  product_count: number
  created_at: string
  updated_at: string
}

// --- Proveedores ---
export type ProviderType = 'manual' | 'api' | 'affiliate' | 'dropship' | 'msm_inventory' | 'cuba_supplier'
export type ProviderStatus = 'inactive' | 'active' | 'suspended' | 'pending_review'

export interface MarketplaceProvider {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  website_url: string
  contact_email: string
  contact_phone: string
  provider_type: ProviderType
  status: ProviderStatus
  api_enabled: boolean
  affiliate_enabled: boolean
  resale_enabled: boolean
  dropshipping_enabled: boolean
  countries_supported: string[]
  credentials_ref: string
  default_commission: number
  currency: string
  product_count: number
  total_sales: number
  average_rating: number
  shipping_from_country: string
  estimated_delivery_days: number
  return_policy: string
  created_at: string
  updated_at: string
}

// --- Tiendas ---
export type StoreStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'suspended' | 'rejected'
export type StoreVerificationLevel = 'none' | 'email_verified' | 'identity_verified' | 'business_verified' | 'premium'
export type StoreMemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'

export interface MarketplaceStore {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string
  logo_url: string
  cover_url: string
  country: string
  city: string
  whatsapp: string
  email: string
  website: string
  social_instagram: string
  social_facebook: string
  social_tiktok: string
  social_youtube: string
  currency: string
  timezone: string
  return_policy: string
  shipping_policy: string
  status: StoreStatus
  verification_level: StoreVerificationLevel
  rejection_reason: string
  product_count: number
  total_sales: number
  total_revenue: number
  average_rating: number
  review_count: number
  follower_count: number
  commission_rate: number
  approved_at: string | null
  suspended_at: string | null
  created_at: string
  updated_at: string
}

export interface MarketplaceStoreMember {
  id: string
  store_id: string
  user_id: string
  role: StoreMemberRole
  invited_by: string | null
  joined_at: string
}

// --- Productos ---
export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'out_of_stock' | 'paused' | 'rejected' | 'archived'
export type ProductSource = 'own' | 'supplier' | 'affiliate'

export interface MarketplaceProduct {
  id: string
  store_id: string
  category_id: string | null
  provider_id: string | null
  name: string
  slug: string
  description: string
  short_description: string
  source: ProductSource
  sku: string
  external_id: string
  external_url: string
  base_price: number
  final_price: number
  currency: string
  tax_rate: number
  service_fee: number
  margin: number
  estimated_shipping: number
  shipping_from_country: string
  free_shipping: boolean
  stock: number
  low_stock_threshold: number
  track_inventory: boolean
  weight_grams: number
  width_cm: number
  height_cm: number
  depth_cm: number
  estimated_delivery_days: number
  delivery_modes: string[]
  return_policy: string
  return_days: number
  countries_deliver_to: string[]
  tags: string[]
  status: ProductStatus
  rejection_reason: string
  sync_status: string
  last_synced_at: string | null
  view_count: number
  sales_count: number
  average_rating: number
  review_count: number
  favorite_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string
  price_override: number | null
  stock: number
  attributes: Record<string, string>
  image_url: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

// --- Proveedor-Producto ---
export interface ProviderProduct {
  id: string
  product_id: string
  provider_id: string
  external_product_id: string
  external_url: string
  provider_price: number
  currency: string
  is_available: boolean
  last_synced_at: string | null
  sync_error: string
  created_at: string
  updated_at: string
}

export interface ProviderPrice {
  id: string
  provider_product_id: string
  price: number
  currency: string
  source: string
  recorded_at: string
}

export interface ProviderInventory {
  id: string
  provider_product_id: string
  stock: number
  available: boolean
  warehouse_location: string
  restock_date: string | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

// --- Carrito ---
export interface MarketplaceCart {
  id: string
  user_id: string
  item_count: number
  subtotal: number
  shipping_total: number
  tax_total: number
  discount_total: number
  grand_total: number
  currency: string
  coupon_code: string
  coupon_discount: number
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  shipping_cost: number
  notes: string
  added_at: string
  // Joined data (not in DB, computed)
  product?: MarketplaceProduct
  variant?: ProductVariant
}

// --- Pedidos ---
export type OrderStatus =
  | 'cart' | 'quotation' | 'pending_confirmation' | 'pending_payment'
  | 'payment_under_review' | 'paid' | 'approved' | 'provider_purchase_pending'
  | 'purchased' | 'processing' | 'shipped' | 'in_transit'
  | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
  | 'refund_requested' | 'refunded' | 'disputed'

export type DeliveryMode =
  | 'provider_direct' | 'msm_delivery' | 'seller_delivery' | 'pickup'
  | 'cuba_authorized_logistics' | 'international_shipping' | 'digital_delivery'

export interface MarketplaceOrder {
  id: string
  buyer_id: string
  store_id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  tax_amount: number
  service_fee: number
  discount_amount: number
  total_amount: number
  currency: string
  delivery_mode: DeliveryMode
  delivery_info: Record<string, unknown>
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  cuba_province: string
  cuba_municipality: string
  cuba_locality: string
  cuba_reference_point: string
  buyer_notes: string
  seller_notes: string
  confirmed_at: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  product_image: string
  variant_name: string
  quantity: number
  unit_price: number
  total_price: number
  item_status: string
  created_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  reason: string
  notes: string
  created_at: string
}

// --- Pagos ---
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded' | 'disputed'
export type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer' | 'crypto' | 'cash_on_delivery' | 'cuba_mobile_payment' | 'manual'

export interface MarketplacePayment {
  id: string
  order_id: string
  amount: number
  currency: string
  fee_amount: number
  net_amount: number
  payment_method: PaymentMethod
  provider_ref: string
  status: PaymentStatus
  card_last_four: string
  card_brand: string
  proof_url: string
  proof_uploaded_by: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type RefundStatus = 'requested' | 'under_review' | 'approved' | 'rejected' | 'processed' | 'completed'

export interface MarketplaceRefund {
  id: string
  payment_id: string
  order_id: string
  amount: number
  currency: string
  reason: string
  status: RefundStatus
  provider_ref: string
  requested_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string
  processed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// --- Envíos ---
export type ShipmentStatus = 'pending' | 'confirmed' | 'purchased_from_provider' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delivery_failed' | 'returned' | 'cancelled'
export type ShipmentProvider = 'provider_direct' | 'msm_delivery' | 'seller_delivery' | 'usps' | 'fedex' | 'ups' | 'dhl' | 'correos_cuba' | 'cuba_logistics' | 'digital' | 'other'

export interface MarketplaceShipment {
  id: string
  order_id: string
  provider: ShipmentProvider
  tracking_number: string
  tracking_url: string
  status: ShipmentStatus
  shipped_from_country: string
  shipped_from_city: string
  destination_country: string
  destination_city: string
  destination_address: string
  cuba_receiver_name: string
  cuba_receiver_phone: string
  cuba_delivery_photo: string
  estimated_delivery: string | null
  actual_delivery: string | null
  shipped_at: string | null
  weight_grams: number
  shipping_cost: number
  notes: string
  created_at: string
  updated_at: string
}

export interface TrackingEvent {
  id: string
  shipment_id: string
  status: string
  location: string
  description: string
  event_time: string
  source: string
  created_at: string
}

// --- Reglas de negocio ---
export type PriceRuleType = 'percentage' | 'fixed' | 'manual' | 'tiered'
export type PriceRuleTarget = 'product' | 'category' | 'store' | 'provider' | 'global'

export interface MarketplacePriceRule {
  id: string
  name: string
  description: string
  rule_type: PriceRuleType
  target: PriceRuleTarget
  percentage: number
  fixed_amount: number
  target_id: string | null
  min_quantity: number
  min_amount: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  priority: number
  max_uses: number
  current_uses: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  product_id: string
  previous_price: number
  new_price: number
  currency: string
  changed_by: string | null
  reason: string
  created_at: string
}

export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y'

export interface MarketplaceCoupon {
  id: string
  code: string
  description: string
  coupon_type: CouponType
  value: number
  min_order_amount: number
  max_discount: number
  store_id: string | null
  applicable_products: string[]
  applicable_categories: string[]
  max_uses_total: number
  max_uses_per_user: number
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CommissionType = 'marketplace_fee' | 'seller_commission' | 'affiliate_commission' | 'provider_cost' | 'payment_processing'

export interface MarketplaceCommission {
  id: string
  order_id: string
  payment_id: string | null
  commission_type: CommissionType
  amount: number
  percentage: number
  recipient_id: string | null
  store_id: string | null
  is_paid: boolean
  paid_at: string | null
  created_at: string
}

// --- Social ---
export interface MarketplaceReview {
  id: string
  product_id: string
  order_id: string | null
  user_id: string
  store_id: string
  rating: number
  title: string
  comment: string
  images: string[]
  seller_reply: string
  seller_reply_at: string | null
  helpful_count: number
  is_verified: boolean
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface MarketplaceFavorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export type DisputeStatus = 'open' | 'under_review' | 'awaiting_response' | 'resolved' | 'escalated' | 'closed'
export type DisputeReason = 'product_not_received' | 'product_not_as_described' | 'damaged_product' | 'wrong_item' | 'quality_issue' | 'seller_no_response' | 'payment_issue' | 'other'

export interface MarketplaceDispute {
  id: string
  order_id: string
  opened_by: string
  reason: DisputeReason
  description: string
  status: DisputeStatus
  evidence_urls: string[]
  resolution: string
  resolved_by: string | null
  resolved_at: string | null
  refund_amount: number
  seller_response_deadline: string | null
  seller_responded: boolean
  created_at: string
  updated_at: string
}

export interface MarketplaceAuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown>
  new_values: Record<string, unknown>
  ip_address: string
  user_agent: string
  created_at: string
}

// --- Config ---
export interface MarketplaceConfig {
  key: string
  value: { value: unknown }
  description: string
  updated_by: string | null
  updated_at: string
}

// --- Computed / Extended ---
export interface ProductWithStore extends MarketplaceProduct {
  store?: MarketplaceStore
  category?: MarketplaceCategory
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export interface StoreWithStats extends MarketplaceStore {
  owner_name?: string
  owner_email?: string
}

export interface OrderWithItems extends MarketplaceOrder {
  items?: OrderItem[]
  store?: MarketplaceStore
  payments?: MarketplacePayment[]
  shipments?: MarketplaceShipment[]
}
