'use client'

import { useState, useEffect } from "react"
import { Settings, Save, CheckCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { SUPPORTED_CURRENCIES } from "@/lib/marketplace/constants"

const CONFIG_KEY = "zafiro_seller_config"

interface SellerConfig {
  notifOrders: boolean
  notifReviews: boolean
  notifPayments: boolean
  notifStock: boolean
  currency: string
}

function loadConfig(): SellerConfig {
  if (typeof window === "undefined") return { notifOrders: true, notifReviews: true, notifPayments: true, notifStock: true, currency: "USD" }
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "null") || { notifOrders: true, notifReviews: true, notifPayments: true, notifStock: true, currency: "USD" } }
  catch { return { notifOrders: true, notifReviews: true, notifPayments: true, notifStock: true, currency: "USD" } }
}

export default function DashboardConfiguracionPage() {
  usePageTitle("Configuración — Dashboard")
  const [config, setConfig] = useState<SellerConfig>(loadConfig)
  const [saved, setSaved] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setConfig(loadConfig()) }, [])

  function handleSave() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggle(key: keyof SellerConfig) {
    setConfig(prev => ({ ...prev, [key]: !prev[key] as boolean }))
  }

  const notifItems = [
    { key: "notifOrders" as const, label: "Nuevos pedidos" },
    { key: "notifReviews" as const, label: "Reseñas de clientes" },
    { key: "notifPayments" as const, label: "Pagos recibidos" },
    { key: "notifStock" as const, label: "Alertas de stock bajo" },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-slate-400" />
        <h1 className="text-lg font-black text-white">Configuración</h1>
      </div>

      <div className="space-y-4 max-w-2xl">
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
          <h3 className="text-xs font-bold text-white mb-3">Notificaciones</h3>
          {notifItems.map((item) => (
            <label key={item.key} className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0 cursor-pointer">
              <span className="text-[10px] text-slate-300">{item.label}</span>
              <button onClick={() => toggle(item.key)}
                className={`w-8 h-4 rounded-full relative transition-colors ${config[item.key] ? "bg-[#197BD2]" : "bg-slate-700"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config[item.key] ? "right-0.5" : "left-0.5"}`} />
              </button>
            </label>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
          <h3 className="text-xs font-bold text-white mb-3">Moneda</h3>
          <select value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#197BD2]/50 transition-colors">
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>

        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#197BD2] text-white text-xs font-bold hover:bg-[#197BD2]/90 transition-colors">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  )
}
