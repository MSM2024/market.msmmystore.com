import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { worldMapEnabled, WORLD_MAP_EMPTY_MESSAGE } from "@/lib/world-map/flags"
import { buildWorldStoryPayload, type WorldStoryPayload } from "@/lib/world-map/aggregates"
import { publicNodes } from "@/lib/world-map/privacy"
import { rateLimitByIp } from "@/lib/world-map/spatial"
import type { MapNodeRow } from "@/lib/world-map/types"

export const runtime = "nodejs"

export interface WorldMapStoryResponse {
  enabled: boolean
  story: WorldStoryPayload | null
  message?: string
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

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "127.0.0.1"
}

/**
 * GET /api/world-map/story
 * Resumen AGRUPADO y público de la actividad mundial (solo números);
 * nunca nombres, nunca coordenadas, respeta worldMap.enabled.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req)
  const rl = rateLimitByIp(ip, { max: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera unos segundos.", retryAfter: rl.retryAfterSeconds },
      { status: 429 },
    )
  }

  if (!worldMapEnabled()) {
    return NextResponse.json({
      enabled: false,
      story: null,
      message: WORLD_MAP_EMPTY_MESSAGE,
    } satisfies WorldMapStoryResponse)
  }

  let rows: MapNodeRow[] = []
  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin")
    const { getSupabaseClient } = await import("@/lib/supabase")
    const supabase = getSupabaseAdminClient() ?? getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from("map_nodes")
        .select("*")
        .eq("is_active", true)
        .limit(5000)
      if (!error && Array.isArray(data)) {
        rows = data.map((r) => asMapNodeRow(r as Record<string, unknown>))
      }
    }
  } catch {
    rows = []
  }

  const visible = publicNodes(rows)
  const story = buildWorldStoryPayload(visible)

  return NextResponse.json({
    enabled: true,
    story,
    message: story ? undefined : WORLD_MAP_EMPTY_MESSAGE,
  } satisfies WorldMapStoryResponse)
}