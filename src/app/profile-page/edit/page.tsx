'use client'

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Camera, Plus, Trash2, Globe } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getProfile, updateProfile, seedMiguelProfile, type UserProfile, type SocialLink } from "@/lib/profile"

export default function EditProfilePage() {
  usePageTitle("Editar Perfil")
  const router = useRouter()
  const [initialEditData] = useState(() => {
    if (typeof window === "undefined") return null
    const session = getSession()
    let p: UserProfile | null = null
    if (session) p = getProfile(session.id)
    if (!p) p = seedMiguelProfile()
    return p
  })
  const [profile, setProfile] = useState<UserProfile | null>(initialEditData)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(() => initialEditData ? {
    name: initialEditData.name, publicName: initialEditData.publicName, username: initialEditData.username,
    title: initialEditData.title, company: initialEditData.company, location: initialEditData.location,
    website: initialEditData.website, linktree: initialEditData.linktree,
    bioShort: initialEditData.bioShort, bioLong: initialEditData.bioLong,
  } : {
    name: "", publicName: "", username: "", title: "", company: "",
    location: "", website: "", linktree: "", bioShort: "", bioLong: "",
  })
  const [rolesText, setRolesText] = useState(() => initialEditData ? initialEditData.roles.join(", ") : "")
  const [editingLinks, setEditingLinks] = useState<SocialLink[]>(() => initialEditData ? [...initialEditData.socialLinks] : [])
  const [newLink, setNewLink] = useState({ platform: "", url: "", label: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!profile) return
    const roles = rolesText.split(",").map(r => r.trim()).filter(Boolean)
    const updated = updateProfile(profile.userId, {
      ...form,
      roles,
      socialLinks: editingLinks,
    })
    if (updated) {
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const updated = updateProfile(profile.userId, { avatar: dataUrl })
      if (updated) setProfile(updated)
    }
    reader.readAsDataURL(file)
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const updated = updateProfile(profile.userId, { coverImage: dataUrl })
      if (updated) setProfile(updated)
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando...</p>
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
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[10px] font-bold hover:opacity-90 transition-all cursor-pointer">
            <Save className="w-3.5 h-3.5" /> {saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>

        <h1 className="text-xl font-black mb-6">Editar Perfil</h1>

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
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saved ? "✓ Cambios guardados" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
