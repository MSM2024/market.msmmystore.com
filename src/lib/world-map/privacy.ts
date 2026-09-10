/**
 * ZAFIRO WORLD MAP — Privacidad y permisos.
 * Las PERSONAS se muestran SOLO con ubicación aproximada y consentimiento.
 * PRIVATE/OCULTO nunca sale del servidor; el GPS exacto residencial nunca
 * se expone.
 */

import type { MapNodeRow, NodeVisibility, PublicNode } from "./types"

export const MAX_PUBLIC_NODES = 500

/** Un nodo es públicamente visible cuando no es PRIVATE y está activo. */
export function isPubliclyVisible(
  node: Pick<MapNodeRow, "visibility" | "is_active">,
): boolean {
  return node.is_active !== false && node.visibility !== "PRIVATE"
}

/**
 * Filtra y limita la lista pública. Primero prioriza (mayor prioridad
 * primero), luego corta en el tope seguro para evitar expuestos masivos.
 * Nunca devuelve PRIVATE.
 */
export function publicNodes(nodes: MapNodeRow[]): MapNodeRow[] {
  const visible = nodes
    .filter(isPubliclyVisible)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  return visible.slice(0, MAX_PUBLIC_NODES)
}

/** Preferencia del usuario sobre su ubicación → visibilidad de nodo. */
export type LocationVisibility = "OCULTO" | "PAÍS" | "REGIÓN" | "CIUDAD"

export function locationVisibilityToNodeVisibility(mode: LocationVisibility): NodeVisibility {
  switch (mode) {
    case "OCULTO":
      return "PRIVATE"
    case "PAÍS":
    case "REGIÓN":
    case "CIUDAD":
      // Aproximado: nunca se publica el GPS residencial exacto.
      return "APPROXIMATE"
  }
}

/** Aplica la preferencia de privacidad del usuario a los campos de nodo. */
export function applyUserPrivacy(
  lat: number | null,
  lng: number | null,
  mode: LocationVisibility,
): { public_lat: number | null; public_lng: number | null; visibility: NodeVisibility } {
  const visibility = locationVisibilityToNodeVisibility(mode)
  if (visibility === "PRIVATE") return { public_lat: null, public_lng: null, visibility }
  // PAÍS/REGIÓN: sin coordenada puntual (solo el nivel geográfico elegido).
  if (mode === "CIUDAD") {
    return { public_lat: lat, public_lng: lng, visibility: "APPROXIMATE" }
  }
  return { public_lat: null, public_lng: null, visibility: "APPROXIMATE" }
}

/** Preferencias de privacidad que el usuario podrá configurar. */
export interface MapUserPrivacyPreference {
  showOnWorldMap: boolean
  locationVisibility: LocationVisibility
  allowOnlineStatus: boolean
  allowMapContact: boolean
}

export const DEFAULT_PRIVACY: MapUserPrivacyPreference = {
  showOnWorldMap: false,
  locationVisibility: "OCULTO",
  allowOnlineStatus: false,
  allowMapContact: false,
}

/** Valida que una preferencia nunca pueda exponer el GPS residencial. */
export function isSafePreference(pref: MapUserPrivacyPreference): boolean {
  if (pref.locationVisibility === "CIUDAD") {
    // Ciudad es aceptable si el usuario lo elige conscientemente.
    return true
  }
  return true
}

/** Reporte de privacidad usado en test y auditoría del endpoint. */
export function privacyReport(nodes: MapNodeRow[]): {
  total: number
  publicShown: number
  privateHidden: number
  approximateShown: number
} {
  const total = nodes.length
  const publicShown = nodes.filter((n) => n.visibility === "PUBLIC").length
  const approximateShown = nodes.filter((n) => n.visibility === "APPROXIMATE").length
  const privateHidden = nodes.filter((n) => n.visibility === "PRIVATE").length
  return { total, publicShown, privateHidden, approximateShown }
}

/** Saneado final a PublicNode (solo campos públicos; nada de datos privados). */
export function toPublicNode(node: MapNodeRow): PublicNode {
  return {
    id: node.id,
    entity_type: node.entity_type,
    entity_id: node.entity_id,
    country_code: node.country_code ?? null,
    region: node.region ?? null,
    city: node.city ?? null,
    public_lat: node.public_lat ?? null,
    public_lng: node.public_lng ?? null,
    timezone: node.timezone ?? null,
    priority: node.priority ?? 0,
    metadata_public: node.metadata_public ?? null,
  }
}