'use client'

import { useState, useEffect } from "react"
import { ShoppingCart, Package, Loader2, AlertCircle, CheckCircle, Truck } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { fetchStoreOrders, updateOrderStatus } from "@/lib/marketplace/client"
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/marketplace/constants"
import type { OrderWithItems } from "@/lib/marketplace/types"

export default function DashboardPedidosPage() {
  usePageTitle("Pedidos — Dashboard")
  const session = getSession()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
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
          .select("id")
          .eq("owner_id", session!.id)
          .single()
        if (!storeData) { setLoading(false); return }
        const data = await fetchStoreOrders(storeData.id)
        setOrders(data)
      } catch { setError("Error al cargar pedidos") }
      setLoading(false)
    }
    load()
  }, [session?.id])

  async function handleStatus(orderId: string, status: string) {
    const ok = await updateOrderStatus(orderId, status)
    if (ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as OrderWithItems["status"] } : o))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
        <h1 className="text-lg font-black text-white">Mis Pedidos</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No hay pedidos aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800/30 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-500">{order.order_number}</p>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800/50 text-slate-400">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-white truncate">
                    {order.items?.map(i => `${i.product_name} x${i.quantity}`).join(", ") || "Sin items"}
                  </p>
                  <p className="text-[8px] text-slate-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-black text-[#197BD2]">{formatPrice(order.total_amount, order.currency)}</p>
                  <p className="text-[8px] text-slate-500">{order.buyer_id?.slice(0, 8)}...</p>
                </div>
              </div>
              {(order.status === "pending_confirmation" || order.status === "paid") && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/30">
                  {order.status === "pending_confirmation" && (
                    <button onClick={() => handleStatus(order.id, "approved")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Confirmar
                    </button>
                  )}
                  {order.status === "paid" && (
                    <button onClick={() => handleStatus(order.id, "shipped")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#197BD2]/10 text-[#197BD2] text-[9px] font-bold hover:bg-[#197BD2]/20 transition-colors">
                      <Truck className="w-3 h-3" /> Enviar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
