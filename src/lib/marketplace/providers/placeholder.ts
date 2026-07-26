// ================================================================
// PLACEHOLDER PROVIDER — Template para futuros proveedores
// Amazon, Walmart, Sams Club, Home Depot, SHEIN
// ================================================================

import type {
  ProviderAdapter,
  ProviderSearchOptions,
  ProviderProductResult,
  ProviderPriceResult,
  ProviderInventoryResult,
  ProviderOrderRequest,
  ProviderOrderResult,
  ProviderOrderStatusResult,
  ProviderTrackingResult,
} from "./types"

export class PlaceholderProvider implements ProviderAdapter {
  name: string
  type: "api" | "affiliate" | "dropship"
  isEnabled = false
  private providerSlug: string

  constructor(name: string, slug: string, type: "api" | "affiliate" | "dropship" = "api") {
    this.name = name
    this.providerSlug = slug
    this.type = type
  }

  async searchProducts(_query: string, _options?: ProviderSearchOptions): Promise<ProviderProductResult[]> {
    if (!this.isEnabled) {
      console.warn(`[${this.name}] Provider no habilitado. Habilitar feature flag: ${this.providerSlug.toUpperCase()}_PROVIDER_ENABLED`)
      return []
    }
    // TODO: Implementar cuando se obtenga autorización y API keys
    return []
  }

  async getProduct(_externalId: string): Promise<ProviderProductResult | null> {
    if (!this.isEnabled) return null
    // TODO: Implementar conector API
    return null
  }

  async getPrice(_externalId: string): Promise<ProviderPriceResult | null> {
    if (!this.isEnabled) return null
    // TODO: Implementar consulta de precios
    return null
  }

  async getBulkPrices(_externalIds: string[]): Promise<ProviderPriceResult[]> {
    if (!this.isEnabled) return []
    // TODO: Implementar consulta masiva de precios
    return []
  }

  async getInventory(_externalId: string): Promise<ProviderInventoryResult | null> {
    if (!this.isEnabled) return null
    // TODO: Implementar consulta de inventario
    return null
  }

  async createOrder(_order: ProviderOrderRequest): Promise<ProviderOrderResult> {
    if (!this.isEnabled) {
      return {
        success: false,
        order_ref: "",
        estimated_delivery: "",
        total_cost: 0,
        currency: "USD",
        error: `Proveedor ${this.name} no habilitado`,
      }
    }
    // TODO: Implementar creación de orden via API
    return {
      success: false,
      order_ref: "",
      estimated_delivery: "",
      total_cost: 0,
      currency: "USD",
      error: "Conector no implementado aún",
    }
  }

  async getOrderStatus(_orderRef: string): Promise<ProviderOrderStatusResult | null> {
    if (!this.isEnabled) return null
    // TODO: Implementar consulta de estado
    return null
  }

  async getTracking(_trackingNumber: string): Promise<ProviderTrackingResult | null> {
    if (!this.isEnabled) return null
    // TODO: Implementar tracking
    return null
  }
}

// Instancias predefinidas (desactivadas)
export const amazonProvider = new PlaceholderProvider("Amazon", "amazon", "api")
export const walmartProvider = new PlaceholderProvider("Walmart", "walmart", "api")
export const samsProvider = new PlaceholderProvider("Sam's Club", "sams", "affiliate")
export const homeDepotProvider = new PlaceholderProvider("Home Depot", "home_depot", "affiliate")
export const sheinProvider = new PlaceholderProvider("SHEIN", "shein", "dropship")
