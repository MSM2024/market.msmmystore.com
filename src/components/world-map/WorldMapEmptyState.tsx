"use client"

import { Globe } from "lucide-react"
import { WORLD_MAP_EMPTY_MESSAGE } from "@/lib/world-map/flags"

/**
 * Estado vacío honesto: se muestra cuando el mapa está desactivado o no
 * hay datos reales. NUNCA inventa nodos/negocios/personas.
 */
export default function WorldMapEmptyState({
  message = WORLD_MAP_EMPTY_MESSAGE,
}: {
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
        <Globe className="w-8 h-8 text-purple-300" />
      </div>
      <p className="text-lg font-medium text-white/80 mb-1">{message}</p>
      <p className="text-sm text-white/50 max-w-md">
        ZAFIRO guarda cada ubicación con privacidad. Las personas solo aparecen con su
        consentimiento y nunca se publica el GPS residencial exacto.
      </p>
    </div>
  )
}