'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, CheckSquare, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"

interface Action {
  id: string
  conversation_id: string
  action_type: string
  parameters: Record<string, unknown>
  status: "pending_confirmation" | "confirmed" | "executed" | "failed"
  result: Record<string, unknown> | null
  created_at: string
  executed_at: string | null
  eliana_conversations: { summary: string | null; created_at: string }
}

type FilterTab = "all" | "pending" | "completed" | "failed"

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; colors: string }> = {
  pending_confirmation: { label: "Pendiente", icon: AlertCircle, colors: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  confirmed: { label: "Confirmada", icon: Clock, colors: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  executed: { label: "Completada", icon: CheckCircle, colors: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  failed: { label: "Fallida", icon: XCircle, colors: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export default function TareasPage() {
  usePageTitle("Tareas — ELIANA")
  const session = getSession()
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>("all")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!session) { setLoading(false); return }
    fetch("/api/eliana/actions")
      .then(r => r.json())
      .then(data => setActions(data.actions || []))
      .catch(() => console.warn("ELIANA: Failed to load actions"))
      .finally(() => setLoading(false))
  }, [session])

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "Ahora"
    if (diffMin < 60) return `${diffMin}m`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}d`
    return d.toLocaleDateString("es", { day: "numeric", month: "short" })
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/eliana/actions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (json.action) setActions(prev => prev.map(a => a.id === id ? json.action : a))
    } catch {}
  }

  const filtered = actions.filter(a => {
    if (tab === "all") return true
    if (tab === "pending") return a.status === "pending_confirmation" || a.status === "confirmed"
    if (tab === "completed") return a.status === "executed"
    if (tab === "failed") return a.status === "failed"
    return true
  })

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: actions.length },
    { key: "pending", label: "Pendientes", count: actions.filter(a => a.status === "pending_confirmation" || a.status === "confirmed").length },
    { key: "completed", label: "Completadas", count: actions.filter(a => a.status === "executed").length },
    { key: "failed", label: "Fallidas", count: actions.filter(a => a.status === "failed").length },
  ]

  const emptyMessages: Record<FilterTab, { title: string; desc: string }> = {
    all: { title: "No hay tareas", desc: "ELIANA creará tareas basadas en tus conversaciones" },
    pending: { title: "No hay tareas pendientes", desc: "Todas las tareas han sido procesadas" },
    completed: { title: "No hay tareas completadas", desc: "Aún no se ha completado ninguna tarea" },
    failed: { title: "No hay tareas fallidas", desc: "Ninguna tarea ha fallado" },
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/chat" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Chat
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <h1 className="text-xl font-black mb-1">Tareas</h1>
        <p className="text-xs text-slate-400 mb-6">Tareas creadas o sugeridas por ELIANA</p>

        <div className="flex gap-2 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                tab === t.key
                  ? "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {t.label} {t.count > 0 && <span className="text-[9px] opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl glass border border-slate-800/30 text-center">
            <CheckSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500">{emptyMessages[tab].title}</p>
            <p className="text-[10px] text-slate-600 mt-1">{emptyMessages[tab].desc}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(action => {
              const cfg = statusConfig[action.status] || statusConfig.pending_confirmation
              const StatusIcon = cfg.icon
              return (
                <div
                  key={action.id}
                  className="p-4 rounded-2xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-bold text-white truncate">
                          {action.action_type}
                        </h3>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${cfg.colors}`}>
                          <StatusIcon className="w-2.5 h-2.5" /> {cfg.label}
                        </span>
                      </div>
                      {action.parameters && Object.keys(action.parameters).length > 0 && (
                        <p className="text-[10px] text-slate-500 truncate mb-1">
                          {JSON.stringify(action.parameters).slice(0, 150)}
                        </p>
                      )}
                      {action.result && (
                        <p className="text-[10px] text-slate-500 truncate mb-1">
                          Resultado: {JSON.stringify(action.result).slice(0, 150)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatDate(action.created_at)}
                        </span>
                        {action.executed_at && (
                          <span className="text-[9px] text-slate-600 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> Ejecutada {formatDate(action.executed_at)}
                          </span>
                        )}
                        {action.eliana_conversations?.summary && (
                          <Link
                            href={`/eliana/chat?conversation=${action.conversation_id}`}
                            className="text-[9px] text-[#00D9FF] hover:underline truncate"
                          >
                            {action.eliana_conversations.summary}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {action.status === "pending_confirmation" && (
                        <button
                          onClick={() => updateStatus(action.id, "confirmed")}
                          className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Confirmar
                        </button>
                      )}
                      {action.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(action.id, "executed")}
                          className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold hover:bg-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Completar
                        </button>
                      )}
                      {action.status === "executed" && (
                        <span className="text-[9px] text-emerald-500 font-bold px-1">Hecho</span>
                      )}
                      {action.status === "failed" && (
                        <button
                          onClick={() => updateStatus(action.id, "pending_confirmation")}
                          className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Reintentar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
