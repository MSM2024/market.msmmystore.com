'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Eye, Target, Globe, Zap, Infinity } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function VisionPage() {
  usePageTitle("Nuestra Visión — ZAFIRO")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Nuestra Visión</h1>
            <p className="text-sm text-slate-400">El futuro del conocimiento humano es inteligente, conectado y accesible para todos</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-[#00D9FF]" />
            <h2 className="text-lg font-black text-white">Visión</h2>
          </div>
          <p className="text-base text-slate-200 leading-relaxed mb-4 italic border-l-2 border-[#00D9FF] pl-4">
            Ser la plataforma global donde la inteligencia humana y la inteligencia artificial convergen para organizar, 
            relacionar y democratizar el conocimiento de la humanidad.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Imaginamos un mundo donde cualquier persona, en cualquier lugar, pueda acceder al conocimiento que necesita 
            de forma instantánea, confiable y contextualizada. Donde los creadores de contenido tengan un centro de control 
            inteligente para toda su presencia digital. Donde las preguntas encuentren respuestas precisas gracias a la 
            sinergia entre comunidad e inteligencia artificial.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl glass">
            <Target className="w-5 h-5 text-[#00D9FF] mb-3" />
            <h3 className="text-xs font-bold text-white mb-2">Corto Plazo (2026-2027)</h3>
            <ul className="space-y-1.5 text-[10px] text-slate-400">
              <li className="flex items-start gap-2">• Consolidar la comunidad hispanohablante</li>
              <li className="flex items-start gap-2">• Integrar APIs oficiales de las 21 plataformas soportadas</li>
              <li className="flex items-start gap-2">• Lanzar el sistema de embeddings y búsqueda semántica</li>
              <li className="flex items-start gap-2">• Alcanzar 10,000 usuarios activos</li>
            </ul>
          </div>
          <div className="p-5 rounded-2xl glass">
            <Infinity className="w-5 h-5 text-purple-400 mb-3" />
            <h3 className="text-xs font-bold text-white mb-2">Largo Plazo (2028+)</h3>
            <ul className="space-y-1.5 text-[10px] text-slate-400">
              <li className="flex items-start gap-2">• Ser el estándar de perfiles inteligentes en Internet</li>
              <li className="flex items-start gap-2">• Integración con educación formal y certificaciones</li>
              <li className="flex items-start gap-2">• Expansión a múltiples idiomas y mercados globales</li>
              <li className="flex items-start gap-2">• Red descentralizada de conocimiento (blockchain)</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> El Futuro que Construimos</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            ZAFIRO no es solo una plataforma. Es un movimiento hacia un Internet más inteligente, donde cada creador 
            tiene un perfil unificado, cada pregunta tiene una respuesta y cada conexión genera nuevo conocimiento. 
            Creemos que el futuro de Internet no es solo social: es inteligente.
          </p>
        </div>
      </div>
    </div>
  )
}
