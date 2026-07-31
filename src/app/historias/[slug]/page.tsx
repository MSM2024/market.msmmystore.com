"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"

interface Story {
  id: string
  title: string
  slug: string
  content: string
  summary: string
  status: string
  privacy: string
  category: string
  created_at: string
  updated_at: string
  published_at: string | null
  event_date: string | null
  location: string
  owner_id: string
  story_media?: { id: string; media_type: string; url: string; caption: string; sort_order: number }[]
  story_tags?: { tag: string }[]
  story_people?: { id: string; full_name: string; relationship: string; role: string }[]
  story_versions?: { id: string; created_at: string; edit_summary: string }[]
}

const PRIVACY_ICONS: Record<string, string> = {
  solo_yo: "🔒",
  familia: "👨‍👩‍👧‍👦",
  equipo: "👥",
  comunidad: "🌐",
  publica: "🌍",
}

const PRIVACY_LABELS: Record<string, string> = {
  solo_yo: "Solo yo",
  familia: "Familia",
  equipo: "Equipo",
  comunidad: "Comunidad",
  publica: "Pública",
}

export default function HistoriaDetailPage() {
  const params = useParams()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/stories/${params.slug}`)
        const data = await res.json()
        setStory(data.story || null)

        const session = await getSession()
        if (session?.id && data.story?.owner_id === session.id) {
          setIsOwner(true)
        }
      } catch {
        setStory(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.slug])

  if (loading) return <div className="min-h-screen zafiro-page text-white flex items-center justify-center">Cargando...</div>

  if (!story) return (
    <div className="min-h-screen zafiro-page text-white flex flex-col items-center justify-center gap-4">
      <p className="text-xl text-white/50">Historia no encontrada</p>
      <Link href="/historias" className="text-purple-400 hover:underline">Ver todas las historias</Link>
    </div>
  )

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/historias" className="hover:text-white">Historias</Link>
          <span>/</span>
          <span className="text-white/60">{story.title}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">{story.category}</span>
          <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/60">
            {PRIVACY_ICONS[story.privacy]} {PRIVACY_LABELS[story.privacy]}
          </span>
          {story.location && <span className="text-xs text-white/40">📍 {story.location}</span>}
          {story.event_date && (
            <span className="text-xs text-white/40">
              📅 {new Date(story.event_date).toLocaleDateString("es-MX")}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4">{story.title}</h1>

        {story.summary && (
          <p className="text-lg text-white/60 italic mb-8 border-l-4 border-purple-500 pl-4">{story.summary}</p>
        )}

        {story.story_media && story.story_media.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {story.story_media
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((media) => (
                <div key={media.id} className="rounded-xl overflow-hidden bg-white/5">
                  {media.media_type === "image" && (
                    <img src={media.url} alt={media.caption || story.title} className="w-full h-48 object-cover" />
                  )}
                  {media.caption && <p className="text-xs text-white/50 p-2">{media.caption}</p>}
                </div>
              ))}
          </div>
        )}

        <div className="prose prose-invert max-w-none mb-8 whitespace-pre-wrap">{story.content}</div>

        {story.story_people && story.story_people.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Personas en esta historia</h3>
            <div className="flex flex-wrap gap-2">
              {story.story_people.map((person) => (
                <div key={person.id} className="px-4 py-2 bg-white/5 rounded-xl text-sm">
                  <span className="font-medium">{person.full_name}</span>
                  {person.relationship && <span className="text-white/50 ml-2">{person.relationship}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {story.story_tags && story.story_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {story.story_tags.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300">
                #{t.tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-white/40 border-t border-white/10 pt-6">
          <span>Actualizado: {new Date(story.updated_at).toLocaleDateString("es-MX")}</span>
          {isOwner && (
            <div className="flex gap-3">
              <Link
                href={`/mis-historias/nueva?slug=${story.slug}`}
                className="text-purple-400 hover:text-purple-300"
              >
                Editar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
