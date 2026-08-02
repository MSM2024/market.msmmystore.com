'use client'

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Volume2, Bell, Shield, User, Globe, Palette, Radio } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

const LANGUAGE_KEY = "eliana_language"
const THEME_KEY = "eliana_theme"

function readSetting(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}

export default function ConfiguracionPage() {
  usePageTitle("Configuración — ELIANA")
  const [language, setLanguage] = useState(() => readSetting(LANGUAGE_KEY, "es"))
  const [theme, setTheme] = useState(() => readSetting(THEME_KEY, "dark"))

  const saveSetting = (key: string, value: string) => {
    try { localStorage.setItem(key, value) } catch { /* ignore */ }
  }

  const sections = [
    { icon: Volume2, label: "Audio y Voz", desc: "Configurar voz, velocidad y volumen", href: "/eliana/configuracion/voz" },
    { icon: Radio, label: "Canales y Acciones", desc: "Gestionar canales de conversación", href: "/eliana/configuracion/canales" },
    { icon: Shield, label: "Privacidad", desc: "Controlar qué recuerda ELIANA", href: "/eliana/configuracion/privacidad" },
    { icon: Bell, label: "Notificaciones", desc: "Preferencias de alertas", href: "/settings" },
    { icon: User, label: "Perfil compartido", desc: "Sincronizar con ZAFIRO", href: "/settings" },
  ]

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/chat" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Chat
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <h1 className="text-xl font-black mb-1">Configuración</h1>
        <p className="text-xs text-slate-400 mb-6">Preferencias de ELIANA — sincronizadas con tu perfil central</p>

        <div className="space-y-2">
          {sections.map((s, i) => (
            <Link key={i} href={s.href}
              className="flex items-center gap-4 p-4 rounded-2xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-[#00D9FF]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{s.label}</p>
                <p className="text-[10px] text-slate-500">{s.desc}</p>
              </div>
            </Link>
          ))}

          <div className="flex items-center gap-4 p-4 rounded-2xl glass border border-slate-800/30">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Idioma</p>
              <p className="text-[10px] text-slate-500">Idioma de las respuestas</p>
            </div>
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); saveSetting(LANGUAGE_KEY, e.target.value) }}
              aria-label="Idioma de ELIANA"
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D9FF] outline-none cursor-pointer"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl glass border border-slate-800/30">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Tema</p>
              <p className="text-[10px] text-slate-500">Apariencia de ELIANA</p>
            </div>
            <div className="flex gap-1.5">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); saveSetting(THEME_KEY, t) }}
                  aria-pressed={theme === t}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                    theme === t ? "bg-[#00D9FF]/15 border-[#00D9FF]/30 text-[#00D9FF]" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {t === "dark" ? "Oscuro" : "Claro"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
