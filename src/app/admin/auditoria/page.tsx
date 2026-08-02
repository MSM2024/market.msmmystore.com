'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { ShieldCheck, Search, Download, RefreshCw, Loader2, Database, Store, Bot, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { hasRole, refreshSession } from "@/lib/auth"
import {
  fetchAuditStats,
  fetchUnifiedAuditLogs,
  type AuditSource,
  type UnifiedAuditEntry,
  type AuditStats,
} from "@/lib/admin/data"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"

const SOURCE_LABELS: Record<AuditSource, string> = {
  sistema: "Sistema",
  marketplace: "Marketplace",
  eliana: "ELIANA",
}

const SOURCE_STYLES: Record<AuditSource, string> = {
  sistema: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  marketplace: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  eliana: "bg-violet-500/15 text-violet-300 border-violet-500/30",
}

const PAGE_SIZE = 50

function shortId(id?: string): string {
  if (!id) return "—"
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default function AdminAuditoriaPage() {
  usePageTitle("Auditoría — ZAFIRO")
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [source, setSource] = useState<AuditSource | "all">("all")
  const [search, setSearch] = useState("")
  const [entries, setEntries] = useState<UnifiedAuditEntry[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState(false)

  const load = useCallback(async (s: AuditSource | "all", p: number) => {
    setLoading(true)
    setError(false)
    const [logs, counts] = await Promise.all([
      fetchUnifiedAuditLogs({ source: s, limit: PAGE_SIZE, offset: p * PAGE_SIZE }),
      fetchAuditStats(),
    ])
    setEntries(logs)
    setStats(counts)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshSession().then((session) => {
      if (!session || (!hasRole("owner") && !hasRole("admin") && !hasRole("superadmin"))) {
        setUnauthorized(true)
        setLoading(false)
        return
      }
      Promise.resolve().then(() => load(source, page))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeSource = (s: AuditSource | "all") => {
    setSource(s)
    setPage(0)
    load(s, 0)
  }

  const changePage = (p: number) => {
    setPage(p)
    load(source, p)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      `${e.action} ${e.actor_email || ""} ${e.resource_type || ""} ${e.details || ""}`.toLowerCase().includes(q)
    )
  }, [entries, search])

  const exportCsv = () => {
    const header = "fecha,fuente,accion,actor,recurso,detalle"
    const lines = filtered.map((e) => {
      const cells = [
        e.created_at,
        SOURCE_LABELS[e.source],
        e.action,
        e.actor_email || e.actor_id || "",
        `${e.resource_type || ""} ${shortId(e.resource_id)}`,
        (e.details || "").replace(/"/g, "'"),
      ]
      return cells.map((c) => `"${c}"`).join(",")
    })
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zafiro-auditoria-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
    </div>
  )

  if (unauthorized) return (
    <div className="max-w-md mx-auto px-4 py-20">
      <EmptyState
        icon={ShieldCheck}
        title="Acceso restringido"
        description="Solo los administradores pueden consultar la bitácora de auditoría."
      />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#050816]" />
          </div>
          <div>
            <h1 className="text-2xl font-black zafiro-gold-text">Auditoría</h1>
            <p className="text-sm text-slate-400">Bitácora de acciones sensibles del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/15 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
          <button onClick={() => load(source, page)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/15 transition-colors" aria-label="Recargar auditoría">
            <RefreshCw className="w-3.5 h-3.5" /> Recargar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          { key: "sistema", label: "Sistema", icon: Database },
          { key: "marketplace", label: "Marketplace", icon: Store },
          { key: "eliana", label: "ELIANA", icon: Bot },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => changeSource(key)}
            className={`rounded-2xl p-4 text-left border transition-colors ${
              source === key ? "bg-white/10 border-[#D4AF37]/40" : "bg-white/5 border-white/10 hover:bg-white/8"
            }`}
          >
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5">
              <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <p className="text-xl font-black text-white">{stats?.[key] ?? "—"}</p>
            <p className="text-[10px] text-slate-500">registros</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {(["all", "sistema", "marketplace", "eliana"] as const).map((s) => (
            <button
              key={s}
              onClick={() => changeSource(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                source === s ? "bg-[#D4AF37] text-[#050816]" : "text-slate-400 hover:text-white"
              }`}
            >
              {s === "all" ? "Todas" : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar acción, actor, recurso…"
            aria-label="Buscar en la bitácora"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
          />
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={() => load(source, page)} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <EmptyState
            icon={Activity}
            title={search ? "Sin coincidencias" : "No hay registros de auditoría"}
            description={search ? "Prueba con otro término de búsqueda." : "Las acciones sensibles aparecerán aquí cuando se registren."}
          />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 font-bold">Fuente</th>
                    <th className="px-4 py-3 font-bold">Acción</th>
                    <th className="px-4 py-3 font-bold">Actor</th>
                    <th className="px-4 py-3 font-bold">Recurso</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={`${e.source}-${e.id}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(e.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${SOURCE_STYLES[e.source]}`}>
                          {SOURCE_LABELS[e.source]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{e.action}</td>
                      <td className="px-4 py-3 text-slate-300">{e.actor_email || shortId(e.actor_id)}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {e.resource_type ? `${e.resource_type} ${shortId(e.resource_id)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-[11px] text-slate-500">
              {filtered.length === PAGE_SIZE ? `Primeros ${PAGE_SIZE} · página ${page + 1}` : `${filtered.length} registros · página ${page + 1}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <button
                onClick={() => changePage(page + 1)}
                disabled={filtered.length < PAGE_SIZE}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
