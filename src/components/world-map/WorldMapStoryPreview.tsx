"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Globe, ArrowRight } from "lucide-react"
import { worldMapStoryPreviewEnabled } from "@/lib/world-map/flags"
import { trackWorldMap } from "@/lib/world-map/analytics"
import type { WorldStoryPayload } from "@/lib/world-map/aggregates"

/**
 * Vista previa de la historia-mundo dentro del feed de /historias.
 * Con storiesPreview=false esta tarjeta NO existe (sin cambio en el feed).
 * Nunca fabrica datos: si la API no devuelve actividad, no se pinta.
 */
export default function WorldMapStoryPreview() {
  if (!worldMapStoryPreviewEnabled()) return null

  return <WorldMapStoryPreviewInner />
}

function WorldMapStoryPreviewInner() {
  const { status, story } = useWorldStory()

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse mb-6">
        <div className="h-4 w-40 rounded bg-white/10 mb-2" />
        <div className="h-3 w-72 rounded bg-white/10" />
      </div>
    )
  }

  if (!story) return null

  const featured = story.countries.slice(0, 3)

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-purple-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white">El mundo está vivo en ZAFIRO 🌎</h2>
          <p className="text-sm text-white/60 mt-1">
            {formatSentence(story)}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {featured.map((c) => (
              <span key={c.country_code} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
                {c.label} · {c.activeNodes} {c.activeNodes === 1 ? "punto" : "puntos"}
              </span>
            ))}
          </div>
          <Link
            href="/world"
            onClick={() => trackWorldMap("world_map_story_open")}
            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-purple-300 hover:text-purple-200 transition"
          >
            ABRIR MAPA <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

const WORLD_STORY_CACHE = new Map<string, WorldStoryPayload | null>()

function formatSentence(story: WorldStoryPayload): string {
  const count = story.totalActiveNodes
  const parts: string[] = []
  if (story.newBusinesses > 0) parts.push(`${story.newBusinesses} negocios activos`)
  if (story.activeProjects > 0) parts.push(`${story.activeProjects} proyectos`)
  if (story.eventsToday > 0) parts.push(`${story.eventsToday} eventos hoy`)
  if (story.featuredPlace) parts.push(`destacando ${story.featuredPlace.name}`)
  const detail = parts.length > 0 ? ` — ${parts.join(", ")}.` : "."
  return `${count} ${count === 1 ? "punto está" : "puntos están"} vivos en el mundo${detail}`
}

function useWorldStory(): { status: "loading" | "error" | "ready"; story: WorldStoryPayload | null } {
  const [state, setState] = useState<{ status: "loading" | "error" | "ready"; story: WorldStoryPayload | null }>(() => {
    if (WORLD_STORY_CACHE.has("story")) {
      return { status: "ready", story: WORLD_STORY_CACHE.get("story") ?? null }
    }
    return { status: "loading", story: null }
  })

  useEffect(() => {
    if (WORLD_STORY_CACHE.has("story")) return
    let cancelled = false
    fetch("/api/world-map/story")
      .then((r) => r.json())
      .then((data: { story: WorldStoryPayload | null }) => {
        WORLD_STORY_CACHE.set("story", data.story ?? null)
        if (!cancelled) setState({ status: "ready", story: data.story ?? null })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", story: null })
      })
    void trackWorldMap("world_map_story_view")
    return () => {
      cancelled = true
    }
  }, [])

  return state
}