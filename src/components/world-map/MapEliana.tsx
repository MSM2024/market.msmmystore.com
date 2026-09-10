"use client"

import { useState } from "react"
import { Sparkles, Send } from "lucide-react"
import { parseMapIntent, ENTITY_TYPE_LABELS } from "@/lib/world-map/search"
import { worldMapElianaSearchEnabled } from "@/lib/world-map/flags"
import { trackWorldMap } from "@/lib/world-map/analytics"
import type { MapSearchIntent } from "@/lib/world-map/types"

/**
 * ELIANA dentro del Mapa Mundial: entiende la intención (negocios cerca de
 * Madrid, eventos hoy, nodos MSM, etc.) y prepara la búsqueda. El usuario
 * confirma; ELIANA nunca fabrica lugares ni coordenadas.
 */
export default function MapEliana({ onSearch }: { onSearch: (intent: MapSearchIntent) => void }) {
  const [value, setValue] = useState("")
  const [result, setResult] = useState<MapSearchIntent | null>(null)
  const [unclear, setUnclear] = useState(false)

  if (!worldMapElianaSearchEnabled()) return null

  const ask = () => {
    const intent = parseMapIntent(value)
    setUnclear(!intent)
    setResult(intent)
    if (intent) trackWorldMap("world_map_eliana_search")
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span className="text-sm font-semibold text-white">ELIANA · Mapa Mundial</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setUnclear(false); setResult(null) }}
          onKeyDown={(e) => { if (e.key === "Enter") ask() }}
          placeholder="Dime qué buscamos por el mundo... ej: 'eventos hoy en Cuba'"
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/40"
        />
        <button
          onClick={ask}
          className="p-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-white"
          aria-label="Preguntar a ELIANA"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {unclear && (
        <p className="text-xs text-white/50">
          Aún no entiendo una ubicación o capa clara. Prueba algo como
          “muéstrame proyectos cerca de Miami” o “qué eventos hay hoy”.
        </p>
      )}

      {result && (
        <div className="text-xs text-white/70 space-y-1.5">
          <p>
            Entendí: buscar{" "}
            {result.entityTypes.length > 0
              ? result.entityTypes.map((t) => ENTITY_TYPE_LABELS[t]).join(" y ")
              : "en todo el mundo"}
            {result.location ? ` en ${result.location.name}` : ""}
            {result.radiusKm ? ` (radio ${result.radiusKm} km)` : ""}.
          </p>
          <button
            onClick={() => onSearch(result)}
            className="text-purple-300 font-medium hover:text-purple-200"
          >
            Buscar ahora →
          </button>
        </div>
      )}
    </div>
  )
}