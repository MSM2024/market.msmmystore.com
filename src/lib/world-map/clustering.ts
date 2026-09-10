/**
 * ZAFIRO WORLD MAP — Clustering puro (cuadrícula geográfica).
 * Determinista y testeable. A zooms bajos agrupa nodos en clusters;
 * por encima de CLUSTER_MAX_ZOOM devuelve nodos individuales.
 */

import type { PublicNode, ServerCluster } from "./types"

export const CLUSTER_MAX_ZOOM = 12

/** Aislamos el subconjunto de campos usados para agrupar (funciona con PublicNode y MapNodeRow). */
type Clusterable = Pick<PublicNode, "id" | "entity_type" | "public_lat" | "public_lng">

function cellDeg(zoom: number): number {
  return 360 / Math.pow(2, Math.max(1, zoom)) / 4
}

/** Clasifica nodos en clusters (cuadrícula) u hojas, dados su lat/lng públicos. */
export function clusterNodes<T extends Clusterable>(
  nodes: T[],
  zoom: number,
  maxCellsPerDim = 64,
): { clusters: ServerCluster[]; leaves: T[] } {
  const leaves: T[] = []
  const map = new Map<string, T[]>()

  for (const node of nodes) {
    if (node.public_lat == null || node.public_lng == null) {
      leaves.push(node)
      continue
    }
    const cell = cellDeg(zoom)
    const cx = Math.floor(node.public_lng / cell) * cell
    const cy = Math.floor(node.public_lat / cell) * cell
    const cellsX = Math.ceil(360 / cell)
    const cellsY = Math.ceil(180 / cell)
    if (cellsX > maxCellsPerDim || cellsY > maxCellsPerDim) {
      leaves.push(node)
      continue
    }
    const key = `${cx.toFixed(4)},${cy.toFixed(4)}`
    const bucket = map.get(key)
    if (bucket) bucket.push(node)
    else map.set(key, [node])
  }

  const clusters: ServerCluster[] = []
  for (const [key, bucket] of map) {
    const [cxRaw, cyRaw] = key.split(",")
    const cx = Number(cxRaw)
    const cy = Number(cyRaw)
    if (bucket.length === 1) {
      leaves.push(bucket[0])
      continue
    }
    let lat = 0
    let lng = 0
    let west = 180
    let south = 90
    let east = -180
    let north = -90
    const types = new Set<string>()

    for (const n of bucket) {
      // Los clusters solo usan coordenadas públicas (nunca privadas).
      lat += n.public_lat!
      lng += n.public_lng!
      west = Math.min(west, n.public_lng!)
      south = Math.min(south, n.public_lat!)
      east = Math.max(east, n.public_lng!)
      north = Math.max(north, n.public_lat!)
      types.add(n.entity_type)
    }
    const count = bucket.length
    clusters.push({
      id: `${cx.toFixed(4)}:${cy.toFixed(4)}:${count}`,
      count,
      center: { lat: lat / count, lng: lng / count },
      bbox: [west, south, east, north],
      entity_types: [...types] as ServerCluster["entity_types"],
    })
  }

  return { clusters, leaves }
}

/** Devuelve true si el nodo tiene coordenadas públicas usables para pintar. */
export function hasPublicCoords(node: Pick<PublicNode, "public_lat" | "public_lng">): boolean {
  return node.public_lat != null && node.public_lng != null
}