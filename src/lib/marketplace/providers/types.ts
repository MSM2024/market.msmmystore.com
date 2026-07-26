// ================================================================
// PROVIDER TYPES — Interfaces para conectores de proveedor
// ================================================================

export interface ProviderAdapter {
  name: string
  type: 'manual' | 'api' | 'affiliate' | 'dropship' | 'msm_inventory' | 'cuba_supplier'
  isEnabled: boolean

  // Catálogo
  searchProducts(query: string, options?: ProviderSearchOptions): Promise<ProviderProductResult[]>
  getProduct(externalId: string): Promise<ProviderProductResult | null>

  // Precios
  getPrice(externalId: string): Promise<ProviderPriceResult | null>
  getBulkPrices(externalIds: string[]): Promise<ProviderPriceResult[]>

  // Inventario
  getInventory(externalId: string): Promise<ProviderInventoryResult | null>

  // Pedidos
  createOrder(order: ProviderOrderRequest): Promise<ProviderOrderResult>
  getOrderStatus(orderRef: string): Promise<ProviderOrderStatusResult | null>

  // Tracking
  getTracking(trackingNumber: string): Promise<ProviderTrackingResult | null>
}

export interface ProviderSearchOptions {
  category?: string
  minPrice?: number
  maxPrice?: number
  countries?: string[]
  page?: number
  limit?: number
}

export interface ProviderProductResult {
  external_id: string
  name: string
  description: string
  url: string
  images: string[]
  price: number
  currency: string
  availability: boolean
  stock: number
  category: string
  brand: string
  rating: number
  review_count: number
  shipping_info?: ProviderShippingInfo
}

export interface ProviderPriceResult {
  external_id: string
  price: number
  currency: string
  original_price?: number
  discount_percentage?: number
  last_updated: string
}

export interface ProviderInventoryResult {
  external_id: string
  stock: number
  available: boolean
  warehouse?: string
  restock_date?: string
}

export interface ProviderShippingInfo {
  cost: number
  currency: string
  estimated_days: number
  countries_supported: string[]
  free_shipping: boolean
}

export interface ProviderOrderRequest {
  external_product_id: string
  quantity: number
  shipping_address: ProviderShippingAddress
  customer_name: string
  customer_email: string
  customer_phone?: string
  notes?: string
}

export interface ProviderShippingAddress {
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

export interface ProviderOrderResult {
  success: boolean
  order_ref: string
  estimated_delivery: string
  total_cost: number
  currency: string
  error?: string
}

export interface ProviderOrderStatusResult {
  order_ref: string
  status: string
  tracking_number?: string
  tracking_url?: string
  estimated_delivery?: string
  last_updated: string
}

export interface ProviderTrackingResult {
  tracking_number: string
  carrier: string
  status: string
  estimated_delivery?: string
  events: ProviderTrackingEvent[]
}

export interface ProviderTrackingEvent {
  timestamp: string
  location: string
  description: string
  status: string
}
