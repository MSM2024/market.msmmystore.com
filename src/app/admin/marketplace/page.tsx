'use client'

import { useState, useEffect } from "react"
import { Store, Package, ShoppingCart, DollarSign, AlertTriangle, Check, X, TrendingUp, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { formatPrice } from "@/lib/marketplace/constants"
import { fetchAdminMarketplaceStats, adminFetchPendingStores, adminFetchPendingProducts, adminApproveStore, adminRejectStore, adminApproveProduct, adminRejectProduct } from "@/lib/marketplace/client"
import type { StoreWithStats, ProductWithStore } from "@/lib/marketplace/types"


interface Stats {
  totalStores: number
  pendingStores: number
  activeStores: number
  totalProducts: number
  pendingProducts: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminMarketplacePage() {
  usePageTitle("Marketplace Admin — ZAFIRO")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingStores, setPendingStores] = useState<StoreWithStats[]>([])
  const [pendingProducts, setPendingProducts] = useState<ProductWithStore[]>([])
  const [toast, setToast] = useState("")
  const [flags, setFlags] = useState<Record<string, boolean>>({
    MARKETPLACE_ENABLED: true,
    AMAZON_PROVIDER_ENABLED: false,
    WALMART_PROVIDER_ENABLED: false,
    SAMS_PROVIDER_ENABLED: false,
    HOME_DEPOT_PROVIDER_ENABLED: false,
    SHEIN_PROVIDER_ENABLED: false,
    CUBA_DELIVERY_ENABLED: false,
    INTERNATIONAL_DELIVERY_ENABLED: false,
    AUTO_APPROVE_PRODUCTS: false,
    AUTO_APPROVE_STORES: false,
    ENABLE_COUPONS: true,
    ENABLE_REVIEWS: true,
    ENABLE_FAVORITES: true,
    ENABLE_DISPUTES: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [s, stores, products] = await Promise.all([
        fetchAdminMarketplaceStats(),
        adminFetchPendingStores(),
        adminFetchPendingProducts(),
      ])
      setStats(s)
      setPendingStores(stores)
      setPendingProducts(products)
    } catch (e) {
      console.error(e)
      setError("Error al cargar datos del marketplace")
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function handleApproveStore(id: string) {
    const ok = await adminApproveStore(id)
    if (ok) {
      setPendingStores(prev => prev.filter(s => s.id !== id))
      setStats(prev => prev ? { ...prev, pendingStores: prev.pendingStores - 1, activeStores: prev.activeStores + 1 } : prev)
      showToast("Tienda aprobada")
    }
  }

  async function handleRejectStore(id: string) {
    const ok = await adminRejectStore(id, "Rechazada por administrador")
    if (ok) {
      setPendingStores(prev => prev.filter(s => s.id !== id))
      setStats(prev => prev ? { ...prev, pendingStores: prev.pendingStores - 1 } : prev)
      showToast("Tienda rechazada")
    }
  }

  async function handleApproveProduct(id: string) {
    const ok = await adminApproveProduct(id)
    if (ok) {
      setPendingProducts(prev => prev.filter(p => p.id !== id))
      setStats(prev => prev ? { ...prev, pendingProducts: prev.pendingProducts - 1 } : prev)
      showToast("Producto aprobado")
    }
  }

  async function handleRejectProduct(id: string) {
    const ok = await adminRejectProduct(id, "Rechazado por administrador")
    if (ok) {
      setPendingProducts(prev => prev.filter(p => p.id !== id))
      setStats(prev => prev ? { ...prev, pendingProducts: prev.pendingProducts - 1 } : prev)
      showToast("Producto rechazado")
    }
  }

  function toggleFlag(key: string) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        <span className="ml-3 text-[11px] text-slate-400">Cargando dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-[11px] text-red-400 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-slate-800/50 text-[10px] font-bold text-slate-300 hover:bg-slate-700/50 transition-colors">
          Reintentar
        </button>
      </div>
    )
  }

  const statCards = [
    { label: "Tiendas Totales", value: stats?.totalStores ?? 0, icon: Store, color: "text-[#D4AF37]" },
    { label: "Pendientes Revisión", value: stats?.pendingStores ?? 0, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Tiendas Activas", value: stats?.activeStores ?? 0, icon: Store, color: "text-emerald-400" },
    { label: "Total Productos", value: stats?.totalProducts ?? 0, icon: Package, color: "text-[#197BD2]" },
    { label: "Productos Pendientes", value: stats?.pendingProducts ?? 0, icon: Package, color: "text-amber-400" },
    { label: "Total Pedidos", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "text-purple-400" },
    { label: "Ingresos Totales", value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign, color: "text-[#D4AF37]" },
  ]

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      <h1 className="text-lg font-black text-[#D4AF37] mb-6">Marketplace Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-lg font-black">{s.value}</p>
            <p className="text-[9px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
          <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            Tiendas Pendientes ({pendingStores.length})
          </h2>
          {pendingStores.length === 0 ? (
            <p className="text-[10px] text-slate-500 py-4 text-center">No hay tiendas pendientes</p>
          ) : (
            <div className="space-y-2">
              {pendingStores.map((store) => (
                <div key={store.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/20 border border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{store.name}</p>
                    <p className="text-[8px] text-slate-500">{store.country} · {new Date(store.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleApproveStore(store.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" title="Aprobar">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button onClick={() => handleRejectStore(store.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Rechazar">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
          <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-[#197BD2]" />
            Productos Pendientes ({pendingProducts.length})
          </h2>
          {pendingProducts.length === 0 ? (
            <p className="text-[10px] text-slate-500 py-4 text-center">No hay productos pendientes</p>
          ) : (
            <div className="space-y-2">
              {pendingProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/20 border border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{product.name}</p>
                    <p className="text-[8px] text-slate-500">{(product as { store?: { name?: string } }).store?.name} · {formatPrice(product.final_price)}</p>
                  </div>
                  <button onClick={() => handleApproveProduct(product.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" title="Aprobar">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button onClick={() => handleRejectProduct(product.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Rechazar">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
        <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-[#197BD2]" />
          Feature Flags
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(flags).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleFlag(key)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:border-slate-600/50 transition-colors text-left"
            >
              <span className="text-[9px] text-slate-300 font-mono">{key}</span>
              <div className={`w-8 h-4 rounded-full relative shrink-0 ml-2 ${value ? "bg-emerald-500" : "bg-slate-600"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "right-0.5" : "left-0.5"}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
