'use client'

import Link from "next/link"
import { ArrowLeft, Volume2, Bell, Shield, User, Globe, Palette } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function ConfiguracionPage() {
  usePageTitle("Configuración — ELIANA")

  const sections = [
    { icon: Volume2, label: "Audio y Voz", desc: "Configurar voz, velocidad y volumen", href: "/eliana/configuracion/voz" },
    { icon: Shield, label: "Privacidad", desc: "Controlar qué recuerda ELIANA", href: "/eliana/configuracion/privacidad" },
    { icon: Bell, label: "Notificaciones", desc: "Preferencias de alertas", href: "/eliana/configuracion/notificaciones" },
    { icon: Globe, label: "Idioma", desc: "Idioma de respuestas", href: "#" },
    { icon: Palette, label: "Tema", desc: "Apariencia de ELIANA", href: "#" },
    { icon: User, label: "Perfil compartido", desc: "Sincronizar con ZAFIRO", href: "/settings" },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
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
        </div>
      </div>
    </div>
  )
}
