'use client'

import { useState, useEffect } from "react"
import { Store, CheckCircle, XCircle, Ban, Eye, Search, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { adminApproveStore, adminRejectStore, adminSuspendStore } from "@/lib/marketplace/client"
import { STORE_STATUS_LABELS, STORE_STATUS_COLORS } from "@/lib/marketplace/constants"
import type { MarketplaceStore, StoreStatus } from "@/lib/marketplace/types"

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending_review", label: "Pendientes" },
  { key: "active", label: "Activas" },
  { key: "suspended", label: "Suspendidas" },
]

export default function AdminMarketplaceTiendasPage() {
  usePageTitle("Admin Tiendas — Marketplace")

  const [stores, setStores] = useState<MarketplaceStore[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; action: string; fn: () => Promise<void> } | null>(null)

  async function loadStores() {
    if (!isSupabaseAvailable()) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase.from("marketplace_stores").select("*").order("created_at", { ascending: false })
    setStores(data || [])
    setLoading(false)
  }

  useEffect(() => { Promise.resolve().then(() => loadStores()) }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function handleApprove(id: string) {
    const ok = await adminApproveStore(id)
    if (ok) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, status: "active" as StoreStatus } : s))
      showToast("Tienda aprobada")
    }
    setConfirmAction(null)
  }

  async function handleSuspend(id: string) {
    const ok = await adminSuspendStore(id)
    if (ok) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, status: "suspended" as StoreStatus } : s))
      showToast("Tienda suspendida")
    }
    setConfirmAction(null)
  }

  async function handleReactivate(id: string) {
    const ok = await adminApproveStore(id)
    if (ok) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, status: "active" as StoreStatus } : s))
      showToast("Tienda reactivada")
    }
    setConfirmAction(null)
  }

  async function handleReject(id: string) {
    const ok = await adminRejectStore(id, "Rechazada por administrador")
    if (ok) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, status: "rejected" as StoreStatus } : s))
      showToast("Tienda rechazada")
    }
    setConfirmAction(null)
  }

  const filtered = stores.filter(s => {
    if (activeTab !== "all" && s.status !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.country.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
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

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-[#0a0e1a] border border-slate-700/50 rounded-xl p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-white mb-2">Confirmar Acción</h3>
            <p className="text-[10px] text-slate-400 mb-4">
              ¿{confirmAction.action} la tienda <span className="text-white font-bold">{confirmAction.name}</span>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 rounded-lg bg-slate-800/50 text-[10px] font-bold text-slate-300 hover:bg-slate-700/50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmAction.fn} className="flex-1 py-2 rounded-lg bg-red-500/20 text-[10px] font-bold text-red-400 hover:bg-red-500/30 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <Store className="w-5 h-5 text-[#D4AF37]" />
        <h1 className="text-lg font-black">Gestionar Tiendas</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{filtered.length} tiendas</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(tab => {
          const count = tab.key === "all" ? stores.length : stores.filter(s => s.status === tab.key).length
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${activeTab === tab.key ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20" : "bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:text-white"}`}>
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tiendas..." className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#197BD2]/50" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800/50">
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Nombre</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden md:table-cell">País</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Estado</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden md:table-cell">Productos</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden lg:table-cell">Ventas</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden lg:table-cell">Creada</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-[10px] text-slate-500">No se encontraron tiendas</td></tr>
            ) : filtered.map(store => (
              <tr key={store.id} className="border-b border-slate-800/30 hover:bg-slate-800/10 transition-colors">
                <td className="py-3 pr-4">
                  <p className="text-[11px] font-bold text-white">{store.name}</p>
                  <p className="text-[8px] text-slate-500 truncate max-w-[150px]">{store.email || store.city}</p>
                </td>
                <td className="py-3 pr-4 hidden md:table-cell">
                  <span className="text-[10px] text-slate-300">{store.country}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${STORE_STATUS_COLORS[store.status]}`}>
                    {STORE_STATUS_LABELS[store.status]}
                  </span>
                </td>
                <td className="py-3 pr-4 hidden md:table-cell">
                  <span className="text-[10px] text-slate-300">{store.product_count}</span>
                </td>
                <td className="py-3 pr-4 hidden lg:table-cell">
                  <span className="text-[10px] text-slate-300">{store.total_sales}</span>
                </td>
                <td className="py-3 pr-4 hidden lg:table-cell">
                  <span className="text-[9px] text-slate-500">{new Date(store.created_at).toLocaleDateString()}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    {store.status === "pending_review" && (
                      <>
                        <button onClick={() => setConfirmAction({ id: store.id, name: store.name, action: "aprobar", fn: () => handleApprove(store.id) })} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" title="Aprobar">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button onClick={() => setConfirmAction({ id: store.id, name: store.name, action: "rechazar", fn: () => handleReject(store.id) })} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Rechazar">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </>
                    )}
                    {store.status === "active" && (
                      <button onClick={() => setConfirmAction({ id: store.id, name: store.name, action: "suspender", fn: () => handleSuspend(store.id) })} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors" title="Suspender">
                        <Ban className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}
                    {store.status === "suspended" && (
                      <button onClick={() => handleReactivate(store.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" title="Reactivar">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors" title="Ver">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
