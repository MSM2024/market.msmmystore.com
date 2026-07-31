'use client'

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Camera, Plus, Trash2, Globe, AlertCircle, RefreshCw } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { refreshSession } from "@/lib/auth"
import { getProfile, updateProfile, type UserProfile, type SocialLink } from "@/lib/profile"

export default function EditProfilePage() {
  usePageTitle("Editar Perfil")
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", publicName: "", username: "", title: "", company: "",
    location: "", website: "", linktree: "", bioShort: "", bioLong: "",
  })
  const [rolesText, setRolesText] = useState("")
  const [editingLinks, setEditingLinks] = useState<SocialLink[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    const timeoutId = setTimeout(() => abortRef.current?.abort(), 10000)

    ;(async () => {
      try {
        const session = await refreshSession()
        if (!mountedRef.current) return
        if (!session) { router.replace("/auth/login"); return }
        const p = await getProfile()
        if (!mountedRef.current) return
        if (signal.aborted) return
        if (p) {
          setProfile(p)
          setForm({
            name: p.name, publicName: p.publicName, username: p.username,
            title: p.title, company: p.company, location: p.location,
            website: p.website, linktree: p.linktree,
            bioShort: p.bioShort, bioLong: p.bioLong,
          })
          setRolesText(p.roles.join(", "))
          setEditingLinks([...p.socialLinks])
        }
      } catch {
        if (mountedRef.current) setError("No pudimos cargar tu perfil.")
      } finally {
        if (mountedRef.current) { setLoaded(true); setLoading(false) }
        clearTimeout(timeoutId)
      }
    })()

    return () => { mountedRef.current = false; abortRef.current?.abort() }
  }, [router])
  const [newLink, setNewLink] = useState({ platform: "", url: "", label: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!profile || saving) return
    setSaving(true)
    setSaveError("")
    try {
      const roles = rolesText.split(",").map(r => r.trim()).filter(Boolean)
      const ok = await updateProfile({
        ...form,
        roles,
        socialLinks: editingLinks,
      })
      if (!mountedRef.current) return
      if (ok) {
        setSaved(true)
        setTimeout(() => { if (mountedRef.current) setSaved(false) }, 2000)
      } else {
        setSaveError("No pudimos guardar los cambios.")
      }
    } catch {
      if (mountedRef.current) setSaveError("Error de conexión. Intenta de nuevo.")
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return
      try {
        const ok = await updateProfile({ avatar: dataUrl })
        if (ok && mountedRef.current) setProfile(prev => prev ? { ...prev, avatar: dataUrl } : null)
      } catch {
        if (mountedRef.current) setSaveError("No pudimos actualizar la foto.")
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return
      try {
        const ok = await updateProfile({ coverImage: dataUrl })
        if (ok && mountedRef.current) setProfile(prev => prev ? { ...prev, coverImage: dataUrl } : null)
      } catch {
        if (mountedRef.current) setSaveError("No pudimos actualizar la portada.")
      }
    }
    reader.readAsDataURL(file)
  }

  const addLink = () => {
    if (!newLink.platform || !newLink.url) return
    const sl: SocialLink = {
      id: `sl_${Date.now()}`,
      platform: newLink.platform,
      url: newLink.url,
      label: newLink.label || newLink.platform,
    }
    setEditingLinks([...editingLinks, sl])
    setNewLink({ platform: "", url: "", label: "" })
  }

  const removeLink = (id: string) => {
    setEditingLinks(editingLinks.filter(l => l.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#00D9FF] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center max-w-xs">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-slate-300 mb-4">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); window.location.reload() }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-400">Debes iniciar sesión para editar tu perfil.</p>
          <Link href="/auth/login" className="mt-4 inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/profile-page" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al perfil
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[10px] font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
            <Save className="w-3.5 h-3.5" /> {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>

        <h1 className="text-xl font-black mb-6">Editar Perfil</h1>

        {saveError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[10px] text-red-300">{saveError}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Fotos */}
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-xs font-bold text-white mb-4">Fotos</h2>
            <div className="flex gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#00D9FF] to-blue-600 p-0.5">
                  <div className="w-full h-full rounded-2xl bg-[#050816] flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-white/60">
                        {profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 mb-1">Foto de perfil</p>
                <button onClick={() => coverInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/40 text-[9px] text-slate-300 hover:bg-slate-700/40 transition-all border border-slate-700/50 cursor-pointer">
                  Cambiar portada
                </button>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>
            </div>
          </div>

          {/* Información básica */}
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-xs font-bold text-white mb-4">Información básica</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "name", label: "Nombre completo", type: "text" },
                { key: "publicName", label: "Nombre público", type: "text" },
                { key: "username", label: "Usuario (@)", type: "text" },
                { key: "title", label: "Título / Cargo", type: "text" },
                { key: "company", label: "Empresa", type: "text" },
                { key: "location", label: "Ubicación", type: "text" },
                { key: "website", label: "Sitio web", type: "url" },
                { key: "linktree", label: "Linktree / Enlace adicional", type: "url" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
                  <input type={f.type} value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-xs font-bold text-white mb-4">Roles (separados por coma)</h2>
            <input type="text" value={rolesText} onChange={e => setRolesText(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none" placeholder="Ej: Creador, Emprendedor, Visionario" />
          </div>

          {/* Bios */}
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-xs font-bold text-white mb-4">Biografías</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Bio corta (visible en perfil)</label>
                <textarea value={form.bioShort} onChange={e => setForm({ ...form, bioShort: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none h-20 resize-none" />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Bio larga</label>
                <textarea value={form.bioLong} onChange={e => setForm({ ...form, bioLong: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none h-28 resize-none" />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-xs font-bold text-white mb-4">Enlaces / Redes</h2>
            <div className="space-y-2 mb-3">
              {editingLinks.map(link => (
                <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/20 border border-slate-700/50">
                  <Globe className="w-3.5 h-3.5 text-[#00D9FF] shrink-0" />
                  <span className="text-[10px] text-white flex-1 min-w-0 truncate">{link.label}</span>
                  <span className="text-[8px] text-slate-500 hidden sm:inline">{link.platform}</span>
                  <button onClick={() => removeLink(link.id)} className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[7px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Plataforma</label>
                <input type="text" value={newLink.platform} onChange={e => setNewLink({ ...newLink, platform: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" placeholder="WhatsApp" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[7px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-0.5">URL</label>
                <input type="url" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" placeholder="https://..." />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-[7px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Etiqueta</label>
                <input type="text" value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none" placeholder="Canal Promos" />
              </div>
              <button onClick={addLink}
                className="px-2.5 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-bold hover:bg-[#00D9FF]/20 transition-all border border-[#00D9FF]/20 cursor-pointer flex items-center gap-1 whitespace-nowrap">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
          </div>

          {/* Save button at bottom */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : saved ? "✓ Cambios guardados" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
