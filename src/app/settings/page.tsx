'use client'

import Link from "next/link"
import { ArrowLeft, Bell, Eye, Globe, Shield, Palette, Moon, Volume2, User, ChevronRight, LogOut, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession, logout as authLogout } from "@/lib/auth"
import { getProfile, getProfiles, updateProfile, createProfile, type UserProfile } from "@/lib/profile"
import { useRouter } from "next/navigation"

const sections = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "privacidad", label: "Privacidad", icon: Eye },
  { id: "idioma", label: "Idioma y Región", icon: Globe },
  { id: "seguridad", label: "Seguridad", icon: Shield },
  { id: "accesibilidad", label: "Accesibilidad", icon: Moon },
  { id: "audio", label: "Audio y Voz", icon: Volume2 },
]

export default function SettingsPage() {
  usePageTitle("Configuración")
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("perfil")
  const sessionUser = getSession()
  const userId = sessionUser?.email || "anonymous"
  const [profileFields, setProfileFields] = useState<Partial<UserProfile>>(() => {
    if (typeof window === "undefined") return {}
    let profile = getProfile(userId)
    if (!profile) {
      const profiles = getProfiles()
      const firstKey = Object.keys(profiles)[0]
      profile = firstKey ? profiles[firstKey] : null
    }
    return profile ? { name: profile.name, username: profile.username, bioShort: profile.bioShort, title: profile.title, location: profile.location, website: profile.website } : {}
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!getProfile(userId) && sessionUser) {
      createProfile(userId, sessionUser.email, sessionUser.name)
    }
  }, [userId, sessionUser])

  const handleSaveProfile = () => {
    updateProfile(userId, profileFields)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <h1 className="text-2xl font-black mb-6">Configuración</h1>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <nav className="space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon
              return (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSection === sec.id
                      ? "bg-gradient-to-r from-[#00D9FF]/15 to-blue-600/10 text-[#00D9FF] border border-[#00D9FF]/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{sec.label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                </button>
              )
            })}
            <hr className="border-slate-800 my-3" />
            <button onClick={() => { authLogout(); router.push("/") }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
              <LogOut className="w-4 h-4" /> Cerrar Sesión {sessionUser && `(${sessionUser.name})`}
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
              <Trash2 className="w-4 h-4" /> Eliminar Cuenta
            </button>
          </nav>

          <div className="p-6 rounded-2xl glass">
            {activeSection === "perfil" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Perfil Público</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center text-xl font-black">{(profileFields.name || "?").charAt(0).toUpperCase()}</div>
                  <div><p className="font-bold">{profileFields.name || "Sin nombre"}</p><p className="text-xs text-slate-400">@{profileFields.username || userId}</p></div>
                </div>
                {[["name", "Nombre"], ["username", "Nombre de Usuario"], ["bioShort", "Biografía"], ["title", "Título Profesional"], ["location", "Ubicación"], ["website", "Sitio Web"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                    <input type="text" placeholder={label}
                      value={(profileFields as Record<string, string>)[key] || ""}
                      onChange={e => setProfileFields({ ...profileFields, [key]: e.target.value })}
                      className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-all">
                    Guardar Cambios
                  </button>
                  {saved && <span className="text-[10px] text-emerald-400 font-bold">✓ Guardado</span>}
                </div>
              </div>
            )}
            {activeSection === "apariencia" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Apariencia</h2>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                  <div><p className="text-sm font-bold">Modo Oscuro</p><p className="text-xs text-slate-400">Tema actual: Oscuro</p></div>
                  <div className="w-10 h-6 rounded-full bg-[#00D9FF] relative cursor-pointer"><div className="w-4 h-4 rounded-full bg-white absolute right-1 top-1" /></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                  <div><p className="text-sm font-bold">Modo Compacto</p><p className="text-xs text-slate-400">Reducir espaciado en vistas</p></div>
                  <div className="w-10 h-6 rounded-full bg-slate-700 relative cursor-pointer"><div className="w-4 h-4 rounded-full bg-white absolute left-1 top-1" /></div>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tamaño de Fuente</label>
                  <input type="range" min="12" max="20" defaultValue="14" className="w-full mt-2 accent-[#00D9FF]" />
                </div>
              </div>
            )}
            {activeSection === "notificaciones" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Notificaciones</h2>
                {["Nuevas respuestas a mis preguntas", "Menciones de otros sintonizadores", "Nuevos seguidores", "Logros y PTS ganados", "Anuncios de la plataforma", "Recomendaciones de contenido", "Suscripciones y membresías"].map((n) => (
                  <div key={n} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-slate-800/60">
                    <span className="text-xs text-slate-300">{n}</span>
                    <div className="w-9 h-5 rounded-full bg-[#00D9FF]/80 relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-white absolute right-0.5 top-0.5" /></div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === "privacidad" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Privacidad</h2>
                {["Perfil visible para todos", "Mostrar PTS públicamente", "Aparecer en rankings", "Recibir mensajes privados", "Compartir actividad en redes"].map((p) => (
                  <div key={p} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-slate-800/60">
                    <span className="text-xs text-slate-300">{p}</span>
                    <div className="w-9 h-5 rounded-full bg-[#00D9FF]/80 relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-white absolute right-0.5 top-0.5" /></div>
                  </div>
                ))}
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 font-bold">Exportar mis datos</p>
                  <p className="text-[10px] text-slate-400 mt-1">Recibirás un enlace para descargar toda tu información</p>
                </div>
              </div>
            )}
            {(activeSection === "idioma" || activeSection === "seguridad" || activeSection === "accesibilidad" || activeSection === "audio") && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">{sections.find(s => s.id === activeSection)?.label}</h2>
                <p className="text-xs text-slate-400">Configuración disponible próximamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
