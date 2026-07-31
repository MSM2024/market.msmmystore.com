'use client'

import { useState, useEffect } from "react"
import { Package, CheckCircle, XCircle, Pause, Eye, Search, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { adminApproveProduct, adminRejectProduct, updateProduct } from "@/lib/marketplace/client"
import { formatPrice, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/lib/marketplace/constants"
import type { ProductWithStore, ProductStatus } from "@/lib/marketplace/types"

const STATUS_TABS = [
  { key: "all", label: "Todos" },
  { key: "pending_review", label: "Pendientes" },
  { key: "published", label: "Publicados" },
  { key: "paused", label: "Pausados" },
  { key: "rejected", label: "Rechazados" },
]

export default function AdminMarketplaceProductosPage() {
  usePageTitle("Admin Productos — Marketplace")

  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState("")

  async function loadProducts() {
    if (!isSupabaseAvailable()) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase.from("marketplace_products").select("*, store:marketplace_stores(name)").order("created_at", { ascending: false })
    setProducts((data || []) as ProductWithStore[])
    setLoading(false)
  }

  useEffect(() => { Promise.resolve().then(() => loadProducts()) }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function handleApprove(id: string) {
    const ok = await adminApproveProduct(id)
    if (ok) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: "published" as ProductStatus } : p))
      showToast("Producto aprobado")
    }
  }

  async function handleReject(id: string) {
    const ok = await adminRejectProduct(id, "Rechazado por administrador")
    if (ok) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" as ProductStatus } : p))
      showToast("Producto rechazado")
    }
  }

  async function handlePause(id: string) {
    const ok = await updateProduct(id, { status: "paused" })
    if (ok) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: "paused" as ProductStatus } : p))
      showToast("Producto pausado")
    }
  }

  const filtered = products.filter(p => {
    if (activeTab !== "all" && p.status !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || ((p as { store?: { name?: string } }).store?.name || "").toLowerCase().includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
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
        <Package className="w-5 h-5 text-[#197BD2]" />
        <h1 className="text-lg font-black">Gestionar Productos</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{filtered.length} productos</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(tab => {
          const count = tab.key === "all" ? products.length : products.filter(p => p.status === tab.key).length
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${activeTab === tab.key ? "bg-[#197BD2]/10 text-[#197BD2] border border-[#197BD2]/20" : "bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:text-white"}`}>
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos o tiendas..." className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#197BD2]/50" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800/50">
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Nombre</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden md:table-cell">Tienda</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Precio</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Estado</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden md:table-cell">Stock</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase hidden lg:table-cell">Ventas</th>
              <th className="pb-2 text-[9px] font-bold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-[10px] text-slate-500">No se encontraron productos</td></tr>
            ) : filtered.map(product => (
              <tr key={product.id} className="border-b border-slate-800/30 hover:bg-slate-800/10 transition-colors">
                <td className="py-3 pr-4">
                  <p className="text-[11px] font-bold text-white truncate max-w-[200px]">{product.name}</p>
                  <p className="text-[8px] text-slate-500">{product.sku}</p>
                </td>
                <td className="py-3 pr-4 hidden md:table-cell">
                  <span className="text-[10px] text-slate-300">{(product as { store?: { name?: string } }).store?.name || "—"}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[11px] font-bold text-[#197BD2]">{formatPrice(product.final_price)}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${PRODUCT_STATUS_COLORS[product.status]}`}>
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </span>
                </td>
                <td className="py-3 pr-4 hidden md:table-cell">
                  <span className={`text-[10px] ${product.stock <= 0 ? "text-red-400" : product.stock <= 5 ? "text-amber-400" : "text-slate-300"}`}>{product.stock}</span>
                </td>
                <td className="py-3 pr-4 hidden lg:table-cell">
                  <span className="text-[10px] text-slate-300">{product.sales_count}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    {product.status === "pending_review" && (
                      <>
                        <button onClick={() => handleApprove(product.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" title="Aprobar">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button onClick={() => handleReject(product.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Rechazar">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </>
                    )}
                    {product.status === "published" && (
                      <button onClick={() => handlePause(product.id)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors" title="Pausar">
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
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
