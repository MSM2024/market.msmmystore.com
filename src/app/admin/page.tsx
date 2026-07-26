'use client'

import Link from "next/link"
import { ArrowLeft, Shield, Users, FileText, BarChart3, Activity, Settings, AlertTriangle, MessageSquare, UserCheck, Eye, Ban, TrendingUp, Cpu, Zap, Bot, CheckCircle, Clock, RefreshCw, DollarSign, Star, Gem, Heart, Share2, Globe, BookOpen, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession, hasRole } from "@/lib/auth"

export default function AdminPage() {
  usePageTitle("Automation Center — ZAFIRO")
  const router = useRouter()
  useEffect(() => {
    const session = getSession()
    if (!session || (!hasRole("admin") && !hasRole("superadmin"))) {
      router.replace("/")
    }
  }, [router])
  const [tab, setTab] = useState("automation")

  const automationStats = [
    { label: "Conversaciones Automatizadas", value: "12,847", icon: MessageSquare, change: "+23%", color: "text-[#00D9FF]" },
    { label: "Casos Resueltos por ELIANA", value: "11,902", icon: Bot, change: "+31%", color: "text-emerald-400" },
    { label: "Casos Escalados a Humanos", value: "945", icon: Users, change: "-5%", color: "text-amber-400" },
    { label: "Tasa de Automatización", value: "92.6%", icon: Cpu, change: "+3.2%", color: "text-purple-400" },
    { label: "Alertas de Fraude", value: "38", icon: AlertTriangle, change: "-12%", color: "text-red-400" },
    { label: "Registros Automatizados", value: "4,210", icon: UserCheck, change: "+18%", color: "text-[#00D9FF]" },
    { label: "Membresías Pro Gestionadas", value: "892", icon: Star, change: "+15%", color: "text-amber-400" },
    { label: "PTS Distribuidos (este mes)", value: "284K", icon: Gem, change: "+22%", color: "text-[#00D9FF]" },
  ]

  const automationLog = [
    { id: "A001", type: "Registro", user: "carlos_medina", action: "Verificación de email completada", status: "Auto-resuelto", date: "hace 5min", eliana: true },
    { id: "A002", type: "Membresía", user: "maria_garcia", action: "Renovación Pro procesada con Stripe", status: "Auto-resuelto", date: "hace 12min", eliana: true },
    { id: "A003", type: "Sponsor", user: "farmasi_oficial", action: "Activación de campaña sponsor", status: "Auto-resuelto", date: "hace 28min", eliana: true },
    { id: "A004", type: "Reporte", user: "sistema", action: "Detección de spam en pregunta #3421", status: "Auto-resuelto", date: "hace 45min", eliana: true },
    { id: "A005", type: "Soporte", user: "juan_perez", action: "Solicitud de recuperación de cuenta", status: "Escalado", date: "hace 1h", eliana: false },
    { id: "A006", type: "Pago", user: "ana_lopez", action: "Disputa de cargo en Stripe", status: "Escalado", date: "hace 2h", eliana: false },
    { id: "A007", type: "Referido", user: "luis_torres", action: "Bonificación por referido acreditada", status: "Auto-resuelto", date: "hace 2h", eliana: true },
    { id: "A008", type: "Fraude", user: "sistema", action: "Múltiples cuentas detectadas — mismo IP", status: "Escalado", date: "hace 3h", eliana: false },
    { id: "A009", type: "Cuba Plus", user: "pedro_ramirez", action: "Activación de Cuba Plus con descuento referido", status: "Auto-resuelto", date: "hace 4h", eliana: true },
    { id: "A010", type: "Moderación", user: "sistema", action: "Contenido inapropiado eliminado automáticamente", status: "Auto-resuelto", date: "hace 5h", eliana: true },
  ]

  const fraudAlerts = [
    { id: "F001", severity: "Alta", detail: "Creación masiva de cuentas desde IP 192.168.x.x", status: "Bloqueado", date: "hace 1h" },
    { id: "F002", severity: "Media", detail: "Intento de canje de PTS desde cuenta sospechosa", status: "En revisión", date: "hace 3h" },
    { id: "F003", severity: "Alta", detail: "Suplantación de identidad detectada por ELIANA", status: "Investigando", date: "hace 6h" },
    { id: "F004", severity: "Baja", detail: "Enlace sospechoso en respuesta de nuevo usuario", status: "Auto-resuelto", date: "hace 8h" },
  ]

  const systemMetrics = [
    { name: "Tiempo de respuesta ELIANA", value: "1.2s", status: "Saludable", color: "text-emerald-400" },
    { name: "Precisión de detección de spam", value: "98.7%", status: "Excelente", color: "text-emerald-400" },
    { name: "Satisfacción de soporte automatizado", value: "4.8/5.0", status: "Excelente", color: "text-emerald-400" },
    { name: "Tiempo de activación de membresías", value: "15s", status: "Óptimo", color: "text-emerald-400" },
    { name: "Tasa de error en pagos Stripe", value: "0.3%", status: "Normal", color: "text-emerald-400" },
    { name: "Tiempo de procesamiento de referidos", value: "30s", status: "Óptimo", color: "text-amber-400" },
  ]

  const improvementSuggestions = [
    "Implementar verificación de identidad con documento para reducir escalados por fraude.",
    "Entrenar a ELIANA con más ejemplos de disputas de pago para mejorar tasa de auto-resolución.",
    "Agregar recordatorio automático de renovación de membresía 7 días antes del vencimiento.",
    "Optimizar detección de contenido duplicado en preguntas frecuentes.",
    "Mejorar el onboarding con tutorial interactivo guiado por ELIANA.",
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
            <p className="text-[10px] font-mono text-slate-500">Centro de Automatización ELIANA — Acceso restringido</p>
          </div>
        </div>

        <nav className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {[
            { id: "automation", label: "Automation", icon: Cpu },
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "usuarios", label: "Usuarios", icon: Users },
            { id: "reportes", label: "Reportes", icon: AlertTriangle },
            { id: "contenido", label: "Contenido", icon: FileText },
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

        {tab === "automation" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-[#00D9FF]" />
              <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider">ELIANA Automation Engine</h2>
            </div>
            <p className="text-[10px] text-slate-400 mb-5 max-w-2xl">
              ELIANA gestiona automáticamente registro, verificación, membresías, pagos, soporte, moderación inicial, 
              detección de fraude y recomendaciones. Solo casos sensibles (fraude complejo, disputas, apelaciones, 
              bloqueos, asuntos legales) son escalados a revisión humana.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {automationStats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="p-3 rounded-2xl glass">
                    <Icon className={`w-4 h-4 ${s.color} mb-1.5`} />
                    <p className="text-lg font-black">{s.value}</p>
                    <p className="text-[8px] text-slate-400">{s.label}</p>
                    <span className="text-[8px] text-emerald-400">{s.change}</span>
                  </div>
                )
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-[#00D9FF]" /> Actividad de Automatización</h3>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {automationLog.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                      <div className="flex items-center gap-2 min-w-0">
                        {a.eliana ? (
                          <Bot className="w-3.5 h-3.5 text-[#00D9FF] shrink-0" />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-white truncate">{a.action}</p>
                          <p className="text-[7px] text-slate-500">{a.user} · {a.type}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded-full ${
                          a.status === "Auto-resuelto" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>{a.status}</span>
                        <p className="text-[6px] text-slate-600 mt-0.5">{a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl glass">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Alertas de Fraude</h3>
                <div className="space-y-1.5">
                  {fraudAlerts.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          f.severity === "Alta" ? "bg-red-400" : f.severity === "Media" ? "bg-amber-400" : "bg-slate-500"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-[9px] text-white truncate">{f.detail}</p>
                          <p className="text-[7px] text-slate-500">Severidad: {f.severity}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded-full ${
                          f.status === "Bloqueado" ? "bg-red-500/10 text-red-400" :
                          f.status === "En revisión" ? "bg-amber-500/10 text-amber-400" :
                          f.status === "Investigando" ? "bg-blue-500/10 text-blue-400" :
                          "bg-emerald-500/10 text-emerald-400"
                        }`}>{f.status}</span>
                        <p className="text-[6px] text-slate-600 mt-0.5">{f.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recomendaciones de Mejora</h3>
                <ul className="space-y-1.5">
                  {improvementSuggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[9px] text-slate-400 leading-relaxed">
                      <span className="text-[#00D9FF] mt-0.5">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#00D9FF]" />
                <h3 className="text-xs font-bold text-white">Procesos Automatizados por ELIANA</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  "Registro y verificación", "Onboarding de nuevos usuarios", "Gestión de membresías Pro", "Cuba Plus",
                  "Pagos con Stripe", "Renovaciones", "Cancelaciones", "Sistema de referidos",
                  "MSM Rewards (PTS)", "Publicaciones", "Comunidades", "Soporte básico",
                  "Notificaciones", "Moderación inicial", "Recomendaciones personalizadas", "Fraude y abuso",
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span className="text-[8px] text-slate-300">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "dashboard" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Usuarios Totales", value: "14,820", icon: Users, change: "+12%", color: "text-[#00D9FF]" },
                { label: "Preguntas", value: "3,452", icon: MessageSquare, change: "+8%", color: "text-emerald-400" },
                { label: "Comunidades", value: "128", icon: Activity, change: "+3%", color: "text-purple-400" },
                { label: "PTS Circulando", value: "2.4M", icon: TrendingUp, change: "+18%", color: "text-amber-400" },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="p-4 rounded-2xl glass">
                    <Icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                    <span className="text-[9px] text-emerald-400">{s.change}</span>
                  </div>
                )
              })}
            </div>
            <div className="p-5 rounded-2xl glass">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Reportes Recientes</h2>
              <div className="space-y-2">
                {[
                  { id: "1", user: "usuario_324", reason: "Spam", status: "Pendiente", date: "hace 2h" },
                  { id: "2", user: "usuario_891", reason: "Contenido ofensivo", status: "Revisado", date: "hace 5h" },
                  { id: "3", user: "usuario_456", reason: "Desinformación", status: "Pendiente", date: "hace 8h" },
                  { id: "4", user: "usuario_123", reason: "Autopromoción", status: "Resuelto", date: "hace 1d" },
                ].map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <Ban className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{r.user}</p>
                        <p className="text-[9px] text-slate-500">{r.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        r.status === "Pendiente" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        r.status === "Revisado" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>{r.status}</span>
                      <p className="text-[8px] text-slate-600 mt-0.5">{r.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "usuarios" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Gestión de Usuarios</h2>
            <p className="text-[10px] text-slate-400">ELIANA gestiona automáticamente el registro, verificación de email, detección de cuentas duplicadas y onboarding. Los casos escalados aparecen aquí para revisión humana.</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
              <Bot className="w-3 h-3 text-[#00D9FF]" /> 92.6% de registros gestionados automáticamente por ELIANA
            </div>
          </div>
        )}

        {tab === "reportes" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Centro de Reportes</h2>
            <p className="text-[10px] text-slate-400">ELIANA detecta y resuelve automáticamente spam, desinformación y contenido inapropiado. Los reportes escalados requieren revisión humana.</p>
          </div>
        )}

        {tab === "contenido" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Moderación de Contenido</h2>
            <p className="text-[10px] text-slate-400">ELIANA modera contenido inicial: detecta duplicados, spam, lenguaje ofensivo y desinformación. Solo contenido sensible o disputas se escalan a moderadores humanos.</p>
          </div>
        )}

        {tab === "moderacion" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Acciones de Moderación</h2>
            <p className="text-[10px] text-slate-400">Historial de acciones: advertencias, suspensiones temporales y bloqueos. Las decisiones automáticas de ELIANA pueden ser apeladas y revisadas por humanos.</p>
          </div>
        )}

        {tab === "config" && (
          <div className="p-5 rounded-2xl glass">
            <h2 className="text-sm font-bold text-white mb-3">Configuración de la Plataforma</h2>
            <p className="text-[10px] text-slate-400">Ajustes generales, límites de rate, configuración de ELIANA, umbrales de automatización, parámetros de detección de fraude y políticas de escalado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
