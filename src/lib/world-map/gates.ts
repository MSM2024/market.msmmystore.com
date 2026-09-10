/**
 * ZAFIRO WORLD MAP — Puertas (gates) por capa.
 * Cada capa del mapa se dibuja SOLO si su flag individual está encendida.
 * Con todas las flags OFF nada se pinta (ZAFIRO queda como está hoy).
 */

import { WORLD_MAP_FLAGS, type WorldMapFlags } from "./flags"
import type { WorldMapEntityType } from "./types"

const LAYER_FLAG: Partial<Record<WorldMapEntityType, keyof WorldMapFlags>> = {
  USER: "peopleLayer",
  BUSINESS: "businessLayer",
  VILLA: "villaNodes",
  COMMUNITY: "eventsLayer",
  EVENT: "eventsLayer",
  PROJECT: "projectsLayer",
  MSM_NODE: "projectsLayer",
  PRODUCT: "marketplaceLayer",
  SERVICE: "businessLayer",
  OPPORTUNITY: "projectsLayer",
}

export function worldMapLayersEnabled(type: WorldMapEntityType): boolean {
  if (!WORLD_MAP_FLAGS.enabled) return false
  const flag = LAYER_FLAG[type]
  if (!flag) return false
  return WORLD_MAP_FLAGS[flag]
}

export { WORLD_MAP_FLAGS }