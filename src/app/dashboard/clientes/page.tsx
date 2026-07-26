'use client'

import { useState, useEffect } from "react"
import { Users, Mail, Loader2, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { fetchStoreOrders } from "@/lib/marketplace/client"
import { formatPrice } from "@/lib/marketplace/constants"

interface Buyer {
  buyer_id: string
  orderCount: number
  totalSpent: number
}

export default function DashboardClientesPage() {
  usePageTitle("Clientes — Dashboard")
  const session = getSession()
  const [buyers, setBuyers] = useState<Buyer[]>([])
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

        const orders = await fetchStoreOrders(storeData.id)
        const map = new Map<string, Buyer>()
        for (const o of orders) {
          if (!o.buyer_id) continue
          const existing = map.get(o.buyer_id)
          if (existing) {
            existing.orderCount++
            if (["paid", "completed", "delivered"].includes(o.status)) existing.totalSpent += o.total_amount || 0
          } else {
            map.set(o.buyer_id, {
              buyer_id: o.buyer_id,
              orderCount: 1,
              totalSpent: ["paid", "completed", "delivered"].includes(o.status) ? (o.total_amount || 0) : 0,
            })
          }
        }
        setBuyers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent))
      } catch { setError("Error al cargar clientes") }
      setLoading(false)
    }
    load()
  }, [session?.id])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#197BD2] animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#197BD2]" />
        <h1 className="text-lg font-black text-white">Mis Clientes</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {buyers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Aún no tienes clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {buyers.map((buyer) => (
            <div key={buyer.buyer_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-[#197BD2]/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#197BD2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{buyer.buyer_id}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] text-slate-500 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{buyer.orderCount} pedidos</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-[#197BD2]">{formatPrice(buyer.totalSpent)}</p>
                <p className="text-[8px] text-slate-500">total gastado</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
