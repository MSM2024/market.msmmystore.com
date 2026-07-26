'use client'

import Link from "next/link"
import { ArrowLeft, Check, Star, Sparkles, Crown, Zap, Shield, Gem } from "lucide-react"
import { useState } from "react"
import { usePageTitle } from "@/lib/usePageTitle"

const plans = [
  {
    name: "Free", price: "0", pts: "100/día", icon: Gem, color: "text-slate-400", border: "border-slate-700",
    features: [
      "Acceso al feed de conocimiento",
      "10 preguntas por día",
      "ELIANA básico",
      "Perfil público",
      "100 PTS/día",
      "Unirte a círculos",
    ]
  },
  {
    name: "Pro", price: "9.99", pts: "500/día", icon: Star, color: "text-[#00D9FF]", border: "border-[#00D9FF]/40", popular: true,
    features: [
      "Todo lo de Free",
      "Preguntas ilimitadas",
      "ELIANA avanzado con Gemini",
      "Analytics de conocimiento",
      "500 PTS/día",
      "Prioridad en soporte",
      "Modo oscuro premium",
      "Exportar datos",
    ]
  },
  {
    name: "Cuba Plus", price: "14.99", pts: "1000/día", icon: Crown, color: "text-amber-400", border: "border-amber-500/40",
    features: [
      "Todo lo de Pro",
      "Acceso a contenido exclusivo Cuba",
      "ELIANA con contexto completo",
      "1000 PTS/día",
      "Sponsor destacado 1 mes",
      "Analytics avanzados",
      "API access",
      "Badge Cuba Plus exclusivo",
      "Soporte prioritario 24/7",
    ]
  },
]

export default function MembershipsPage() {
  usePageTitle("Membresías")
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-2">Planes de Membresía</h1>
          <p className="text-sm text-slate-400">Desbloquea el conocimiento completo de ZAFIRO</p>
          <div className="inline-flex items-center gap-1 mt-4 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
            <button onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${billing === "monthly" ? "bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white" : "text-slate-400"}`}>Mensual</button>
            <button onClick={() => setBilling("annual")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${billing === "annual" ? "bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white" : "text-slate-400"}`}>Anual <span className="text-emerald-400 text-[9px]">-20%</span></button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            const price = billing === "annual" ? (parseFloat(plan.price) * (plan.price === "0" ? 0 : 0.8)).toFixed(2) : plan.price
            return (
              <div key={i} className={`relative rounded-3xl border ${plan.border} bg-[#0B1220]/40 p-6 flex flex-col`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00D9FF] to-blue-600 text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Más Popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`w-6 h-6 ${plan.color}`} />
                  <h2 className="text-lg font-black text-white">{plan.name}</h2>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{plan.price === "0" ? "Gratis" : `$${price}`}</span>
                  {plan.price !== "0" && <span className="text-xs text-slate-400 ml-1">/{billing === "monthly" ? "mes" : "año"}</span>}
                </div>
                <div className="text-[10px] font-mono text-[#00D9FF] mb-5">+ {plan.pts} PTS</div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setSelectedPlan(plan.name); setConfirming(true) }} className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  plan.price === "0"
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white hover:opacity-90"
                }`}>
                  {plan.price === "0" ? "Comenzar Gratis" : "Suscribirse"}
                  {plan.price !== "0" && <Zap className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-10 p-6 rounded-2xl glass">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Garantía</h3>
          <p className="text-xs text-slate-400">Todos los planes incluyen cancelación en cualquier momento. Pagos procesados de forma segura a través de Stripe. Datos encriptados con cifrado AES-256.</p>
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setConfirming(false)}>
          <div className="w-full max-w-sm p-6 rounded-3xl border border-slate-700 bg-[#0B1220] text-center" onClick={e => e.stopPropagation()}>
            <Gem className="w-10 h-10 text-[#00D9FF] mx-auto mb-3" />
            <h2 className="text-lg font-black mb-2">Confirmar Membresía</h2>
            <p className="text-xs text-slate-400 mb-4">Estás a punto de suscribirte al plan <strong className="text-white">{selectedPlan}</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer">Cancelar</button>
              <button onClick={() => { setConfirming(false); alert(`✅ Redirigiendo a Stripe para el plan ${selectedPlan}…`) }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
