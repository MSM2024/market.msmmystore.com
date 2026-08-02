'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, Plus, Eye, Pause, Trash2, Loader2, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { formatPrice, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/lib/marketplace/constants"
import type { MarketplaceProduct } from "@/lib/marketplace/types"

export default function DashboardProductosPage() {
  usePageTitle("Productos — Dashboard")
  const session = getSession()
  const router = useRouter()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!session?.id) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable()) { setLoading(false); return }

    async function load() {
      try {
        const { data: storeData } = await supabase!
          .from("marketplace_stores")
          .select("id")
          .eq("owner_id", session!.id)
          .single()
        if (!storeData) { setLoading(false); return }

        const { data } = await supabase!
          .from("marketplace_products")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false })
        if (data) setProducts(data)
      } catch { setError("Error al cargar productos") }
      setLoading(false)
    }
    load()
  }, [session?.id])

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { error } = await supabase.from("marketplace_products").delete().eq("id", id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
  }

  async function handlePause(id: string, currentStatus: string) {
    const supabase = getSupabaseClient()
    if (!supabase) return
    const newStatus = currentStatus === "paused" ? "published" : "paused"
    const { error } = await supabase.from("marketplace_products").update({ status: newStatus }).eq("id", id)
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as MarketplaceProduct["status"] } : p))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#197BD2]" />
          <h1 className="text-lg font-black text-white">Mis Productos</h1>
        </div>
        <Link href="/marketplace/vender/crear-producto" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#197BD2] text-white text-[10px] font-bold hover:bg-[#197BD2]/90 transition-colors">
          <Plus className="w-3 h-3" /> Nuevo Producto
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-3">No tienes productos aún</p>
          <Link href="/marketplace/vender/crear-producto" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#197BD2] text-white text-xs font-bold">
            <Plus className="w-4 h-4" /> Crear Primer Producto
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-[#197BD2]/20 transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-800/30 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black text-[#197BD2]">{formatPrice(product.final_price, product.currency)}</span>
                  <span className="text-[8px] text-slate-500">{product.stock} en stock</span>
                  <span className="text-[8px] text-slate-500">{product.sales_count} ventas</span>
                </div>
              </div>
              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${PRODUCT_STATUS_COLORS[product.status]}`}>
                {PRODUCT_STATUS_LABELS[product.status]}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => router.push(`/marketplace/productos/${product.slug}`)} className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"><Eye className="w-3.5 h-3.5 text-slate-400" /></button>
                <button onClick={() => handlePause(product.id, product.status)} className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <Pause className={`w-3.5 h-3.5 ${product.status === "paused" ? "text-emerald-400" : "text-amber-400"}`} />
                </button>
                <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
