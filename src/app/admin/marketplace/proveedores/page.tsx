'use client'

import { useState, useEffect } from "react"
import { Truck, Globe, Package, Star, Search, Loader2, Power, PowerOff } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { fetchProviders, adminToggleProviderStatus } from "@/lib/marketplace/client"
import type { MarketplaceProvider, ProviderStatus } from "@/lib/marketplace/types"

const PROVIDER_STATUS_COLORS: Record<ProviderStatus, string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  inactive: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  suspended: "text-red-400 bg-red-500/10 border-red-500/20",
  pending_review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
}

const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  pending_review: "Pendiente",
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  api: "API",
  affiliate: "Afiliado",
  dropship: "Dropshipping",
  msm_inventory: "Inventario MSM",
  cuba_supplier: "Proveedor Cuba",
}

export default function AdminMarketplaceProveedoresPage() {
  usePageTitle("Admin Proveedores — Marketplace")

  const [providers, setProviders] = useState<MarketplaceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState("")

  useEffect(() => { loadProviders() }, [])

  async function loadProviders() {
    const data = await fetchProviders()
    setProviders(data)
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function toggleProviderStatus(id: string) {
    const provider = providers.find(p => p.id === id)
    if (!provider) return
    const newStatus = provider.status === "active" ? "inactive" : "active"
    const ok = await adminToggleProviderStatus(id, newStatus)
    if (ok) {
      setProviders(prev => prev.map(p =>
        p.id === id ? { ...p, status: newStatus as ProviderStatus } : p
      ))
      showToast(`Proveedor ${newStatus === "active" ? "activado" : "desactivado"}`)
    } else {
      showToast("Error al actualizar proveedor")
    }
  }

  const filtered = providers.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.provider_type.toLowerCase().includes(q)
    }
    return true
  })

  const activeCount = providers.filter(p => p.status === "active").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-5 h-5 text-purple-400" />
        <h1 className="text-lg font-black">Gestionar Proveedores</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{activeCount} activos / {providers.length} total</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedores..." className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-10 text-center text-[10px] text-slate-500">No se encontraron proveedores</div>
        ) : filtered.map(provider => (
          <div key={provider.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">{provider.name}</p>
                  <p className="text-[9px] text-slate-500">{PROVIDER_TYPE_LABELS[provider.provider_type] || provider.provider_type}</p>
                </div>
              </div>
              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${PROVIDER_STATUS_COLORS[provider.status]}`}>
                {PROVIDER_STATUS_LABELS[provider.status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
              {provider.countries_supported?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="text-[9px] text-slate-400">{provider.countries_supported.length} países</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-500" />
                <span className="text-[9px] text-slate-400">{provider.product_count} productos</span>
              </div>
              {provider.average_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#D4AF37]" />
                  <span className="text-[9px] text-slate-400">{provider.average_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {provider.api_enabled && <span className="text-[8px] px-2 py-0.5 rounded bg-[#197BD2]/10 text-[#197BD2] border border-[#197BD2]/20">API</span>}
              {provider.affiliate_enabled && <span className="text-[8px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Afiliado</span>}
              {provider.resale_enabled && <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Reventa</span>}
              {provider.dropshipping_enabled && <span className="text-[8px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Dropship</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/30">
              <span className="text-[9px] text-slate-500">Comisión: {provider.default_commission}%</span>
              <button onClick={() => toggleProviderStatus(provider.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                {provider.status === "active" ? (
                  <>
                    <PowerOff className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400">Desactivar</span>
                  </>
                ) : (
                  <>
                    <Power className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-400">Activar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
