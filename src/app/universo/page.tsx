'use client'

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, ExternalLink, Search, Gem, Globe, Link2, X, Check, AlertCircle, Shield, Download, MessageSquare, Heart, Send, Eye, EyeOff, ArrowUp, ArrowDown, Edit3 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import {
  type ConnectedPlatform, type PlatformType,
  getPlatforms, addPlatform, removePlatform, updatePlatform,
  toggleVisibility, reorderPlatforms, importFromLinktree,
  PLATFORM_META, CONTENT_LABELS,
} from "@/lib/universo"
import { DEFAULT_ECOSYSTEM, type EcosystemProject } from "@/lib/ecosistema"
import { getComments, addComment } from "@/lib/comentarios"

const PLATFORM_OPTIONS: { type: PlatformType; placeholder: string }[] = [
  { type: "youtube", placeholder: "https://youtube.com/@tucanal" },
  { type: "instagram", placeholder: "https://instagram.com/tuusuario" },
  { type: "tiktok", placeholder: "https://tiktok.com/@tusuario" },
  { type: "twitter", placeholder: "https://x.com/tuusuario" },
  { type: "facebook", placeholder: "https://facebook.com/tuusuario" },
  { type: "linkedin", placeholder: "https://linkedin.com/in/tuusuario" },
  { type: "telegram", placeholder: "https://t.me/tucanal" },
  { type: "whatsapp", placeholder: "https://wa.me/..." },
  { type: "pinterest", placeholder: "https://pinterest.com/tuusuario" },
  { type: "venmo", placeholder: "https://venmo.com/u/tuusuario" },
  { type: "blog", placeholder: "https://tublog.com" },
  { type: "podcast", placeholder: "https://tupodcast.com" },
  { type: "github", placeholder: "https://github.com/tuusuario" },
  { type: "website", placeholder: "https://tusitioweb.com" },
  { type: "store", placeholder: "https://tutienda.com" },
  { type: "app", placeholder: "https://tuaplicacion.com" },
  { type: "other", placeholder: "https://..." },
]

function formatSyncTime(lastSync: string): { label: string; color: string } {
  const minutes = Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)
  if (minutes < 60) return { label: `${minutes}m`, color: "text-emerald-400" }
  if (minutes < 1440) return { label: `${Math.round(minutes / 60)}h`, color: "text-amber-400" }
  return { label: `${Math.round(minutes / 1440)}d`, color: "text-slate-500" }
}

function SyncBadge({ lastSync }: { lastSync: string }) {
  const [info] = useState(() => formatSyncTime(lastSync))
  return <span className={`text-[8px] font-mono ${info.color}`}>↻ {info.label}</span>
}

const DEFAULT_SEEDS: Omit<ConnectedPlatform, "id" | "connectedAt" | "lastSync" | "userId">[] = [
  { type: "youtube", url: "https://youtube.com/@msmchannel2023", title: "MSM Channel", description: "Contenido sobre tecnología, productos y filosofía MSM", image: "", category: "Video", tags: ["youtube", "video", "msm"], summary: "Canal oficial con videos sobre productos, tutoriales y visión de la marca MSM.", stats: {}, isActive: true, isVerified: false, contentType: "video", elianaAnalysis: null },
  { type: "instagram", url: "https://instagram.com/msm_mystore", title: "@msm_mystore", description: "Contenido visual y catálogo de productos", image: "", category: "Redes Sociales", tags: ["instagram", "visual", "productos"], summary: "", stats: {}, isActive: true, isVerified: false, contentType: "photo", elianaAnalysis: null },
  { type: "facebook", url: "https://facebook.com/msmmystore", title: "MSM my store", description: "Página oficial en Facebook", image: "", category: "Redes Sociales", tags: ["facebook", "social"], summary: "", stats: {}, isActive: true, isVerified: true, contentType: "social", elianaAnalysis: null },
  { type: "telegram", url: "https://t.me/msmmystor", title: "MSM my store Telegram", description: "Canal oficial en Telegram", image: "", category: "Mensajería", tags: ["telegram", "canal"], summary: "", stats: {}, isActive: true, isVerified: true, contentType: "channel", elianaAnalysis: null },
  { type: "whatsapp", url: "https://wa.me/17723015523", title: "MSM WhatsApp", description: "Atención personalizada", image: "", category: "Mensajería", tags: ["whatsapp", "chat"], summary: "", stats: {}, isActive: true, isVerified: true, contentType: "channel", elianaAnalysis: null },
  { type: "twitter", url: "https://x.com/msmmystore", title: "@msmmystore", description: "Actualizaciones en tiempo real", image: "", category: "Redes Sociales", tags: ["x", "social"], summary: "", stats: {}, isActive: true, isVerified: false, contentType: "social", elianaAnalysis: null },
  { type: "website", url: "https://msmmystore.com", title: "MSM my Store", description: "Tienda oficial y centro de operaciones", image: "", category: "Web", tags: ["web", "tienda", "ecommerce"], summary: "", stats: {}, isActive: true, isVerified: true, contentType: "shop", elianaAnalysis: null },
  { type: "blog", url: "https://blog.msmmystore.com", title: "Blog MSM", description: "Artículos y contenido de valor", image: "", category: "Contenido", tags: ["blog", "artículos"], summary: "", stats: {}, isActive: true, isVerified: true, contentType: "blog", elianaAnalysis: null },
]

export default function UniversoPage() {
  usePageTitle("Mi Universo Digital")

  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>(() => {
    const session = getSession()
    if (!session) return []
    let stored = getPlatforms(session.id)
    if (stored.length === 0) {
      DEFAULT_SEEDS.forEach(p => addPlatform({ ...p, userId: session.id }))
      stored = getPlatforms(session.id)
    } else {
      const hasOldSeeds = stored.some(p => p.url.includes("tucanal") || p.url.includes("tuusuario"))
      if (hasOldSeeds) {
        stored.forEach(p => removePlatform(p.id))
        DEFAULT_SEEDS.forEach(p => addPlatform({ ...p, userId: session.id }))
        stored = getPlatforms(session.id)
      }
    }
    return stored
  })
  const [userId, setUserId] = useState<string>(() => {
    const session = getSession()
    return session?.id || ""
  })
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"conexiones" | "ecosistema">("conexiones")
  const [imported, setImported] = useState(false)

  const [formType, setFormType] = useState<PlatformType>("other")
  const [formUrl, setFormUrl] = useState("")
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formImage, setFormImage] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formError, setFormError] = useState("")
  const [editingPlatform, setEditingPlatform] = useState<ConnectedPlatform | null>(null)
  const [commentTarget, setCommentTarget] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [following, setFollowing] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("zafiro_following") || "[]")
  })

  const toggleFollow = (id: string) => {
    const next = following.includes(id) ? following.filter(f => f !== id) : [...following, id]
    setFollowing(next)
    localStorage.setItem("zafiro_following", JSON.stringify(next))
  }

  const loadPlatforms = useCallback(() => {
    const session = getSession()
    if (!session) return
    setUserId(session.id)
    let stored = getPlatforms(session.id)
    if (stored.length === 0) {
      DEFAULT_SEEDS.forEach(p => addPlatform({ ...p, userId: session.id }))
      stored = getPlatforms(session.id)
    } else {
      const hasOldSeeds = stored.some(p => p.url.includes("tucanal") || p.url.includes("tuusuario"))
      if (hasOldSeeds) {
        stored.forEach(p => removePlatform(p.id))
        DEFAULT_SEEDS.forEach(p => addPlatform({ ...p, userId: session.id }))
        stored = getPlatforms(session.id)
      }
    }
    setPlatforms(stored)
  }, [])

  const handleImportLinktree = () => {
    const session = getSession()
    if (!session) return
    const imported_ = importFromLinktree(session.id, "msmmystore")
    if (imported_.length > 0) {
      setImported(true)
      loadPlatforms()
    }
  }

  const filtered = platforms.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
    PLATFORM_META[p.type].label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, ConnectedPlatform[]>>((acc, p) => {
    const cat = p.category || PLATFORM_META[p.type].label
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const ecosystemGrouped = DEFAULT_ECOSYSTEM.reduce<Record<string, EcosystemProject[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  const handleSave = () => {
    if (!formUrl.trim()) { setFormError("El enlace es obligatorio"); return }
    if (!formTitle.trim()) { setFormError("El título es obligatorio"); return }
    setFormError("")
    const base = {
      type: formType, url: formUrl.trim(), title: formTitle.trim(),
      description: formDescription.trim(), image: formImage || "",
      category: PLATFORM_META[formType].label,
      tags: formTags.split(",").map(t => t.trim()).filter(Boolean), summary: "", stats: {},
      elianaAnalysis: null, userId,
    }
    if (editingPlatform) {
      updatePlatform(editingPlatform.id, base)
      setEditingPlatform(null)
    } else {
      addPlatform({ ...base, isActive: true, isVerified: false, contentType: "other" })
    }
    setFormType("other"); setFormUrl(""); setFormTitle(""); setFormDescription(""); setFormTags(""); setFormImage("")
    setShowForm(false)
    loadPlatforms()
  }

  const handleRemove = (id: string) => { removePlatform(id); loadPlatforms() }
  const handleToggleVisibility = (id: string) => { toggleVisibility(id); loadPlatforms() }
  const handleReorder = (id: string, dir: 'up' | 'down') => {
    const userPlatforms = platforms.filter(p => p.userId === userId)
    const idx = userPlatforms.findIndex(p => p.id === id)
    if (idx === -1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= userPlatforms.length) return
    const ids = userPlatforms.map(p => p.id)
    ;[ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]]
    reorderPlatforms(userId, ids)
    loadPlatforms()
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h2 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest">Mi Universo Digital</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!imported && (
              <button onClick={handleImportLinktree}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-all cursor-pointer border border-slate-700/50">
                <Download className="w-3.5 h-3.5" /> Importar Linktree
              </button>
            )}
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Conectar
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-5 border-b border-slate-800">
          {[
            { key: "conexiones", label: "Conexiones", icon: Link2 },
            { key: "ecosistema", label: "Mi Ecosistema", icon: Globe },
          ].map(tab => {
            const Icon = tab.icon; const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold border-b-2 transition-all cursor-pointer ${
                  isActive ? "text-[#00D9FF] border-[#00D9FF]" : "text-slate-500 border-transparent hover:text-slate-300"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === "conexiones" && (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Buscar plataformas, etiquetas..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1220]/60 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00D9FF]/40 transition-colors" />
            </div>

            {Object.entries(grouped).length === 0 ? (
              <div className="text-center py-16">
                <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-bold">Tu universo digital está vacío</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Conecta tus plataformas para centralizar tu presencia digital</p>
                <button onClick={handleImportLinktree}
                  className="px-4 py-2 rounded-xl bg-slate-800/40 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-all cursor-pointer border border-slate-700/50">
                  Importar desde Linktree
                </button>
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-8">
                  <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">{category}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(items as (ConnectedPlatform & { _order?: number })[]).map((p, idx) => {
                      const meta = PLATFORM_META[p.type]
                      return (
                        <div key={p.id} className="group rounded-2xl glass hover:border-slate-700 transition-all overflow-hidden">
                          {p.image && (
                            <div className="h-20 sm:h-24 bg-slate-800/30 overflow-hidden">
                              <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm font-bold ${meta.color} shrink-0`}>
                                  {meta.icon}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-white truncate">{p.title}</p>
                                    {p.isVerified && <span title="Verificado"><Shield className="w-3 h-3 text-[#00D9FF] shrink-0" /></span>}
                                    <SyncBadge lastSync={p.lastSync} />
                                  </div>
                                  <p className="text-[9px] text-slate-500">{meta.label}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditingPlatform(p); setFormType(p.type); setFormUrl(p.url); setFormTitle(p.title); setFormDescription(p.description); setFormImage(p.image); setFormTags(p.tags.join(", ")); setShowForm(true) }}
                                  className="p-1 rounded-lg text-slate-500 hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all cursor-pointer">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleToggleVisibility(p.id)}
                                  className={`p-1 rounded-lg transition-all cursor-pointer ${p.isActive ? "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-red-400/50 hover:text-red-400 hover:bg-red-500/10"}`}>
                                  {p.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                                <button onClick={() => handleRemove(p.id)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {!p.isActive && (
                              <div className="mb-2 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <p className="text-[8px] font-mono text-amber-400/70">Visibilidad desactivada — no aparece en tu perfil público</p>
                              </div>
                            )}
                            <div className="flex items-center gap-1 mb-2">
                              <button onClick={() => handleReorder(p.id, 'up')}
                                className="p-0.5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 transition-all cursor-pointer" title="Mover arriba">
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={() => handleReorder(p.id, 'down')}
                                className="p-0.5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 transition-all cursor-pointer" title="Mover abajo">
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            {p.description && (
                              <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">{p.description}</p>
                            )}
                            {p.elianaAnalysis && (
                              <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#00D9FF]/5 border border-[#00D9FF]/10">
                                <div className="flex items-center gap-1 mb-1">
                                  <Gem className="w-2.5 h-2.5 text-[#00D9FF]" />
                                  <span className="text-[7px] font-mono text-[#00D9FF] font-bold uppercase tracking-wider">ELIANA</span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-relaxed">{p.elianaAnalysis.summary}</p>
                                {p.elianaAnalysis.categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {p.elianaAnalysis.categories.map(c => (
                                      <span key={c} className="px-1 py-0.5 rounded text-[7px] font-mono bg-slate-800/60 text-slate-400 border border-slate-700/50">{c}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold ${
                                p.isVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800/40 text-slate-500 border border-slate-700/30"
                              }`}>
                                {p.isVerified ? "✓ Verificado" : "Sin verificar"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[7px] font-mono bg-slate-800/40 text-slate-400 border border-slate-700/30">
                                {CONTENT_LABELS[p.contentType]}
                              </span>
                            </div>
                            {Object.keys(p.stats).length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-1.5 text-[8px] text-slate-500">
                                {Object.entries(p.stats).map(([k, v]) => (
                                  <span key={k}>{k}: <strong className="text-slate-300">{v.toLocaleString()}</strong></span>
                                ))}
                              </div>
                            )}
                            {p.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.tags.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded text-[7px] font-mono bg-slate-800/60 text-slate-400 border border-slate-700/50">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex border-t border-slate-800 flex-wrap">
                            {[
                              { icon: ExternalLink, label: "Abrir", href: p.url, external: true, color: "hover:text-white" },
                              { icon: MessageSquare, label: "Comentar", action: () => setCommentTarget(p.id), color: "hover:text-amber-400" },
                              { icon: Gem, label: "ELIANA", href: `/?ask=${encodeURIComponent(p.title)}`, color: "hover:text-[#00D9FF]" },
                              { icon: Heart, label: following.includes(p.id) ? "Siguiendo" : "Seguir", action: () => toggleFollow(p.id), color: following.includes(p.id) ? "text-emerald-400" : "hover:text-emerald-400" },
                              { icon: Send, label: "Mensaje", href: "/messages", color: "hover:text-indigo-400" },
                            ].map((btn, bi) => (
                              btn.href ? (
                                btn.external ? (
                                  <a key={bi} href={btn.href} target="_blank" rel="noopener noreferrer"
                                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-[8px] font-mono text-slate-400 ${btn.color} hover:bg-slate-800/30 transition-all cursor-pointer border-r border-slate-800 last:border-r-0`}>
                                    <btn.icon className="w-3 h-3" /> {btn.label}
                                  </a>
                                ) : (
                                  <Link key={bi} href={btn.href}
                                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-[8px] font-mono text-slate-400 ${btn.color} hover:bg-slate-800/30 transition-all cursor-pointer border-r border-slate-800 last:border-r-0`}>
                                    <btn.icon className="w-3 h-3" /> {btn.label}
                                  </Link>
                                )
                              ) : (
                                <button key={bi} onClick={btn.action}
                                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-[8px] font-mono ${btn.color} hover:bg-slate-800/30 transition-all cursor-pointer border-r border-slate-800 last:border-r-0 ${
                                    btn.label === "Siguiendo" ? "text-emerald-400" : "text-slate-400"
                                  }`}>
                                  <btn.icon className="w-3 h-3" /> {btn.label}
                                </button>
                              )
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "ecosistema" && (
          <>
            <p className="text-[10px] text-slate-400 mb-5 max-w-xl">
              Todos tus proyectos, marcas y plataformas en un solo lugar. Cada proyecto es una pieza de tu ecosistema digital.
            </p>
            {Object.entries(ecosystemGrouped).map(([category, items]) => (
              <div key={category} className="mb-8">
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">{category}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(p => {
                    const statusColors: Record<string, string> = {
                      activo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      "próximamente": "bg-slate-800/40 text-slate-500 border-slate-700/30",
                    }
                    const isInternal = p.url.startsWith("/")
                    return (
                      <Link key={p.id} href={p.url} target={isInternal ? undefined : "_blank"} rel={isInternal ? undefined : "noopener noreferrer"}
                        className="block rounded-2xl glass hover:border-slate-700 transition-all p-4 group">
                        <div className="flex items-start gap-3 mb-2">
                          <span className={`w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm ${p.color} shrink-0`}>
                            {p.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white">{p.name}</p>
                              <span className={`px-1 py-0.5 rounded text-[6px] font-mono font-bold ${statusColors[p.status]}`}>
                                {p.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed mt-0.5">{p.description}</p>
                          </div>
                        </div>
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded text-[7px] font-mono bg-slate-800/60 text-slate-400 border border-slate-700/50">{t}</span>
                            ))}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingPlatform(null); setFormType("other"); setFormUrl(""); setFormTitle(""); setFormDescription(""); setFormImage(""); setFormTags(""); setFormError("") }}>
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0B1220] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {editingPlatform ? <Edit3 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-[#00D9FF]" />}
                <h3 className="text-sm font-bold text-white">{editingPlatform ? "Editar Plataforma" : "Conectar Plataforma"}</h3>
              </div>
              <button onClick={() => { setShowForm(false); setEditingPlatform(null); setFormType("other"); setFormUrl(""); setFormTitle(""); setFormDescription(""); setFormImage(""); setFormTags(""); setFormError("") }} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {formError && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <div className="mb-4">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Plataforma</label>
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                {PLATFORM_OPTIONS.map(opt => {
                  const meta = PLATFORM_META[opt.type]
                  const isSelected = formType === opt.type
                  return (
                    <button key={opt.type} onClick={() => setFormType(opt.type)}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[9px] font-mono border transition-all cursor-pointer ${
                        isSelected ? "bg-[#00D9FF]/10 border-[#00D9FF]/30 text-[#00D9FF]" : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600"
                      }`}>
                      <span className={meta.color}>{meta.icon}</span>
                      <span className="text-center leading-tight">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 block">Enlace</label>
                <input type="url" value={formUrl} onChange={e => setFormUrl(e.target.value)}
                  placeholder={PLATFORM_OPTIONS.find(o => o.type === formType)?.placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors" />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 block">Título</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  placeholder="Nombre de tu canal, perfil o proyecto"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors" />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 block">Descripción</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2}
                  placeholder="¿De qué trata este espacio?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors resize-none" />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 block">Imagen de portada (URL)</label>
                <input type="url" value={formImage} onChange={e => setFormImage(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors" />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 block">Etiquetas (separadas por coma)</label>
                <input type="text" value={formTags} onChange={e => setFormTags(e.target.value)}
                  placeholder="ej: tecnología, ciencia, criptografía"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowForm(false); setEditingPlatform(null); setFormType("other"); setFormUrl(""); setFormTitle(""); setFormDescription(""); setFormImage(""); setFormTags(""); setFormError("") }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/40 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <Check className="w-3.5 h-3.5" /> {editingPlatform ? "Guardar Cambios" : "Conectar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setCommentTarget(null); setCommentText("") }}>
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0B1220] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Comentar</h3>
              </div>
              <button onClick={() => { setCommentTarget(null); setCommentText("") }} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows={3} autoFocus
              placeholder="Escribe un comentario sobre esta plataforma..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors resize-none mb-3" />
            <div className="flex gap-2">
              <button onClick={() => { setCommentTarget(null); setCommentText("") }}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-800/40 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all cursor-pointer">
                Cancelar
              </button>
              <button onClick={() => {
                if (commentText.trim()) {
                  const session = getSession()
                  addComment(commentTarget, session?.id || "anon", session?.name || "Anónimo", commentText)
                  setCommentTarget(null)
                  setCommentText("")
                }
              }}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" /> Comentar
              </button>
            </div>
            <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
              {commentTarget && getComments(commentTarget).slice(0, 5).map(c => (
                <div key={c.id} className="px-3 py-2 rounded-xl bg-slate-800/20">
                  <p className="text-[9px] font-bold text-slate-300">{c.userName}</p>
                  <p className="text-[10px] text-slate-400">{c.text}</p>
                  <p className="text-[7px] text-slate-600 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
              {commentTarget && getComments(commentTarget).length === 0 && (
                <p className="text-[9px] text-slate-500 text-center">Sin comentarios aún</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
