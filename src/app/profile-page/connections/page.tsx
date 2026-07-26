'use client'

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe, ExternalLink, Plus, Trash2, Save, Edit3, X, Shield, Camera, MessageSquare, Video, Music2, Send, Store, Briefcase, Code2, MessageCircle, Music, BookOpen } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getProfile, updateProfile, seedMiguelProfile, type SocialLink, type UserProfile } from "@/lib/profile"
import { getPlatforms, PLATFORM_META, addPlatform, removePlatform, importFromLinktree, type ConnectedPlatform, type PlatformType } from "@/lib/universo"

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  youtube: Video, instagram: Camera, twitter: MessageCircle, linkedin: Briefcase,
  github: Code2, facebook: Globe, podcast: Music2, music: Music, store: Store,
  tiktok: Music2, telegram: Send, whatsapp: MessageSquare, website: Globe,
  blog: BookOpen,
}

export default function ConnectionsPage() {
  usePageTitle("Conexiones")
  const [initialConnData] = useState(() => {
    if (typeof window === "undefined") return null
    const session = getSession()
    let p: UserProfile | null = null
    if (session) p = getProfile(session.id)
    if (!p) p = seedMiguelProfile()
    return p
  })
  const [profile] = useState<UserProfile | null>(initialConnData)
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>(() => initialConnData ? getPlatforms(initialConnData.userId) : [])
  const [showAddPlatform, setShowAddPlatform] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPlatform, setNewPlatform] = useState({ type: "website" as PlatformType, url: "", title: "", description: "" })
  const [newLink, setNewLink] = useState({ platform: "", url: "", label: "" })
  const [editingLinks, setEditingLinks] = useState<SocialLink[]>(() => initialConnData ? [...initialConnData.socialLinks] : [])
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleImportLinktree = () => {
    if (!profile) return
    const imported = importFromLinktree(profile.userId, "msmmystore")
    if (imported.length > 0) {
      setPlatforms(getPlatforms(profile.userId))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleAddPlatform = () => {
    if (!profile || !newPlatform.url || !newPlatform.title) return
    addPlatform({
      type: newPlatform.type,
      url: newPlatform.url,
      title: newPlatform.title,
      description: newPlatform.description,
      image: "",
      category: PLATFORM_META[newPlatform.type]?.label || "Otro",
      tags: [],
      summary: "",
      stats: {},
      isActive: true,
      isVerified: false,
      contentType: "other",
      elianaAnalysis: null,
      userId: profile.userId,
    })
    setPlatforms(getPlatforms(profile.userId))
    setShowAddPlatform(false)
    setNewPlatform({ type: "website", url: "", title: "", description: "" })
  }

  const handleRemovePlatform = (id: string) => {
    removePlatform(id)
    setPlatforms(getPlatforms(profile!.userId))
    setDeleting(null)
  }

  const handleSaveLinks = () => {
    if (!profile) return
    updateProfile(profile.userId, { socialLinks: editingLinks })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addLink = () => {
    if (!newLink.platform || !newLink.url) return
    setEditingLinks([...editingLinks, {
      id: `sl_${Date.now()}`,
      platform: newLink.platform,
      url: newLink.url,
      label: newLink.label || newLink.platform,
    }])
    setNewLink({ platform: "", url: "", label: "" })
    setShowAddLink(false)
  }

  const removeLink = (id: string) => {
    setEditingLinks(editingLinks.filter(l => l.id !== id))
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
          <div className="flex items-center gap-2">
            <button onClick={handleSaveLinks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[10px] font-bold hover:opacity-90 transition-all cursor-pointer">
              <Save className="w-3.5 h-3.5" /> {saved ? "✓ Guardado" : "Guardar enlaces"}
            </button>
          </div>
        </div>

        <h1 className="text-xl font-black mb-6">Mis Conexiones</h1>

        <div className="space-y-8">
          {/* ENLACES PERSONALES */}
          <div className="p-5 rounded-2xl glass">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-[#00D9FF]" /> Enlaces personales</h2>
              <button onClick={() => setShowAddLink(!showAddLink)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-bold hover:bg-[#00D9FF]/20 transition-all border border-[#00D9FF]/20 cursor-pointer">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            <div className="space-y-1.5">
              {editingLinks.map(link => (
                <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/20 border border-slate-700/50 group">
                  <Globe className="w-3.5 h-3.5 text-[#00D9FF] shrink-0" />
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white flex-1 min-w-0 truncate hover:underline">{link.label}</a>
                  <span className="text-[8px] text-slate-500 hidden sm:inline">{link.platform}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-slate-500 hover:text-white transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={() => removeLink(link.id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {editingLinks.length === 0 && (
                <p className="text-[10px] text-slate-500 text-center py-4">No hay enlaces personales aún</p>
              )}
            </div>
            {showAddLink && (
              <div className="mt-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="grid sm:grid-cols-3 gap-2 mb-2">
                  <input type="text" value={newLink.platform} onChange={e => setNewLink({ ...newLink, platform: e.target.value })}
                    placeholder="Plataforma" className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" />
                  <input type="url" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://..." className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" />
                  <input type="text" value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                    placeholder="Etiqueta" className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addLink} className="px-3 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer">Agregar</button>
                  <button onClick={() => setShowAddLink(false)} className="px-3 py-1 rounded-lg bg-slate-800/40 text-slate-400 text-[9px] hover:bg-slate-700/40 transition-all cursor-pointer">Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* PLATAFORMAS CONECTADAS */}
          <div className="p-5 rounded-2xl glass">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Plataformas conectadas</h2>
              <div className="flex gap-2">
                <button onClick={handleImportLinktree}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20 cursor-pointer">
                  Importar Linktree
                </button>
                <button onClick={() => setShowAddPlatform(!showAddPlatform)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-bold hover:bg-[#00D9FF]/20 transition-all border border-[#00D9FF]/20 cursor-pointer">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
            </div>

            {platforms.length === 0 ? (
              <div className="text-center py-6">
                <Globe className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500 mb-2">No hay plataformas conectadas</p>
                <button onClick={handleImportLinktree}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20 cursor-pointer">
                  Importar desde Linktree
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                {platforms.map(p => {
                  const meta = PLATFORM_META[p.type]
                  const PIcon = PLATFORM_ICONS[p.type] || Globe
                  return (
                    <div key={p.id} className="group relative rounded-2xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all backdrop-blur-sm">
                      {p.image && (
                        <div className="h-16 sm:h-20 bg-slate-800/30 overflow-hidden rounded-t-2xl">
                          <img src={p.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm ${meta.color} shrink-0`}>
                              {PIcon ? <PIcon className="w-4 h-4" /> : meta.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] font-bold text-white truncate">{p.title}</p>
                                {p.isVerified && <Shield className="w-3 h-3 text-[#00D9FF] shrink-0" />}
                              </div>
                              <p className="text-[8px] text-slate-500">{meta.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all cursor-pointer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button onClick={() => setDeleting(deleting === p.id ? null : p.id)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${deleting === p.id ? "text-red-400 bg-red-500/10" : "text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"}`}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {p.description && <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>}
                      </div>
                      {deleting === p.id && (
                        <div className="px-3 pb-3">
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-[8px] text-red-300 mb-1.5">¿Eliminar esta plataforma?</p>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleRemovePlatform(p.id)}
                                className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-[8px] font-bold hover:bg-red-500/30 transition-all cursor-pointer">Eliminar</button>
                              <button onClick={() => setDeleting(null)}
                                className="px-2 py-1 rounded-lg bg-slate-800/40 text-slate-400 text-[8px] hover:bg-slate-700/40 transition-all cursor-pointer">Cancelar</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {showAddPlatform && (
              <div className="mt-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="grid sm:grid-cols-2 gap-2 mb-2">
                  <select value={newPlatform.type} onChange={e => setNewPlatform({ ...newPlatform, type: e.target.value as PlatformType })}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none">
                    {Object.entries(PLATFORM_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <input type="url" value={newPlatform.url} onChange={e => setNewPlatform({ ...newPlatform, url: e.target.value })}
                    placeholder="URL" className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" />
                  <input type="text" value={newPlatform.title} onChange={e => setNewPlatform({ ...newPlatform, title: e.target.value })}
                    placeholder="Título" className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" />
                  <input type="text" value={newPlatform.description} onChange={e => setNewPlatform({ ...newPlatform, description: e.target.value })}
                    placeholder="Descripción" className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddPlatform} className="px-3 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer">Conectar</button>
                  <button onClick={() => setShowAddPlatform(false)} className="px-3 py-1 rounded-lg bg-slate-800/40 text-slate-400 text-[9px] hover:bg-slate-700/40 transition-all cursor-pointer">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
