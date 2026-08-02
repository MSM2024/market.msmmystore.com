'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, MessageSquare, Clock, Search, Trash2, Loader2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"

interface ConversationMessage {
  id: string
  role: string
  content: string
  created_at: string
}

interface Conversation {
  id: string
  channel: string
  status: string
  summary: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  messages: ConversationMessage[]
}

export default function ConversacionesPage() {
  usePageTitle("Conversaciones — ELIANA")
  const session = getSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!session) { setLoading(false); return }
    fetch("/api/eliana/conversations")
      .then(r => r.json())
      .then(data => setConversations(data.conversations || []))
      .catch(() => console.warn("ELIANA: Failed to load conversations"))
      .finally(() => setLoading(false))
  }, [session])

  async function deleteConversation(id: string) {
    if (!confirm("¿Eliminar esta conversación?")) return
    try {
      await fetch(`/api/eliana/conversations?id=${id}`, { method: "DELETE" })
      setConversations(prev => prev.filter(c => c.id !== id))
    } catch { console.warn("ELIANA: Failed to delete conversation") }
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (c.summary || "").toLowerCase().includes(s) ||
      c.messages.some(m => m.content.toLowerCase().includes(s))
  })

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

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/chat" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Chat
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <h1 className="text-xl font-black mb-1">Conversaciones</h1>
        <p className="text-xs text-slate-400 mb-6">Historial de tus conversaciones con ELIANA</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl glass border border-slate-800/30 text-center">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500">
              {search ? "No se encontraron conversaciones" : "No hay conversaciones aún"}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              {search ? "Intenta con otros términos" : "Inicia una conversación con ELIANA desde el chat"}
            </p>
            {!search && (
              <Link href="/eliana/chat"
                className="inline-block mt-4 text-[10px] text-[#00D9FF] hover:underline font-bold">
                Abrir Chat
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(conv => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              const preview = lastMsg ? lastMsg.content.slice(0, 120) + (lastMsg.content.length > 120 ? "..." : "") : "Sin mensajes"
              const msgCount = conv.messages.length
              return (
                <Link
                  key={conv.id}
                  href={`/eliana/chat?conversation=${conv.id}`}
                  className="block p-4 rounded-2xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-bold text-white truncate">
                          {conv.summary || `Conversación ${formatDate(conv.created_at)}`}
                        </h3>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                          conv.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                          conv.status === "resolved" ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-700/30 text-slate-500"
                        }`}>
                          {conv.status === "active" ? "Activa" : conv.status === "resolved" ? "Resuelta" : conv.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{preview}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatDate(conv.created_at)}
                        </span>
                        <span className="text-[9px] text-slate-600 flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" /> {msgCount} mensajes
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); deleteConversation(conv.id) }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
