'use client'

import { useState, useEffect } from "react"
import { ShoppingCart, Package, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/marketplace/constants"
import type { OrderWithItems, OrderStatus } from "@/lib/marketplace/types"

const STATUS_TABS = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes", statuses: ["pending_confirmation", "pending_payment", "payment_under_review"] as OrderStatus[] },
  { key: "active", label: "Activas", statuses: ["paid", "approved", "processing", "shipped", "in_transit"] as OrderStatus[] },
  { key: "completed", label: "Completadas", statuses: ["completed", "delivered"] as OrderStatus[] },
  { key: "cancelled", label: "Canceladas", statuses: ["cancelled", "refunded", "refund_requested"] as OrderStatus[] },
]

const ORDER_STATUS_DOT: Record<string, string> = {
  cart: "bg-slate-400",
  pending_confirmation: "bg-amber-400",
  pending_payment: "bg-amber-400",
  payment_under_review: "bg-amber-400",
  paid: "bg-[#197BD2]",
  approved: "bg-[#197BD2]",
  processing: "bg-[#197BD2]",
  shipped: "bg-purple-400",
  in_transit: "bg-purple-400",
  out_for_delivery: "bg-purple-400",
  delivered: "bg-emerald-400",
  completed: "bg-emerald-400",
  cancelled: "bg-red-400",
  refunded: "bg-red-400",
  refund_requested: "bg-amber-400",
  disputed: "bg-red-400",
}

export default function AdminMarketplacePedidosPage() {
  usePageTitle("Admin Pedidos — Marketplace")

  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadOrders() {
    if (!isSupabaseAvailable()) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase.from("marketplace_orders").select("*, items:marketplace_order_items(*), store:marketplace_stores(name)").order("created_at", { ascending: false })
    setOrders((data || []) as OrderWithItems[])
    setLoading(false)
  }

  useEffect(() => { Promise.resolve().then(() => loadOrders()) }, [])

  const filtered = orders.filter(o => {
    if (activeTab !== "all") {
      const tab = STATUS_TABS.find(t => t.key === activeTab)
      if (tab && "statuses" in tab && tab.statuses) {
        if (!tab.statuses.includes(o.status)) return false
      }
    }
    if (search) {
      const q = search.toLowerCase()
      return o.order_number.toLowerCase().includes(q) || ((o as { store?: { name?: string } }).store?.name || "").toLowerCase().includes(q) || o.buyer_id.toLowerCase().includes(q)
    }
    return true
  })

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
        <h1 className="text-lg font-black">Pedidos del Marketplace</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{filtered.length} pedidos</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(tab => {
          let count: number
          if (tab.key === "all") {
            count = orders.length
          } else if ("statuses" in tab && tab.statuses) {
            count = orders.filter(o => tab.statuses!.includes(o.status)).length
          } else {
            count = 0
          }
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${activeTab === tab.key ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20" : "bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:text-white"}`}>
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por número, tienda o comprador..." className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#197BD2]/50" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[10px] text-slate-500">No se encontraron pedidos</div>
        ) : filtered.map(order => (
          <div key={order.id} className="rounded-xl bg-slate-900/30 border border-slate-800/50 overflow-hidden">
            <button onClick={() => toggleExpand(order.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800/10 transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${ORDER_STATUS_DOT[order.status] || "bg-slate-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold text-white">{order.order_number}</span>
                  <span className="text-[8px] text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[9px] text-slate-400">{(order as { store?: { name?: string } }).store?.name || "Tienda"} · {order.items?.length || 0} items</p>
              </div>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/30 shrink-0">
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="text-[11px] font-black text-[#197BD2] shrink-0">{formatPrice(order.total_amount)}</span>
              {expandedId === order.id ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </button>

            {expandedId === order.id && (
              <div className="border-t border-slate-800/30 p-3 bg-slate-800/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-[8px] text-slate-500 uppercase">Comprador</p>
                    <p className="text-[10px] text-white">{order.buyer_id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-500 uppercase">Subtotal</p>
                    <p className="text-[10px] text-white">{formatPrice(order.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-500 uppercase">Envío</p>
                    <p className="text-[10px] text-white">{formatPrice(order.shipping_cost)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-500 uppercase">Total</p>
                    <p className="text-[10px] text-white font-bold">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 mb-2">Items</p>
                    <div className="space-y-1.5">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/20">
                          <div className="w-8 h-8 rounded bg-slate-800/50 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{item.product_name}</p>
                            <p className="text-[8px] text-slate-500">Cant: {item.quantity} · Unit: {formatPrice(item.unit_price)}</p>
                          </div>
                          <span className="text-[10px] font-bold text-[#197BD2]">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
