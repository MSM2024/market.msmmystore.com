"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getSession } from "@/lib/auth"
import Link from "next/link"

interface StoryData {
  title: string
  content: string
  summary: string
  category: string
  privacy: string
  status: string
  event_date: string
  location: string
  tags: string[]
  people: { full_name: string; relationship: string; role: string }[]
}

const CATEGORIES = ["general", "infancia", "juventud", "familia", "viajes", "reflexion"]
const PRIVACY_OPTIONS = [
  { value: "solo_yo", label: "Solo yo" },
  { value: "familia", label: "Familia" },
  { value: "equipo", label: "Equipo" },
  { value: "comunidad", label: "Comunidad" },
  { value: "publica", label: "Pública" },
]
const STATUS_OPTIONS = [
  { value: "borrador", label: "Borrador" },
  { value: "publicada", label: "Publicada" },
  { value: "archivada", label: "Archivada" },
]

export default function NuevaHistoriaWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>}>
      <NuevaHistoriaPage />
    </Suspense>
  )
}

function NuevaHistoriaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editSlug = searchParams.get("slug")

  const [form, setForm] = useState<StoryData>({
    title: "",
    content: "",
    summary: "",
    category: "general",
    privacy: "solo_yo",
    status: "borrador",
    event_date: "",
    location: "",
    tags: [],
    people: [],
  })
  const [tagInput, setTagInput] = useState("")
  const [personInput, setPersonInput] = useState({ full_name: "", relationship: "", role: "participant" })
  const [saving, setSaving] = useState(false)
  const [elianaLoading, setElianaLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s?.id) {
      window.location.href = "/auth/login"
    }
  }, [])

  useEffect(() => {
    if (!editSlug || initialized) return
    Promise.resolve().then(() => setInitialized(true))
    fetch(`/api/stories/${editSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.story) {
          setForm({
            title: data.story.title || "",
            content: data.story.content || "",
            summary: data.story.summary || "",
            category: data.story.category || "general",
            privacy: data.story.privacy || "solo_yo",
            status: data.story.status || "borrador",
            event_date: data.story.event_date ? data.story.event_date.slice(0, 10) : "",
            location: data.story.location || "",
            tags: (data.story.story_tags || []).map((t: { tag: string }) => t.tag),
            people: (data.story.story_people || []).map(
              (p: { full_name: string; relationship: string; role: string }) => ({
                full_name: p.full_name,
                relationship: p.relationship || "",
                role: p.role || "participant",
              })
            ),
          })
        }
      })
      .catch(() => {})
  }, [editSlug, initialized])

  const handleChange = (field: keyof StoryData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const addPerson = () => {
    if (personInput.full_name.trim()) {
      setForm((prev) => ({
        ...prev,
        people: [...prev.people, { ...personInput, full_name: personInput.full_name.trim() }],
      }))
      setPersonInput({ full_name: "", relationship: "", role: "participant" })
    }
  }

  const removePerson = (index: number) => {
    setForm((prev) => ({
      ...prev,
      people: prev.people.filter((_, i) => i !== index),
    }))
  }

  const saveStory = async (status?: string) => {
    setSaving(true)
    setError("")
    try {
      const method = editSlug ? "PUT" : "POST"
      const url = editSlug ? `/api/stories/${editSlug}` : "/api/stories"
      const body = { ...form, status: status || form.status }

      if (form.tags.length > 0 || form.people.length > 0) {
        body.tags = form.tags
        body.people = form.people
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")

      router.push("/mis-historias")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const elianaAction = useCallback(async (action: string) => {
    setElianaLoading(action)
    setError("")
    try {
      const res = await fetch("/api/eliana/story-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title: form.title,
          content: form.content,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error de ELIANA")

      if (action === "correct" && data.content) handleChange("content", data.content)
      else if (action === "summarize" && data.summary) handleChange("summary", data.summary)
      else if (action === "title" && data.title) handleChange("title", data.title)
      else if (action === "organize" && data.content) handleChange("content", data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con ELIANA")
    } finally {
      setElianaLoading(null)
    }
  }, [form.title, form.content])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{editSlug ? "Editar Historia" : "Nueva Historia"}</h1>
          <Link href="/mis-historias" className="text-white/50 hover:text-white text-sm">
            ← Volver
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-white/60 mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Título de tu historia"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-semibold placeholder-white/30"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">Privacidad</label>
              <select
                value={form.privacy}
                onChange={(e) => handleChange("privacy", e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
              >
                {PRIVACY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">Fecha del evento</label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => handleChange("event_date", e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">Ubicación</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Lugar"
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Resumen</label>
            <textarea
              value={form.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="Breve resumen de tu historia..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-white/60">Contenido</label>
              <div className="flex gap-2">
                <button
                  onClick={() => elianaAction("correct")}
                  disabled={elianaLoading !== null || !form.content}
                  className="text-xs px-3 py-1.5 bg-green-600/30 rounded-lg hover:bg-green-600/50 disabled:opacity-30"
                >
                  {elianaLoading === "correct" ? "..." : "Corregir ortografía"}
                </button>
                <button
                  onClick={() => elianaAction("organize")}
                  disabled={elianaLoading !== null || !form.content}
                  className="text-xs px-3 py-1.5 bg-blue-600/30 rounded-lg hover:bg-blue-600/50 disabled:opacity-30"
                >
                  {elianaLoading === "organize" ? "..." : "Organizar relato"}
                </button>
                <button
                  onClick={() => elianaAction("summarize")}
                  disabled={elianaLoading !== null || !form.content}
                  className="text-xs px-3 py-1.5 bg-yellow-600/30 rounded-lg hover:bg-yellow-600/50 disabled:opacity-30"
                >
                  {elianaLoading === "summarize" ? "..." : "Crear resumen"}
                </button>
                <button
                  onClick={() => elianaAction("title")}
                  disabled={elianaLoading !== null || !form.content}
                  className="text-xs px-3 py-1.5 bg-purple-600/30 rounded-lg hover:bg-purple-600/50 disabled:opacity-30"
                >
                  {elianaLoading === "title" ? "..." : "Crear título"}
                </button>
              </div>
            </div>
            <textarea
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Escribe tu historia aquí..."
              rows={15}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 font-mono text-sm leading-relaxed resize-y"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Etiquetas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Agregar etiqueta..."
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30"
              />
              <button onClick={addTag} className="px-4 py-2 bg-purple-600/30 rounded-xl hover:bg-purple-600/50">
                +
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300 flex items-center gap-1"
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="text-purple-400 hover:text-red-400 ml-1">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Personas relacionadas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={personInput.full_name}
                onChange={(e) => setPersonInput((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nombre completo"
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30"
              />
              <input
                type="text"
                value={personInput.relationship}
                onChange={(e) => setPersonInput((prev) => ({ ...prev, relationship: e.target.value }))}
                placeholder="Parentesco"
                className="w-40 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30"
              />
              <button onClick={addPerson} className="px-4 py-2 bg-purple-600/30 rounded-xl hover:bg-purple-600/50">
                +
              </button>
            </div>
            {form.people.length > 0 && (
              <div className="space-y-2">
                {form.people.map((person, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-sm">
                    <span className="font-medium">{person.full_name}</span>
                    {person.relationship && <span className="text-white/50">({person.relationship})</span>}
                    <button onClick={() => removePerson(i)} className="ml-auto text-red-400 hover:text-red-300">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => saveStory("borrador")}
              disabled={saving || !form.title}
              className="px-6 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 disabled:opacity-30"
            >
              {saving ? "Guardando..." : "Guardar borrador"}
            </button>
            <button
              onClick={() => saveStory("publicada")}
              disabled={saving || !form.title}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-30"
            >
              {saving ? "Publicando..." : "Publicar"}
            </button>
            {editSlug && (
              <button
                onClick={() => saveStory("archivada")}
                disabled={saving}
                className="px-6 py-3 bg-gray-600/30 rounded-xl font-semibold hover:bg-gray-600/50 disabled:opacity-30"
              >
                Archivar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
