'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Store, Package, ShoppingCart, DollarSign, TrendingUp, Settings, Plus, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { fetchSellerStats } from "@/lib/marketplace/client"
import { formatPrice, STORE_STATUS_LABELS, STORE_STATUS_COLORS } from "@/lib/marketplace/constants"
import type { MarketplaceStore } from "@/lib/marketplace/types"

export default function SellerPortalPage() {
  usePageTitle("Mi Tienda — MSM Marketplace")
  const session = getSession()
  const [store, setStore] = useState<MarketplaceStore | null>(null)
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0, monthRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [hasStore, setHasStore] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable() || !session?.id) {
      Promise.resolve().then(() => setLoading(false))
      return
    }

    async function load() {
      const { data: storeData } = await supabase!
        .from("marketplace_stores")
        .select("*")
        .eq("owner_id", session!.id)
        .single()
      if (storeData) {
        setStore(storeData)
        setHasStore(true)
        const s = await fetchSellerStats(storeData.id)
        setStats(s)
      }
      setLoading(false)
    }
    load()
  }, [session?.id])

  if (loading) return (
    <div className="min-h-screen zafiro-page text-white flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  if (!hasStore) return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/marketplace" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Store className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h1 className="text-lg font-black">Vender en MSM</h1>
            <p className="text-[9px] text-slate-500">Crea tu tienda y comienza a vender</p>
          </div>
        </div>
        <div className="text-center py-16">
          <Store className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Crea tu tienda</h2>
          <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
            Configura tu espacio de venta en el marketplace MSM. Administra productos, pedidos y ganancias desde un solo lugar.
          </p>
          <Link href="/marketplace/crear-tienda" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#197BD2] text-white text-sm font-bold hover:bg-[#197BD2]/90 transition-colors">
            <Plus className="w-5 h-5" /> Crear Mi Tienda
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Store className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h1 className="text-lg font-black">{store!.name}</h1>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${STORE_STATUS_COLORS[store!.status]}`}>
              {STORE_STATUS_LABELS[store!.status]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Productos", value: stats.totalProducts.toString(), icon: Package, color: "text-[#197BD2]" },
            { label: "Pedidos", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-amber-400" },
            { label: "Ventas Totales", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-[#D4AF37]" },
            { label: "Este Mes", value: formatPrice(stats.monthRevenue), icon: TrendingUp, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[9px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link href="/dashboard/productos" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#197BD2]/10 border border-[#197BD2]/20 hover:border-[#197BD2]/40 transition-all">
            <Package className="w-5 h-5 text-[#197BD2]" />
            <span className="text-[9px] font-bold text-[#197BD2]">Productos</span>
          </Link>
          <Link href="/dashboard/pedidos" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all">
            <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold text-[#D4AF37]">Pedidos</span>
          </Link>
          <Link href="/dashboard/tienda" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400">Configurar</span>
          </Link>
        </div>

        {stats.pendingOrders > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
            <p className="text-[10px] font-bold text-amber-400">
              Tienes {stats.pendingOrders} pedido{stats.pendingOrders > 1 ? "s" : ""} pendiente{stats.pendingOrders > 1 ? "s" : ""} por procesar
            </p>
            <Link href="/dashboard/pedidos" className="text-[9px] text-amber-300 underline mt-1 inline-block">Ver pedidos</Link>
          </div>
        )}
      </div>
    </div>
  )
}
