'use client'

import Link from "next/link"
import { ArrowLeft, Shield, Users, FileText, BarChart3, Activity, Settings, AlertTriangle, MessageSquare, UserCheck, Eye, TrendingUp, Cpu, Zap, Bot, CheckCircle, Clock, RefreshCw, DollarSign, Gem, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession, hasRole } from "@/lib/auth"
import { isSupabaseAvailable } from "@/lib/supabase"
import {
  fetchPlatformStats,
  fetchRecentReports,
  fetchAuditLogs,
  fetchPendingStores,
  fetchPendingProducts,
  type PlatformStats,
  type AdminReport,
  type AuditLogEntry,
} from "@/lib/admin/data"

export default function AdminPage() {
  usePageTitle("Automation Center — ZAFIRO")
  const router = useRouter()
  const [tab, setTab] = useState("automation")
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalQuestions: 0, totalCommunities: 0,
    ptsCirculating: 0, pendingReports: 0, pendingStoreApprovals: 0,
    pendingProductApprovals: 0, totalOrders: 0, totalRevenue: 0,
  })
  const [reports, setReports] = useState<AdminReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [pendingStores, setPendingStores] = useState<any[]>([])
  const [pendingProducts, setPendingProducts] = useState<any[]>([])

  useEffect(() => {
    const session = getSession()
    if (!session || (!hasRole("admin") && !hasRole("superadmin"))) {
      router.replace("/")
      return
    }
    loadData()
  }, [router])

  async function loadData() {
    setLoading(true)
    setDbConnected(isSupabaseAvailable())

    const [statsData, reportsData, logsData, storesData, productsData] = await Promise.all([
      fetchPlatformStats(),
      fetchRecentReports(10),
      fetchAuditLogs(20),
      fetchPendingStores(),
      fetchPendingProducts(),
    ])

    setStats(statsData)
    setReports(reportsData)
    setAuditLogs(logsData)
    setPendingStores(storesData)
    setPendingProducts(productsData)
    setLoading(false)
  }

  const automationStats = [
    { label: "Usuarios Registrados", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-[#00D9FF]" },
    { label: "Preguntas Totales", value: stats.totalQuestions.toLocaleString(), icon: MessageSquare, color: "text-emerald-400" },
    { label: "Comunidades Activas", value: stats.totalCommunities.toLocaleString(), icon: Activity, color: "text-purple-400" },
    { label: "Pendientes Aprobación", value: (stats.pendingStoreApprovals + stats.pendingProductApprovals).toString(), icon: AlertTriangle, color: "text-amber-400" },
    { label: "Pedidos Totales", value: stats.totalOrders.toLocaleString(), icon: DollarSign, color: "text-emerald-400" },
    { label: "Reportes Pendientes", value: stats.pendingReports.toString(), icon: FileText, color: "text-red-400" },
    { label: "Ingresos Totales", value: `$${stats.totalRevenue.toLocaleString()}`, icon: Gem, color: "text-[#00D9FF]" },
    { label: "Estado DB", value: dbConnected ? "Conectada" : "Sin conexión", icon: dbConnected ? CheckCircle : AlertTriangle, color: dbConnected ? "text-emerald-400" : "text-red-400" },
  ]

  const systemMetrics = [
    { name: "Estado de Supabase", value: dbConnected ? "Conectado" : "Sin conectar", status: dbConnected ? "Saludable" : "Requiere credenciales", color: dbConnected ? "text-emerald-400" : "text-red-400" },
    { name: "RLS Policies Activas", value: "75 tablas", status: "Migrado", color: "text-emerald-400" },
    { name: "Stripe Conectado", value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Sí" : "No", status: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Operativo" : "Requiere setup", color: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "text-emerald-400" : "text-amber-400" },
    { name: "Tiendas Pendientes", value: stats.pendingStoreApprovals.toString(), status: stats.pendingStoreApprovals === 0 ? "Limpio" : "Requiere acción", color: stats.pendingStoreApprovals === 0 ? "text-emerald-400" : "text-amber-400" },
    { name: "Productos Pendientes", value: stats.pendingProductApprovals.toString(), status: stats.pendingProductApprovals === 0 ? "Limpio" : "Requiere acción", color: stats.pendingProductApprovals === 0 ? "text-emerald-400" : "text-amber-400" },
    { name: "Reportes Activos", value: stats.pendingReports.toString(), status: stats.pendingReports === 0 ? "Limpio" : "Requiere moderación", color: stats.pendingReports === 0 ? "text-emerald-400" : "text-amber-400" },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-cyan-600 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Automation Center</h1>
            <p className="text-[10px] font-mono text-slate-500">Centro de Automatización — Acceso restringido</p>
          </div>
        </div>

        <nav className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {[
            { id: "automation", label: "Overview", icon: Cpu },
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "usuarios", label: "Usuarios", icon: Users },
            { id: "reportes", label: "Reportes", icon: AlertTriangle },
            { id: "moderacion", label: "Moderación", icon: Eye },
            { id: "config", label: "Configuración", icon: Settings },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === t.id
                    ? "bg-gradient-to-r from-[#00D9FF]/15 to-blue-600/10 text-[#00D9FF] border border-[#00D9FF]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            )
          })}
        </nav>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-[#00D9FF] animate-spin" />
            <span className="ml-3 text-sm text-slate-400">Cargando datos...</span>
          </div>
        )}

        {!loading && tab === "automation" && (
          <div>
            {!dbConnected && (
              <div className="mb-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-amber-400">Supabase No Conectado</h3>
                </div>
                <p className="text-[10px] text-slate-400">
                  Las estadísticas muestran 0 porque las credenciales de Supabase no están configuradas.
                  Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local para activar datos reales.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {automationStats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="p-3 rounded-2xl glass">
                    <Icon className={`w-4 h-4 ${s.color} mb-1.5`} />
                    <p className="text-lg font-black">{s.value}</p>
                    <p className="text-[8px] text-slate-400">{s.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-[#00D9FF]" /> Rendimiento del Sistema</h3>
                <div className="space-y-2">
                  {systemMetrics.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
                      <span className="text-[9px] text-slate-400">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-white">{m.value}</span>
                        <span className={`text-[7px] ${m.color}`}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-[#00D9FF]" /> Actividad Reciente</h3>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <p className="text-[9px] text-slate-500 text-center py-4">No hay actividad registrada</p>
                  ) : (
                    auditLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-white truncate">{log.action}</p>
                          <p className="text-[7px] text-slate-500">{log.target_type}</p>
                        </div>
                        <span className="text-[6px] text-slate-600 shrink-0">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "dashboard" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Usuarios", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-[#00D9FF]" },
                { label: "Preguntas", value: stats.totalQuestions.toLocaleString(), icon: MessageSquare, color: "text-emerald-400" },
                { label: "Comunidades", value: stats.totalCommunities.toLocaleString(), icon: Activity, color: "text-purple-400" },
                { label: "Pedidos", value: stats.totalOrders.toLocaleString(), icon: DollarSign, color: "text-amber-400" },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="p-4 rounded-2xl glass">
                    <Icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="p-5 rounded-2xl glass mb-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Reportes Recientes</h2>
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4">No hay reportes pendientes</p>
                ) : (
                  reports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{r.user}</p>
                          <p className="text-[9px] text-slate-500">{r.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          r.status === "pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>{r.status}</span>
                        <p className="text-[8px] text-slate-600 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3">Tiendas Pendientes ({pendingStores.length})</h3>
                {pendingStores.length === 0 ? (
                  <p className="text-[9px] text-slate-500">No hay tiendas pendientes</p>
                ) : (
                  <div className="space-y-1.5">
                    {pendingStores.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="p-2 rounded-lg bg-slate-800/20 border border-slate-700/30 text-[9px]">
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-slate-500">{s.country} — {new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3">Productos Pendientes ({pendingProducts.length})</h3>
                {pendingProducts.length === 0 ? (
                  <p className="text-[9px] text-slate-500">No hay productos pendientes</p>
                ) : (
                  <div className="space-y-1.5">
                    {pendingProducts.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="p-2 rounded-lg bg-slate-800/20 border border-slate-700/30 text-[9px]">
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-slate-500">${p.base_price} — {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "usuarios" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Gestión de Usuarios</h2>
            <p className="text-[10px] text-slate-400 mb-4">
              {stats.totalUsers} usuarios registrados en la plataforma.
            </p>
            <div className="text-[10px] text-slate-500">
              La gestión de usuarios se realiza desde Supabase Dashboard o se puede expandir esta sección con paginación.
            </div>
          </div>
        )}

        {!loading && tab === "reportes" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Centro de Reportes</h2>
            <p className="text-[10px] text-slate-400 mb-4">
              {stats.pendingReports} reportes pendientes de revisión.
            </p>
            {reports.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">No hay reportes</p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-white">{r.user}</p>
                      <p className="text-[9px] text-slate-500">{r.reason}</p>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      r.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && tab === "moderacion" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Historial de Auditoría</h2>
            <p className="text-[10px] text-slate-400 mb-4">
              Últimas acciones registradas en el sistema.
            </p>
            {auditLogs.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">No hay actividad registrada</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-white truncate">{log.action}</p>
                      <p className="text-[7px] text-slate-500">{log.target_type} — {log.target_id?.slice(0, 8)}</p>
                    </div>
                    <span className="text-[6px] text-slate-600 shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && tab === "config" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Configuración de la Plataforma</h2>
            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                <p className="text-[10px] font-bold text-white mb-1">Stripe</p>
                <p className="text-[9px] text-slate-400">
                  {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Configurado" : "No configurado"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                <p className="text-[10px] font-bold text-white mb-1">Supabase</p>
                <p className="text-[9px] text-slate-400">
                  {dbConnected ? "Conectado" : "Sin conectar — configurar credenciales"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                <p className="text-[10px] font-bold text-white mb-1">RLS (Row Level Security)</p>
                <p className="text-[9px] text-slate-400">75 tablas migradas — políticas reforzadas en migración 00035</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                <p className="text-[10px] font-bold text-white mb-1">Dominios</p>
                <p className="text-[9px] text-slate-400">
                  zafiro.msmmystore.com ✅ · eliana.msmmystore.com ✅ · market.msmmystore.com (rewrite activo)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
