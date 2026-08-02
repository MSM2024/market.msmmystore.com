'use client'

import Link from "next/link"
import { ArrowLeft, Truck, Package, MapPin, Clock, Globe, Zap, Search, BarChart3, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function MSMDeliveryPage() {
  usePageTitle("MSM Delivery — Logística Inteligente")

  const coverage = [
    { country: "Cuba", flag: "🇨🇺", desc: "Entrega a toda la isla con puntos de recogida en las principales ciudades.", status: "Disponible" },
    { country: "Estados Unidos", flag: "🇺🇸", desc: "Envíos a todo el territorio continental con seguimiento en tiempo real.", status: "Disponible" },
    { country: "Latinoamérica", flag: "🌎", desc: "México, Colombia, Venezuela, Argentina y más países próximamente.", status: "Próximamente" },
    { country: "Europa", flag: "🇪🇸", desc: "España y la Unión Europea con logística optimizada para paquetes internacionales.", status: "Próximamente" },
  ]

  const features = [
    { icon: Search, title: "Tracking en Tiempo Real", desc: "Sigue tu paquete desde el momento que sale del vendedor hasta llegar a tu puerta.", color: "text-[#00D9FF]" },
    { icon: Globe, title: "Múltiples Transportistas", desc: "Comparamos precios y tiempos entre transportistas para ofrecerte la mejor opción.", color: "text-emerald-400" },
    { icon: Zap, title: "Envío Express", desc: "Entrega en 24-48 horas para pedidos urgentes dentro de Cuba y EE.UU.", color: "text-amber-400" },
    { icon: Package, title: "Envío Estándar", desc: "Opción económica con entrega en 5-10 días hábiles según destino.", color: "text-blue-400" },
    { icon: Shield, title: "Seguro Incluido", desc: "Cada paquete viaja con seguro de protección contra pérdidas y daños.", color: "text-purple-400" },
    { icon: BarChart3, title: "Costos Transparentes", desc: "Sin sorpresas. Calcula el costo exacto antes de confirmar tu envío.", color: "text-pink-400" },
  ]

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">MSM Delivery</h1>
            <p className="text-sm text-slate-400">Logística Inteligente del Ecosistema MSM</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Próximamente
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-emerald-400 font-bold">MSM Delivery</span> es el servicio de logística inteligente
            del ecosistema MSM. Diseñado para resolver el reto del envío internacional con cobertura en
            Cuba, Estados Unidos y Latinoamérica.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Combinamos múltiples transportistas, tracking en tiempo real y costos transparentes
            para que cada compra en el Marketplace llegue a su destino de forma segura y rápida.
          </p>
        </div>

        {/* Mockup Tracking UI */}
        <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider mb-4">Vista Previa del Tracking</h2>
        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">MSM Delivery</p>
                <p className="text-[9px] text-slate-500">Seguimiento de Envío</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                En Tránsito
              </span>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-slate-500 mb-1">Número de Seguimiento</p>
              <p className="text-sm font-mono font-bold text-white">MSM-2026-7854-CU</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500">Origen</p>
                  <p className="text-[11px] font-bold text-white flex items-center gap-1"><MapPin className="w-3 h-3 text-[#00D9FF]" /> Miami, FL</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[9px] text-slate-500">Destino</p>
                  <p className="text-[11px] font-bold text-white flex items-center gap-1 justify-end"><MapPin className="w-3 h-3 text-amber-400" /> La Habana, Cuba</p>
                </div>
              </div>
              <div className="relative mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00D9FF] to-emerald-400 rounded-full" style={{ width: "65%" }} />
                <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050816]" />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[8px] text-emerald-400">Recogido</p>
                <p className="text-[8px] text-slate-500">~3 días restantes</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { time: "24 Jul, 10:30 AM", event: "Paquete en tránsito hacia La Habana", status: "done" },
                { time: "23 Jul, 2:15 PM", event: "Paquete en aduanas — en proceso de liberación", status: "active" },
                { time: "22 Jul, 8:00 AM", event: "Paquete recibido en centro de distribución Miami", status: "done" },
                { time: "21 Jul, 4:45 PM", event: "Paquete recogido del vendedor", status: "done" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/20 border border-slate-700/20">
                  {step.status === "active" ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-[10px] text-slate-400">{step.event}</p>
                    <p className="text-[8px] text-slate-500">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-[#050816]/60 backdrop-blur-sm z-20">
            <div className="text-center">
              <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Próximamente</p>
              <p className="text-[10px] text-slate-400">MSM Delivery estará disponible pronto</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider mb-4">Características</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {features.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl glass hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <h3 className="text-xs font-bold text-white">{f.title}</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Coverage */}
        <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider mb-4">Cobertura</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {coverage.map((c, i) => (
            <div key={i} className="p-4 rounded-2xl glass flex items-start gap-4">
              <span className="text-3xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xs font-bold text-white">{c.country}</h3>
                  <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold ${c.status === "Disponible" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center py-6 border-t border-slate-800">
          <p className="text-xs text-slate-500">Parte del <Link href="/ecosystem" className="text-emerald-400 hover:underline">Ecosistema MSM</Link></p>
        </div>
      </div>
    </div>
  )
}
