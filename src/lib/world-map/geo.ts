/**
 * ZAFIRO WORLD MAP — Utilidades geográficas puras (cliente/servidor).
 * Haversine para radio y búsquedas; nunca genera coordenadas imaginarias.
 */

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Distancia en km entre dos puntos (haversine). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * R * Math.asin(Math.sqrt(h))
}

export interface LatLng {
  lat: number
  lng: number
}

/** Centro de un conjunto de puntos (media aritmética). */
export function centerOf(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 }
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

/** Copia un punto dentro del radio (en km) desde un centro. */
export function withinRadius(
  center: LatLng,
  point: LatLng,
  radiusKm: number,
): boolean {
  return distanceKm(center, point) <= radiusKm
}