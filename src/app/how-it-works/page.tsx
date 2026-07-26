'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Search, MessageSquare, Users, Award, Globe, Shield, BookOpen, Sparkles, Link2, Star, Zap, Target } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import ElianaDiamond from "@/components/ElianaDiamond"

export default function HowItWorksPage() {
  usePageTitle("Cómo Funciona ZAFIRO — ZAFIRO")

  const steps = [
    {
      icon: Search, title: "1. Haz una Pregunta", desc: "Todo comienza con un pensamiento, una duda, una curiosidad. Escribe tu pregunta en ZAFIRO y el sistema la analiza, la categoriza y la publica en el Mapa Vivo del Conocimiento.",
    },
    {
      icon: Users, title: "2. Recibe Respuestas", desc: "La comunidad y ELIANA trabajan juntos. Los usuarios expertos responden desde su experiencia, mientras ELIANA complementa con análisis, resúmenes y referencias relacionadas.",
    },
    {
      icon: "eliana", title: "3. ELIANA Analiza", desc: "Cada pregunta y respuesta es procesada por ELIANA, nuestra inteligencia artificial. Extrae conceptos clave, identifica relaciones, genera resúmenes y conecta con conocimiento previo en el Mapa Vivo.",
    },
    {
      icon: Globe, title: "4. Conecta tu Universo Digital", desc: "Vincula tus redes sociales, canales de YouTube, Instagram, TikTok, Facebook, X, Telegram, GitHub, blogs, tiendas y proyectos. Todo aparece en tu perfil unificado.",
    },
    {
      icon: Shield, title: "5. Construye tu Reputación", desc: "Cada contribución suma PTS. Responder preguntas, crear contenido de calidad y mantener comunidades activas aumenta tu reputación, nivel y visibilidad en la plataforma.",
    },
    {
      icon: Award, title: "6. Gana Recompensas", desc: "Los PTS acumulados se canjean por membresías Pro, Cuba Plus, descuentos en servicios del ecosistema MSM y beneficios exclusivos para creadores.",
    },
    {
      icon: Star, title: "7. Conviértete en Sponsor", desc: "Las marcas y creadores pueden patrocinar contenido, comunidades y proyectos. Los Sponsors ganan visibilidad y conexión directa con audiencias especializadas.",
    },
    {
      icon: Target, title: "8. Descubre y Crece", desc: "El Mapa Vivo del Conocimiento revela conexiones que no sabías que existían. Descubre expertos, proyectos relacionados y nuevo conocimiento en cada visita.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Cómo Funciona ZAFIRO</h1>
            <p className="text-sm text-slate-400">Tu viaje desde una pregunta hasta un ecosistema digital completo</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[#00D9FF]" />
            <h2 className="text-sm font-bold text-white">Filosofía Central</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
            <p>ZAFIRO opera sobre tres principios fundamentales:</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs font-bold text-[#00D9FF] mb-1">Todo comienza con un pensamiento</p>
                <p className="text-[9px] text-slate-400">Cada pregunta, cada duda, cada idea es el punto de partida. No hay preguntas tontas, solo conocimiento por descubrir.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs font-bold text-[#00D9FF] mb-1">Internet es el almacenamiento</p>
                <p className="text-[9px] text-slate-400">No almacenamos contenido original. Los videos, fotos y archivos viven en sus plataformas originales. Nosotros organizamos el conocimiento.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs font-bold text-[#00D9FF] mb-1">ZAFIRO es la inteligencia</p>
                <p className="text-[9px] text-slate-400">Procesamos, analizamos, relacionamos y hacemos descubrible el conocimiento usando inteligencia artificial y comunidad.</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">El Ciclo del Conocimiento</h2>
        <div className="space-y-3 mb-8">
          {steps.map((s, i) => {
            return (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl glass hover:border-slate-700 transition-all">
                <div className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                  {s.icon === "eliana" ? <ElianaDiamond size={18} /> : <s.icon className="w-4.5 h-4.5 text-[#00D9FF]" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl glass p-6 mb-8">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Gem className="w-4 h-4 text-[#00D9FF]" /> Componentes Clave</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/eliana" className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-[#00D9FF]/30 transition-all group">
              <ElianaDiamond size={16} className="mb-2" />
              <h3 className="text-xs font-bold text-white mb-1 group-hover:text-[#00D9FF] transition-colors">ELIANA</h3>
              <p className="text-[9px] text-slate-400">Inteligencia artificial que analiza, resume y relaciona todo el conocimiento de la plataforma.</p>
            </Link>
            <Link href="/ecosystem" className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-[#00D9FF]/30 transition-all group">
              <Globe className="w-4 h-4 text-indigo-400 mb-2" />
              <h3 className="text-xs font-bold text-white mb-1 group-hover:text-[#00D9FF] transition-colors">Universo Digital</h3>
              <p className="text-[9px] text-slate-400">Conecta todas tus plataformas en un perfil inteligente y unificado.</p>
            </Link>
            <Link href="/memberships" className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-[#00D9FF]/30 transition-all group">
              <Award className="w-4 h-4 text-amber-400 mb-2" />
              <h3 className="text-xs font-bold text-white mb-1 group-hover:text-[#00D9FF] transition-colors">MSM Rewards</h3>
              <p className="text-[9px] text-slate-400">Sistema de PTS, niveles y beneficios por contribuir al conocimiento colectivo.</p>
            </Link>
            <Link href="/sponsors-page" className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-[#00D9FF]/30 transition-all group">
              <Star className="w-4 h-4 text-pink-400 mb-2" />
              <h3 className="text-xs font-bold text-white mb-1 group-hover:text-[#00D9FF] transition-colors">Sponsors</h3>
              <p className="text-[9px] text-slate-400">Conecta tu marca con comunidades de conocimiento especializadas.</p>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#00D9FF]/5 bg-[#00D9FF]/5 p-6">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#00D9FF]" /> Listo para empezar?</h2>
          <p className="text-xs text-slate-400 mb-4">Tu viaje comienza con una sola pregunta. El resto lo construimos juntos.</p>
          <div className="flex gap-3">
            <Link href="/auth/register" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all">
              Crear cuenta gratis
            </Link>
            <Link href="/help" className="px-4 py-2 rounded-xl bg-slate-800/40 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-all border border-slate-700/50">
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
