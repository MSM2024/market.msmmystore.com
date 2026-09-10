/**
 * ZAFIRO WORLD MAP — Feature flags.
 * TODAS LAS FLAGS NACEN APAGADAS. Con worldMap.enabled=false ZAFIRO
 * funciona EXACTAMENTE como hoy (no se renderiza la historia-mundo, no se
 * carga el mapa, no se enlaza la ruta, ELIANA no busca en el mapa).
 *
 * Un release futuro activa cada flag de forma escalonada:
 *   A) enabled+storiesPreview · B) business/projects/villa ·
 *   C) products/services/events/communities · D) people bajo consentimiento ·
 *   E) elianaSearch · F) realtimePresence.
 *
 * Opcionalmente se puede forzar desde entorno NEXT_PUBLIC_WORLD_MAP_*,
 * pero el valor por defecto SIEMPRE es false.
 */

export const WORLD_MAP_NAMESPACE = "worldMap"

export interface WorldMapFlags {
  enabled: boolean
  storiesPreview: boolean
  peopleLayer: boolean
  businessLayer: boolean
  marketplaceLayer: boolean
  projectsLayer: boolean
  eventsLayer: boolean
  villaNodes: boolean
  elianaSearch: boolean
  realtimePresence: boolean
}

export const WORLD_MAP_FLAG_DEFAULTS: WorldMapFlags = {
  enabled: false,
  storiesPreview: false,
  peopleLayer: false,
  businessLayer: false,
  marketplaceLayer: false,
  projectsLayer: false,
  eventsLayer: false,
  villaNodes: false,
  elianaSearch: false,
  realtimePresence: false,
}

export type WorldMapFlagKey = keyof WorldMapFlags

function envBool(name: string, fallback: boolean): boolean {
  if (typeof process === "undefined" || !process.env) return fallback
  const raw = process.env[name]
  if (raw === undefined || raw === "") return fallback
  return raw === "true" || raw === "1"
}

function evalFlags(): WorldMapFlags {
  const f = {} as WorldMapFlags
  for (const key of Object.keys(WORLD_MAP_FLAG_DEFAULTS) as WorldMapFlagKey[]) {
    f[key] = envBool(`NEXT_PUBLIC_WORLD_MAP_${key.toUpperCase()}`, WORLD_MAP_FLAG_DEFAULTS[key])
  }
  return f
}

/** Estado EFECTIVO de las flags (constante de build; false por defecto). */
export const WORLD_MAP_FLAGS: WorldMapFlags = evalFlags()

export const worldMapEnabled = (): boolean => WORLD_MAP_FLAGS.enabled
export const worldMapStoryPreviewEnabled = (): boolean =>
  WORLD_MAP_FLAGS.enabled && WORLD_MAP_FLAGS.storiesPreview
export const worldMapElianaSearchEnabled = (): boolean =>
  WORLD_MAP_FLAGS.enabled && WORLD_MAP_FLAGS.elianaSearch
export const worldMapRealtimeEnabled = (): boolean =>
  WORLD_MAP_FLAGS.enabled && WORLD_MAP_FLAGS.realtimePresence

/**
 * Mensaje honesto que se muestra cuando el mapa está desactivado o la
 * fuente de datos aún no existe. Nunca se inventan nodos/negocios/personas.
 */
export const WORLD_MAP_EMPTY_MESSAGE = "ZAFIRO está creciendo en esta zona 🌎"