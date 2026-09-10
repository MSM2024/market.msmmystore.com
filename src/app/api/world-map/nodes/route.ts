import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  parseBbox,
  parseEntityTypes,
  rateLimitByIp,
  DEFAULT_QUERY_LIMIT,
  MAX_QUERY_LIMIT,
} from "@/lib/world-map/spatial"
import { publicNodes, toPublicNode } from "@/lib/world-map/privacy"
import { clusterNodes } from "@/lib/world-map/clustering"
import { createViewportCache, worldMapCacheKey } from "@/lib/world-map/cache"
import { worldMapEnabled } from "@/lib/world-map/flags"
import type { MapNodeRow, NodesApiResponse } from "@/lib/world-map/types"

export const runtime = "nodejs"

const CACHE = createViewportCache<NodesApiResponse>({ ttlMs: 30_000, maxEntries: 60 })

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "127.0.0.1"
}

function emptyResponse(viewportNullable: NodesApiResponse["viewport"]): NodesApiResponse {
  return {
    enabled: worldMapEnabled(),
    nodes: [],
    clusters: [],
    viewport: viewportNullable,
    totalVisible: 0,
  }
}

function asMapNodeRow(row: Record<string, unknown>): MapNodeRow {
  return {
    id: String(row.id ?? ""),
    entity_type: (row.entity_type as MapNodeRow["entity_type"]) ?? "MSM_NODE",
    entity_id: String(row.entity_id ?? ""),
    country_code: row.country_code != null ? String(row.country_code) : null,
    region: row.region != null ? String(row.region) : null,
    city: row.city != null ? String(row.city) : null,
    public_lat: row.public_lat != null ? Number(row.public_lat) : null,
    public_lng: row.public_lng != null ? Number(row.public_lng) : null,
    geohash: row.geohash != null ? String(row.geohash) : null,
    timezone: row.timezone != null ? String(row.timezone) : null,
    visibility: (row.visibility as MapNodeRow["visibility"]) ?? "PRIVATE",
    is_active: row.is_active !== false,
    priority: row.priority != null ? Number(row.priority) : 0,
    metadata_public: (row.metadata_public as Record<string, unknown> | null) ?? null,
    created_at: row.created_at != null ? String(row.created_at) : new Date(0).toISOString(),
    updated_at: row.updated_at != null ? String(row.updated_at) : new Date(0).toISOString(),
  }
}

/**
 * GET /api/world-map/nodes
 * Solo consulta el bounding box visible; NUNCA devuelve el planeta completo,
 * nunca devuelve datos privados y respeta worldMap.enabled (off → 200 vacío).
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req)
  const rl = rateLimitByIp(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera unos segundos.", retryAfter: rl.retryAfterSeconds },
      { status: 429 },
    )
  }

  const params = req.nextUrl.searchParams
  const parsed = parseBbox({
    west: params.get("west"),
    south: params.get("south"),
    east: params.get("east"),
    north: params.get("north"),
    zoom: params.get("zoom"),
  })

  if (parsed.error || !parsed.viewport) {
    return NextResponse.json({ error: parsed.error ?? "bbox inválido" }, { status: 400 })
  }

  const viewport = parsed.viewport
  const types = parseEntityTypes(params.get("types"))
  const rawLimit = Number(params.get("limit"))
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_QUERY_LIMIT, Math.max(1, Math.round(rawLimit)))
    : DEFAULT_QUERY_LIMIT

  const category = params.get("category")?.toLowerCase() ?? ""
  const cacheKey = worldMapCacheKey({
    zoom: viewport.zoom,
    bbox: `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`,
    layers: types,
    filters: `${category}`,
  })

  const cached = CACHE.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  // Flags apagadas → respuesta vacía honesta (SOLO el viewport solicitado).
  if (!worldMapEnabled()) {
    const body = emptyResponse(viewport)
    CACHE.set(cacheKey, body)
    return NextResponse.json(body)
  }

  let rows: MapNodeRow[] = []
  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin")
    const { getSupabaseClient } = await import("@/lib/supabase")
    const supabase = getSupabaseAdminClient() ?? getSupabaseClient()
    if (supabase) {
      let query = supabase
        .from("map_nodes")
        .select("*")
        .eq("is_active", true)
        .in("entity_type", types)
        .gte("public_lng", viewport.west)
        .lte("public_lng", viewport.east)
        .gte("public_lat", viewport.south)
        .lte("public_lat", viewport.north)

      if (category) {
        query = query.ilike("metadata_public->>category", `%${category}%`)
      }

      const { data, error } = await query
        .order("priority", { ascending: false })
        .limit(limit)

      if (!error && Array.isArray(data)) {
        rows = data.map((r) => asMapNodeRow(r as Record<string, unknown>))
      }
    }
  } catch {
    // Tabla no creada todavía: respuesta vacía honesta (sin inventar datos).
    rows = []
  }

  const visibleRows = publicNodes(rows)
  const nodes = visibleRows.map(toPublicNode)
  const clustering = clusterNodes(nodes, viewport.zoom)

  const body: NodesApiResponse = {
    enabled: true,
    nodes: clustering.leaves,
    clusters: clustering.clusters,
    viewport,
    totalVisible: nodes.length,
  }
  CACHE.set(cacheKey, body)
  return NextResponse.json(body)
}