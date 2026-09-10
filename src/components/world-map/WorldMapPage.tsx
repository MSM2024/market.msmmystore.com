"use client"

import { useState } from "react"
import { worldMapEnabled, WORLD_MAP_EMPTY_MESSAGE } from "@/lib/world-map/flags"
import type { MapSearchIntent, WorldMapEntityType } from "@/lib/world-map/types"
import MapCanvas from "./MapCanvas"
import MapLayers from "./MapLayers"
import MapSearch from "./MapSearch"
import MapEliana from "./MapEliana"
import MapPrivacy from "./MapPrivacy"
import MapRealtime from "./MapRealtime"
import WorldMapEmptyState from "./WorldMapEmptyState"

const DEFAULT_TYPES: WorldMapEntityType[] = ["BUSINESS", "PROJECT", "MSM_NODE"]

/**
 * Página del Mapa Mundial.
 * - worldMap.enabled=false → placeholder honesto SIN cargar el mapa
 *   (maplibre no entra en el bundle inicial de ZAFIRO).
 * - worldMap.enabled=true  → lienzo MapLibre + capas/búsqueda con sus flags.
 */
export default function WorldMapPage() {
  const [types, setTypes] = useState<WorldMapEntityType[]>(DEFAULT_TYPES)
  const [intent, setIntent] = useState<MapSearchIntent | null>(null)

  const applyIntent = (search: MapSearchIntent) => {
    setIntent(search)
    if (search.entityTypes.length > 0) setTypes(search.entityTypes)
  }

  if (!worldMapEnabled()) {
    return (
      <div className="min-h-screen zafiro-page text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold zafiro-gold-text mb-2">Mapa Mundial 🌎</h1>
          <p className="text-sm text-white/50 mb-6">{WORLD_MAP_EMPTY_MESSAGE}</p>
          <WorldMapEmptyState />
          <div className="mt-6">
            <MapPrivacy />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-3xl font-bold zafiro-gold-text">Mapa Mundial 🌎</h1>
          <MapRealtime />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapCanvas
              entityTypes={types}
              category={intent?.filters.category}
              radiusKm={intent?.radiusKm}
              focus={intent?.location?.center ?? null}
            />
          </div>
          <div className="space-y-4">
            <MapEliana onSearch={applyIntent} />
            <MapSearch onSearch={applyIntent} />
            <MapLayers selected={types} onChange={setTypes} />
            <MapPrivacy />
          </div>
        </div>
      </div>
    </div>
  )
}