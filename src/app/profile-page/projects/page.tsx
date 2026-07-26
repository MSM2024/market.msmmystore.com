'use client'

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Layers, Plus, Trash2, Save, ExternalLink, Edit3, X, Globe } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getProfile, updateProfile, addProject, updateProject, removeProject, seedMiguelProfile, type UserProject, type UserProfile } from "@/lib/profile"

const PROJECT_ICONS = ["💎", "🏪", "📓", "🧠", "✨", "🛒", "🌐", "📣", "💳", "🎵", "📱", "🎨", "⚡", "🔬", "🤖", "🚀"]
const STATUS_OPTIONS: ("activo" | "beta" | "próximamente")[] = ["activo", "beta", "próximamente"]
const STATUS_COLORS: Record<string, string> = {
  activo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  próximamente: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}
const COLOR_OPTIONS = [
  { cls: "text-[#00D9FF]", hex: "#00D9FF" },
  { cls: "text-amber-400", hex: "#fbbf24" },
  { cls: "text-purple-400", hex: "#c084fc" },
  { cls: "text-indigo-400", hex: "#818cf8" },
  { cls: "text-cyan-300", hex: "#67e8f9" },
  { cls: "text-emerald-400", hex: "#34d399" },
  { cls: "text-pink-400", hex: "#f472b6" },
  { cls: "text-blue-400", hex: "#60a5fa" },
  { cls: "text-orange-400", hex: "#fb923c" },
  { cls: "text-green-400", hex: "#4ade80" },
  { cls: "text-red-400", hex: "#f87171" },
  { cls: "text-slate-100", hex: "#f1f5f9" },
]

function loadProjectsProfile(): UserProfile | null {
  if (typeof window === "undefined") return null
  const session = getSession()
  let p: UserProfile | null = null
  if (session) p = getProfile(session.id)
  if (!p) p = seedMiguelProfile()
  return p
}

export default function ProjectsPage() {
  usePageTitle("Mis Proyectos")
  const [profile] = useState<UserProfile | null>(() => loadProjectsProfile())
  const [projects, setProjects] = useState<UserProject[]>(() => {
    if (typeof window === "undefined") return []
    const session = getSession()
    let p: UserProfile | null = null
    if (session) p = getProfile(session.id)
    if (!p) p = seedMiguelProfile()
    return p?.customProjects || []
  })
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", url: "", status: "activo" as UserProject["status"], icon: "💎", color: "text-[#00D9FF]", tags: "" })

  const resetForm = () => {
    setForm({ name: "", description: "", url: "", status: "activo", icon: "💎", color: "text-[#00D9FF]", tags: "" })
    setEditing(null)
    setShowAdd(false)
  }

  const handleAdd = () => {
    if (!profile || !form.name) return
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
    const proj = addProject(profile.userId, { ...form, tags })
    if (proj) {
      setProjects([...projects, proj])
      resetForm()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleEdit = (proj: UserProject) => {
    setEditing(proj.id)
    setForm({
      name: proj.name, description: proj.description, url: proj.url,
      status: proj.status, icon: proj.icon, color: proj.color,
      tags: proj.tags.join(", "),
    })
    setShowAdd(true)
  }

  const handleUpdate = () => {
    if (!profile || !editing) return
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
    const updated = updateProject(profile.userId, editing, { ...form, tags })
    if (updated) {
      setProjects(projects.map(p => p.id === editing ? updated : p))
      resetForm()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleRemove = (id: string) => {
    if (!profile) return
    if (removeProject(profile.userId, id)) {
      setProjects(projects.filter(p => p.id !== id))
      if (editing === id) resetForm()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/profile-page" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al perfil
          </Link>
          <button onClick={() => { resetForm(); setShowAdd(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[10px] font-bold hover:opacity-90 transition-all cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Nuevo proyecto
          </button>
        </div>

        <h1 className="text-xl font-black mb-6">Mis Proyectos</h1>

        <div className="grid md:grid-cols-2 gap-4">
          {projects.map(proj => (
            <div key={proj.id} className="group relative p-4 rounded-2xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-lg ${proj.color} shrink-0`}>
                  {proj.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-xs font-bold text-white">{proj.name}</h3>
                    <span className={`text-[6px] font-mono px-1 py-0.5 rounded-full border ${STATUS_COLORS[proj.status]}`}>{proj.status}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 line-clamp-2 mb-2">{proj.description}</p>
                  {proj.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {proj.tags.map((t, i) => (
                        <span key={i} className="text-[6px] px-1 py-0.5 rounded bg-slate-800/40 text-slate-500">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <a href={proj.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[8px] text-[#00D9FF] hover:underline">
                      <ExternalLink className="w-2.5 h-2.5" /> Abrir
                    </a>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleEdit(proj)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/30 transition-all cursor-pointer">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleRemove(proj.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && !showAdd && (
          <div className="text-center py-12">
            <Layers className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500 mb-3">No hay proyectos aún</p>
            <button onClick={() => { resetForm(); setShowAdd(true) }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[9px] font-bold hover:opacity-90 transition-all cursor-pointer">
              <Plus className="w-3 h-3" /> Crear proyecto
            </button>
          </div>
        )}

        {/* Add/Edit form */}
        {showAdd && (
          <div className="mt-6 p-5 rounded-2xl glass border border-[#00D9FF]/20">
            <h2 className="text-xs font-bold text-white mb-4">{editing ? "Editar proyecto" : "Nuevo proyecto"}</h2>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none" />
                </div>
                <div>
                  <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">URL</label>
                  <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none h-16 resize-none" />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as UserProject["status"] })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Icono</label>
                  <div className="flex flex-wrap gap-1">
                    {PROJECT_ICONS.map(icon => (
                      <button key={icon} onClick={() => setForm({ ...form, icon })}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${form.icon === icon ? "bg-[#00D9FF]/20 border border-[#00D9FF]/40" : "bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/40"}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Color</label>
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c.cls} onClick={() => setForm({ ...form, color: c.cls })}
                        className={`w-5 h-5 rounded-full transition-all cursor-pointer ${form.color === c.cls ? "ring-2 ring-white ring-offset-1 ring-offset-[#050816]" : ""}`}
                        style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Tags (separados por coma)</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={editing ? handleUpdate : handleAdd}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[10px] font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> {editing ? "Actualizar" : "Crear proyecto"}
                </button>
                <button onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800/40 text-slate-300 text-[10px] font-bold hover:bg-slate-700/40 transition-all cursor-pointer border border-slate-700/50">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
