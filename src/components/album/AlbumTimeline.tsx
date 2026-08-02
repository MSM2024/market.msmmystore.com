"use client"

import { useState } from "react"
import { Plus, Trash2, CalendarDays } from "lucide-react"
import type { AlbumFamilyDetail, AlbumTimelineEventRow } from "@/lib/album/repository"

interface AlbumTimelineProps {
  family: AlbumFamilyDetail | null
  isOwner: boolean
  onChanged: () => void
}

const CATEGORY_STYLE: Record<string, string> = {
  nacimiento: "bg-blue-500",
  boda: "bg-pink-500",
  viaje: "bg-teal-500",
  logro: "bg-amber-500",
  recuerdo: "bg-purple-500",
  otro: "bg-slate-500",
}

const EMPTY_FORM = { title: "", description: "", event_date: "", category: "recuerdo" as const }

export default function AlbumTimeline({ family, isOwner, onChanged }: AlbumTimelineProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const events: AlbumTimelineEventRow[] = family?.events ?? []

  const reset = () => { setForm(EMPTY_FORM); setShowForm(false); setError("") }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!family || !form.title.trim()) return
    setBusy(true); setError("")
    try {
      const res = await fetch(`/api/album/families/${family.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: family.id,
          title: form.title.trim(),
          description: form.description,
          event_date: form.event_date || null,
          category: form.category,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "No se pudo crear el evento")
        return
      }
      reset()
      onChanged()
    } catch {
      setError("Error de conexión")
    } finally {
      setBusy(false)
    }
  }

  const removeEvent = async (id: string) => {
    if (!window.confirm("¿Eliminar este evento de la línea de tiempo?")) return
    const res = await fetch(`/api/album/events/${id}`, { method: "DELETE" })
    if (res.ok) onChanged()
  }

  if (!family) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/40">Selecciona una familia para ver su línea de tiempo</p>
      </div>
    )
  }

  return (
    <section aria-label={`Cronología de ${family.name}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Línea de Tiempo</h2>
          <p className="text-xs text-white/40">Los momentos que construyen el legado</p>
        </div>
        {isOwner && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo evento
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createEvent} className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="event-title" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Título *</label>
              <input id="event-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="Ej: Boda de mis padres" />
            </div>
            <div>
              <label htmlFor="event-date" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Fecha</label>
              <input id="event-date" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label htmlFor="event-category" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Categoría</label>
              <select id="event-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
                <option value="nacimiento">Nacimiento</option>
                <option value="boda">Boda</option>
                <option value="viaje">Viaje</option>
                <option value="logro">Logro</option>
                <option value="recuerdo">Recuerdo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="event-desc" className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider mb-1">Descripción</label>
              <textarea id="event-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none" />
            </div>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">
              {busy ? "Guardando..." : "Guardar evento"}
            </button>
            <button type="button" onClick={reset}
              className="px-4 py-2 rounded-xl bg-white/10 text-white/60 text-xs font-semibold hover:bg-white/20 transition cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white/[0.03] border border-white/5">
          <p className="text-sm text-white/40">Aún no hay eventos en la línea de tiempo</p>
        </div>
      ) : (
        <ol className="relative border-l border-white/10 ml-3 space-y-6" aria-label={`Cronología de ${family.name}`}>
          {events.map((ev) => (
            <li key={ev.id} className="ml-6 relative">
              <span
                className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full ${CATEGORY_STYLE[ev.category] || CATEGORY_STYLE.otro}`}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{ev.title}</h3>
                  {ev.event_date && (
                    <p className="text-[10px] font-mono text-purple-300/80 mt-0.5">
                      {new Date(ev.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  {ev.description && <p className="text-xs text-white/50 mt-1.5">{ev.description}</p>}
                  <span className="inline-block mt-1.5 text-[8px] font-mono uppercase tracking-wider text-white/30">
                    {ev.category}
                  </span>
                </div>
                {isOwner && (
                  <button onClick={() => removeEvent(ev.id)} aria-label={`Eliminar evento ${ev.title}`}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
