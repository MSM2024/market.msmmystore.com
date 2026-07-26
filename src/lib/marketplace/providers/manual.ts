// ================================================================
// MANUAL PROVIDER — Proveedor manual (activo por defecto)
// El vendedor administra sus productos manualmente
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

export class ManualProvider implements ProviderAdapter {
  name = "Proveedor Manual"
  type = "manual" as const
  isEnabled = true

  async searchProducts(_query: string, _options?: ProviderSearchOptions): Promise<ProviderProductResult[]> {
    // Proveedor manual no tiene catálogo propio
    return []
  }

  async getProduct(_externalId: string): Promise<ProviderProductResult | null> {
    return null
  }

  async getPrice(_externalId: string): Promise<ProviderPriceResult | null> {
    return null
  }

  async getBulkPrices(_externalIds: string[]): Promise<ProviderPriceResult[]> {
    return []
  }

  async getInventory(_externalId: string): Promise<ProviderInventoryResult | null> {
    return null
  }

  async createOrder(order: ProviderOrderRequest): Promise<ProviderOrderResult> {
    // Con proveedor manual, el vendedor gestiona el pedido directamente
    return {
      success: true,
      order_ref: `MANUAL-${Date.now()}`,
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      total_cost: 0,
      currency: "USD",
    }
  }

  async getOrderStatus(_orderRef: string): Promise<ProviderOrderStatusResult | null> {
    return null
  }

  async getTracking(_trackingNumber: string): Promise<ProviderTrackingResult | null> {
    return null
  }
}

export const manualProvider = new ManualProvider()
