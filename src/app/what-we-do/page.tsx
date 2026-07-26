'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Globe, Brain, MessageSquare, Users, BookOpen, Link2, Sparkles, BarChart3, Shield, Award } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function WhatWeDoPage() {
  usePageTitle("Qué Hacemos — ZAFIRO")

  const pillars = [
    {
      icon: Brain, title: "Organizamos el Conocimiento", desc: "Analizamos y relacionamos millones de datos provenientes de preguntas, respuestas, plataformas conectadas y fuentes públicas. Cada pieza de información se integra en el Mapa Vivo del Conocimiento.",
    },
    {
      icon: MessageSquare, title: "Conectamos Preguntas con Respuestas", desc: "Los usuarios preguntan, la comunidad responde y ELIANA refuerza con análisis inteligente. Cada respuesta se convierte en un nodo de conocimiento accesible para todos.",
    },
    {
      icon: Globe, title: "Centralizamos tu Universo Digital", desc: "Conectamos tus redes sociales, canales, aplicaciones y proyectos en un solo perfil inteligente. YouTube, Instagram, TikTok, Facebook, X, Telegram, GitHub, blogs, tiendas y más.",
    },
    {
      icon: Users, title: "Construimos Comunidades de Expertos", desc: "Los Círculos son espacios donde expertos y aprendices colaboran. Cada círculo es un ecosistema de conocimiento especializado con reputación, logros y reconocimiento.",
    },
    {
      icon: BarChart3, title: "Recompensamos el Conocimiento", desc: "MSM Rewards otorga PTS por contribuciones valiosas. Las preguntas, respuestas, conexiones y participaciones generan puntos que se traducen en membresías y beneficios exclusivos.",
    },
    {
      icon: Shield, title: "Protegemos la Privacidad y los Derechos", desc: "No almacenamos contenido original. Las vistas previas se generan mediante APIs oficiales. Cada creador autoriza su propio contenido al conectarlo. Las plataformas origen (YouTube, Instagram, etc.) gestionan sus propias políticas de derechos de autor.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Qué Hacemos</h1>
            <p className="text-sm text-slate-400">Transformamos la información dispersa en conocimiento organizado e inteligente</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            En ZAFIRO construimos la primera <span className="text-white font-bold">Red Social del Conocimiento</span> impulsada por inteligencia artificial. 
            No somos una red social tradicional ni un motor de búsqueda convencional. Somos un <span className="text-[#00D9FF]">constructor de ecosistemas digitales inteligentes</span>.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tomamos la información dispersa en Internet —redes sociales, canales, blogs, aplicaciones, preguntas y respuestas— y la organizamos en un mapa vivo, 
            relacionado y accesible. Cada usuario construye su propio universo digital y contribuye al conocimiento colectivo de la humanidad.
          </p>
        </div>

        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">Nuestros Pilares</h2>
        <div className="grid gap-4 mb-8">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl glass hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#00D9FF]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/5 p-6 mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#00D9FF]" /> Lo Que No Hacemos</h2>
          <ul className="space-y-2 text-[11px] text-slate-400">
            <li className="flex items-start gap-2">✗ No almacenamos videos, fotos ni archivos de terceros.</li>
            <li className="flex items-start gap-2">✗ No compartimos datos personales sin consentimiento.</li>
            <li className="flex items-start gap-2">✗ No alojamos contenido original. Solo mostramos metadatos y vistas previas autorizadas por el creador.</li>
            <li className="flex items-start gap-2">✗ No vendemos información de nuestros usuarios.</li>
            <li className="flex items-start gap-2">✗ No permitimos spam, desinformación ni contenido dañino.</li>
          </ul>
        </div>

        <div className="text-center py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">Descubre <Link href="/how-it-works" className="text-[#00D9FF] hover:underline">cómo funciona ZAFIRO</Link></p>
        </div>
      </div>
    </div>
  )
}
