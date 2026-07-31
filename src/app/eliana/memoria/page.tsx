'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Brain, Search, Plus, Clock, Tag, Loader2, X } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"

interface Intake {
  id: string
  conversation_id: string
  intake_type: string
  data: Record<string, unknown>
  completed: boolean
  created_at: string
  updated_at: string
  eliana_conversations: { summary: string | null; created_at: string }
}

export default function MemoriaPage() {
  usePageTitle("Memoria — ELIANA")
  const session = getSession()
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Intake | null>(null)
  const [formType, setFormType] = useState("preferences")
  const [formData, setFormData] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!session) { setLoading(false); return }
    fetch("/api/eliana/intakes")
      .then(r => r.json())
      .then(data => setIntakes(data.intakes || []))
      .catch(() => console.warn("ELIANA: Failed to load intakes"))
      .finally(() => setLoading(false))
  }, [session])

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "Ahora"
    if (diffMin < 60) return `${diffMin}m`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}d`
    return d.toLocaleDateString("es", { day: "numeric", month: "short" })
  }

  const filtered = intakes.filter(i => {
    if (!search) return true
    const s = search.toLowerCase()
    return i.intake_type.toLowerCase().includes(s) ||
      JSON.stringify(i.data).toLowerCase().includes(s) ||
      (i.eliana_conversations?.summary || "").toLowerCase().includes(s)
  })

  const grouped = filtered.reduce<Record<string, Intake[]>>((acc, i) => {
    const t = i.intake_type || "other"
    if (!acc[t]) acc[t] = []
    acc[t].push(i)
    return acc
  }, {})

  const typeLabels: Record<string, string> = {
    preferences: "Preferencias",
    context: "Contexto",
    knowledge: "Conocimiento",
    personal: "Personal",
    other: "Otros",
  }

  const typeColors: Record<string, string> = {
    preferences: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    context: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    knowledge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    personal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  }

  async function handleSave() {
    const payload = {
      conversation_id: editing?.conversation_id || "00000000-0000-0000-0000-000000000000",
      intake_type: formType,
      data: formData ? { value: formData } : {},
      completed: true,
    }
    try {
      if (editing) {
        const res = await fetch("/api/eliana/intakes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
        const json = await res.json()
        if (json.intake) setIntakes(prev => prev.map(i => i.id === editing.id ? json.intake : i))
      } else {
        const res = await fetch("/api/eliana/intakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.intake) setIntakes(prev => [json.intake, ...prev])
      }
    } catch {}
    setShowModal(false)
    setEditing(null)
    setFormType("preferences")
    setFormData("")
  }

  function openEdit(intake: Intake) {
    setEditing(intake)
    setFormType(intake.intake_type)
    setFormData(typeof intake.data?.value === "string" ? intake.data.value : JSON.stringify(intake.data, null, 2))
    setShowModal(true)
  }

  function openNew() {
    setEditing(null)
    setFormType("preferences")
    setFormData("")
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/chat" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Chat
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black mb-1">Memoria</h1>
            <p className="text-xs text-slate-400">Preferencias, contexto y conocimiento autorizado</p>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer">
            <Plus className="w-3 h-3" /> Nuevo
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en memoria..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl glass border border-slate-800/30 text-center">
            <Brain className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500">
              {search ? "No se encontraron entradas" : "La memoria se poblará con tus interacciones"}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">ELIANA recordará tu contexto autorizado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {typeLabels[type] || type}
                  </h2>
                  <span className="text-[9px] text-slate-600">{items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map(intake => (
                    <button
                      key={intake.id}
                      onClick={() => openEdit(intake)}
                      className="w-full text-left p-3 rounded-2xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border ${typeColors[type] || typeColors.other}`}>
                              {typeLabels[type] || type}
                            </span>
                            <span className="text-[9px] text-slate-600 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {formatDate(intake.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {intake.data && typeof intake.data.value === "string"
                              ? intake.data.value
                              : intake.data ? JSON.stringify(intake.data).slice(0, 200) : "(sin datos)"}
                          </p>
                          {intake.eliana_conversations?.summary && (
                            <p className="text-[9px] text-slate-600 mt-1 truncate">
                              {intake.eliana_conversations.summary}
                            </p>
                          )}
                        </div>
                        {intake.completed && (
                          <span className="text-[8px] text-emerald-500 font-bold shrink-0">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl glass border border-slate-800/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">{editing ? "Editar entrada" : "Nueva entrada"}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-1 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <select
                value={formType}
                onChange={e => setFormType(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-[#00D9FF] outline-none transition-all"
              >
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <textarea
                value={formData}
                onChange={e => setFormData(e.target.value)}
                placeholder="Describe la información a recordar..."
                rows={4}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-[#00D9FF] outline-none transition-all resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowModal(false); setEditing(null) }}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
