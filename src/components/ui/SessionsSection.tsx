"use client"

import { useCallback, useEffect, useState } from "react"
import { Monitor, Smartphone, Globe, Loader2, XCircle, RefreshCw, Check, LogOut } from "lucide-react"

interface ActiveSession {
  id: string
  user_agent: string | null
  ip: string | null
  created_at: string
  updated_at: string
  aal: string | null
  factor_id: string | null
  is_current: boolean
}

function deviceLabel(ua: string | null): { name: string; kind: "monitor" | "phone" | "globe" } {
  if (!ua) return { name: "Dispositivo desconocido", kind: "globe" }
  const s = ua.toLowerCase()
  if (s.includes("mobile") || s.includes("android") || s.includes("iphone")) {
    return { name: "Dispositivo móvil", kind: "phone" }
  }
  const name = ua.split(/[()]/)[1]?.trim() || "Navegador"
  return { name, kind: "monitor" }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

export default function SessionsSection() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/sessions", { credentials: "include", cache: "no-store" })
      if (res.status === 401 || res.status === 403) {
        setError("No autorizado")
        return
      }
      if (!res.ok) {
        setError("No se pudieron cargar las sesiones")
        return
      }
      const data = (await res.json()) as { sessions?: ActiveSession[] }
      setSessions(data.sessions || [])
    } catch {
      setError("No se pudieron cargar las sesiones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  const revoke = async (jti: string) => {
    setBusyId(jti)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jti }),
      })
      if (!res.ok) {
        setMessage({ ok: false, text: "No se pudo revocar la sesión" })
        return
      }
      setSessions((prev) => prev.filter((s) => s.id !== jti))
      setMessage({ ok: true, text: "Sesión revocada" })
    } catch {
      setMessage({ ok: false, text: "No se pudo revocar la sesión" })
    } finally {
      setBusyId(null)
    }
  }

  const revokeOthers = async () => {
    setMessage(null)
    for (const s of sessions.filter((s) => !s.is_current)) {
      await revoke(s.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs py-3">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando sesiones activas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60">
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-xs font-bold text-slate-200">Sesiones activas</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{error}</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 cursor-pointer">
          <RefreshCw className="w-3 h-3" /> Reintentar
        </button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60 text-slate-500 text-xs">
        No hay sesiones activas registradas.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-200">Sesiones activas</p>
        {sessions.length > 1 && (
          <button onClick={revokeOthers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 cursor-pointer">
            <LogOut className="w-3 h-3" /> Cerrar las demás
          </button>
        )}
      </div>

      {sessions.map((s) => {
        const dev = deviceLabel(s.user_agent)
        const Icon = dev.kind === "phone" ? Smartphone : dev.kind === "monitor" ? Monitor : Globe
        return (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/20 border border-slate-800/60">
            <Icon className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-2">
                {dev.name}
                {s.is_current && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/25">ESTA SESIÓN</span>
                )}
                {s.aal === "aal2" && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">MFA</span>
                )}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                {s.ip || "IP desconocida"} · Última actividad {formatDate(s.updated_at)}
              </p>
            </div>
            {!s.is_current && (
              <button onClick={() => revoke(s.id)} disabled={busyId === s.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 cursor-pointer disabled:opacity-50">
                {busyId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Revocar
              </button>
            )}
          </div>
        )
      })}

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-[10px] font-bold ${
          message.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-300"
        }`}>
          {message.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
