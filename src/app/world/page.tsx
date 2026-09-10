"use client"

import dynamic from "next/dynamic"

// maplibre-gl se carga SOLO desde aquí (chunk separado, ssr:false).
// Con worldMap.enabled=false este chunk ni siquiera se solicita.
const WorldMapPage = dynamic(() => import("@/components/world-map/WorldMapPage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/50">
      Preparando el mapa...
    </div>
  ),
})

export default function WorldPage() {
  return <WorldMapPage />
}