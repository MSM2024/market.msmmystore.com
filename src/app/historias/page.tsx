"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import WorldMapStoryPreview from "@/components/world-map/WorldMapStoryPreview"

interface Story {
  id: string
  title: string
  slug: string
  summary: string
  category: string
  created_at: string
  published_at: string | null
  story_tags?: { tag: string }[]
}

export default function HistoriasPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 12

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true))
    const params = new URLSearchParams({ public: "true", page: String(page), limit: String(limit) })
    if (search) params.set("q", search)
    if (category) params.set("category", category)

    fetch(`/api/stories?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories || [])
        setTotal(data.total || 0)
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }, [search, category, page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold zafiro-gold-text mb-8">Historias</h1>

        <WorldMapStoryPreview />

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar historias..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
          >
            <option value="">Todas las categorías</option>
            <option value="general">General</option>
            <option value="infancia">Infancia</option>
            <option value="juventud">Juventud</option>
            <option value="familia">Familia</option>
            <option value="viajes">Viajes</option>
            <option value="reflexion">Reflexión</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">Cargando historias...</div>
        ) : stories.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No hay historias publicadas aún"
            description="Las historias publicadas por los autores aparecerán aquí."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/historias/${story.slug}`}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition"
              >
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 mb-3 inline-block">
                  {story.category}
                </span>
                <h2 className="text-lg font-semibold mb-1">{story.title}</h2>
                {story.summary && (
                  <p className="text-sm text-white/60 mb-3 line-clamp-2">{story.summary}</p>
                )}
                {story.story_tags && story.story_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {story.story_tags.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                        {t.tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-white/40">
                  {new Date(story.published_at || story.created_at).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-30 hover:bg-white/20"
            >
              Anterior
            </button>
            <span className="text-white/60">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-30 hover:bg-white/20"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
