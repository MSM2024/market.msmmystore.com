'use client'

import Link from "next/link"
import { ArrowLeft, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Shield, Globe, Smartphone, Zap, Receipt, RefreshCw } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import ElianaDiamond from "@/components/ElianaDiamond"

export default function MSMPaymentsPage() {
  usePageTitle("MSM Payments — Cartera Digital")

  const features = [
    { icon: Wallet, title: "Balance Multimoneda", desc: "Consulta tu saldo en USD, EUR, CUP y otras monedas en tiempo real.", color: "text-[#00D9FF]" },
    { icon: ArrowUpRight, title: "Transferencias", desc: "Envía dinero a otros usuarios del ecosistema MSM de forma instantánea y sin comisiones ocultas.", color: "text-emerald-400" },
    { icon: ArrowDownLeft, title: "Recibe Pagos", desc: "Acepta pagos para tu tienda, servicios o productos directamente en tu wallet MSM.", color: "text-blue-400" },
    { icon: Receipt, title: "Historial Completo", desc: "Revisa cada transacción con detalles, fechas, estados y comprobantes descargables.", color: "text-purple-400" },
    { icon: Shield, title: "Seguridad Bancaria", desc: "Encriptación de extremo a extremo, autenticación biométrica y protección contra fraude.", color: "text-amber-400" },
    { icon: Globe, title: "Envíos Internacionales", desc: "Envía y recibe dinero entre Cuba, Estados Unidos y Latinoamérica con tipos de cambio justos.", color: "text-pink-400" },
  ]

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">MSM Payments</h1>
            <p className="text-sm text-slate-400">Cartera Digital del Ecosistema MSM</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Próximamente
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-[#00D9FF] font-bold">MSM Payments</span> es la Cartera Digital del ecosistema MSM.
            Diseñada para gestionar tus finanzas dentro de un solo lugar: desde transferencias entre usuarios
            hasta pagos en el Marketplace, remesas a Cuba y gestión de ganancias como vendedor.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Un wallet construido para la comunidad hispanohablante, con soporte multimoneda,
            comisiones transparentes e integración directa con cada plataforma del ecosistema.
          </p>
        </div>

        {/* Mockup Card UI */}
        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">Vista Previa</h2>
        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#00D9FF]/10 to-transparent rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
                  <ElianaDiamond size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">MSM Wallet</p>
                  <p className="text-[9px] text-slate-500">Cartera Digital</p>
                </div>
              </div>
              <Smartphone className="w-4 h-4 text-slate-600" />
            </div>
            <div className="mb-6">
              <p className="text-[10px] text-slate-400 mb-1">Balance Total</p>
              <p className="text-3xl font-black text-white">$2,450<span className="text-lg text-slate-400">.00</span></p>
              <p className="text-[9px] text-emerald-400 mt-1">+12.5% este mes</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 mb-1">USD</p>
                <p className="text-sm font-bold text-white">$1,200</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 mb-1">EUR</p>
                <p className="text-sm font-bold text-white">€850</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 mb-1">CUP</p>
                <p className="text-sm font-bold text-white">$400</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[10px] font-bold text-[#00D9FF]">
                <ArrowUpRight className="w-3.5 h-3.5" /> Enviar
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Recibir
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400">
                <RefreshCw className="w-3.5 h-3.5" /> Cambiar
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-[#050816]/60 backdrop-blur-sm z-20">
            <div className="text-center">
              <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Próximamente</p>
              <p className="text-[10px] text-slate-400">MSM Payments estará disponible pronto</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">Características</h2>
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

        {/* Integration */}
        <div className="rounded-2xl glass p-6 mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-[#00D9FF]" /> Integración con el Ecosistema</h2>
          <ul className="space-y-2 text-[11px] text-slate-400">
            <li className="flex items-start gap-2">• Paga directamente en <strong className="text-white">MSM Marketplace</strong> sin salir de tu wallet.</li>
            <li className="flex items-start gap-2">• Recibe las ganancias de tus ventas en <strong className="text-white">MSM My Store</strong> en tu wallet MSM.</li>
            <li className="flex items-start gap-2">• Envía <strong className="text-white">Remesas a Cuba</strong> usando el servicio integrado de MSM.</li>
            <li className="flex items-start gap-2">• Gana <strong className="text-white">PTS</strong> por cada transacción y úsalos en el ecosistema.</li>
            <li className="flex items-start gap-2">• Conecta tu wallet a <strong className="text-white">ZAFIRO</strong> para ver todo tu historial financiero en tu perfil.</li>
          </ul>
        </div>

        <div className="text-center py-6 border-t border-slate-800">
          <p className="text-xs text-slate-500">Parte del <Link href="/ecosystem" className="text-[#00D9FF] hover:underline">Ecosistema MSM</Link></p>
        </div>
      </div>
    </div>
  )
}
