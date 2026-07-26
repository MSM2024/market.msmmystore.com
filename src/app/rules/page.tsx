'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Shield, AlertTriangle, Heart, Brain, Users, Ban, Eye, Star, MessageSquare, Sparkles } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function RulesPage() {
  usePageTitle("Reglas de la Comunidad — ZAFIRO")

  const rules = [
    {
      icon: Star, title: "1. Conocimiento de Calidad",
      desc: "Toda contribución debe aportar valor. Las preguntas deben ser claras y específicas. Las respuestas deben ser fundamentadas, útiles y bien redactadas. ZAFIRO es una Red Social del Conocimiento: cada interacción debe enriquecer el Mapa Vivo del Conocimiento.",
      color: "text-[#00D9FF]", border: "border-[#00D9FF]/20",
    },
    {
      icon: Heart, title: "2. Respeto y Empatía",
      desc: "Trata a todos los miembros con dignidad y respeto. No se tolera el acoso, la discriminación, los ataques personales ni el lenguaje ofensivo. Detrás de cada pregunta hay una persona buscando ayuda. Detrás de cada respuesta hay un esfuerzo genuino.",
      color: "text-pink-400", border: "border-pink-400/20",
    },
    {
      icon: Brain, title: "3. Integridad Académica",
      desc: "No plagies. Siempre atribuye las fuentes cuando uses información de terceros. No publiques información falsa o engañosa. Si no estás seguro de algo, indícalo. La confianza en el conocimiento es la base de ZAFIRO.",
      color: "text-purple-400", border: "border-purple-400/20",
    },
    {
      icon: Ban, title: "4. Sin Spam ni Autopromoción",
      desc: "No está permitido el spam, la publicidad no solicitada ni la autopromoción excesiva. Puedes compartir tus proyectos y plataformas en tu perfil y en Mi Universo Digital, pero no uses las preguntas y respuestas como vehículo publicitario.",
      color: "text-red-400", border: "border-red-400/20",
    },
    {
      icon: Eye, title: "5. Privacidad y Consentimiento",
      desc: "No compartas información personal tuya o de terceros sin consentimiento explícito. Esto incluye direcciones, números de teléfono, correos electrónicos y datos financieros. Reporta cualquier violación de privacidad al equipo de moderación.",
      color: "text-emerald-400", border: "border-emerald-400/20",
    },
    {
      icon: Shield, title: "6. Moderación y Reportes",
      desc: "La moderación de ZAFIRO combina inteligencia artificial (ELIANA detecta y resuelve automáticamente spam, desinformación y contenido inapropiado) con revisión humana para casos sensibles. Cualquier usuario puede reportar contenido. Las decisiones de moderación automatizadas pueden apelarse y ser revisadas por un humano.",
      color: "text-amber-400", border: "border-amber-400/20",
    },
    {
      icon: AlertTriangle, title: "7. Consecuencias",
      desc: "Las infracciones pueden resultar en: advertencia privada, eliminación de contenido, suspensión temporal de la cuenta, pérdida parcial o total de PTS, o eliminación permanente de la cuenta. Las suspensiones se determinan según la gravedad, intencionalidad y reincidencia de la infracción.",
      color: "text-orange-400", border: "border-orange-400/20",
    },
    {
      icon: Sparkles, title: "8. Uso de ELIANA",
      desc: "ELIANA es una herramienta de inteligencia artificial que complementa, no reemplaza, el juicio humano. Los análisis generados por ELIANA deben ser verificados y pueden ser complementados por la comunidad. No uses ELIANA para generar contenido engañoso, desinformación o material inapropiado.",
      color: "text-cyan-400", border: "border-cyan-400/20",
    },
    {
      icon: Users, title: "9. Círculos y Comunidades",
      desc: "Cada Círculo puede tener reglas adicionales establecidas por su líder. Al unirte a un Círculo, aceptas cumplir tanto las reglas globales de ZAFIRO como las reglas específicas de ese Círculo. Los líderes de Círculo pueden moderar contenido dentro de su comunidad.",
      color: "text-blue-400", border: "border-blue-400/20",
    },
    {
      icon: MessageSquare, title: "10. Debate Constructivo",
      desc: "El desacuerdo es bienvenido; la hostilidad no. Construye argumentos basados en evidencia y razonamiento. Escucha antes de responder. Reconoce cuando te equivocas. El objetivo no es ganar una discusión, sino llegar juntos a una mejor comprensión.",
      color: "text-indigo-400", border: "border-indigo-400/20",
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Reglas de la Comunidad</h1>
            <p className="text-sm text-slate-400">Construimos juntos un espacio de conocimiento respetuoso y valioso</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            ZAFIRO es más que una plataforma: es una comunidad de personas unidas por la curiosidad y el deseo de aprender. 
            Estas reglas existen para proteger ese espíritu y asegurar que todos puedan contribuir y beneficiarse del 
            conocimiento colectivo. <span className="text-white font-bold">Todo comienza con un pensamiento</span>, 
            pero el respeto es lo que lo hace crecer.
          </p>
        </div>

        <div className="space-y-3">
          {rules.map((rule, i) => {
            const Icon = rule.icon
            return (
              <div key={i} className={`p-5 rounded-2xl border ${rule.border} bg-[#0B1220]/40 hover:border-slate-700 transition-all`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center ${rule.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{rule.title}</h2>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-11">{rule.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-5 rounded-2xl glass">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Gem className="w-4 h-4 text-[#00D9FF]" /> Filosofía de Moderación</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            En ZAFIRO, la moderación no es censura. Es la protección del espacio de aprendizaje colectivo. 
            Nuestro enfoque es restaurativo, no punitivo: primero educamos, luego advertimos, y solo como 
            último recurso sancionamos.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Creemos que la mayoría de las personas quieren contribuir positivamente. Cuando alguien viola 
            una regla, buscamos primero explicar por qué y dar la oportunidad de corregir. Las sanciones 
            graves están reservadas para comportamientos maliciosos y reincidentes.
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 text-xs text-[#00D9FF] hover:underline">
            Reportar una infracción
          </Link>
        </div>
      </div>
    </div>
  )
}
