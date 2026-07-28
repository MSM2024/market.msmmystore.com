'use client'

import Link from "next/link"
import { ArrowLeft, Bell, Eye, Globe, Shield, Palette, Moon, Volume2, User, ChevronRight, LogOut, Trash2, Monitor, Sun, Type, Mail, MessageSquare, Heart, Award, Megaphone, Users, Bookmark, Lock, MapPin, LinkIcon, Camera, Check, AlertTriangle, Smartphone, Key, Fingerprint, EyeOff, Languages, Clock, Mic, Play, Square, Accessibility, Download } from "lucide-react"
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
  { id: "accesibilidad", label: "Accesibilidad", icon: Accessibility },
  { id: "audio", label: "Audio y Voz", icon: Volume2 },
]

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${enabled ? "bg-[#00D9FF]" : "bg-slate-700"}`}>
      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${enabled ? "right-1" : "left-1"}`} />
    </button>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-xs font-bold text-slate-200">{label}</p>
        {desc && <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export default function SettingsPage() {
  usePageTitle("Configuración")
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("perfil")
  const sessionUser = getSession()
  const userId = sessionUser?.email || "anonymous"

  // Profile state
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" })
  const [passwordMsg, setPasswordMsg] = useState<"ok" | "error" | null>(null)

  function getDefaultSettings() {
    return {
      appearance: { darkMode: true, compactMode: false, fontSize: 14, accentColor: "cyan" },
      notifications: { responses: true, mentions: true, followers: true, achievements: true, announcements: true, recommendations: true, subscriptions: true, emailDigest: false, pushEnabled: true },
      privacy: { publicProfile: true, showPts: true, showRankings: true, allowMessages: true, shareActivity: false, showOnline: true, allowSearch: true },
      language: { lang: "es", region: "CU", timezone: "America/Havana", dateFormat: "DD/MM/YYYY" },
      security: { twoFactor: false, loginAlerts: true, sessionTimeout: "30", lastPasswordChange: "", activeSessions: 1 },
      accessibility: { reduceMotion: false, highContrast: false, screenReader: false, fontSizePref: "normal", keyboardNav: true },
      audio: { elianaVoice: true, voiceSpeed: 1, autoPlay: false, soundEffects: true, micPermission: false },
    }
  }

  // Settings state (persisted in localStorage)
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") return getDefaultSettings()
    try { return JSON.parse(localStorage.getItem("zafiro_settings") || JSON.stringify(getDefaultSettings())) } catch { return getDefaultSettings() }
  })

  const updateSettings = (section: string, key: string, value: unknown) => {
    setSettings((prev: Record<string, Record<string, unknown>>) => {
      const next = { ...prev, [section]: { ...(prev[section] as Record<string, unknown>), [key]: value } }
      localStorage.setItem("zafiro_settings", JSON.stringify(next))
      return next
    })
  }

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

  const handleLogout = () => { authLogout(); router.push("/") }

  const handleDeleteAccount = () => {
    localStorage.removeItem("zafiro_users")
    localStorage.removeItem("zafiro_session")
    localStorage.removeItem("zafiro_profiles")
    localStorage.removeItem("zafiro_settings")
    authLogout()
    router.push("/")
  }

  const handleExportData = () => {
    const data = {
      profile: profileFields,
      settings,
      exportedAt: new Date().toISOString(),
      platform: "ZAFIRO",
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zafiro-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) { setPasswordMsg("error"); return }
    if (passwords.newPass !== passwords.confirm) { setPasswordMsg("error"); return }
    if (passwords.newPass.length < 8) { setPasswordMsg("error"); return }
    const users = JSON.parse(localStorage.getItem("zafiro_users") || "[]")
    const user = users.find((u: { email: string }) => u.email === userId)
    if (!user) { setPasswordMsg("error"); return }
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(passwords.current + "zafiro_salt_v1"))
    const currentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")
    if (user.passwordHash !== currentHash) { setPasswordMsg("error"); return }
    const newHashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(passwords.newPass + "zafiro_salt_v1"))
    const newHash = Array.from(new Uint8Array(newHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")
    user.passwordHash = newHash
    localStorage.setItem("zafiro_users", JSON.stringify(users))
    setPasswords({ current: "", newPass: "", confirm: "" })
    setPasswordMsg("ok")
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  const userInitial = (profileFields.name || sessionUser?.name || "?").charAt(0).toUpperCase()
  const displayName = profileFields.name || sessionUser?.name || "Sin nombre"
  const displayUsername = profileFields.username || userId

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <h1 className="text-2xl font-black mb-6">Configuración</h1>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar nav */}
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
            <Link href={`/perfil/${displayUsername}`}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all">
              <Eye className="w-4 h-4" /> Perfil Público
            </Link>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
              <LogOut className="w-4 h-4" /> Cerrar Sesión {sessionUser && <span className="opacity-60">({sessionUser.name})</span>}
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
              <Trash2 className="w-4 h-4" /> Eliminar Cuenta
            </button>
          </nav>

          {/* Content */}
          <div className="p-6 rounded-2xl glass">

            {/* ── PERFIL ── */}
            {activeSection === "perfil" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Perfil</h2>
                  <button onClick={() => window.open(`/perfil/${displayUsername}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 hover:bg-[#00D9FF]/20 transition-all cursor-pointer">
                    <Eye className="w-3 h-3" /> Ver Perfil Público
                  </button>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center text-xl font-black">{userInitial}</div>
                    <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold">{displayName}</p>
                    <p className="text-xs text-slate-400">@{displayUsername}</p>
                    {sessionUser?.role && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">{sessionUser.role.toUpperCase()}</span>}
                  </div>
                </div>

                {/* Fields */}
                {[
                  ["name", "Nombre", "text"],
                  ["username", "Nombre de Usuario", "text"],
                  ["bioShort", "Biografía", "textarea"],
                  ["title", "Título Profesional", "text"],
                  ["location", "Ubicación", "text"],
                  ["website", "Sitio Web", "text"],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                    {type === "textarea" ? (
                      <textarea placeholder={label} rows={3}
                        value={(profileFields as Record<string, string>)[key] || ""}
                        onChange={e => setProfileFields({ ...profileFields, [key]: e.target.value })}
                        className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none resize-none" />
                    ) : (
                      <input type="text" placeholder={label}
                        value={(profileFields as Record<string, string>)[key] || ""}
                        onChange={e => setProfileFields({ ...profileFields, [key]: e.target.value })}
                        className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-all">
                    Guardar Cambios
                  </button>
                  {saved && <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Guardado</span>}
                </div>
              </div>
            )}

            {/* ── APARIENCIA ── */}
            {activeSection === "apariencia" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Apariencia</h2>

                <SettingRow label="Tema" desc="Elige entre modo oscuro o claro">
                  <div className="flex gap-2">
                    {[
                      { value: "dark", icon: Moon, label: "Oscuro" },
                      { value: "light", icon: Sun, label: "Claro" },
                      { value: "system", icon: Monitor, label: "Sistema" },
                    ].map(t => (
                      <button key={t.value}
                        onClick={() => updateSettings("appearance", "darkMode", t.value === "dark")}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          (t.value === "dark" && settings.appearance.darkMode) || (t.value === "light" && !settings.appearance.darkMode)
                            ? "bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30"
                            : "bg-slate-900/40 text-slate-400 border border-slate-800 hover:text-white"
                        }`}>
                        <t.icon className="w-3 h-3" /> {t.label}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Modo Compacto" desc="Reducir espaciado en vistas">
                  <Toggle enabled={settings.appearance.compactMode} onChange={() => updateSettings("appearance", "compactMode", !settings.appearance.compactMode)} />
                </SettingRow>

                <SettingRow label="Tamaño de Fuente" desc={`${settings.appearance.fontSize}px`}>
                  <div className="flex items-center gap-3">
                    <Type className="w-3 h-3 text-slate-500" />
                    <input type="range" min="12" max="20" value={settings.appearance.fontSize}
                      onChange={e => updateSettings("appearance", "fontSize", parseInt(e.target.value))}
                      className="w-32 accent-[#00D9FF]" />
                    <Type className="w-4 h-4 text-slate-500" />
                  </div>
                </SettingRow>

                <SettingRow label="Color de Acento" desc="Color principal de la interfaz">
                  <div className="flex gap-2">
                    {[{ color: "cyan", cls: "bg-[#00D9FF]" }, { color: "purple", cls: "bg-purple-500" }, { color: "emerald", cls: "bg-emerald-500" }, { color: "amber", cls: "bg-amber-500" }, { color: "rose", cls: "bg-rose-500" }].map(c => (
                      <button key={c.color} onClick={() => updateSettings("appearance", "accentColor", c.color)}
                        className={`w-6 h-6 rounded-full ${c.cls} cursor-pointer transition-all ${settings.appearance.accentColor === c.color ? "ring-2 ring-white ring-offset-2 ring-offset-[#050816]" : "opacity-50 hover:opacity-100"}`} />
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Animaciones" desc="Efectos de movimiento en la interfaz">
                  <Toggle enabled={!settings.appearance.compactMode} onChange={() => updateSettings("appearance", "compactMode", !settings.appearance.compactMode)} />
                </SettingRow>
              </div>
            )}

            {/* ── NOTIFICACIONES ── */}
            {activeSection === "notificaciones" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Notificaciones</h2>

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Actividad</p>
                {[
                  ["responses", "Nuevas respuestas a mis preguntas", "Recibe alertas cuando alguien responde"],
                  ["mentions", "Menciones de otros sintonizadores", "Cuando te mencionan en publicaciones"],
                  ["followers", "Nuevos seguidores", "Cuando alguien te sigue"],
                  ["achievements", "Logros y PTS ganados", "Cuando desbloqueas logros o ganas puntos"],
                ].map(([key, label, desc]) => (
                  <SettingRow key={key} label={label} desc={desc}>
                    <Toggle enabled={settings.notifications[key]} onChange={() => updateSettings("notifications", key, !settings.notifications[key])} />
                  </SettingRow>
                ))}

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider pt-2">Plataforma</p>
                {[
                  ["announcements", "Anuncios de la plataforma", "Noticias y actualizaciones importantes"],
                  ["recommendations", "Recomendaciones de contenido", "Contenido sugerido basado en tus intereses"],
                  ["subscriptions", "Suscripciones y membresías", "Renovaciones, cambios de plan y pagos"],
                ].map(([key, label, desc]) => (
                  <SettingRow key={key} label={label} desc={desc}>
                    <Toggle enabled={settings.notifications[key]} onChange={() => updateSettings("notifications", key, !settings.notifications[key])} />
                  </SettingRow>
                ))}

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider pt-2">Canales</p>
                <SettingRow label="Notificaciones Push" desc="Notificaciones en tu dispositivo">
                  <Toggle enabled={settings.notifications.pushEnabled} onChange={() => updateSettings("notifications", "pushEnabled", !settings.notifications.pushEnabled)} />
                </SettingRow>
                <SettingRow label="Resumen por Email" desc="Recibe un resumen semanal por correo">
                  <Toggle enabled={settings.notifications.emailDigest} onChange={() => updateSettings("notifications", "emailDigest", !settings.notifications.emailDigest)} />
                </SettingRow>
              </div>
            )}

            {/* ── PRIVACIDAD ── */}
            {activeSection === "privacidad" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Privacidad</h2>

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Visibilidad</p>
                {[
                  ["publicProfile", "Perfil visible para todos", "Otros pueden ver tu perfil público"],
                  ["showPts", "Mostrar PTS públicamente", "Tu balance de puntos es visible"],
                  ["showRankings", "Aparecer en rankings", "Aparecer en tablas de clasificación"],
                  ["showOnline", "Mostrar estado en línea", "Otros pueden ver cuando estás activo"],
                ].map(([key, label, desc]) => (
                  <SettingRow key={key} label={label} desc={desc}>
                    <Toggle enabled={settings.privacy[key]} onChange={() => updateSettings("privacy", key, !settings.privacy[key])} />
                  </SettingRow>
                ))}

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider pt-2">Interacción</p>
                {[
                  ["allowMessages", "Recibir mensajes privados", "Otros miembros pueden enviarte mensajes"],
                  ["shareActivity", "Compartir actividad en redes", "Mostrar actividad reciente en tu perfil"],
                  ["allowSearch", "Aparecer en búsquedas", "Tu perfil aparece en resultados de búsqueda"],
                ].map(([key, label, desc]) => (
                  <SettingRow key={key} label={label} desc={desc}>
                    <Toggle enabled={settings.privacy[key]} onChange={() => updateSettings("privacy", key, !settings.privacy[key])} />
                  </SettingRow>
                ))}

                <button onClick={handleExportData} className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full text-left cursor-pointer hover:bg-amber-500/15 transition-all">
                  <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5"><Download className="w-3 h-3" /> Exportar mis datos</p>
                  <p className="text-[10px] text-slate-400 mt-1">Descarga un archivo JSON con toda tu información</p>
                </button>
              </div>
            )}

            {/* ── IDIOMA Y REGIÓN ── */}
            {activeSection === "idioma" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Idioma y Región</h2>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Idioma de la Interfaz</label>
                  <SelectInput value={settings.language.lang} onChange={v => updateSettings("language", "lang", v)}
                    options={[
                      { value: "es", label: "Español" },
                      { value: "en", label: "English" },
                      { value: "pt", label: "Português" },
                      { value: "fr", label: "Français" },
                    ]} />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Región</label>
                  <SelectInput value={settings.language.region} onChange={v => updateSettings("language", "region", v)}
                    options={[
                      { value: "CU", label: "Cuba" },
                      { value: "US", label: "Estados Unidos" },
                      { value: "MX", label: "México" },
                      { value: "CO", label: "Colombia" },
                      { value: "AR", label: "Argentina" },
                      { value: "ES", label: "España" },
                      { value: "VE", label: "Venezuela" },
                      { value: "CL", label: "Chile" },
                      { value: "PE", label: "Perú" },
                      { value: "EC", label: "Ecuador" },
                    ]} />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Zona Horaria</label>
                  <SelectInput value={settings.language.timezone} onChange={v => updateSettings("language", "timezone", v)}
                    options={[
                      { value: "America/Havana", label: "Cuba (CST)" },
                      { value: "America/New_York", label: "EST (Nueva York)" },
                      { value: "America/Chicago", label: "CST (Chicago)" },
                      { value: "America/Los_Angeles", label: "PST (Los Ángeles)" },
                      { value: "America/Mexico_City", label: "México (CST)" },
                      { value: "America/Bogota", label: "Colombia (COT)" },
                      { value: "America/Argentina/Buenos_Aires", label: "Argentina (ART)" },
                      { value: "Europe/Madrid", label: "España (CET)" },
                    ]} />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Formato de Fecha</label>
                  <SelectInput value={settings.language.dateFormat} onChange={v => updateSettings("language", "dateFormat", v)}
                    options={[
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                    ]} />
                </div>
              </div>
            )}

            {/* ── SEGURIDAD ── */}
            {activeSection === "seguridad" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Seguridad</h2>

                <SettingRow label="Autenticación de Dos Factores (2FA)" desc="Protege tu cuenta con una segunda capa de seguridad">
                  <div className="flex items-center gap-2">
                    {settings.security.twoFactor && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVO</span>}
                    <Toggle enabled={settings.security.twoFactor} onChange={() => updateSettings("security", "twoFactor", !settings.security.twoFactor)} />
                  </div>
                </SettingRow>

                <SettingRow label="Alertas de Inicio de Sesión" desc="Recibe notificación cuando alguien accede a tu cuenta">
                  <Toggle enabled={settings.security.loginAlerts} onChange={() => updateSettings("security", "loginAlerts", !settings.security.loginAlerts)} />
                </SettingRow>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tiempo de Sesión</label>
                  <p className="text-[10px] text-slate-500 mb-1">Cerrar sesión automáticamente después de inactividad</p>
                  <SelectInput value={settings.security.sessionTimeout} onChange={v => updateSettings("security", "sessionTimeout", v)}
                    options={[
                      { value: "15", label: "15 minutos" },
                      { value: "30", label: "30 minutos" },
                      { value: "60", label: "1 hora" },
                      { value: "120", label: "2 horas" },
                      { value: "never", label: "Nunca" },
                    ]} />
                </div>

                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-slate-300">Cambiar Contraseña</p>
                  <input type="password" placeholder="Contraseña actual" value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                  <input type="password" placeholder="Nueva contraseña (mínimo 8 caracteres)" value={passwords.newPass}
                    onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                  <input type="password" placeholder="Confirmar nueva contraseña" value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                  <div className="flex items-center gap-3">
                    <button onClick={handleChangePassword} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-all">
                      Actualizar Contraseña
                    </button>
                    {passwordMsg === "ok" && <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Contraseña actualizada</span>}
                    {passwordMsg === "error" && <span className="text-[10px] text-red-400 font-bold">Contraseña actual incorrecta o datos inválidos</span>}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                  <p className="text-xs font-bold text-slate-300 mb-2">Sesiones Activas</p>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                    <Smartphone className="w-4 h-4 text-[#00D9FF]" />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-white">Sesión Actual</p>
                      <p className="text-[9px] text-slate-500">Navegador • Ahora</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVA</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCESIBILIDAD ── */}
            {activeSection === "accesibilidad" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Accesibilidad</h2>

                <SettingRow label="Reducir Movimiento" desc="Desactiva animaciones y transiciones">
                  <Toggle enabled={settings.accessibility.reduceMotion} onChange={() => updateSettings("accessibility", "reduceMotion", !settings.accessibility.reduceMotion)} />
                </SettingRow>

                <SettingRow label="Alto Contraste" desc="Aumenta el contraste para mejor legibilidad">
                  <Toggle enabled={settings.accessibility.highContrast} onChange={() => updateSettings("accessibility", "highContrast", !settings.accessibility.highContrast)} />
                </SettingRow>

                <SettingRow label="Modo Lector de Pantalla" desc="Optimiza la interfaz para lectores de pantalla">
                  <Toggle enabled={settings.accessibility.screenReader} onChange={() => updateSettings("accessibility", "screenReader", !settings.accessibility.screenReader)} />
                </SettingRow>

                <SettingRow label="Navegación por Teclado" desc="Navega con Tab, Enter y flechas del teclado">
                  <Toggle enabled={settings.accessibility.keyboardNav} onChange={() => updateSettings("accessibility", "keyboardNav", !settings.accessibility.keyboardNav)} />
                </SettingRow>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tamaño de Texto Preferido</label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { value: "small", label: "Pequeño" },
                      { value: "normal", label: "Normal" },
                      { value: "large", label: "Grande" },
                      { value: "xlarge", label: "Extra Grande" },
                    ].map(s => (
                      <button key={s.value} onClick={() => updateSettings("accessibility", "fontSizePref", s.value)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          settings.accessibility.fontSizePref === s.value
                            ? "bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30"
                            : "bg-slate-900/40 text-slate-400 border border-slate-800 hover:text-white"
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#00D9FF]/5 border border-[#00D9FF]/10">
                  <p className="text-xs font-bold text-[#00D9FF]">Acerca de la Accesibilidad</p>
                  <p className="text-[10px] text-slate-400 mt-1">ZAFIRO se compromete a hacer la plataforma accesible para todos. Estas configuraciones mejoran tu experiencia según tus necesidades.</p>
                </div>
              </div>
            )}

            {/* ── AUDIO Y VOZ ── */}
            {activeSection === "audio" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Audio y Voz</h2>

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">ELIANA - Asistente de Voz</p>

                <SettingRow label="Voz de ELIANA" desc="Activar respuestas de voz del asistente">
                  <Toggle enabled={settings.audio.elianaVoice} onChange={() => updateSettings("audio", "elianaVoice", !settings.audio.elianaVoice)} />
                </SettingRow>

                <SettingRow label="Velocidad de Voz" desc={`Velocidad: ${settings.audio.voiceSpeed}x`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">0.5x</span>
                    <input type="range" min="0.5" max="2" step="0.1" value={settings.audio.voiceSpeed}
                      onChange={e => updateSettings("audio", "voiceSpeed", parseFloat(e.target.value))}
                      className="w-28 accent-[#00D9FF]" />
                    <span className="text-[10px] text-slate-500">2x</span>
                  </div>
                </SettingRow>

                <SettingRow label="Reproducción Automática" desc="Reproducir respuestas de voz automáticamente">
                  <Toggle enabled={settings.audio.autoPlay} onChange={() => updateSettings("audio", "autoPlay", !settings.audio.autoPlay)} />
                </SettingRow>

                <SettingRow label="Permisos de Micrófono" desc="Permitir entrada de voz al chat">
                  <Toggle enabled={settings.audio.micPermission} onChange={() => updateSettings("audio", "micPermission", !settings.audio.micPermission)} />
                </SettingRow>

                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider pt-2">Efectos de Sonido</p>

                <SettingRow label="Sonidos de Interfaz" desc="Sonidos al enviar mensajes, recibir notificaciones">
                  <Toggle enabled={settings.audio.soundEffects} onChange={() => updateSettings("audio", "soundEffects", !settings.audio.soundEffects)} />
                </SettingRow>

                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                  <p className="text-xs font-bold text-slate-300 mb-3">Probar Voz de ELIANA</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => {
                      if (typeof window !== "undefined" && "speechSynthesis" in window) {
                        const u = new SpeechSynthesisUtterance("Bendiciones. Soy ELIANA, tu guía inteligente de MSM y ZAFIRO. ¿En qué puedo ayudarte hoy?")
                        u.lang = "es-ES"
                        u.rate = settings.audio.voiceSpeed
                        speechSynthesis.speak(u)
                      }
                    }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF]/20 to-blue-600/20 border border-[#00D9FF]/30 text-[#00D9FF] text-xs font-bold cursor-pointer hover:bg-[#00D9FF]/30 transition-all">
                      <Play className="w-3.5 h-3.5" /> Reproducir Prueba
                    </button>
                    <button onClick={() => { if (typeof window !== "undefined") speechSynthesis?.cancel() }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-bold cursor-pointer hover:text-white transition-all">
                      <Square className="w-3 h-3" /> Detener
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0f1e] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Eliminar Cuenta</h3>
                <p className="text-[10px] text-slate-400">Esta acción es irreversible</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-4">Se eliminarán permanentemente todos tus datos, PTS, logros, historial y perfil. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-700 transition-all">
                Cancelar
              </button>
              <button onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold cursor-pointer hover:bg-red-600 transition-all">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
