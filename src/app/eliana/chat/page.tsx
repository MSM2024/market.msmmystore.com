'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Send, ArrowLeft, Settings, History, Brain, RotateCcw, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import ElianaDiamond from "@/components/ElianaDiamond"
import { getSession } from "@/lib/auth"
import { processElianaRequest, getElianaContext } from "@/lib/eliana/engine"
import { getContextualSuggestions } from "@/lib/eliana/recommendations"
import type { ElianaContext } from "@/lib/eliana/types"

const ELIANA_DOMAIN = "https://eliana.msmmystore.com"

const RETURN_URL_ALLOWLIST = [
  "https://msmmystore.com",
  "https://zafiro.msmmystore.com",
  "https://market.msmmystore.com",
  "https://marketplace.msmmystore.com",
  "https://beta.msmmystore.com",
]

type ConnectionStatus = "online" | "processing" | "offline"

interface HandoffContext {
  source_app?: string
  source_module?: string
  resource_type?: string
  resource_id?: string
  requested_action?: string
  return_url?: string
}

function parseContextFromUrl(searchParams: URLSearchParams): HandoffContext {
  return {
    source_app: searchParams.get("src") || undefined,
    source_module: searchParams.get("mod") || undefined,
    resource_type: searchParams.get("rt") || undefined,
    resource_id: searchParams.get("rid") || undefined,
    requested_action: searchParams.get("action") || undefined,
    return_url: searchParams.get("return") || undefined,
  }
}

function getReturnLabel(url: string): string {
  try {
    const origin = new URL(url).origin
    if (origin.includes("zafiro")) return "Volver a ZAFIRO"
    if (origin.includes("market")) return "Volver al Marketplace"
    if (origin.includes("msmmystore")) return "Volver a MSM"
    return "Volver"
  } catch {
    return "Volver"
  }
}

function ElianaChatContent() {
  const searchParams = useSearchParams()
  const handoffId = searchParams.get("handoff")
  const ctx = useMemo(() => parseContextFromUrl(searchParams), [searchParams])

  const [status, setStatus] = useState<ConnectionStatus>("online")
  const [messages, setMessages] = useState<{ role: "user" | "eliana"; text: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const session = useMemo(() => getSession(), [])

  // Initialize chat with context
  useEffect(() => {
    if (initialized) return
    setInitialized(true)

    const contextLabel = ctx.source_app
      ? `desde ${ctx.source_app}${ctx.resource_type ? ` (${ctx.resource_type})` : ""}`
      : ""

    const greeting = session
      ? `**Bendiciones**, ${session.name}. Soy **ELIANA**, tu Guía Inteligente.${contextLabel ? ` Te recibo ${contextLabel}.` : ""} ¿En qué puedo ayudarte?`
      : `**Bendiciones**. Soy **ELIANA**, la Guía Inteligente de **MSM & ZAFIRO**.${contextLabel ? ` Te recibo ${contextLabel}.` : ""} ¿En qué puedo ayudarte?`

    setMessages([{ role: "eliana", text: greeting }])

    const userPage = ctx.source_app || "eliana"
    setSuggestions(getContextualSuggestions(session?.id || "guest", userPage))
  }, [initialized, ctx, session])

  // Consume handoff if present
  useEffect(() => {
    if (!handoffId) return
    fetch(`/api/eliana/context-handoff?id=${handoffId}`)
      .then(r => r.json())
      .then(data => {
        if (data.context) {
          const label = data.context.resource_type
            ? ` sobre ${data.context.resource_type}`
            : ""
          setMessages(prev => [...prev, {
            role: "eliana",
            text: `Recibí contexto${label}. ¿Cómo puedo ayudarte con esto?`,
          }])
        }
      })
      .catch(() => {})
  }, [handoffId])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", text }])
    setStatus("processing")
    setLoading(true)

    try {
      const userPage = ctx.source_app || "eliana"
      const elianaContext = getElianaContext(userPage, undefined, ctx.resource_id)
      const history = messages.map(m => ({
        role: m.role === "eliana" ? "assistant" as const : "user" as const,
        content: m.text,
      }))
      const res = await processElianaRequest(text, history, elianaContext)
      setMessages(prev => [...prev, { role: "eliana", text: res.text }])
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions)
      } else {
        setSuggestions(getContextualSuggestions(session?.id || "guest", userPage, text))
      }
      setStatus("online")
    } catch {
      setMessages(prev => [...prev, {
        role: "eliana",
        text: "Lo siento, estoy teniendo problemas de conexión. Por favor, intenta de nuevo.",
      }])
      setStatus("offline")
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, ctx, session])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const returnUrl = ctx.return_url && RETURN_URL_ALLOWLIST.includes(ctx.return_url)
    ? ctx.return_url
    : null

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0B1220]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {returnUrl ? (
              <a href={returnUrl} className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> {getReturnLabel(returnUrl)}
              </a>
            ) : (
              <Link href="/eliana" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> ELIANA
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <ElianaDiamond size={24} variant="animated" />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                status === "online" ? "bg-emerald-400" : status === "processing" ? "bg-amber-400" : "bg-rose-500"
              } ring-1 ring-[#050816]`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white">ELIANA</p>
              <p className="text-[7px] text-slate-500">
                {ctx.source_app ? `Asistencia para ${ctx.source_app}` : "Guía Inteligente MSM"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/eliana/conversaciones" className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-slate-400 hover:text-white">
              <History className="w-3.5 h-3.5" />
            </Link>
            <Link href="/eliana/configuracion" className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-slate-400 hover:text-white">
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20"
                  : "glass text-slate-200"
              }`}>
                {msg.text.split("\n").map((line, j) => <p key={j}>{line}</p>)}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl glass flex gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); setTimeout(() => sendMessage(), 50) }}
              className="text-[9px] px-3 py-1.5 rounded-lg glass text-slate-300 hover:text-white hover:border-[#00D9FF]/30 transition-all border border-slate-700/30 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800/60 bg-[#0B1220]/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-slate-700/30 focus-within:border-[#00D9FF]/40 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-transparent text-[12px] text-white placeholder-slate-500 outline-none"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-1.5 rounded-lg hover:bg-[#00D9FF]/10 disabled:opacity-30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#00D9FF]" />
            </button>
          </div>
          <p className="text-[8px] text-slate-600 text-center mt-2">
            ELIANA — Guía Inteligente · MSM & ZAFIRO
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ElianaChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center">
          <ElianaDiamond size={48} variant="animated" />
          <p className="text-xs text-slate-400 mt-4">Cargando ELIANA...</p>
        </div>
      </div>
    }>
      <ElianaChatContent />
    </Suspense>
  )
}
