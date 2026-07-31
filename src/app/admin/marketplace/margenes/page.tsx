'use client'

import { useState } from "react"
import { DollarSign, Save, Info, Calculator } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { loadMarginConfig, saveMarginConfig, type MarginConfig } from "@/lib/marketplace/client"

export default function AdminMarketplaceMargenesPage() {
  usePageTitle("Admin Márgenes — Marketplace")

  const [config, setConfig] = useState<MarginConfig>(loadMarginConfig)
  const [toast, setToast] = useState("")

  function updateConfig(key: keyof MarginConfig, value: string) {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setConfig(prev => ({ ...prev, [key]: num }))
    }
  }

  function handleSave() {
    saveMarginConfig(config)
    setToast("Configuración guardada")
    setTimeout(() => setToast(""), 3000)
  }

  const examplePrice = 100
  const commission = examplePrice * (config.globalCommission / 100)
  const serviceFee = examplePrice * (config.msmServiceFee / 100)
  const paymentFee = examplePrice * (config.paymentProcessingFee / 100) + config.paymentFixedFee
  const reserve = examplePrice * (config.operationalReserve / 100)
  const sellerRevenue = examplePrice - commission - serviceFee - paymentFee - reserve

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-[#D4AF37]" />
        <h1 className="text-lg font-black">Configurar Márgenes y Comisiones</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <h2 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
              Comisiones Globales
            </h2>
            <div className="space-y-3">
              {[
                { key: "globalCommission" as const, label: "Comisión Marketplace Global", desc: "Porcentaje cobrado por venta" },
                { key: "msmServiceFee" as const, label: "Cargo de Servicio MSM", desc: "Fee de plataforma" },
                { key: "operationalReserve" as const, label: "Reserva Operativa", desc: "Reserva de contingencia" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                  <div>
                    <p className="text-[11px] text-slate-300">{item.label}</p>
                    <p className="text-[8px] text-slate-500">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={config[item.key]} onChange={e => updateConfig(item.key, e.target.value)} step="0.1" className="w-20 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white text-right focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
                    <span className="text-[10px] text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <h2 className="text-xs font-bold text-white mb-4">Márgenes del Vendedor</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                <div>
                  <p className="text-[11px] text-slate-300">Margen Mínimo</p>
                  <p className="text-[8px] text-slate-500">Piso para vendedores</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={config.minSellerMargin} onChange={e => updateConfig("minSellerMargin", e.target.value)} step="0.1" className="w-20 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white text-right focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
                  <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                <div>
                  <p className="text-[11px] text-slate-300">Margen Máximo</p>
                  <p className="text-[8px] text-slate-500">Tope para vendedores</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={config.maxSellerMargin} onChange={e => updateConfig("maxSellerMargin", e.target.value)} step="0.1" className="w-20 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white text-right focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
                  <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <h2 className="text-xs font-bold text-white mb-4">Procesamiento de Pagos</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                <p className="text-[11px] text-slate-300">Fee porcentual (Stripe)</p>
                <div className="flex items-center gap-2">
                  <input type="number" value={config.paymentProcessingFee} onChange={e => updateConfig("paymentProcessingFee", e.target.value)} step="0.1" className="w-20 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white text-right focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
                  <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                <p className="text-[11px] text-slate-300">Fee fijo por transacción</p>
                <div className="flex items-center gap-2">
                  <input type="number" value={config.paymentFixedFee} onChange={e => updateConfig("paymentFixedFee", e.target.value)} step="0.01" className="w-20 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white text-right focus:outline-none focus:border-[#197BD2]/50 transition-colors" />
                  <span className="text-[10px] text-slate-500">USD</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-bold hover:bg-[#D4AF37]/20 transition-colors">
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <h2 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-[#197BD2]" />
              Ejemplo de Desglose — {examplePrice.toFixed(2)} USD
            </h2>
            <div className="space-y-2">
              {[
                { label: "Precio del producto", value: examplePrice, color: "text-white" },
                { label: `Comisión Marketplace (${config.globalCommission}%)`, value: -commission, color: "text-red-400" },
                { label: `Cargo Servicio MSM (${config.msmServiceFee}%)`, value: -serviceFee, color: "text-red-400" },
                { label: `Procesamiento (${config.paymentProcessingFee}% + $${config.paymentFixedFee})`, value: -paymentFee, color: "text-red-400" },
                { label: `Reserva Operativa (${config.operationalReserve}%)`, value: -reserve, color: "text-red-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-[10px] text-slate-400">{item.label}</span>
                  <span className={`text-[11px] font-bold ${item.value >= 0 ? "text-white" : item.color}`}>
                    {item.value >= 0 ? "" : "-"}${Math.abs(item.value).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-700/30 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400">Ingreso neto vendedor</span>
                  <span className="text-[13px] font-black text-emerald-400">${sellerRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#197BD2]" />
              Cómo Funciona el Pricing
            </h2>
            <div className="space-y-2">
              {[
                "1. Precio del proveedor: costo base del producto",
                "2. + Envío: costo de logística al destino",
                "3. + Impuestos: IVA/tasas según país",
                "4. + Procesamiento: fee de pasarela de pago (Stripe)",
                "5. + Servicio MSM: cargo de plataforma por gestión",
                "6. + Margen vendedor: ganancia del seller",
                "7. + Reserva: fondo de contingencia para disputas",
                "= Precio final visible al comprador",
              ].map((line, i) => (
                <p key={i} className="text-[9px] text-slate-400 leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
