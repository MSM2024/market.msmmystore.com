/**
 * ZAFIRO WORLD MAP — Utilidades espaciales de servidor.
 * Validación de viewport, whitelist de entidades, rate limit por IP y
 * construcción del query de bounding box para Supabase (geohash/índices).
 */

import { WORLD_MAP_ENTITY_TYPES, type MapViewport, type WorldMapEntityType } from "./types"

export interface BboxResult {
  viewport: MapViewport | null
  error?: string
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Valida y normaliza un viewport {west,south,east,north,zoom}. */
export function parseBbox(raw: Record<string, unknown>): BboxResult {
  const wn = Number(raw.west)
  const sn = Number(raw.south)
  const en = Number(raw.east)
  const nn = Number(raw.north)
  const zoom = Number(raw.zoom)

  if ([wn, sn, en, nn].some((n) => !Number.isFinite(n))) {
    return { viewport: null, error: "bbox requerido: west,south,east,north" }
  }

  const west = clamp(wn, -180, 180)
  let east = clamp(en, -180, 180)
  const south = clamp(sn, -90, 90)
  let north = clamp(nn, -90, 90)

  if (west === east || south === north) {
    return { viewport: null, error: "bbox inválido: area vacía" }
  }
  if (east <= west) east = west + 0.01
  if (north <= south) north = south + 0.01

  return {
    viewport: {
      west,
      south,
      east,
      north,
      zoom: Number.isFinite(zoom) ? clamp(Math.round(zoom), 0, 20) : 2,
    },
  }
}

export const DEFAULT_MAP_LAYERS: WorldMapEntityType[] = ["BUSINESS", "PROJECT", "MSM_NODE"]

/** Filtra una lista de tipos contra la whitelist; vacío → capas por defecto. */
export function parseEntityTypes(types: unknown): WorldMapEntityType[] {
  if (typeof types !== "string" || types.trim() === "") return DEFAULT_MAP_LAYERS
  const out: WorldMapEntityType[] = []
  for (const raw of types.split(",")) {
    const t = raw.trim().toUpperCase() as WorldMapEntityType
    if (WORLD_MAP_ENTITY_TYPES.includes(t) && !out.includes(t)) out.push(t)
  }
  return out.length > 0 ? out : DEFAULT_MAP_LAYERS
}

/** Where de bounding box para el query a Supabase (índices por lat/lng). */
export function bboxWhere(viewport: MapViewport) {
  return {
    "public_lng.gte": viewport.west,
    "public_lng.lte": viewport.east,
    "public_lat.gte": viewport.south,
    "public_lat.lte": viewport.north,
  }
}

interface SlidingEntry {
  count: number
  resetAt: number
}

const SLIDING = new Map<string, SlidingEntry>()

/** Rate limit en memoria por IP (ventana fija). Devuelve {allowed, retryAfter}. */
export function rateLimitByIp(
  ip: string,
  options: { max?: number; windowMs?: number } = {},
): { allowed: boolean; retryAfterSeconds: number } {
  const max = options.max ?? 120
  const windowMs = options.windowMs ?? 60_000
  const now = Date.now()
  const entry = SLIDING.get(ip)
  if (!entry || entry.resetAt <= now) {
    SLIDING.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  entry.count += 1
  if (entry.count > max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSeconds: 0 }
}

export function resetIp(ip: string): void {
  SLIDING.delete(ip)
}

export const MAX_QUERY_LIMIT = 500
export const DEFAULT_QUERY_LIMIT = 200