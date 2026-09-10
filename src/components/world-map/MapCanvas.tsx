"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { NodesApiResponse, PublicNode, ServerCluster } from "@/lib/world-map/types"
import { withinRadius } from "@/lib/world-map/geo"
import { WORLD_MAP_EMPTY_MESSAGE } from "@/lib/world-map/flags"
import MapNodeCard from "./MapNodeCard"

type ML = typeof import("maplibre-gl")

const DEFAULT_CENTER: [number, number] = [-55, 30]
const DEFAULT_ZOOM = 1.6
const MAX_ZOOM = 18

const NODE_COLORS: Record<string, string> = {
  BUSINESS: "#7c3aed",
  PRODUCT: "#f59e0b",
  SERVICE: "#06b6d4",
  PROJECT: "#10b981",
  EVENT: "#f43f5e",
  COMMUNITY: "#0ea5e9",
  VILLA: "#d946ef",
  MSM_NODE: "#f8fafc",
  OPPORTUNITY: "#22c55e",
  USER: "#eab308",
}

interface MapCanvasProps {
  entityTypes: string[]
  category?: string
  radiusKm?: number | null
  focus?: { lat: number; lng: number } | null
}

/**
 * El lienzo del Mapa Mundial (MapLibre + OSM, sin API key).
 * maplibre-gl se importa dinámicamente DENTRO del efecto: nunca se evalúa
 * en el servidor y no entra en el bundle inicial de ZAFIRO.
 */
export default function MapCanvas({ entityTypes, category, radiusKm, focus }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const mlRef = useRef<ML | null>(null)
  const markersRef = useRef<Array<{ remove: () => void }>>([])

  const [ready, setReady] = useState(false)
  const [nodes, setNodes] = useState<PublicNode[]>([])
  const [clusters, setClusters] = useState<ServerCluster[]>([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<PublicNode | null>(null)

  const paramsRef = useRef({ entityTypes, category, radiusKm, focus })

  const clearMarkers = () => {
    for (const m of markersRef.current) m.remove()
    markersRef.current = []
  }

  const load = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    const zoom = Math.round(map.getZoom())
    const { entityTypes: et, category: cat, radiusKm: rk, focus: fc } = paramsRef.current

    const params = new URLSearchParams({
      west: String(b.getWest()),
      south: String(b.getSouth()),
      east: String(b.getEast()),
      north: String(b.getNorth()),
      zoom: String(zoom),
      types: et.join(","),
      limit: "300",
    })
    if (cat) params.set("category", cat)

    try {
      const res = await fetch(`/api/world-map/nodes?${params.toString()}`)
      if (!res.ok) return
      const data: NodesApiResponse = await res.json()
      if (!data.enabled) {
        setNodes([])
        setClusters([])
        setTotal(0)
        return
      }
      let visible = data.nodes
      if (rk && rk > 0 && fc) {
        visible = visible.filter(
          (n) =>
            n.public_lat != null &&
            n.public_lng != null &&
            withinRadius(fc, { lat: n.public_lat, lng: n.public_lng }, rk),
        )
      }
      setNodes(visible)
      setClusters(data.clusters)
      setTotal(data.totalVisible)
    } catch {
      // Sin datos conectados aún: el mapa queda vacío honesto.
    }
  }, [])

  const loadRef = useRef(load)

  useEffect(() => {
    paramsRef.current = { entityTypes, category, radiusKm, focus }
  })

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let disposed = false
    let map: MapLibreMap | null = null

    void (async () => {
      const mod = await import("maplibre-gl")
      if (disposed || !containerRef.current) return
      mlRef.current = mod
      map = new mod.Map({
        container: containerRef.current,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 1,
        maxZoom: MAX_ZOOM,
        maxBounds: [
          [-180, -85],
          [180, 85],
        ],
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
      })
      mapRef.current = map
      map.addControl(new mod.NavigationControl({ showCompass: false }), "top-left")
      map.on("moveend", () => void loadRef.current())
      setReady(true)
    })()

    return () => {
      disposed = true
      clearMarkers()
      map?.remove()
      mapRef.current = null
      mlRef.current = null
      setReady(false)
    }
  }, [])

  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.flyTo({
        center: [focus.lng, focus.lat],
        zoom: Math.max(mapRef.current.getZoom(), 6),
      })
    }
  }, [focus])

  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => void loadRef.current(), 0)
    return () => clearTimeout(id)
  }, [ready, load, entityTypes, category, radiusKm])

  useEffect(() => {
    const map = mapRef.current
    const ml = mlRef.current
    if (!map || !ml) return

    clearMarkers()

    for (const c of clusters) {
      const el = document.createElement("div")
      const size = Math.min(44, 24 + c.count * 4)
      el.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        "border-radius:50%",
        "background:rgba(124,58,237,0.9)",
        "color:#fff",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "font-size:11px",
        "font-weight:600",
        "border:2px solid #fff",
        "cursor:pointer",
        "box-shadow:0 2px 8px rgba(0,0,0,.4)",
      ].join(";")
      el.textContent = String(c.count)
      el.addEventListener("click", () => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [c.center.lng, c.center.lat],
            zoom: Math.min(mapRef.current.getZoom() + 2, MAX_ZOOM),
          })
        }
      })
      markersRef.current.push(
        new ml.Marker({ element: el }).setLngLat([c.center.lng, c.center.lat]).addTo(map),
      )
    }

    for (const n of nodes) {
      if (n.public_lat == null || n.public_lng == null) continue
      const el = document.createElement("div")
      el.style.cssText = [
        "width:12px",
        "height:12px",
        "border-radius:50%",
        `background:${NODE_COLORS[n.entity_type] ?? "#94a3b8"}`,
        "border:2px solid #fff",
        "cursor:pointer",
        "box-shadow:0 1px 4px rgba(0,0,0,.5)",
      ].join(";")
      el.addEventListener("click", () => setSelected(n))
      markersRef.current.push(
        new ml.Marker({ element: el }).setLngLat([n.public_lng, n.public_lat]).addTo(map),
      )
    }
  }, [nodes, clusters, ready])

  return (
    <div className="relative w-full h-[70vh] sm:h-[75vh] rounded-2xl overflow-hidden border border-white/10">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur">
        {total > 0
          ? `${total} ${total === 1 ? "punto activo" : "puntos activos"} en esta zona`
          : WORLD_MAP_EMPTY_MESSAGE}
      </div>

      {selected && <MapNodeCard node={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}