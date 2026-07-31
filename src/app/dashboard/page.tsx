'use client'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { MessageSquare, BookOpen, Settings, User, Clock, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { refreshSession, type ZafiroSession } from "@/lib/auth"
import EmptyState from "@/components/ui/EmptyState"

interface Conversation {
  id: string
  status: string
  summary: string | null
  created_at: string
  messages: { id: string; role: string; content: string; created_at: string }[]
}

interface Profile {
  name: string
  email: string
  role: string
  avatar: string
}

export default function DashboardPage() {
  usePageTitle("Dashboard — ZAFIRO")
  const [session, setSession] = useState<ZafiroSession | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    ;(async () => {
      const s = await refreshSession()
      if (!mountedRef.current) return
      setSession(s)
      if (!s) { setLoading(false); return }

      const [convData, profileData] = await Promise.all([
        fetch("/api/eliana/conversations").then(r => r.json()).catch(() => ({ conversations: [] })),
        fetch("/api/user-profile").then(r => r.json()).catch(() => ({ profile: null })),
      ])
      if (!mountedRef.current) return
      setConversations((convData.conversations || []).slice(0, 5))
      setProfile(profileData.profile)
      setLoading(false)
    })()
    return () => { mountedRef.current = false }
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
    </div>
  )

  if (!session) return (
    <EmptyState
      icon={User}
      title="Inicia sesión para ver tu dashboard"
      description="Accede a tu cuenta para ver tus conversaciones y tu panel de control."
      action={
        <Link href="/auth/login" className="inline-block px-4 py-2 rounded-lg bg-[#00D9FF] text-black text-xs font-bold">
          Iniciar Sesión
        </Link>
      }
    />
  )

  const displayName = profile?.name || session.name || session.email?.split("@")[0] || "Usuario"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">
          Hola, {displayName}
        </h1>
        <p className="text-xs text-slate-400">Bienvenido a ZAFIRO — Tu ecosistema digital</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link href="/eliana/chat" className="p-5 rounded-2xl bg-gradient-to-br from-[#00D9FF]/10 to-[#050A1A] border border-[#00D9FF]/20 hover:border-[#00D9FF]/40 transition-all group">
          <Sparkles className="w-6 h-6 text-[#00D9FF] mb-3" />
          <h3 className="text-sm font-black text-white mb-1">ELIANA</h3>
          <p className="text-[10px] text-slate-400">Tu Guía Inteligente</p>
          <ArrowRight className="w-3 h-3 text-[#00D9FF] mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link href="/admin/knowledge" className="p-5 rounded-2xl bg-gradient-to-br from-[#DAA520]/10 to-[#050A1A] border border-[#DAA520]/20 hover:border-[#DAA520]/40 transition-all group">
          <BookOpen className="w-6 h-6 text-[#DAA520] mb-3" />
          <h3 className="text-sm font-black text-white mb-1">Base de Conocimiento</h3>
          <p className="text-[10px] text-slate-400">Documentos y reglas</p>
          <ArrowRight className="w-3 h-3 text-[#DAA520] mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link href="/settings" className="p-5 rounded-2xl bg-gradient-to-br from-slate-700/30 to-[#050A1A] border border-slate-700/30 hover:border-slate-600/50 transition-all group">
          <Settings className="w-6 h-6 text-slate-400 mb-3" />
          <h3 className="text-sm font-black text-white mb-1">Configuración</h3>
          <p className="text-[10px] text-slate-400">Perfil, notificaciones, privacidad</p>
          <ArrowRight className="w-3 h-3 text-slate-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-white">Conversaciones Recientes</h2>
          <Link href="/eliana/conversaciones" className="text-[10px] text-[#00D9FF] hover:underline font-bold">
            Ver todas
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 rounded-2xl glass border border-slate-800/30 text-center">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500">No hay conversaciones aún</p>
            <Link href="/eliana/chat" className="inline-block mt-3 text-[10px] text-[#00D9FF] hover:underline font-bold">
              Iniciar conversación
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              return (
                <Link
                  key={conv.id}
                  href={`/eliana/chat?conversation=${conv.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {conv.summary || `Conversación ${new Date(conv.created_at).toLocaleDateString("es")}`}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {lastMsg ? lastMsg.content.slice(0, 80) : "Sin mensajes"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-slate-600 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(conv.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                    </p>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${
                      conv.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/30 text-slate-500"
                    }`}>
                      {conv.status === "active" ? "Activa" : conv.status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl glass border border-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00D9FF]/10 flex items-center justify-center">
            <User className="w-5 h-5 text-[#00D9FF]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{displayName}</p>
            <p className="text-[10px] text-slate-500">{session.email} · {session.role || "customer"}</p>
          </div>
          <Link href="/settings" className="ml-auto text-[10px] text-[#00D9FF] hover:underline font-bold">
            Editar perfil
          </Link>
        </div>
      </div>
    </div>
  )
}
