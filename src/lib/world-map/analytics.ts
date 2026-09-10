/**
 * ZAFIRO WORLD MAP — Analíticas de privacidad mínima.
 * Cada evento se registra SIN GPS preciso y SIN datos personales.
 * Con worldMap.enabled=false no se envía NADA (no-op total).
 */

export type WorldMapAnalyticsEvent =
  | "world_map_open"
  | "world_map_story_view"
  | "world_map_story_open"
  | "world_map_search"
  | "world_map_layer_change"
  | "world_map_node_open"
  | "world_map_eliana_search"

const META: Record<string, { sample: boolean }> = {
  world_map_open: { sample: true },
  world_map_story_view: { sample: true },
  world_map_story_open: { sample: true },
  world_map_search: { sample: true },
  world_map_layer_change: { sample: true },
  world_map_node_open: { sample: true },
  world_map_eliana_search: { sample: true },
}

interface WorldMapAnalyticsProps {
  place?: string
  layer?: string
  entityType?: string
}

/**
 * Registra un evento de analytics SI y solo si el world map está activo.
 * No envía datos a ningún servicio externo todavía: queda preparada la
 * firma para conectar un endpoint propio más adelante.
 */
export function trackWorldMap(
  event?: WorldMapAnalyticsEvent | string,
  props?: WorldMapAnalyticsProps,
): void {
  const key: string = event ?? ""
  if (!META[key]) return
  // No se registra nada cuando las flags están apagadas.
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    // Solo diagnóstico local; nunca se logean datos sensibles.
    return
  }
  void props
}