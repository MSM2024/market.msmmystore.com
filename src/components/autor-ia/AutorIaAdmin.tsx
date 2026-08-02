"use client"

import { useState, useEffect } from "react"
import {
  BookOpen, Plus, Trash2, Save, Sparkles, Upload, ChevronLeft, FileText,
} from "lucide-react"

interface Section {
  id: string
  section_number: number
  title: string
  content: string
}

interface Chapter {
  id: string
  chapter_number: number
  title: string
  summary: string
  content: string
  status: string
  sections: Section[]
}

interface Book {
  id: string
  title: string
  subtitle: string
  purpose: string
  target_reader: string
  outline: string
  voice: string
  style_guide: string
  visibility: string
  status: string
  published_book_id: string | null
  updated_at: string
}

interface Detail {
  book: Book
  chapters: Chapter[]
}

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-white/10 text-white/60",
  outline: "bg-blue-500/20 text-blue-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  review: "bg-orange-500/20 text-orange-400",
  approved: "bg-green-500/20 text-green-400",
  published: "bg-emerald-500/20 text-emerald-400",
  archived: "bg-red-500/20 text-red-400",
}

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Privado",
  trusted_circle: "Círculo de confianza",
  family: "Familia",
  team: "Equipo",
  members: "Miembros",
  public: "Público",
}

export default function AutorIaAdmin() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [creating, setCreating] = useState(false)
  const [newBook, setNewBook] = useState({ title: "", subtitle: "", purpose: "", target_reader: "" })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [sectionInputs, setSectionInputs] = useState<Record<string, string>>({})
  const [draftFields, setDraftFields] = useState<Book | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/consejo/autor")
      .then(r => r.json())
      .then(d => { if (!cancelled) setBooks(d.books || []) })
      .catch(() => { /* silencioso */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function refreshBooks() {
    try {
      const res = await fetch("/api/consejo/autor")
      const data = await res.json()
      setBooks(data.books || [])
    } catch { /* silencioso */ }
  }

  async function loadDetail(id: string) {
    const res = await fetch(`/api/consejo/autor/${id}`)
    const data = await res.json()
    if (res.ok && data.book) {
      setDetail(data)
      setDraftFields(data.book)
    }
  }

  const openBook = async (id: string) => {
    setDetail(null)
    await loadDetail(id)
  }

  async function createBook(e: React.FormEvent) {
    e.preventDefault()
    if (!newBook.title.trim()) return
    setCreating(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/consejo/autor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBook),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo crear el libro" }); return }
      setNewBook({ title: "", subtitle: "", purpose: "", target_reader: "" })
      await refreshBooks()
      await openBook(data.book.id)
    } catch { setFeedback({ ok: false, message: "Error de red" }) }
    finally { setCreating(false) }
  }

  async function saveBook() {
    if (!detail || !draftFields) return
    setBusyId("save")
    setFeedback(null)
    try {
      const res = await fetch(`/api/consejo/autor/${detail.book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftFields),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo guardar" }); return }
      setFeedback({ ok: true, message: "Cambios guardados" })
      await refreshBooks()
    } finally { setBusyId(null) }
  }

  async function genOutline() {
    if (!detail) return
    setGenerating("outline")
    setFeedback(null)
    try {
      const res = await fetch(`/api/consejo/autor/${detail.book.id}/outline`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo generar el outline" }); return }
      setFeedback({ ok: true, message: "Outline generado" })
      await loadDetail(detail.book.id)
    } finally { setGenerating(null) }
  }

  async function createChapter() {
    if (!detail || !newChapterTitle.trim()) return
    setBusyId("newChapter")
    setFeedback(null)
    try {
      const res = await fetch(`/api/consejo/autor/${detail.book.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChapterTitle }),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo crear el capítulo" }); return }
      setNewChapterTitle("")
      await loadDetail(detail.book.id)
    } finally { setBusyId(null) }
  }

  async function genChapter(chapterId: string) {
    setGenerating(chapterId)
    setFeedback(null)
    try {
      const res = await fetch(`/api/consejo/autor/chapters/${chapterId}/generate`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo generar el capítulo" }); return }
      if (detail) await loadDetail(detail.book.id)
    } finally { setGenerating(null) }
  }

  async function genSection(chapterId: string) {
    const title = (sectionInputs[chapterId] || "").trim()
    if (!title) return
    setGenerating(`section:${chapterId}`)
    setFeedback(null)
    try {
      const res = await fetch(`/api/consejo/autor/chapters/${chapterId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo generar la sección" }); return }
      setSectionInputs(prev => ({ ...prev, [chapterId]: "" }))
      if (detail) await loadDetail(detail.book.id)
    } finally { setGenerating(null) }
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("¿Eliminar este capítulo?")) return
    setBusyId(chapterId)
    try {
      await fetch(`/api/consejo/autor/chapters/${chapterId}`, { method: "DELETE" })
      if (detail) await loadDetail(detail.book.id)
    } finally { setBusyId(null) }
  }

  async function deleteBook() {
    if (!detail) return
    if (!confirm(`¿Archivar "${detail.book.title}"?`)) return
    setBusyId("delete")
    try {
      await fetch(`/api/consejo/autor/${detail.book.id}`, { method: "DELETE" })
      setDetail(null)
      await refreshBooks()
    } finally { setBusyId(null) }
  }

  async function publish() {
    if (!detail) return
    setBusyId("publish")
    setFeedback(null)
    try {
      const res = await fetch(`/api/consejo/autor/${detail.book.id}/publish`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setFeedback({ ok: false, message: data.error || "No se pudo publicar" }); return }
      setFeedback({ ok: true, message: `Publicado en la Biblioteca Viva` })
      await loadDetail(detail.book.id)
    } finally { setBusyId(null) }
  }

  const setField = (key: keyof Book) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDraftFields(prev => prev ? { ...prev, [key]: e.target.value } : prev)
  }

  if (detail && draftFields) {
    return (
      <div className="min-h-screen zafiro-page text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button onClick={() => setDetail(null)} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4">
            <ChevronLeft className="w-4 h-4" /> Volver a la lista
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold flex-1">{draftFields.title}</h1>
            <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[draftFields.status] || "bg-white/10 text-white/50"}`}>
              {draftFields.status}
            </span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/50">
              {VISIBILITY_LABELS[draftFields.visibility] || draftFields.visibility}
            </span>
            {draftFields.published_book_id && (
              <a href={`/biblioteca/${draftFields.published_book_id}`} className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                Ver en Biblioteca
              </a>
            )}
          </div>

          {feedback && (
            <div className={`mb-4 p-3 rounded-lg border text-sm ${feedback.ok ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              {feedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <label className="block">
              <span className="text-xs text-white/50">Título</span>
              <input type="text" value={draftFields.title} onChange={setField("title")} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
            <label className="block">
              <span className="text-xs text-white/50">Subtítulo</span>
              <input type="text" value={draftFields.subtitle} onChange={setField("subtitle")} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
            <label className="block">
              <span className="text-xs text-white/50">Propósito</span>
              <textarea value={draftFields.purpose} onChange={setField("purpose")} rows={2} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
            <label className="block">
              <span className="text-xs text-white/50">Lector objetivo</span>
              <input type="text" value={draftFields.target_reader} onChange={setField("target_reader")} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
            <label className="block">
              <span className="text-xs text-white/50">Voz</span>
              <input type="text" value={draftFields.voice} onChange={setField("voice")} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
            <label className="block">
              <span className="text-xs text-white/50">Visibilidad</span>
              <select value={draftFields.visibility} onChange={setField("visibility")} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50">
                {Object.entries(VISIBILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-white/50">Guía de estilo</span>
              <textarea value={draftFields.style_guide} onChange={setField("style_guide")} rows={2} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-white/50">Outline</span>
              <textarea value={draftFields.outline} onChange={setField("outline")} rows={6} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#00D9FF]/50" />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={saveBook} disabled={busyId === "save"} className="px-4 py-2 rounded-lg text-sm bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4 inline mr-1" /> Guardar
            </button>
            <button onClick={genOutline} disabled={generating === "outline"} className="px-4 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 disabled:opacity-50 transition-colors">
              <Sparkles className="w-4 h-4 inline mr-1" /> {generating === "outline" ? "Generando..." : "Generar outline con IA"}
            </button>
            <button onClick={publish} disabled={busyId === "publish"} className="px-4 py-2 rounded-lg text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors">
              <Upload className="w-4 h-4 inline mr-1" /> {busyId === "publish" ? "Publicando..." : "Publicar a Biblioteca Viva"}
            </button>
            <button onClick={deleteBook} disabled={busyId === "delete"} className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50 transition-colors ml-auto">
              <Trash2 className="w-4 h-4 inline mr-1" /> Archivar
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold flex-1">Capítulos</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChapterTitle}
                onChange={e => setNewChapterTitle(e.target.value)}
                placeholder="Título del nuevo capítulo"
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50"
              />
              <button onClick={createChapter} disabled={busyId === "newChapter" || !newChapterTitle.trim()} className="px-3 py-2 rounded-lg text-sm bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 hover:bg-[#00D9FF]/30 disabled:opacity-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {detail.chapters.length === 0 && (
              <div className="text-center text-white/40 py-10 border border-dashed border-white/20 rounded-xl">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Sin capítulos aún. Genera el outline y crea capítulos, o añade uno manualmente.</p>
              </div>
            )}
            {detail.chapters.map(chapter => (
              <div key={chapter.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#00D9FF]/20 text-[#00D9FF]">{chapter.chapter_number}</span>
                  <span className="font-medium flex-1">{chapter.title}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[chapter.status] || "bg-white/10 text-white/50"}`}>{chapter.status}</span>
                  <button onClick={() => genChapter(chapter.id)} disabled={generating === chapter.id} className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 disabled:opacity-50 transition-colors">
                    <Sparkles className="w-3 h-3 inline mr-1" /> {generating === chapter.id ? "Generando..." : "Generar capítulo"}
                  </button>
                  <button onClick={() => deleteChapter(chapter.id)} disabled={busyId === chapter.id} className="px-2 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {chapter.content ? (
                  <details>
                    <summary className="text-xs text-white/50 cursor-pointer hover:text-white/80 mb-2">
                      {chapter.content.split(/\s+/).filter(Boolean).length} palabras · ver contenido
                    </summary>
                    <pre className="whitespace-pre-wrap text-sm text-white/80 bg-black/30 rounded-lg p-3 max-h-80 overflow-auto">{chapter.content}</pre>
                  </details>
                ) : (
                  <p className="text-xs text-white/40 mb-2">Sin contenido aún.</p>
                )}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={sectionInputs[chapter.id] || ""}
                    onChange={e => setSectionInputs(prev => ({ ...prev, [chapter.id]: e.target.value }))}
                    placeholder="Título de sección a generar (ej: Introducción)"
                    className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50"
                  />
                  <button onClick={() => genSection(chapter.id)} disabled={generating === `section:${chapter.id}` || !(sectionInputs[chapter.id] || "").trim()} className="px-3 py-2 rounded-lg text-sm bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30 disabled:opacity-50 transition-colors">
                    <Sparkles className="w-4 h-4 inline mr-1" /> {generating === `section:${chapter.id}` ? "Generando..." : "Generar sección"}
                  </button>
                </div>
                {chapter.sections.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chapter.sections.map(s => (
                      <span key={s.id} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/60" title={s.content.slice(0, 80)}>
                        {s.section_number}. {s.title} · {s.content.split(/\s+/).filter(Boolean).length} palabras
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-[#00D9FF]" />
          <h1 className="text-3xl font-bold">Autor IA</h1>
          <span className="px-3 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Solo OWNER
          </span>
        </div>

        {feedback && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${feedback.ok ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
            {feedback.message}
          </div>
        )}

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8">
          <h2 className="text-sm font-semibold text-white/70 mb-3">Nuevo libro</h2>
          <form onSubmit={createBook} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white/50">Título *</span>
                <input type="text" value={newBook.title} onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
              </label>
              <label className="block">
                <span className="text-xs text-white/50">Subtítulo</span>
                <input type="text" value={newBook.subtitle} onChange={e => setNewBook(prev => ({ ...prev, subtitle: e.target.value }))} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
              </label>
              <label className="block">
                <span className="text-xs text-white/50">Propósito</span>
                <input type="text" value={newBook.purpose} onChange={e => setNewBook(prev => ({ ...prev, purpose: e.target.value }))} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
              </label>
              <label className="block">
                <span className="text-xs text-white/50">Lector objetivo</span>
                <input type="text" value={newBook.target_reader} onChange={e => setNewBook(prev => ({ ...prev, target_reader: e.target.value }))} className="mt-1 w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
              </label>
            </div>
            <button type="submit" disabled={creating || !newBook.title.trim()} className="px-4 py-2 rounded-lg text-sm bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 hover:bg-[#00D9FF]/30 disabled:opacity-50 transition-colors">
              <Plus className="w-4 h-4 inline mr-1" /> {creating ? "Creando..." : "Crear libro"}
            </button>
          </form>
        </div>

        <h2 className="text-sm font-semibold text-white/50 mb-3">Libros en escritura</h2>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center text-white/50 py-12">Cargando libros...</div>
          ) : books.length === 0 ? (
            <div className="text-center text-white/40 py-12 border border-dashed border-white/20 rounded-xl">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No hay libros en escritura. Crea el primero arriba.</p>
            </div>
          ) : (
            books.map(book => (
              <button key={book.id} onClick={() => openBook(book.id)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#00D9FF]/40 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{book.title}</div>
                  {book.subtitle && <div className="text-xs text-white/40 truncate">{book.subtitle}</div>}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[book.status] || "bg-white/10 text-white/50"}`}>{book.status}</span>
                <span className="text-xs text-white/30">{new Date(book.updated_at).toLocaleDateString()}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
