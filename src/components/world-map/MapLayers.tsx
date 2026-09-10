"use client"

import { Layers } from "lucide-react"
import type { WorldMapFlags } from "@/lib/world-map/flags"
import { WORLD_MAP_ENTITY_TYPES, type WorldMapEntityType } from "@/lib/world-map/types"
import { ENTITY_TYPE_LABELS } from "@/lib/world-map/search"
import { worldMapLayersEnabled } from "@/lib/world-map/gates"

const LAYER_FLAG: Partial<Record<WorldMapEntityType, keyof WorldMapFlags>> = {
  USER: "peopleLayer",
  BUSINESS: "businessLayer",
  VILLA: "villaNodes",
  COMMUNITY: "eventsLayer",
  EVENT: "eventsLayer",
  PROJECT: "projectsLayer",
  MSM_NODE: "projectsLayer",
  PRODUCT: "marketplaceLayer",
  SERVICE: "businessLayer",
  OPPORTUNITY: "projectsLayer",
}

function tilesFor(entityType: WorldMapEntityType): WorldMapEntityType[] {
  const seen = new Set<WorldMapEntityType>()
  for (const t of WORLD_MAP_ENTITY_TYPES) {
    if (LAYER_FLAG[t] === LAYER_FLAG[entityType] && worldMapLayersEnabled(t)) seen.add(t)
  }
  return [...seen].sort((a, b) => WORLD_MAP_ENTITY_TYPES.indexOf(a) - WORLD_MAP_ENTITY_TYPES.indexOf(b))
}

/** Selector de capas del mapa. Solo pinta las capas con su flag activa. */
export default function MapLayers({
  selected,
  onChange,
}: {
  selected: WorldMapEntityType[]
  onChange: (types: WorldMapEntityType[]) => void
}) {
  const enabled = WORLD_MAP_ENTITY_TYPES.filter((t) => LAYER_FLAG[t] && worldMapLayersEnabled(t))
  if (enabled.length === 0) return null

  const toggle = (type: WorldMapEntityType) => {
    const tiles = tilesFor(type)
    const anyActive = tiles.some((t) => selected.includes(t))
    onChange(
      anyActive
        ? selected.filter((s) => !tiles.includes(s))
        : [...new Set([...selected, ...tiles])],
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-purple-300" />
        <h3 className="text-sm font-semibold text-white">Capas</h3>
      </div>
      <div className="space-y-2">
        {enabled.map((type) => {
          const tiles = tilesFor(type)
          const active = tiles.some((t) => selected.includes(t))
          const labels = tiles.map((t) => ENTITY_TYPE_LABELS[t]).join(" / ")
          return (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(type)}
                className="accent-purple-500"
              />
              <span className="text-white/70">{labels}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}