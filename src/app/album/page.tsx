"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase"

interface Story {
  id: string
  title: string
  slug: string
  summary: string
  category: string
  status: string
  privacy: string
  event_date: string | null
  location: string
  created_at: string
  story_media?: { url: string; media_type: string }[]
  story_tags?: { tag: string }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "from-purple-500 to-pink-500",
  infancia: "from-blue-400 to-cyan-400",
  juventud: "from-green-400 to-emerald-400",
  familia: "from-amber-400 to-orange-400",
  viajes: "from-teal-400 to-cyan-400",
  reflexion: "from-violet-400 to-purple-400",
}

export default function AlbumPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => {
      const session = getSession()
      setIsOwner(!!session?.id)

      const sb = getSupabaseClient()
      if (!sb) { setLoading(false); return }

      const load = async () => {
        try {
          let query = sb
            .from("stories")
            .select("*, story_media(url, media_type), story_tags(tag)")
            .order("created_at", { ascending: false })

          if (!session?.id) {
            query = query.in("status", ["publicada"]).in("privacy", ["publica", "comunidad"])
          }

          const { data } = await query
          setStories((data as Story[]) || [])
        } catch {
          setStories([])
        } finally {
          setLoading(false)
        }
      }
      load()
    })
  }, [])

  const filtered = filter
    ? stories.filter((s) => s.category === filter || s.title.toLowerCase().includes(filter.toLowerCase()))
    : stories

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Álbum de la Vida</h1>
            <p className="text-sm text-white/40 mt-1">Tu legado familiar en historias</p>
          </div>
          {isOwner && (
            <Link
              href="/mis-historias/nueva"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              + Nueva Historia
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {["", "general", "infancia", "juventud", "familia", "viajes", "reflexion"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                filter === cat
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Todas"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">Cargando álbum...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 mb-4">No hay historias en el álbum</p>
            {isOwner && (
              <Link href="/mis-historias/nueva" className="text-purple-400 hover:text-purple-300 underline text-sm">
                Escribe tu primera historia
              </Link>
            )}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((story) => (
              <Link
                key={story.id}
                href={`/historias/${story.slug}`}
                className="break-inside-avoid block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition group"
              >
                {story.story_media && story.story_media.length > 0 && (
                  <div className="aspect-video bg-white/5 overflow-hidden">
                    <img
                      src={story.story_media[0].url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                )}
                <div className="p-4">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[story.category] || "from-gray-500 to-gray-600"} text-white mb-2`}
                  >
                    {story.category}
                  </span>
                  <h2 className="text-base font-semibold mb-1 group-hover:text-purple-400 transition">
                    {story.title}
                  </h2>
                  {story.summary && (
                    <p className="text-xs text-white/50 line-clamp-2">{story.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
                    {story.event_date && <span>{new Date(story.event_date).toLocaleDateString("es-MX")}</span>}
                    {story.location && <span>📍 {story.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
