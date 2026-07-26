'use client'

import Link from "next/link"
import { ArrowLeft, Award, TrendingUp, BarChart3, DollarSign, Target, Zap, Eye, Plus } from "lucide-react"
import { useState } from "react"
import { usePageTitle } from "@/lib/usePageTitle"

const campaigns = [
  { name: "Nothing Tech", logo: "N", budget: 800, spent: 320, impressions: 14520, clicks: 1240, conv: 412, status: "Activa" },
  { name: "Vercel Systems", logo: "▲", budget: 1500, spent: 750, impressions: 28940, clicks: 3410, conv: 980, status: "Activa" },
  { name: "Stripe Quantum", logo: "St", budget: 1200, spent: 450, impressions: 11200, clicks: 890, conv: 240, status: "Activa" },
  { name: "OpenAI Research", logo: "O", budget: 2000, spent: 1120, impressions: 34900, clicks: 4520, conv: 1540, status: "Activa" },
]

export default function SponsorsFullPage() {
  usePageTitle("Sponsors")
  const [tab, setTab] = useState("campaigns")
  const [campForm, setCampForm] = useState({ company: "", title: "", budget: "", category: "" })

  const handleCreateCampaign = () => {
    const campaigns = JSON.parse(localStorage.getItem("zafiro_campaigns") || "[]")
    campaigns.push({ ...campForm, id: Date.now(), status: "Activa", impressions: 0, clicks: 0, conv: 0 })
    localStorage.setItem("zafiro_campaigns", JSON.stringify(campaigns))
    alert("Campaña creada exitosamente (simulada)")
    setCampForm({ company: "", title: "", budget: "", category: "" })
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Sponsors</h1>
            <p className="text-xs text-slate-400">Panel de patrocinadores y campañas</p>
          </div>
        </div>

        <nav className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {[
            { id: "campaigns", label: "Campañas", icon: Target },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "create", label: "Crear Campaña", icon: Plus },
            { id: "billing", label: "Facturación", icon: DollarSign },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === t.id
                    ? "bg-gradient-to-r from-[#00D9FF]/15 to-blue-600/10 text-[#00D9FF] border border-[#00D9FF]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            )
          })}
        </nav>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Campañas Activas", value: "4", icon: Target, color: "text-[#00D9FF]" },
            { label: "Total Invertido", value: "$2,640", icon: DollarSign, color: "text-emerald-400" },
            { label: "Impresiones Totales", value: "89,560", icon: Eye, color: "text-purple-400" },
            { label: "CTR Promedio", value: "8.9%", icon: TrendingUp, color: "text-amber-400" },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="p-4 rounded-2xl glass">
                <Icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            )
          })}
        </div>

        {tab === "campaigns" && (
          <div className="space-y-3">
            {campaigns.map((c, i) => (
              <div key={i} className="p-5 rounded-2xl glass hover:bg-[#0B1220]/80 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-sm font-black">{c.logo}</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <p className="text-[9px] text-slate-500">Presupuesto: ${c.budget} · Gastado: ${c.spent}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{c.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-xs font-bold text-[#00D9FF]">{c.impressions.toLocaleString()}</p><p className="text-[8px] text-slate-500">Impresiones</p></div>
                  <div><p className="text-xs font-bold text-amber-400">{c.clicks.toLocaleString()}</p><p className="text-[8px] text-slate-500">Clics</p></div>
                  <div><p className="text-xs font-bold text-emerald-400">{c.conv.toLocaleString()}</p><p className="text-[8px] text-slate-500">Conversiones</p></div>
                </div>
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00D9FF] to-emerald-400 rounded-full" style={{ width: `${(c.spent / c.budget) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "analytics" && (
          <div className="p-8 rounded-2xl glass text-center">
            <BarChart3 className="w-10 h-10 text-[#00D9FF] mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-1">Analytics de Campañas</h2>
            <p className="text-xs text-slate-400">Dashboard analítico detallado con gráficos de rendimiento por campaña, segmentación por audiencia y optimización de presupuesto.</p>
          </div>
        )}

        {tab === "create" && (
          <div className="p-8 rounded-2xl glass">
            <h2 className="text-lg font-bold mb-4">Crear Nueva Campaña</h2>
              <div className="space-y-4 max-w-lg">
                {[["company", "Nombre de la Empresa"], ["title", "Título de Campaña"], ["budget", "Presupuesto ($)"], ["category", "Categoría"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">{label}</label>
                    <input type="text" placeholder={label}
                      value={(campForm as Record<string, string>)[key]}
                      onChange={e => setCampForm({ ...campForm, [key]: e.target.value })}
                      className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
                  </div>
                ))}
                <button onClick={handleCreateCampaign}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Crear Campaña con Stripe
                </button>
              </div>
          </div>
        )}

        {tab === "billing" && (
          <div className="p-8 rounded-2xl glass">
            <h2 className="text-lg font-bold mb-4">Facturación</h2>
            <p className="text-xs text-slate-400">Historial de pagos, facturas y configuración de métodos de pago procesados a través de Stripe.</p>
          </div>
        )}
      </div>
    </div>
  )
}
