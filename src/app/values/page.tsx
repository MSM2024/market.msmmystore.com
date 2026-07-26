'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Heart, Shield, Brain, Users, Sparkles, Globe, BookOpen, Award, Zap, Eye } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function ValuesPage() {
  usePageTitle("Nuestros Valores — ZAFIRO")

  const values = [
    { icon: Brain, title: "Conocimiento como Bien Común", desc: "Creemos que el conocimiento debe ser accesible para todos. Cada pregunta y respuesta enriquece el acervo colectivo de la humanidad." },
    { icon: Users, title: "Colaboración sobre Competencia", desc: "El conocimiento crece cuando se comparte. Fomentamos comunidades donde todos aprenden de todos, sin importar su nivel de experiencia." },
    { icon: Shield, title: "Integridad y Transparencia", desc: "Somos claros sobre cómo funcionamos, cómo usamos los datos y cómo generamos ingresos. No hay algoritmos ocultos ni agendas secretas." },
    { icon: Sparkles, title: "Innovación Constante", desc: "La tecnología evoluciona y nosotros con ella. Incorporamos los últimos avances en IA, procesamiento de lenguaje y análisis de datos." },
    { icon: Eye, title: "Privacidad por Diseño", desc: "No almacenamos contenido original de terceros. Solo metadatos y resúmenes. El usuario controla qué comparte y cómo aparece." },
    { icon: Globe, title: "Diversidad e Inclusión", desc: "ZAFIRO es para todos los hispanohablantes, sin importar su país, cultura o nivel de conocimiento. La diversidad enriquece el Mapa Vivo." },
    { icon: Award, title: "Calidad sobre Cantidad", desc: "Preferimos una respuesta excelente a cien respuestas mediocres. Nuestro sistema de reputación y moderación prioriza la calidad." },
    { icon: BookOpen, title: "Aprendizaje Continuo", desc: "Nunca se termina de aprender. ZAFIRO está diseñado para que cada visita deje algo nuevo, una conexión inesperada, un conocimiento valioso." },
    { icon: Heart, title: "Respeto y Empatía", desc: "Detrás de cada pregunta hay una persona. Detrás de cada respuesta hay un esfuerzo. Tratamos a todos con dignidad y respeto." },
    { icon: Zap, title: "Responsabilidad", desc: "El conocimiento tiene poder. Nos tomamos en serio la responsabilidad de organizarlo y presentarlo de manera ética y precisa." },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Nuestros Valores</h1>
            <p className="text-sm text-slate-400">Los principios que guían cada decisión en ZAFIRO</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed">
            En ZAFIRO, cada característica, cada decisión y cada línea de código está guiada por un conjunto de valores fundamentales. 
            No son solo palabras en una página: son el filtro a través del cual evaluamos todo lo que hacemos. Si algo no alinea 
            con estos valores, no lo hacemos.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v, i) => {
            const Icon = v.icon
            return (
              <div key={i} className="p-5 rounded-2xl glass hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <h3 className="text-xs font-bold text-white">{v.title}</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
