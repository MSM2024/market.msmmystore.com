'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Globe, Brain, Users, Shield, Sparkles, BookOpen, Infinity, Cpu } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function AboutPage() {
  usePageTitle("Quiénes Somos — ZAFIRO")

  const principles = [
    { icon: Brain, title: "Conocimiento Vivo", desc: "El conocimiento no es estático. Crece, se relaciona y evoluciona con cada pregunta, respuesta y conexión." },
    { icon: Globe, title: "Red Social del Conocimiento", desc: "Somos una plataforma social donde el conocimiento es el centro. Cada usuario es un nodo activo en un ecosistema inteligente." },
    { icon: Gem, title: "Impulsados por ELIANA", desc: "Nuestra inteligencia artificial analiza, organiza y relaciona el conocimiento para ofrecer respuestas precisas y contextuales." },
      { icon: Users, title: "Comunidad Primero", desc: "Creemos en el poder de la colaboración humana. Las preguntas, respuestas y debates son el motor del aprendizaje colectivo." },
      { icon: Shield, title: "Soberanía del Conocimiento", desc: "Cada creador mantiene el control de su contenido. Nosotros organizamos, no almacenamos. Internet es el almacenamiento, ZAFIRO es la inteligencia." },
      { icon: Cpu, title: "Automatización Inteligente", desc: "ELIANA automatiza registro, verificación, membresías, pagos, soporte, moderación y detección de fraude. Solo los casos más sensibles requieren revisión humana." },
      { icon: Sparkles, title: "Ecosistema Abierto", desc: "Conectamos con YouTube, Instagram, TikTok, Facebook, X, Telegram, GitHub y cualquier plataforma pública. Tu perfil es el centro de tu universo digital." },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Quiénes Somos</h1>
            <p className="text-sm text-slate-400">La primera Red Social del Conocimiento impulsada por Inteligencia Artificial</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-[#00D9FF] font-bold">ZAFIRO</span> nace de una idea fundamental: <span className="text-white font-bold">todo comienza con un pensamiento</span>.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            En un mundo donde la información crece exponencialmente, creamos una plataforma que no solo almacena datos, sino que los comprende, los relaciona y los transforma en conocimiento vivo. ZAFIRO es el punto de encuentro entre la inteligencia humana y la inteligencia artificial, donde las preguntas encuentran respuestas precisas y las conexiones generan nuevo aprendizaje.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Somos un equipo multidisciplinario de desarrolladores, creadores de contenido, expertos en inteligencia artificial y visionarios del conocimiento digital. Nuestra sede conceptual está en Madrid, España, pero nuestra comunidad abarca todo el mundo hispanohablante.
          </p>
        </div>

        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">Nuestros Principios</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {principles.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} className="p-5 rounded-2xl glass hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <h3 className="text-xs font-bold text-white">{p.title}</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl glass p-6 mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Gem className="w-4 h-4 text-[#00D9FF]" /> Nuestra Filosofía</h2>
          <div className="space-y-3">
            {[
              { q: "Internet es el almacenamiento", a: "No almacenamos videos, fotos ni archivos pesados. Solo organizamos metadatos, resúmenes generados por ELIANA y relaciones entre contenidos. El contenido original vive en su plataforma de origen." },
              { q: "ZAFIRO es la inteligencia", a: "Procesamos, analizamos y relacionamos el conocimiento usando inteligencia artificial. Cada plataforma conectada enriquece el Mapa Vivo del Conocimiento." },
              { q: "Todo comienza con un pensamiento", a: "Una pregunta, una duda, una idea. Ese es el punto de partida. ZAFIRO te ayuda a encontrar respuestas, conectar con expertos y descubrir conocimiento que no sabías que existía." },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <p className="text-xs font-bold text-[#00D9FF] mb-1">{f.q}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-6 border-t border-slate-800">
          <p className="text-xs text-slate-500">Parte del <Link href="/ecosystem" className="text-[#00D9FF] hover:underline">Ecosistema MSM</Link></p>
        </div>
      </div>
    </div>
  )
}
