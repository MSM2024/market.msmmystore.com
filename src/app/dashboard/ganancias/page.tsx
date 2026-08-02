'use client'

import { useState, useEffect } from "react"
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { fetchStoreOrders } from "@/lib/marketplace/client"
import { formatPrice } from "@/lib/marketplace/constants"
import type { OrderWithItems } from "@/lib/marketplace/types"

export default function DashboardGananciasPage() {
  usePageTitle("Ganancias — Dashboard")
  const userId = getSession()?.id
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!userId) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable()) { setLoading(false); return }

    async function load() {
      try {
        const { data: storeData } = await supabase!
          .from("marketplace_stores")
          .select("id")
          .eq("owner_id", userId!)
          .single()
        if (!storeData) { setLoading(false); return }
        const data = await fetchStoreOrders(storeData.id)
        setOrders(data)
      } catch { setError("Error al cargar ganancias") }
      setLoading(false)
    }
    load()
  }, [userId])

  const completedOrders = orders.filter(o => ["paid", "completed", "delivered"].includes(o.status))
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthRevenue = completedOrders.filter(o => o.created_at >= monthStart).reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const commission = totalRevenue * 0.10
  const netProfit = totalRevenue - commission

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-[#D4AF37]" />
        <h1 className="text-lg font-black zafiro-gold-text">Ganancias</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Ventas Totales", value: formatPrice(totalRevenue), change: `${completedOrders.length} pedidos`, up: true },
          { label: "Este Mes", value: formatPrice(monthRevenue), change: new Date().toLocaleDateString("es-ES", { month: "long" }), up: true },
          { label: "Comisiones MSM", value: formatPrice(commission), change: "10%", up: false },
          { label: "Neto", value: formatPrice(netProfit), change: "tu ganancia", up: true },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <p className="text-[9px] text-slate-400 mb-1">{s.label}</p>
            <p className="text-lg font-black text-white">{s.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {s.up ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-slate-500" />}
              <span className={`text-[9px] font-bold ${s.up ? "text-emerald-400" : "text-slate-500"}`}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {completedOrders.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Sin datos de ganancias aún</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#197BD2]" /> Transacciones</h2>
          <div className="space-y-2">
            {completedOrders.slice(0, 10).map((order) => {
              const comm = (order.total_amount || 0) * 0.10
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">
                      {order.items?.map(i => i.product_name).join(", ") || order.order_number}
                    </p>
                    <p className="text-[8px] text-slate-500">{new Date(order.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-[#197BD2]">+{formatPrice(order.total_amount || 0, order.currency)}</p>
                    <p className="text-[8px] text-slate-500">-MSM {formatPrice(comm, order.currency)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
