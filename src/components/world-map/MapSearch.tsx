"use client"

import { useState } from "react"
import { Search, Check } from "lucide-react"
import { parseMapIntent, ENTITY_TYPE_LABELS } from "@/lib/world-map/search"
import { worldMapElianaSearchEnabled } from "@/lib/world-map/flags"
import { trackWorldMap } from "@/lib/world-map/analytics"
import type { MapSearchIntent } from "@/lib/world-map/types"

/**
 * Buscador del mapa. Traduce intención humana a capas/ubicación (parseMapIntent)
 * y aplica el filtro SOLO cuando el usuario confirma. Nunca inventa respuestas.
 */
export default function MapSearch({ onSearch }: { onSearch: (intent: MapSearchIntent) => void }) {
  const [value, setValue] = useState("")
  const [parsed, setParsed] = useState<MapSearchIntent | null>(null)

  if (!worldMapElianaSearchEnabled()) return null

  const interpret = () => {
    const intent = parseMapIntent(value)
    setParsed(intent)
    if (intent) trackWorldMap("world_map_search")
  }

  const apply = () => {
    if (parsed) onSearch(parsed)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-purple-300" />
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setParsed(null) }}
          onKeyDown={(e) => { if (e.key === "Enter") interpret() }}
          placeholder="Ej: busca cafeterías cerca de Madrid"
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/40"
        />
        <button
          onClick={interpret}
          className="px-3 py-1.5 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-white text-sm"
        >
          Buscar
        </button>
      </div>

      {parsed && (
        <div className="text-sm text-white/70">
          {parsed.entityTypes.length > 0 ? (
            parsed.entityTypes.map((t) => (
              <span key={t} className="mr-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {ENTITY_TYPE_LABELS[t]}
              </span>
            ))
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">Todo</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            {parsed.location ? parsed.location.name : "Todo el mapa"}
            {parsed.radiusKm ? ` · ${parsed.radiusKm} km` : ""}
          </span>
          <button
            onClick={apply}
            className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200"
          >
            <Check className="w-3.5 h-3.5" /> Aplicar
          </button>
        </div>
      )}
    </div>
  )
}