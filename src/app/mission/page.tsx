'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Target, Globe, Users, Shield, Sparkles } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function MissionPage() {
  usePageTitle("Nuestra Misión — ZAFIRO")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Nuestra Misión</h1>
            <p className="text-sm text-slate-400">Organizar el conocimiento del mundo y hacerlo accesible e inteligente para todos</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black text-white">Misión</h2>
          </div>
          <p className="text-base text-slate-200 leading-relaxed mb-4 italic border-l-2 border-amber-400 pl-4">
            Empoderar a cada persona para centralizar, organizar y potenciar su presencia digital y su conocimiento 
            a través de una plataforma inteligente que conecta preguntas, respuestas, comunidades, redes sociales y proyectos.
          </p>
        </div>

        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">Cómo Cumplimos Nuestra Misión</h2>
        <div className="grid gap-3 mb-8">
          {[
            { icon: Globe, title: "Centralizar tu universo digital", desc: "Conectamos todas tus plataformas en un perfil inteligente. YouTube, Instagram, TikTok, Facebook, X, Telegram, GitHub, blogs, tiendas y más." },
            { icon: Users, title: "Construir comunidades de conocimiento", desc: "Los Círculos conectan expertos y aprendices. Cada comunidad genera, valida y organiza conocimiento especializado." },
            { icon: Shield, title: "Garantizar información confiable", desc: "La moderación combinada con inteligencia artificial asegura que el contenido sea relevante, respetuoso y verificado." },
            { icon: Sparkles, title: "Potenciar con inteligencia artificial", desc: "ELIANA analiza, resume y relaciona contenido automáticamente, haciendo que el conocimiento sea descubrible y accesible." },
          ].map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl glass hover:border-slate-700 transition-all">
                <div className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[#00D9FF]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">{m.title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl glass p-6">
          <h2 className="text-sm font-bold text-white mb-3">Nuestro Compromiso</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Nos comprometemos a mantener ZAFIRO como una plataforma gratuita y accesible para todos los usuarios 
            que deseen aprender, compartir y conectar. Las membresías premium y Cuba Plus son servicios adicionales 
            que financian el desarrollo continuo de la plataforma, pero el conocimiento fundamental siempre será libre.
          </p>
        </div>
      </div>
    </div>
  )
}
