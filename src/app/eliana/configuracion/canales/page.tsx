"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MessageCircle, Globe, Store, Sparkles, Send, Mail, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"

interface Channel {
  id: string
  channel_name: string
  enabled: boolean
  welcome_message: string
  system_prompt_addition: string
  max_context_length: number
  requires_auth: boolean
  webhook_url: string
  config: Record<string, unknown>
}

const CHANNEL_META: Record<string, { label: string; desc: string; icon: React.ComponentType<{ className?: string }>; external: boolean }> = {
  web: { label: "Web (Chat)", desc: "Chat embebido en el sitio", icon: Globe, external: false },
  whatsapp: { label: "WhatsApp", desc: "Requiere credenciales de la Cloud API", icon: MessageCircle, external: true },
  telegram: { label: "Telegram", desc: "Requiere token de bot", icon: Send, external: true },
  email: { label: "Correo", desc: "Respuestas por email", icon: Mail, external: true },
  marketplace: { label: "Marketplace", desc: "Asistente de tiendas y pedidos", icon: Store, external: false },
  zafiro: { label: "ZAFIRO", desc: "Guía dentro de la red de conocimiento", icon: Sparkles, external: false },
  eliana_domain: { label: "Dominio ELIANA", desc: "Guía central del ecosistema", icon: Sparkles, external: false },
}

function isOwnerSession(): boolean {
  const session = getSession()
  const roles = session?.roles ?? (session?.role ? [session.role] : [])
  return roles.includes("owner") || roles.includes("superadmin")
}

export default function CanalesPage() {
  usePageTitle("Canales — ELIANA")

  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyName, setBusyName] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [pendingExternal, setPendingExternal] = useState<Channel | null>(null)
  const isOwner = isOwnerSession()

  useEffect(() => {
    let cancelled = false
    fetch("/api/eliana/channels")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setChannels(d.channels || []) })
      .catch(() => { if (!cancelled) setError("No se pudieron cargar los canales") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const applyToggle = async (channel: Channel) => {
    setPendingExternal(null)
    setBusyName(channel.channel_name)
    setError(""); setNotice("")
    try {
      const res = await fetch("/api/eliana/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_name: channel.channel_name, enabled: !channel.enabled }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "No se pudo actualizar el canal")
        return
      }
      setChannels((prev) => prev.map((c) => (c.channel_name === channel.channel_name ? data.channel : c)))
      setNotice(`Canal "${channel.channel_name}" ${data.channel.enabled ? "activado" : "desactivado"}`)
    } catch {
      setError("Error de conexión")
    } finally {
      setBusyName(null)
    }
  }

  const onToggle = (channel: Channel) => {
    if (!isOwner) return
    const meta = CHANNEL_META[channel.channel_name]
    if (!channel.enabled && meta?.external) {
      setPendingExternal(channel)
      return
    }
    applyToggle(channel)
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/configuracion" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Configuración
          </Link>
        </div>

        <h1 className="text-xl font-black mb-1">Canales y Acciones</h1>
        <p className="text-xs text-slate-400 mb-6">
          Canales de conversación de ELIANA. Los canales externos permanecen inactivos hasta que se configuren credenciales de forma segura.
        </p>

        {!isOwner && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            Solo el propietario puede cambiar el estado de los canales.
          </div>
        )}

        {pendingExternal && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-300">Activar canal externo: {CHANNEL_META[pendingExternal.channel_name]?.label}</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Este canal comunica con un servicio de terceros y requiere credenciales configuradas de forma segura. No se activará sin ellas.
                  ¿Confirmas la activación?
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => applyToggle(pendingExternal)}
                    disabled={busyName === pendingExternal.channel_name}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 disabled:opacity-40"
                  >
                    {busyName === pendingExternal.channel_name ? "Activando..." : "Confirmar activación"}
                  </button>
                  <button
                    onClick={() => setPendingExternal(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 justify-center py-16 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando canales...
          </div>
        ) : error ? (
          <p className="text-center py-16 text-sm text-red-400">{error}</p>
        ) : (
          <div className="space-y-2.5">
            {channels.map((c) => {
              const meta = CHANNEL_META[c.channel_name] || { label: c.channel_name, desc: "", icon: MessageCircle, external: false }
              const Icon = meta.icon
              return (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl glass border border-slate-800/30">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.enabled ? "bg-[#00D9FF]/15 text-[#00D9FF]" : "bg-slate-800/60 text-slate-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{meta.label}</p>
                      {meta.external && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-mono uppercase tracking-wider text-amber-400">
                          externo
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{meta.desc}</p>
                    {c.enabled && c.welcome_message && (
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">“{c.welcome_message}”</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-slate-500 hidden sm:block">{c.max_context_length} ctx</span>
                    <button
                      onClick={() => onToggle(c)}
                      disabled={!isOwner || busyName === c.channel_name}
                      aria-label={`${c.enabled ? "Desactivar" : "Activar"} canal ${meta.label}`}
                      aria-pressed={c.enabled}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${c.enabled ? "bg-[#00D9FF]" : "bg-slate-700"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${c.enabled ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {notice && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {notice}
          </div>
        )}
      </div>
    </div>
  )
}
