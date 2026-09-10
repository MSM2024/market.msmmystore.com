/**
 * ZAFIRO WORLD MAP — Agregados públicos para la historia-mundo.
 * Solo cuenta números y agrupaciones; NUNCA nombres ni datos privados.
 * Los resúmenes se generan backend (world_activity_summary) o en memoria
 * a partir de nodos ya visibles.
 */

import type { MapNodeRow, WorldMapEntityType } from "./types"
import { isPubliclyVisible, toPublicNode } from "./privacy"

export interface CountryActivity {
  country_code: string
  label: string
  activeNodes: number
  businesses: number
  projects: number
  events: number
  communities: number
  products: number
  peopleApproximate: number
}

export interface WorldStoryPayload {
  countries: CountryActivity[]
  totalActiveNodes: number
  newBusinesses: number
  activeProjects: number
  eventsToday: number
  featuredPlace?: { name: string; kind: string }
}

const COUNTRY_LABELS: Record<string, string> = {
  CU: "Cuba",
  PR: "Puerto Rico",
  US: "Estados Unidos",
  ES: "España",
  MX: "México",
  DO: "República Dominicana",
  CO: "Colombia",
  VE: "Venezuela",
  JP: "Japón",
}

const TYPE_COUNTER: Record<WorldMapEntityType, (entry: CountryActivity) => void> = {
  USER: (e) => { e.peopleApproximate += 1 },
  BUSINESS: (e) => { e.businesses += 1 },
  PRODUCT: (e) => { e.products += 1 },
  SERVICE: (e) => { e.communities += 1 },
  PROJECT: (e) => { e.projects += 1 },
  EVENT: (e) => { e.events += 1 },
  COMMUNITY: (e) => { e.communities += 1 },
  VILLA: (e) => { e.businesses += 1 },
  MSM_NODE: () => {}, // solo cuenta como nodo activo
  OPPORTUNITY: (e) => { e.projects += 1 },
}

/** Agrega actividad por país a partir de nodos ya filtrados como públicos. */
export function summarizeActivity(rows: MapNodeRow[]): CountryActivity[] {
  const visible = rows.filter(isPubliclyVisible)
  const map = new Map<string, CountryActivity>()

  for (const row of visible) {
    const code = row.country_code || "??"
    let entry = map.get(code)
    if (!entry) {
      entry = {
        country_code: code,
        label: COUNTRY_LABELS[code] ?? code,
        activeNodes: 0,
        businesses: 0,
        projects: 0,
        events: 0,
        communities: 0,
        products: 0,
        peopleApproximate: 0,
      }
      map.set(code, entry)
    }
    entry.activeNodes += 1
    TYPE_COUNTER[row.entity_type]?.(entry)
  }

  return [...map.values()].sort((a, b) => b.activeNodes - a.activeNodes)
}

/** Construye el payload de la historia mundial; null cuando no hay actividad. */
export function buildWorldStoryPayload(rows: MapNodeRow[]): WorldStoryPayload | null {
  const countries = summarizeActivity(rows)
  if (countries.length === 0) return null

  const totalActiveNodes = countries.reduce((acc, c) => acc + c.activeNodes, 0)
  const newBusinesses = countries.reduce((acc, c) => acc + c.businesses, 0)
  const activeProjects = countries.reduce((acc, c) => acc + c.projects, 0)
  const eventsToday = countries.reduce((acc, c) => acc + c.events, 0)
  const featured = countries[0]

  return {
    countries,
    totalActiveNodes,
    newBusinesses,
    activeProjects,
    eventsToday,
    featuredPlace: featured
      ? { name: featured.label, kind: featured.businesses > 0 ? "business" : "community" }
      : undefined,
  }
}

/** Utilidad de respaldo para la vista previa cuando no hay API (historia). */
export function emptyWorldStoryFallback(): { countries: []; totalActiveNodes: 0 } {
  return { countries: [], totalActiveNodes: 0 }
}

export function toPublicNodes(rows: MapNodeRow[]) {
  return rows.filter(isPubliclyVisible).map(toPublicNode)
}