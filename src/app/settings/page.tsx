'use client'

import Link from "next/link"
import { ArrowLeft, Bell, Eye, Globe, Shield, Palette, Moon, Volume2, User, ChevronRight, LogOut, Trash2, Monitor, Sun, Type, Check, AlertTriangle, Lock, Camera, EyeOff, Languages, Clock, Mic, Accessibility, Loader2, RefreshCw, Home } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { usePageTitle } from "@/lib/usePageTitle"
import { refreshSession, logout as authLogout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

const SETTINGS_TIMEOUT_MS = 10000

type PageStatus = "idle" | "loading" | "success" | "error" | "unauthorized"

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  })

  if (response.status === 401 || response.status === 403) {
    const err = new Error("UNAUTHORIZED") as Error & { code: string }
    err.code = "UNAUTHORIZED"
    throw err
  }

  if (!response.ok) {
    throw new Error(`REQUEST_FAILED_${response.status}`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    throw new Error("INVALID_JSON_RESPONSE")
  }

  return response.json()
}

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

const DEFAULT_SETTINGS = {
  theme: "dark",
  accent: "#00D9FF",
  language: "es",
  timezone: "America/Mexico_City",
  notifications: { email: true, push: true, sms: false, responses: true, mentions: true, announcements: true },
  privacy: { showProfile: true, showActivity: false, showOnline: true, allowSearch: true },
  accessibility: { reducedMotion: false, largeText: false, highContrast: false, keyboardNav: true },
  audio: { voiceEnabled: false, autoPlay: true, volume: 80, soundEffects: true },
}

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

type Settings = typeof DEFAULT_SETTINGS

export default function SettingsPage() {
  usePageTitle("Configuración")
  const router = useRouter()
  const requestRef = useRef<AbortController | null>(null)

  const [status, setStatus] = useState<PageStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [activeSection, setActiveSection] = useState("perfil")
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({ name: "", username: "", bio: "", title: "", location: "", website: "" })
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" })
  const [passwordMsg, setPasswordMsg] = useState<"ok" | "error" | null>(null)
  const [sessionName, setSessionName] = useState("")
  const [sessionRole, setSessionRole] = useState("")

  const loadSettings = useCallback(async () => {
    requestRef.current?.abort()

    const controller = new AbortController()
    requestRef.current = controller

    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException("SETTINGS_TIMEOUT", "AbortError"))
    }, SETTINGS_TIMEOUT_MS)

    setStatus("loading")
    setErrorMessage("")

    try {
      const session = await refreshSession()
      if (!session) {
        setStatus("unauthorized")
        router.replace("/auth/login")
        return
      }

      const results = await Promise.allSettled([
        fetchJson("/api/user-settings", controller.signal),
        fetchJson("/api/user-profile", controller.signal),
      ])

      const settingsResult = results[0]

      if (settingsResult.status === "rejected") {
        const err = settingsResult.reason as Error & { code?: string }
        if (err?.code === "UNAUTHORIZED") {
          setStatus("unauthorized")
          router.replace("/auth/login")
          return
        }
        throw err
      }

      const settingsData = settingsResult.value as Record<string, unknown>
      const profileResult = results[1]

      if (profileResult.status === "fulfilled") {
        const pp = (profileResult.value as { profile?: Record<string, string> | null }).profile
        if (pp) {
          setProfile({
            name: pp.name || "",
            username: pp.username || "",
            bio: pp.bio || "",
            title: pp.title || "",
            location: pp.location || "",
            website: pp.website || "",
          })
        }
      }

      setSettings({ ...DEFAULT_SETTINGS, ...settingsData })
      setSessionName(session.name || "")
      setSessionRole(session.role || "")
      setStatus("success")
    } catch (err: unknown) {
      const e = err as Error & { code?: string }
      if (e?.code === "UNAUTHORIZED") {
        setStatus("unauthorized")
        router.replace("/auth/login")
        return
      }
      if (e?.name === "AbortError") {
        setErrorMessage("La carga de la configuración superó el tiempo máximo")
      } else {
        setErrorMessage("No pudimos cargar la configuración")
      }
      setStatus("error")
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [router])

  useEffect(() => {
    Promise.resolve().then(() => loadSettings())
    return () => {
      requestRef.current?.abort()
    }
  }, [loadSettings])

  const handleSaveProfile = useCallback(async () => {
    setSaving(true)
    try {
      await fetch("/api/user-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }, [profile])

  const handleSaveSettings = useCallback(async (updates: Partial<Settings>) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    await fetch("/api/user-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {})
  }, [settings])

  const handleLogout = () => { authLogout(); router.push("/") }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user-profile", { method: "DELETE" })
      if (!res.ok) throw new Error()
    } catch {}
    localStorage.clear()
    authLogout()
    router.push("/")
  }

  const handleChangePassword = async () => {
    if (!passwords.newPass || passwords.newPass !== passwords.confirm || passwords.newPass.length < 8) {
      setPasswordMsg("error"); return
    }
    const supabase = getSupabaseClient()
    if (supabase && isSupabaseAvailable()) {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
      if (error) { setPasswordMsg("error"); return }
    }
    setPasswords({ current: "", newPass: "", confirm: "" })
    setPasswordMsg("ok")
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  if (status === "idle" || status === "loading") return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
    </div>
  )

  if (status === "unauthorized") return null

  if (status === "error") return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
      <div className="text-center max-w-xs">
        <Loader2 className="w-10 h-10 text-slate-600 mx-auto mb-4" />
        <p className="text-sm text-slate-300 mb-1">No pudimos cargar la configuración</p>
        <p className="text-[10px] text-slate-500 mb-5">Verifica tu conexión y vuelve a intentarlo</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={loadSettings}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
          <button onClick={() => router.replace("/")}
            className="px-4 py-2 rounded-xl bg-slate-800/60 text-slate-300 text-xs font-bold hover:bg-slate-700/60 transition-all cursor-pointer border border-slate-700/50 flex items-center justify-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )

  const displayName = profile.name || "Sin nombre"
  const displayUsername = profile.username || "usuario"
  const userInitial = displayName.charAt(0).toUpperCase()

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
            <Link href={`/perfil/${displayUsername}`}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all">
              <Eye className="w-4 h-4" /> Perfil Público
            </Link>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
              <LogOut className="w-4 h-4" /> Cerrar Sesión {sessionName && <span className="opacity-60">({sessionName})</span>}
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
              <Trash2 className="w-4 h-4" /> Eliminar Cuenta
            </button>
          </nav>

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
                    {sessionRole && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">{sessionRole.toUpperCase()}</span>}
                  </div>
                </div>
                {[
                  ["name", "Nombre", "text"],
                  ["username", "Nombre de Usuario", "text"],
                  ["bio", "Biografía", "textarea"],
                  ["title", "Título Profesional", "text"],
                  ["location", "Ubicación", "text"],
                  ["website", "Sitio Web", "text"],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                    {type === "textarea" ? (
                      <textarea placeholder={label} rows={3}
                        value={(profile as Record<string, string>)[key] || ""}
                        onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                        className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none resize-none" />
                    ) : (
                      <input type="text" placeholder={label}
                        value={(profile as Record<string, string>)[key] || ""}
                        onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                        className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
                    {saving ? "Guardando..." : "Guardar Cambios"}
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
                        onClick={() => handleSaveSettings({ theme: t.value })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          settings.theme === t.value
                            ? "bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30"
                            : "bg-slate-900/40 text-slate-400 border border-slate-800 hover:text-white"
                        }`}>
                        <t.icon className="w-3 h-3" /> {t.label}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Color de Acento" desc="Color principal de la interfaz">
                  <input type="color" value={settings.accent}
                    onChange={e => handleSaveSettings({ accent: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
                </SettingRow>
              </div>
            )}

            {/* ── NOTIFICACIONES ── */}
            {activeSection === "notificaciones" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Notificaciones</h2>
                {[
                  ["email", "Correo Electrónico"],
                  ["push", "Notificaciones Push"],
                  ["sms", "SMS"],
                  ["responses", "Respuestas a tus publicaciones"],
                  ["mentions", "Menciones"],
                  ["announcements", "Anuncios"],
                ].map(([key, label]) => (
                  <SettingRow key={key} label={label}>
                    <Toggle
                      enabled={!!(settings.notifications as Record<string, boolean>)[key]}
                      onChange={() => {
                        const n = { ...settings.notifications, [key]: !(settings.notifications as Record<string, boolean>)[key] }
                        handleSaveSettings({ notifications: n })
                      }} />
                  </SettingRow>
                ))}
              </div>
            )}

            {/* ── PRIVACIDAD ── */}
            {activeSection === "privacidad" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Privacidad</h2>
                {[
                  ["showProfile", "Perfil visible para todos"],
                  ["showActivity", "Mostrar actividad reciente"],
                  ["showOnline", "Mostrar estado en línea"],
                  ["allowSearch", "Permite búsqueda por email"],
                ].map(([key, label]) => (
                  <SettingRow key={key} label={label}>
                    <Toggle
                      enabled={!!(settings.privacy as Record<string, boolean>)[key]}
                      onChange={() => {
                        const p = { ...settings.privacy, [key]: !(settings.privacy as Record<string, boolean>)[key] }
                        handleSaveSettings({ privacy: p })
                      }} />
                  </SettingRow>
                ))}
              </div>
            )}

            {/* ── IDIOMA ── */}
            {activeSection === "idioma" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Idioma y Región</h2>
                <SettingRow label="Idioma">
                  <select value={settings.language} onChange={e => handleSaveSettings({ language: e.target.value })}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none cursor-pointer">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </SettingRow>
                <SettingRow label="Zona Horaria">
                  <select value={settings.timezone} onChange={e => handleSaveSettings({ timezone: e.target.value })}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none cursor-pointer">
                    <option value="America/Mexico_City">México (GMT-6)</option>
                    <option value="America/Havana">Cuba (GMT-5)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                    <option value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  </select>
                </SettingRow>
              </div>
            )}

            {/* ── SEGURIDAD ── */}
            {activeSection === "seguridad" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Seguridad</h2>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Contraseña Actual</label>
                  <input type="password" placeholder="••••••••" value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Nueva Contraseña</label>
                  <input type="password" placeholder="Mínimo 8 caracteres" value={passwords.newPass}
                    onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Confirmar Nueva</label>
                  <input type="password" placeholder="Repite la contraseña" value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleChangePassword}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer hover:opacity-90">
                    Cambiar Contraseña
                  </button>
                  {passwordMsg === "ok" && <span className="text-[10px] text-emerald-400 font-bold"><Check className="w-3 h-3 inline" /> Contraseña actualizada</span>}
                  {passwordMsg === "error" && <span className="text-[10px] text-red-400 font-bold"><AlertTriangle className="w-3 h-3 inline" /> Error</span>}
                </div>
              </div>
            )}

            {/* ── ACCESIBILIDAD ── */}
            {activeSection === "accesibilidad" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Accesibilidad</h2>
                {[
                  ["reducedMotion", "Reducir Animaciones"],
                  ["largeText", "Texto Grande"],
                  ["highContrast", "Alto Contraste"],
                  ["keyboardNav", "Navegación por Teclado"],
                ].map(([key, label]) => (
                  <SettingRow key={key} label={label}>
                    <Toggle
                      enabled={!!(settings.accessibility as Record<string, boolean>)[key]}
                      onChange={() => {
                        const a = { ...settings.accessibility, [key]: !(settings.accessibility as Record<string, boolean>)[key] }
                        handleSaveSettings({ accessibility: a })
                      }} />
                  </SettingRow>
                ))}
              </div>
            )}

            {/* ── AUDIO ── */}
            {activeSection === "audio" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">Audio y Voz</h2>
                <SettingRow label="Voz de ELIANA" desc="Activar respuestas por voz">
                  <Toggle
                    enabled={settings.audio.voiceEnabled}
                    onChange={() => {
                      const a = { ...settings.audio, voiceEnabled: !settings.audio.voiceEnabled }
                      handleSaveSettings({ audio: a })
                    }} />
                </SettingRow>
                <SettingRow label="Auto-reproducción" desc="Reproducir automáticamente">
                  <Toggle
                    enabled={settings.audio.autoPlay}
                    onChange={() => {
                      const a = { ...settings.audio, autoPlay: !settings.audio.autoPlay }
                      handleSaveSettings({ audio: a })
                    }} />
                </SettingRow>
                <SettingRow label="Efectos de Sonido">
                  <Toggle
                    enabled={settings.audio.soundEffects}
                    onChange={() => {
                      const a = { ...settings.audio, soundEffects: !settings.audio.soundEffects }
                      handleSaveSettings({ audio: a })
                    }} />
                </SettingRow>
                <SettingRow label="Volumen" desc={`${settings.audio.volume}%`}>
                  <input type="range" min="0" max="100" value={settings.audio.volume}
                    onChange={e => {
                      const a = { ...settings.audio, volume: parseInt(e.target.value) }
                      handleSaveSettings({ audio: a })
                    }}
                    className="w-24 accent-[#00D9FF]" />
                </SettingRow>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#0A0E1A] border border-red-500/20 rounded-2xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-sm font-black text-white text-center mb-2">¿Eliminar cuenta?</h3>
            <p className="text-[10px] text-slate-400 text-center mb-4">Esta acción es irreversible. Todos tus datos serán eliminados.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer">Cancelar</button>
              <button onClick={handleDeleteAccount}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
