'use client'

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

const PRIVACY_KEY = "eliana_privacy_settings"

interface PrivacySetting {
  key: string
  label: string
  desc: string
  defaultValue: boolean
}

const SETTINGS: PrivacySetting[] = [
  { key: "remember_preferences", label: "Recordar preferencias", desc: "ELIANA recuerda tus configuraciones", defaultValue: true },
  { key: "remember_product_context", label: "Recordar contexto de productos", desc: "Recuerda productos que consultaste", defaultValue: true },
  { key: "remember_conversations", label: "Recordar conversaciones", desc: "Conserva historial de conversaciones", defaultValue: true },
  { key: "use_business_context", label: "Usar contexto empresarial", desc: "Accede a datos autorizados del ecosistema", defaultValue: false },
  { key: "share_with_support", label: "Compartir datos con soporte", desc: "Permite escalación con contexto", defaultValue: true },
]

function readSettings(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PRIVACY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export default function PrivacidadPage() {
  usePageTitle("Privacidad — ELIANA")

  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const stored = readSettings()
    const initial: Record<string, boolean> = {}
    for (const s of SETTINGS) initial[s.key] = stored[s.key] ?? s.defaultValue
    return initial
  })
  const [saved, setSaved] = useState(false)

  const toggle = (key: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      setSaved(true)
      return next
    })
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/configuracion" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Configuración
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <h1 className="text-xl font-black mb-1">Privacidad</h1>
        <p className="text-xs text-slate-400 mb-6">Controla qué datos conserva ELIANA</p>

        <div className="space-y-4">
          {SETTINGS.map((item) => (
            <div key={item.key} className="p-4 rounded-2xl glass border border-slate-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  aria-label={`${item.label}: ${values[item.key] ? "activado" : "desactivado"}`}
                  aria-pressed={values[item.key]}
                  className={`relative w-10 h-6 rounded-full border transition-colors cursor-pointer ${
                    values[item.key] ? "bg-[#00D9FF]/20 border-[#00D9FF]/30" : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                    values[item.key] ? "left-5 bg-[#00D9FF]" : "left-1 bg-slate-500"
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {saved && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Preferencias guardadas en este dispositivo
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
          <Shield className="w-3.5 h-3.5" />
          Estas preferencias se guardan localmente y se respetan en todas las conversaciones.
        </div>
      </div>
    </div>
  )
}
