export type { ProviderAdapter, ProviderSearchOptions, ProviderProductResult, ProviderPriceResult, ProviderInventoryResult, ProviderOrderRequest, ProviderOrderResult, ProviderOrderStatusResult, ProviderTrackingResult, ProviderTrackingEvent, ProviderShippingAddress, ProviderShippingInfo } from "./types"
export { ManualProvider, manualProvider } from "./manual"
export { MSMInventoryProvider, msmInventoryProvider } from "./msm-inventory"
export { PlaceholderProvider, amazonProvider, walmartProvider, samsProvider, homeDepotProvider, sheinProvider } from "./placeholder"

import type { ProviderAdapter } from "./types"
import { manualProvider } from "./manual"
import { msmInventoryProvider } from "./msm-inventory"
import { amazonProvider, walmartProvider, samsProvider, homeDepotProvider, sheinProvider } from "./placeholder"

export const ALL_PROVIDERS: ProviderAdapter[] = [
  manualProvider,
  msmInventoryProvider,
  amazonProvider,
  walmartProvider,
  samsProvider,
  homeDepotProvider,
  sheinProvider,
]

export function getProviderByName(name: string): ProviderAdapter | undefined {
  return ALL_PROVIDERS.find(p => p.name.toLowerCase() === name.toLowerCase())
}

export function getActiveProviders(): ProviderAdapter[] {
  return ALL_PROVIDERS.filter(p => p.isEnabled)
}
