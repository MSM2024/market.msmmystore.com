'use client'

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, XCircle, ArrowUpRight, Search, Loader2, MessageSquare } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { formatPrice, DISPUTE_STATUS_LABELS, DISPUTE_REASON_LABELS } from "@/lib/marketplace/constants"
import { adminResolveDispute, adminRejectDispute, adminEscalateDispute } from "@/lib/marketplace/client"
import type { MarketplaceDispute, DisputeStatus } from "@/lib/marketplace/types"

const DISPUTE_STATUS_COLORS: Record<DisputeStatus, string> = {
  open: "text-red-400 bg-red-500/10 border-red-500/20",
  under_review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  awaiting_response: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  escalated: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  closed: "text-slate-400 bg-slate-500/10 border-slate-500/20",
}

const DISPUTE_STATUS_ICON_COLOR: Record<DisputeStatus, string> = {
  open: "text-red-400",
  under_review: "text-amber-400",
  awaiting_response: "text-amber-400",
  resolved: "text-emerald-400",
  escalated: "text-purple-400",
  closed: "text-slate-400",
}

const STATUS_TABS = [
  { key: "all", label: "Todas" },
  { key: "open", label: "Abiertas" },
  { key: "under_review", label: "En Revisión" },
  { key: "resolved", label: "Resueltas" },
  { key: "escalated", label: "Escaladas" },
]

export default function AdminMarketplaceDisputasPage() {
  usePageTitle("Admin Disputas — Marketplace")

  const [disputes, setDisputes] = useState<MarketplaceDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [toast, setToast] = useState("")
  const [refundModal, setRefundModal] = useState<{ disputeId: string; maxAmount: number } | null>(null)
  const [refundAmount, setRefundAmount] = useState("")

  useEffect(() => { loadDisputes() }, [])

  async function loadDisputes() {
    if (!isSupabaseAvailable()) { setLoading(false); return }
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    const { data, error } = await supabase.from("marketplace_disputes").select("*").order("created_at", { ascending: false })
    if (error) {
      console.error("Disputes table may not exist:", error)
      setDisputes([])
    } else {
      setDisputes((data || []) as MarketplaceDispute[])
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function handleResolve(id: string) {
    const dispute = disputes.find(d => d.id === id)
    setRefundModal({ disputeId: id, maxAmount: dispute?.refund_amount || 0 })
    setRefundAmount(dispute?.refund_amount?.toString() || "")
  }

  async function confirmResolve() {
    if (!refundModal) return
    const amount = parseFloat(refundAmount) || 0
    const ok = await adminResolveDispute(refundModal.disputeId, amount)
    if (ok) {
      setDisputes(prev => prev.map(d =>
        d.id === refundModal.disputeId
          ? { ...d, status: "resolved" as DisputeStatus, refund_amount: amount }
          : d
      ))
      showToast("Disputa resuelta")
    } else {
      showToast("Error al resolver disputa")
    }
    setRefundModal(null)
  }

  async function handleReject(id: string) {
    const ok = await adminRejectDispute(id)
    if (ok) {
      setDisputes(prev => prev.map(d =>
        d.id === id ? { ...d, status: "closed" as DisputeStatus } : d
      ))
      showToast("Disputa rechazada")
    } else {
      showToast("Error al rechazar disputa")
    }
  }

  async function handleEscalate(id: string) {
    const ok = await adminEscalateDispute(id)
    if (ok) {
      setDisputes(prev => prev.map(d =>
        d.id === id ? { ...d, status: "escalated" as DisputeStatus } : d
      ))
      showToast("Disputa escalada")
    } else {
      showToast("Error al escalar disputa")
    }
  }

  const filtered = disputes.filter(d => {
    if (activeTab !== "all" && d.status !== activeTab) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
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

      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRefundModal(null)}>
          <div className="bg-[#0a0e1a] border border-slate-700/50 rounded-xl p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-white mb-2">Resolver Disputa</h3>
            <p className="text-[10px] text-slate-400 mb-3">Monto de reembolso:</p>
            <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} step="0.01" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#197BD2]/50 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRefundModal(null)} className="flex-1 py-2 rounded-lg bg-slate-800/50 text-[10px] font-bold text-slate-300 hover:bg-slate-700/50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmResolve} className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h1 className="text-lg font-black">Gestionar Disputas</h1>
        <span className="text-[10px] text-slate-500 ml-auto">{filtered.length} disputas</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(tab => {
          const count = tab.key === "all" ? disputes.length : disputes.filter(d => d.status === tab.key).length
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${activeTab === tab.key ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:text-white"}`}>
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-[11px] text-slate-500">No hay disputas{activeTab !== "all" ? " con este estado" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(dispute => (
            <div key={dispute.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${DISPUTE_STATUS_ICON_COLOR[dispute.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-white">Orden: {dispute.order_id.slice(0, 8)}...</span>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${DISPUTE_STATUS_COLORS[dispute.status]}`}>
                      {DISPUTE_STATUS_LABELS[dispute.status]}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    <span className="text-[#D4AF37]">{DISPUTE_REASON_LABELS[dispute.reason] || dispute.reason}</span>
                  </p>
                  {dispute.description && (
                    <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{dispute.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-[#197BD2]">{formatPrice(dispute.refund_amount)}</p>
                  <p className="text-[8px] text-slate-500">{new Date(dispute.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/30">
                {(dispute.status === "open" || dispute.status === "under_review") && (
                  <>
                    <button onClick={() => handleResolve(dispute.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] font-bold text-emerald-400">Resolver</span>
                    </button>
                    <button onClick={() => handleReject(dispute.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                      <XCircle className="w-3 h-3 text-red-400" />
                      <span className="text-[9px] font-bold text-red-400">Rechazar</span>
                    </button>
                    <button onClick={() => handleEscalate(dispute.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                      <ArrowUpRight className="w-3 h-3 text-purple-400" />
                      <span className="text-[9px] font-bold text-purple-400">Escalar</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
