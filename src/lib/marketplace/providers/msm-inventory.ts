// ================================================================
// MSM INVENTORY PROVIDER — Inventario propio de MSM
// Productos que MSM tiene en stock y envía directamente
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

export class MSMInventoryProvider implements ProviderAdapter {
  name = "Inventario MSM"
  type = "msm_inventory" as const
  isEnabled = true

  async searchProducts(_query: string, _options?: ProviderSearchOptions): Promise<ProviderProductResult[]> {
    // MSM inventory se consulta desde la propia BD
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
    // MSM procesa internamente
    return {
      success: true,
      order_ref: `MSM-${Date.now()}`,
      estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
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

export const msmInventoryProvider = new MSMInventoryProvider()
