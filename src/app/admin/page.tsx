'use client'

import Link from "next/link"
import { ArrowLeft, Shield, Users, FileText, BarChart3, Activity, Settings, AlertTriangle, MessageSquare, Eye, Cpu, Bot, CheckCircle, XCircle, RefreshCw, Gem, Search, Store, Package, X, Check, ChevronLeft, ChevronRight, BookOpen, Database, Server, ShoppingCart } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { hasRole, refreshSession } from "@/lib/auth"
import { isSupabaseAvailable } from "@/lib/supabase"
import {
  fetchPlatformStats,
  fetchRecentReports,
  fetchAuditLogs,
  fetchPendingStores,
  fetchPendingProducts,
  fetchUsers,
  resolveReport,
  dismissReport,
  type PlatformStats,
  type AdminReport,
  type AuditLogEntry,
  type AdminUser,
} from "@/lib/admin/data"
import {
  adminApproveStore,
  adminRejectStore,
  adminApproveProduct,
  adminRejectProduct,
} from "@/lib/marketplace/client"
import type { MarketplaceStore, MarketplaceProduct } from "@/lib/marketplace/types"

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm transition-all ${
      type === "success" ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
    }`}>
      {message}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    superadmin: "bg-red-500/20 text-red-300 border-red-500/30",
    admin: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    finance: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    kyc: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    inventory: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    support: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    auditor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  }
  const cls = colors[role] || "bg-slate-800/50 text-slate-400 border-slate-700/50"
  return <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cls}`}>{role}</span>
}

const SUB_ADMIN_PAGES = [
  { href: "/admin/marketplace", label: "Marketplace", icon: ShoppingCart, desc: "Tiendas, productos, pedidos", color: "text-[#D4AF37]" },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: BookOpen, desc: "Documentos y chunks", color: "text-emerald-400" },
  { href: "/admin/eliana", label: "ELIANA", icon: Bot, desc: "Dashboard de IA", color: "text-[#00D9FF]" },
  { href: "/admin/biblioteca-importacion", label: "Biblioteca", icon: Database, desc: "Importación y libros", color: "text-purple-400" },
  { href: "/admin/system-status", label: "System Status", icon: Server, desc: "Monitoreo de componentes", color: "text-amber-400" },
  { href: "/admin/auditoria", label: "Auditoría", icon: Shield, desc: "Bitácora de acciones sensibles", color: "text-slate-300" },
]

export default function AdminPage() {
  usePageTitle("Automation Center — ZAFIRO")
  const router = useRouter()
  const [tab, setTab] = useState("automation")
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalQuestions: 0, totalCommunities: 0,
    ptsCirculating: 0, pendingReports: 0, pendingStoreApprovals: 0,
    pendingProductApprovals: 0, totalOrders: 0, totalRevenue: 0,
  })
  const [reports, setReports] = useState<AdminReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [pendingStores, setPendingStores] = useState<MarketplaceStore[]>([])
  const [pendingProducts, setPendingProducts] = useState<MarketplaceProduct[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [userPage, setUserPage] = useState(0)
  const [userTotal, setUserTotal] = useState(0)
  const [auditFilter, setAuditFilter] = useState("all")
  const USERS_PER_PAGE = 20

  async function loadData() {
    setLoading(true)
    setDbConnected(isSupabaseAvailable())

    const [statsData, reportsData, logsData, storesData, productsData] = await Promise.all([
      fetchPlatformStats(),
      fetchRecentReports(10),
      fetchAuditLogs(50),
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

  const loadUsers = useCallback(async () => {
    if (!dbConnected) return
    const data = await fetchUsers(USERS_PER_PAGE, userPage * USERS_PER_PAGE)
    setUsers(data)
    setUserTotal(stats.totalUsers)
  }, [dbConnected, userPage, stats.totalUsers])

  useEffect(() => {
    refreshSession().then(session => {
      if (!session || (!hasRole("owner") && !hasRole("admin") && !hasRole("superadmin"))) {
        router.replace("/")
        return
      }
    })
    Promise.resolve().then(() => loadData())
  }, [router])

  useEffect(() => {
    if (tab === "usuarios") { Promise.resolve().then(() => loadUsers()) }
  }, [tab, loadUsers])

  const automationStats = [
    { label: "Usuarios Registrados", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-[#00D9FF]" },
    { label: "Preguntas Totales", value: stats.totalQuestions.toLocaleString(), icon: MessageSquare, color: "text-emerald-400" },
    { label: "Comunidades Activas", value: stats.totalCommunities.toLocaleString(), icon: Activity, color: "text-purple-400" },
    { label: "Pendientes Aprobación", value: (stats.pendingStoreApprovals + stats.pendingProductApprovals).toString(), icon: AlertTriangle, color: "text-amber-400" },
    { label: "Pedidos Totales", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-emerald-400" },
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

  const filteredAuditLogs = auditFilter === "all" ? auditLogs : auditLogs.filter(l => l.action === auditFilter)
  const auditActionTypes = [...new Set(auditLogs.map(l => l.action))]

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ message: msg, type })
  }

  async function handleApproveStore(id: string) {
    const ok = await adminApproveStore(id)
    if (ok) {
      setPendingStores(prev => prev.filter(s => s.id !== id))
      setStats(prev => ({ ...prev, pendingStoreApprovals: prev.pendingStoreApprovals - 1 }))
      showToast("Tienda aprobada")
    } else { showToast("Error al aprobar tienda", "error") }
  }

  async function handleRejectStore(id: string) {
    const ok = await adminRejectStore(id, "Rechazada por administrador")
    if (ok) {
      setPendingStores(prev => prev.filter(s => s.id !== id))
      setStats(prev => ({ ...prev, pendingStoreApprovals: prev.pendingStoreApprovals - 1 }))
      showToast("Tienda rechazada")
    } else { showToast("Error al rechazar tienda", "error") }
  }

  async function handleApproveProduct(id: string) {
    const ok = await adminApproveProduct(id)
    if (ok) {
      setPendingProducts(prev => prev.filter(p => p.id !== id))
      setStats(prev => ({ ...prev, pendingProductApprovals: prev.pendingProductApprovals - 1 }))
      showToast("Producto aprobado")
    } else { showToast("Error al aprobar producto", "error") }
  }

  async function handleRejectProduct(id: string) {
    const ok = await adminRejectProduct(id, "Rechazado por administrador")
    if (ok) {
      setPendingProducts(prev => prev.filter(p => p.id !== id))
      setStats(prev => ({ ...prev, pendingProductApprovals: prev.pendingProductApprovals - 1 }))
      showToast("Producto rechazado")
    } else { showToast("Error al rechazar producto", "error") }
  }

  async function handleResolveReport(id: string) {
    const ok = await resolveReport(id)
    if (ok) {
      setReports(prev => prev.filter(r => r.id !== id))
      setStats(prev => ({ ...prev, pendingReports: prev.pendingReports - 1 }))
      showToast("Reporte resuelto")
    } else { showToast("Error al resolver reporte", "error") }
  }

  async function handleDismissReport(id: string) {
    const ok = await dismissReport(id)
    if (ok) {
      setReports(prev => prev.filter(r => r.id !== id))
      setStats(prev => ({ ...prev, pendingReports: prev.pendingReports - 1 }))
      showToast("Reporte descartado")
    } else { showToast("Error al descartar reporte", "error") }
  }

  const searchedUsers = users.filter(u =>
    !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.role?.toLowerCase().includes(userSearch.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(userTotal / USERS_PER_PAGE))

  return (
    <div className="min-h-screen zafiro-page text-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-cyan-600 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">Automation Center</h1>
            <p className="text-[10px] font-mono text-slate-500">Centro de Automatización — Acceso restringido</p>
          </div>
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[10px] font-bold text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Cargando..." : "Actualizar"}
          </button>
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
                  Las estadísticas muestran 0. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {SUB_ADMIN_PAGES.map(p => {
                const Icon = p.icon
                return (
                  <Link key={p.href} href={p.href}
                    className="p-3 rounded-2xl glass hover:border-[#00D9FF]/20 transition-all group">
                    <Icon className={`w-4 h-4 ${p.color} mb-1.5`} />
                    <p className="text-[10px] font-bold text-white group-hover:text-[#00D9FF] transition-colors">{p.label}</p>
                    <p className="text-[7px] text-slate-500">{p.desc}</p>
                  </Link>
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
                { label: "Pedidos", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-amber-400" },
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

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  Tiendas Pendientes ({pendingStores.length})
                </h3>
                {pendingStores.length === 0 ? (
                  <p className="text-[9px] text-slate-500 text-center py-4">No hay tiendas pendientes</p>
                ) : (
                  <div className="space-y-1.5">
                    {pendingStores.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-white truncate">{s.name}</p>
                          <p className="text-[7px] text-slate-500">{s.country} — {new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleApproveStore(s.id)} className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer" title="Aprobar">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </button>
                        <button onClick={() => handleRejectStore(s.id)} className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer" title="Rechazar">
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#197BD2]" />
                  Productos Pendientes ({pendingProducts.length})
                </h3>
                {pendingProducts.length === 0 ? (
                  <p className="text-[9px] text-slate-500 text-center py-4">No hay productos pendientes</p>
                ) : (
                  <div className="space-y-1.5">
                    {pendingProducts.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-white truncate">{p.name}</p>
                          <p className="text-[7px] text-slate-500">${p.base_price} — {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleApproveProduct(p.id)} className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer" title="Aprobar">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </button>
                        <button onClick={() => handleRejectProduct(p.id)} className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer" title="Rechazar">
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          r.status === "pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>{r.status}</span>
                        <button onClick={() => handleResolveReport(r.id)} className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer" title="Resolver">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </button>
                        <button onClick={() => handleDismissReport(r.id)} className="p-1 rounded bg-slate-500/10 hover:bg-slate-500/20 cursor-pointer" title="Descartar">
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "usuarios" && (
          <div className="p-5 rounded-2xl glass">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Gestión de Usuarios</h2>
              <span className="text-[10px] text-slate-400">{stats.totalUsers} registrados</span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text" value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(0) }}
                placeholder="Buscar por username o rol..."
                className="w-full bg-[#14171A] border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors"
              />
            </div>

            {!dbConnected ? (
              <p className="text-[10px] text-slate-500 text-center py-4">Sin conexión a base de datos</p>
            ) : searchedUsers.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">{userSearch ? "Sin resultados" : "No hay usuarios registrados"}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="text-left py-2 pr-2 text-[9px] font-bold text-slate-500 uppercase">Username</th>
                        <th className="text-left py-2 px-2 text-[9px] font-bold text-slate-500 uppercase">Rol</th>
                        <th className="text-right py-2 pl-2 text-[9px] font-bold text-slate-500 uppercase">Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedUsers.map((u) => (
                        <tr key={u.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <td className="py-2.5 pr-2">
                            <span className="font-bold text-white">{u.username || "—"}</span>
                          </td>
                          <td className="py-2.5 px-2"><RoleBadge role={u.role} /></td>
                          <td className="py-2.5 pl-2 text-right text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/40">
                  <span className="text-[9px] text-slate-500">
                    Página {userPage + 1} de {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => setUserPage(p => Math.max(0, p - 1))} disabled={userPage === 0}
                      className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700/40 disabled:opacity-30 transition-colors cursor-pointer">
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    <button onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))} disabled={userPage >= totalPages - 1}
                      className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700/40 disabled:opacity-30 transition-colors cursor-pointer">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              </>
            )}
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
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{r.user}</p>
                      <p className="text-[9px] text-slate-500">{r.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        r.status === "pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>{r.status}</span>
                      {r.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleResolveReport(r.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer" title="Resolver">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </button>
                          <button onClick={() => handleDismissReport(r.id)} className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 transition-colors cursor-pointer" title="Descartar">
                            <X className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && tab === "moderacion" && (
          <div className="p-5 rounded-2xl glass">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Historial de Auditoría</h2>
              {auditActionTypes.length > 0 && (
                <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)}
                  className="bg-[#14171A] border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 outline-none focus:border-[#00D9FF]/30 cursor-pointer">
                  <option value="all">Todas las acciones</option>
                  {auditActionTypes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
            </div>
            {filteredAuditLogs.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">No hay actividad registrada</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {filteredAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-white truncate">{log.action}</p>
                      <p className="text-[7px] text-slate-500">{log.target_type} — {log.target_id?.slice(0, 8)}</p>
                    </div>
                    <span className="text-[6px] text-slate-600 shrink-0 ml-2">
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
            <div className="space-y-3 mt-4">
              {[
                { label: "Stripe", value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Configurado" : "No configurado", ok: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY },
                { label: "Supabase URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL || "No configurado", ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                { label: "Supabase Anon Key", value: dbConnected ? "Configurado" : "No configurado", ok: dbConnected },
                { label: "Supabase Publishable Key", value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "Configurado" : "No configurado", ok: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
                { label: "Supabase Service Role Key", value: "PENDIENTE", ok: false },
                { label: "RLS (Row Level Security)", value: "75 tablas migradas", ok: true },
                { label: "Dominios", value: "zafiro.msmmystore.com · eliana.msmmystore.com · market.msmmystore.com", ok: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {item.ok
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />
                    }
                    <span className="text-[10px] font-bold text-white">{item.label}</span>
                  </div>
                  <span className={`text-[9px] ${item.ok ? "text-slate-400" : "text-amber-400"}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-[9px] text-amber-400/80">
                ⚠ La Service Role Key está pendiente — necesaria para operaciones admin vía API de Supabase.
                Búscala en Supabase Dashboard → Project Settings → API → service_role key.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
