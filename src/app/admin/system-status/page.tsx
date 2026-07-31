'use client'

import Link from "next/link"
import { ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle, Cpu, Database, Key, Mail, Bot, Server, RefreshCw, HardDrive, Activity, User, UserCheck, Layers, GitBranch, Clock, Cloud, Zap } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { hasRole, refreshSession, type ZafiroSession } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase"

interface SystemStatus {
  auth: { status: string; mailerAutoconfirm: boolean; disableSignup: boolean }
  supabase: { status: string; url: string; anonKey: boolean; serviceRoleKey: boolean }
  database: { status: string; tables: Record<string, boolean> }
  eliana: { status: string; gemini: string }
  storage: { status: string }
  session: ZafiroSession | null
  migrations: { highestApplied: number; totalLocal: number; pending: string[] }
  version: string
  nodeEnv: string
  lastCheck: string
}

const EXPECTED_TABLES = [
  "profiles", "audit_logs", "notifications", "organizations", "memberships",
  "sso_tickets", "app_sessions", "login_events", "user_settings",
  "eliana_knowledge", "eliana_conversations", "eliana_messages",
  "eliana_memory", "eliana_tasks"
]

const MIGRATION_FILES = [
  "00001", "00002", "00003", "00004", "00005", "00006", "00007", "00008",
  "00009", "00010", "00011", "00012", "00013", "00014", "00015",
  "00016", "00017", "00018", "00019", "00020", "00021", "00022", "00023",
  "00024", "00025", "00026", "00027", "00028", "00029", "00030", "00031",
  "00032", "00033", "00034", "00035", "00036", "00037", "00038", "00039",
  "00040", "00041", "00042", "00043", "00044", "00045", "00046", "00047",
  "00048", "00049", "00050", "00051", "00052"
]

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
      ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
      "bg-red-500/10 text-red-400 border border-red-500/20"
    }`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  )
}

export default function SystemStatusPage() {
  usePageTitle("Estado del Sistema — ZAFIRO")
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState("")

  const runChecks = useCallback(async () => {
    setChecking(true)
    setError("")

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
    const hasAnon = anonKey && anonKey !== "your-anon-key-here" && anonKey !== "[SENSITIVE]"
    const hasPublishable = publishableKey && publishableKey.startsWith("sb_publishable_") && publishableKey !== "[SENSITIVE]"

    const start: SystemStatus = {
      auth: { status: "checking", mailerAutoconfirm: false, disableSignup: false },
      supabase: {
        status: envUrl && envUrl !== "https://your-project.supabase.co" ? "configured" : "missing",
        url: envUrl,
        anonKey: !!hasAnon || !!hasPublishable,
        serviceRoleKey: false,
      },
      database: { status: "checking", tables: {} },
      eliana: { status: "checking", gemini: "unknown" },
      storage: { status: "unknown" },
      session: null,
      migrations: { highestApplied: 0, totalLocal: MIGRATION_FILES.length, pending: MIGRATION_FILES },
      version: "0.1.0",
      nodeEnv: process.env.NODE_ENV || "unknown",
      lastCheck: new Date().toISOString(),
    }

    const session = refreshSession()
    const healthCheck = fetch("/api/eliana/health").then(r => r.json()).catch(() => null)
    const authSettings = hasAnon
      ? fetch(`${envUrl}/auth/v1/settings`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }).then(r => r.json()).catch(() => null)
      : Promise.resolve(null)

    const [resolvedSession, healthData, authData] = await Promise.all([session, healthCheck, authSettings])

    const supabase = getSupabaseClient()

    if (resolvedSession) {
      start.session = resolvedSession
    }

    if (healthData) {
      start.eliana = {
        status: healthData.status === "ok" ? "ok" : "error",
        gemini: healthData.gemini || "unknown",
      }
    }

    if (authData) {
      start.auth = {
        status: "ok",
        mailerAutoconfirm: authData.mailer_autoconfirm === true,
        disableSignup: authData.disable_signup === true,
      }
    }

    if (hasAnon && supabase) {
      const tableResults: Record<string, boolean> = {}
      const batchSize = 5
      for (let i = 0; i < EXPECTED_TABLES.length; i += batchSize) {
        const batch = EXPECTED_TABLES.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map(async (t) => {
            try {
              const r = await supabase.from(t).select("id", { count: "exact", head: true })
              return { table: t, exists: !r.error }
            } catch { return { table: t, exists: false } }
          })
        )
        results.forEach(({ table, exists }) => { tableResults[table] = exists })
      }
      start.database = {
        status: Object.values(tableResults).some(Boolean) ? "ok" : "error",
        tables: tableResults,
      }

      const existingTables = Object.entries(tableResults).filter(([, v]) => v).map(([k]) => k)
      const foundMigrations = [
        existingTables.includes("profiles") ? "00001" : null,
        existingTables.includes("organizations") ? "00036" : null,
        existingTables.includes("memberships") ? "00036" : null,
      ].filter(Boolean) as string[]

      const highestApplied = foundMigrations.length > 0
        ? Math.max(...foundMigrations.map(m => parseInt(m)))
        : 0

      start.migrations = {
        highestApplied,
        totalLocal: MIGRATION_FILES.length,
        pending: MIGRATION_FILES.filter(m => parseInt(m) > highestApplied),
      }
    }

    start.lastCheck = new Date().toISOString()
    setStatus(start)
    setChecking(false)
  }, [])

  useEffect(() => {
    refreshSession().then(s => {
      if (!s || (!hasRole("owner") && !hasRole("admin") && !hasRole("superadmin"))) {
        router.replace("/auth/login")
        return
      }
      setAuthorized(true)
      runChecks()
    })
  }, [router, runChecks])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#00D9FF] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#00D9FF]" />
              <h1 className="text-2xl font-bold">Estado del Sistema</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">Monitoreo de componentes críticos de ZAFIRO OS</p>
          </div>
          <button
            onClick={runChecks}
            disabled={checking}
            className="ml-auto px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm font-medium hover:bg-slate-700/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Verificando..." : "Actualizar"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {checking && !status && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-10 h-10 border-2 border-[#00D9FF] border-t-transparent rounded-full" />
              <p className="text-sm text-slate-400">Verificando todos los componentes...</p>
            </div>
          </div>
        )}

        {status && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Cloud, label: "Auth", ok: status.auth.status === "ok", detail: status.auth.mailerAutoconfirm ? "Auto-confirm" : "Email confirm" },
                { icon: Database, label: "Supabase", ok: status.supabase.anonKey, detail: status.supabase.serviceRoleKey ? "Service Key OK" : status.supabase.anonKey ? "Anon/Publishable Key OK" : "Sin credenciales" },
                { icon: Server, label: "Base de Datos", ok: status.database.status === "ok", detail: `${Object.values(status.database.tables).filter(Boolean).length}/${EXPECTED_TABLES.length} tablas` },
                { icon: Bot, label: "ELIANA", ok: status.eliana.status === "ok", detail: status.eliana.gemini },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className={`w-5 h-5 ${item.ok ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    <StatusBadge ok={item.ok} label={item.ok ? "OK" : "Error"} />
                  </div>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-[#00D9FF]" />
                <h2 className="text-sm font-medium">Sesión Actual</h2>
              </div>
              {status.session ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Usuario</p>
                    <p className="font-medium">{status.session.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="font-medium truncate">{status.session.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">ID</p>
                    <p className="font-mono text-xs truncate">{status.session.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Rol</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      status.session.role === "owner" ? "bg-purple-500/20 text-purple-300" :
                      status.session.role === "admin" ? "bg-blue-500/20 text-blue-300" :
                      "bg-slate-500/20 text-slate-300"
                    }`}>{status.session.role || "customer"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No hay sesión activa</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-[#00D9FF]" />
                <h2 className="text-sm font-medium">Tablas de Base de Datos</h2>
                <span className="text-xs text-slate-500">
                  ({Object.values(status.database.tables).filter(Boolean).length}/{EXPECTED_TABLES.length})
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {EXPECTED_TABLES.map(t => (
                  <div key={t} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30">
                    {status.database.tables[t] !== undefined ? (
                      status.database.tables[t]
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs font-mono">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <GitBranch className="w-5 h-5 text-[#00D9FF]" />
                <h2 className="text-sm font-medium">Migraciones</h2>
                <span className="text-xs text-slate-500">
                  {status.migrations.highestApplied} aplicada / {status.migrations.totalLocal} locales
                </span>
              </div>
              {status.migrations.pending.length > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-300">Migraciones Pendientes</p>
                      <p className="text-xs text-amber-400/70 mt-1">
                        {status.migrations.pending.length} migraciones por aplicar en Supabase Dashboard
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {MIGRATION_FILES.map(m => {
                  const num = parseInt(m)
                  const applied = num <= status.migrations.highestApplied
                  return (
                    <span key={m} className={`px-2 py-0.5 rounded text-xs font-mono ${
                      applied
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : num === status.migrations.highestApplied + 1
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-slate-800/50 text-slate-500 border border-slate-700/50"
                    }`}>{m}</span>
                  )
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-[#00D9FF]" />
                <h2 className="text-sm font-medium">Configuración</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>SMTP</span>
                  </div>
                  <StatusBadge ok={false} label="No configurado" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    <span>Anon / Publishable Key</span>
                  </div>
                  <StatusBadge ok={status.supabase.anonKey} label={status.supabase.anonKey ? "Configurada" : "No configurada"} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    <span>Service Role Key</span>
                  </div>
                  <StatusBadge ok={status.supabase.serviceRoleKey} label={status.supabase.serviceRoleKey ? "Configurada" : "PENDIENTE"} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Auto-confirm</span>
                  </div>
                  <StatusBadge ok={status.auth.mailerAutoconfirm} label={status.auth.mailerAutoconfirm ? "Activado" : "Desactivado"} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <span>Signup</span>
                  </div>
                  <StatusBadge ok={!status.auth.disableSignup} label={status.auth.disableSignup ? "Desactivado" : "Activado"} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    <span>ELIANA</span>
                  </div>
                  <StatusBadge ok={status.eliana.status === "ok"} label={status.eliana.status === "ok" ? "Online" : "Offline"} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    <span>Storage</span>
                  </div>
                  <StatusBadge ok={status.storage.status === "ok"} label={status.storage.status === "ok" ? "Online" : "No verificado"} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/30">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Versión: {status.version}</span>
                <span>Entorno: {status.nodeEnv}</span>
                <span>Última verificación: {new Date(status.lastCheck).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  {process.env.NEXT_PUBLIC_APP_URL || "zafiro.msmmystore.com"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
