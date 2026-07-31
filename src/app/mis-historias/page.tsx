"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase"

interface Story {
  id: string
  title: string
  slug: string
  summary: string
  status: string
  privacy: string
  category: string
  created_at: string
  updated_at: string
  published_at: string | null
  story_tags?: { tag: string }[]
}

const STATUS_MAP: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  archivada: "Archivada",
}

const PRIVACY_MAP: Record<string, string> = {
  solo_yo: "Solo yo",
  familia: "Familia",
  equipo: "Equipo",
  comunidad: "Comunidad",
  publica: "Pública",
}

export default function MisHistoriasPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<unknown>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const loadStories = useCallback(async () => {
    setLoading(true)
    try {
      const sb = getSupabaseClient()
      if (!sb) return
      let query = sb
        .from("stories")
        .select("*, story_tags(tag)")
        .eq("owner_id", (await getSession())?.id)
        .order("created_at", { ascending: false })

      if (statusFilter) query = query.eq("status", statusFilter)
      if (searchQuery) query = query.ilike("title", `%${searchQuery}%`)

      const { data } = await query
      setStories((data as Story[]) || [])
    } catch {
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    const s = getSession()
    if (!s?.id) {
      window.location.href = "/auth/login"
      return
    }
    Promise.resolve().then(() => {
      setUser(s)
      loadStories()
    })
  }, [loadStories])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/stories/${slug}`, { method: "DELETE" })
    if (res.ok) setStories((prev) => prev.filter((s) => s.slug !== slug))
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Mis Historias</h1>
          <Link
            href="/mis-historias/nueva"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold hover:opacity-90"
          >
            + Nueva Historia
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar historias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="publicada">Publicada</option>
            <option value="archivada">Archivada</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">Cargando historias...</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 mb-4">Aún no tienes historias</p>
            <Link
              href="/mis-historias/nueva"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Escribe tu primera historia
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      story.status === "publicada"
                        ? "bg-green-500/20 text-green-400"
                        : story.status === "archivada"
                          ? "bg-gray-500/20 text-gray-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {STATUS_MAP[story.status] || story.status}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                    {PRIVACY_MAP[story.privacy] || story.privacy}
                  </span>
                </div>

                <Link href={`/historias/${story.slug}`}>
                  <h2 className="text-lg font-semibold mb-1 hover:text-purple-400 transition">
                    {story.title}
                  </h2>
                </Link>

                {story.summary && (
                  <p className="text-sm text-white/60 mb-3 line-clamp-2">{story.summary}</p>
                )}

                {story.story_tags && story.story_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {story.story_tags.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        {t.tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-white/40 mb-4">
                  {new Date(story.updated_at || story.created_at).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/mis-historias/nueva?slug=${story.slug}`}
                    className="flex-1 text-center px-3 py-2 bg-purple-600/30 rounded-xl text-sm hover:bg-purple-600/50 transition"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/historias/${story.slug}`}
                    className="flex-1 text-center px-3 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => handleDelete(story.slug, story.title)}
                    className="px-3 py-2 bg-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/30 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
