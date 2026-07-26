'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Store, Package, ShoppingCart, DollarSign, TrendingUp, Plus, Settings, Loader2, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { fetchSellerStats } from "@/lib/marketplace/client"
import { STORE_STATUS_LABELS, STORE_STATUS_COLORS, formatPrice } from "@/lib/marketplace/constants"
import type { MarketplaceStore } from "@/lib/marketplace/types"

export default function DashboardPage() {
  usePageTitle("Dashboard — ZAFIRO")
  const session = getSession()
  const [store, setStore] = useState<MarketplaceStore | null>(null)
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0, monthRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session?.id) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable()) { setLoading(false); return }

    async function load() {
      try {
        const { data: storeData } = await supabase!
          .from("marketplace_stores")
          .select("*")
          .eq("owner_id", session!.id)
          .single()
        if (storeData) {
          setStore(storeData)
          const s = await fetchSellerStats(storeData.id)
          setStats(s)
        }
      } catch (e) { setError("Error al cargar datos") }
      setLoading(false)
    }
    load()
  }, [session?.id])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  if (!session) return (
    <div className="text-center py-20">
      <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-400">Inicia sesión para ver tu dashboard</p>
      <Link href="/auth/login" className="inline-block mt-3 px-4 py-2 rounded-lg bg-[#197BD2] text-white text-xs font-bold">Iniciar Sesión</Link>
    </div>
  )

  if (error) return (
    <div className="text-center py-20">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-sm text-red-400">{error}</p>
    </div>
  )

  if (!store) return (
    <div className="text-center py-20">
      <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <h2 className="text-lg font-black text-white mb-2">Crea tu primera tienda</h2>
      <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
        Configura tu tienda en el marketplace y comienza a vender productos a millones de usuarios.
      </p>
      <Link href="/marketplace/crear-tienda" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#197BD2] text-white text-xs font-bold hover:bg-[#197BD2]/90 transition-colors">
        <Plus className="w-4 h-4" /> Crear Mi Tienda
      </Link>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#197BD2] to-[#D4AF37] flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white">{store.name}</h1>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${STORE_STATUS_COLORS[store.status]}`}>
            {STORE_STATUS_LABELS[store.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Productos", value: stats.totalProducts.toString(), icon: Package, color: "text-[#197BD2]" },
          { label: "Pedidos Pendientes", value: stats.pendingOrders.toString(), icon: ShoppingCart, color: "text-amber-400" },
          { label: "Ingresos del Mes", value: formatPrice(stats.monthRevenue), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Ingresos Totales", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-[#D4AF37]" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-[9px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/productos" className="flex items-center gap-3 p-4 rounded-xl bg-[#197BD2]/10 border border-[#197BD2]/20 hover:border-[#197BD2]/40 transition-all">
          <Package className="w-5 h-5 text-[#197BD2]" />
          <span className="text-[10px] font-bold text-[#197BD2]">Gestionar Productos</span>
        </Link>
        <Link href="/dashboard/pedidos" className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
          <ShoppingCart className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400">Ver Pedidos</span>
        </Link>
        <Link href="/dashboard/tienda" className="flex items-center gap-3 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all">
          <Settings className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-[10px] font-bold text-[#D4AF37]">Configurar Tienda</span>
        </Link>
        <Link href="/marketplace/vender/crear-producto" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <Plus className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">Crear Producto</span>
        </Link>
      </div>
    </div>
  )
}
