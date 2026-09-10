/**
 * ZAFIRO WORLD MAP — Modelo de dominio.
 * PREPARADO con todas las flags APAGADAS: nada de esto se activa en
 * producción hasta que un release encienda worldMap.enabled.
 * map_nodes NO copia datos privados: solo referencia entity_type + entity_id;
 * la información real vive en la entidad original del ecosistema.
 */

export type WorldMapEntityType =
  | "USER"
  | "BUSINESS"
  | "PRODUCT"
  | "SERVICE"
  | "PROJECT"
  | "EVENT"
  | "COMMUNITY"
  | "VILLA"
  | "MSM_NODE"
  | "OPPORTUNITY"

export const WORLD_MAP_ENTITY_TYPES: WorldMapEntityType[] = [
  "USER",
  "BUSINESS",
  "PRODUCT",
  "SERVICE",
  "PROJECT",
  "EVENT",
  "COMMUNITY",
  "VILLA",
  "MSM_NODE",
  "OPPORTUNITY",
]

export type NodeVisibility = "PUBLIC" | "APPROXIMATE" | "PRIVATE"

export const NODE_VISIBILITIES: NodeVisibility[] = ["PUBLIC", "APPROXIMATE", "PRIVATE"]

/**
 * Fila genérica de referencia geográfica. NO contiene email, teléfono,
 * dirección residencial, GPS residencial, tokens ni datos de pago.
 */
export interface MapNodeRow {
  id: string
  entity_type: WorldMapEntityType
  entity_id: string
  country_code: string | null
  region: string | null
  city: string | null
  public_lat: number | null
  public_lng: number | null
  geohash: string | null
  timezone: string | null
  visibility: NodeVisibility
  is_active: boolean
  priority: number
  metadata_public: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

/** Nodo ya saneado: ÚNICAMENTE campos públicos (nunca se expone datos privados). */
export interface PublicNode {
  id: string
  entity_type: WorldMapEntityType
  entity_id: string
  country_code: string | null
  region: string | null
  city: string | null
  public_lat: number | null
  public_lng: number | null
  timezone: string | null
  priority: number
  metadata_public: Record<string, unknown> | null
}

export interface MapViewport {
  west: number
  south: number
  east: number
  north: number
  zoom: number
}

export interface ServerCluster {
  id: string
  count: number
  center: { lat: number; lng: number }
  bbox: [number, number, number, number] // [w, s, e, n]
  entity_types: WorldMapEntityType[]
}

export interface NodesApiResponse {
  enabled: boolean
  nodes: PublicNode[]
  clusters: ServerCluster[]
  viewport: MapViewport | null
  totalVisible: number
}

/** Localizada con datos REALES (base/geocoder autorizado). ELIANA nunca inventa coordenadas. */
export interface MapLocationRef {
  name: string
  type: "country" | "region" | "city"
  country_code?: string
  region?: string
  city?: string
  center?: { lat: number; lng: number } // null cuando el centro aún no está confirmado
  timezone?: string
}

export interface MapSearchIntent {
  intent: "MAP_SEARCH"
  entityTypes: WorldMapEntityType[]
  location: MapLocationRef | null
  radiusKm: number | null
  filters: { category?: string; minRating?: number; online?: boolean }
  sort: "distance" | "relevance" | "created_at" | null
  raw: string
}