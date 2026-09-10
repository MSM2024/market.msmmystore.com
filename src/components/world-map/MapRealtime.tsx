"use client"

import { Radio } from "lucide-react"
import { worldMapRealtimeEnabled } from "@/lib/world-map/flags"

/**
 * Presencia en vivo (flag realtimePresence). Mientras esté off no pinta nada.
 * El valor mostrado por ahora es un placeholder honesto (sin websockets
 * conectados todavía); se iluminará cuando se conecte el canal realtime.
 */
export default function MapRealtime() {
  if (!worldMapRealtimeEnabled()) return null
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-white/5 rounded-full px-2 py-1">
      <Radio className="w-3.5 h-3.5 text-emerald-300" />
      <span>En vivo</span>
    </div>
  )
}