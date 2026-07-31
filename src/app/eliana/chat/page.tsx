'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Send, ArrowLeft, Settings, History, Brain, RotateCcw, ChevronDown, Mic, MicOff, Volume2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import ElianaDiamond from "@/components/ElianaDiamond"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { getSession } from "@/lib/auth"
import { processElianaRequest, getElianaContext } from "@/lib/eliana/engine"
import { getContextualSuggestions } from "@/lib/eliana/recommendations"
import type { ElianaContext } from "@/lib/eliana/types"

const RETURN_URL_ALLOWLIST = [
  "https://msmmystore.com",
  "https://zafiro.msmmystore.com",
  "https://market.msmmystore.com",
  "https://marketplace.msmmystore.com",
  "https://beta.msmmystore.com",
]

type ConnectionStatus = "idle" | "connecting" | "connected" | "sending" | "streaming" | "success" | "reconnecting" | "offline" | "unauthorized" | "rate_limited" | "error"

type ChatMessageStatus = "queued" | "sending" | "sent" | "completed" | "failed"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  status: ChatMessageStatus
  createdAt: string
}

interface HandoffContext {
  source_app?: string
  source_module?: string
  resource_type?: string
  resource_id?: string
  requested_action?: string
  return_url?: string
}

const CHAT_TIMEOUT_MS = 35000
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 5000]

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
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

const PENDING_KEY = "eliana_pending"

function getPendingMessages(cid: string | null): { id: string; content: string; conversationId: string }[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    if (!cid) return []
    return all.filter((m: { conversationId: string }) => m.conversationId === cid)
  } catch {
    return []
  }
}

function savePendingMessage(id: string, cid: string | null, content: string) {
  if (!cid) return
  try {
    const raw = localStorage.getItem(PENDING_KEY) || "[]"
    const all = JSON.parse(raw)
    all.push({ id, conversationId: cid, content, createdAt: Date.now() })
    if (all.length > 20) all.splice(0, all.length - 20)
    localStorage.setItem(PENDING_KEY, JSON.stringify(all))
  } catch {}
}

function removePendingMessage(id: string) {
  try {
    const raw = localStorage.getItem(PENDING_KEY) || "[]"
    const all = JSON.parse(raw)
    localStorage.setItem(PENDING_KEY, JSON.stringify(all.filter((m: { id: string }) => m.id !== id)))
  } catch {}
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

  const [status, setStatus] = useState<ConnectionStatus>("idle")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const isSendingRef = useRef(false)
  const mountedRef = useRef(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasSpeech, setHasSpeech] = useState(false)

  const session = useMemo(() => getSession(), [])

  const conversationIdRef = useRef<string | null>(null)

  const upsertMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === msg.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = msg
        return next
      }
      return [...prev, msg]
    })
  }, [])

  const updateMessageStatus = useCallback((id: string, status: ChatMessageStatus) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }, [])

  // Initialize chat with context
  useEffect(() => {
    if (initialized) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialized(true)
    setStatus("connecting")

    const contextLabel = ctx.source_app
      ? `desde ${ctx.source_app}${ctx.resource_type ? ` (${ctx.resource_type})` : ""}`
      : ""

    const greeting = session
      ? `**Bendiciones**, ${session.name}. Soy **ELIANA**, tu Guía Inteligente.${contextLabel ? ` Te recibo ${contextLabel}.` : ""} ¿En qué puedo ayudarte?`
      : `**Bendiciones**. Soy **ELIANA**, la Guía Inteligente de **MSM & ZAFIRO**.${contextLabel ? ` Te recibo ${contextLabel}.` : ""} ¿En qué puedo ayudarte?`

    const greetingMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: greeting,
      status: "completed",
      createdAt: new Date().toISOString(),
    }
    setMessages([greetingMsg])

    fetch("/api/eliana/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_app: ctx.source_app }),
    })
      .then(r => r.json())
      .then(data => {
        const cid = data.conversation_id
        if (cid) {
          setConversationId(cid)
          conversationIdRef.current = cid
          setStatus("connected")
        }
      })
      .catch(() => {
        console.warn("ELIANA: create conversation failed")
        setStatus("connected")
      })

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
          const handoffMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `Recibí contexto${label}. ¿Cómo puedo ayudarte con esto?`,
            status: "completed",
            createdAt: new Date().toISOString(),
          }
          setMessages(prev => [...prev, handoffMsg])
        }
      })
      .catch(() => console.warn("ELIANA: consume handoff failed"))
  }, [handoffId])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  // Voice init
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) {
        const recog = new SR()
        recog.continuous = false
        recog.interimResults = false
        recog.lang = "es-MX"
        recog.onresult = (e: { results: { transcript: string }[][] }) => {
          const transcript = e.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
        }
        recog.onerror = () => setIsListening(false)
        recog.onend = () => setIsListening(false)
        recognitionRef.current = recog
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasSpeech(true)
      }
    }
  }, [])

  const sendMessage = useCallback(async (overrideContent?: string, overrideId?: string) => {
    const text = (overrideContent || input).trim()
    if (!text || isSendingRef.current) return

    const cid = conversationIdRef.current
    const messageId = overrideId || generateId()
    const controller = new AbortController()

    requestRef.current?.abort()
    requestRef.current = controller
    isSendingRef.current = true

    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException("CHAT_TIMEOUT", "AbortError"))
    }, CHAT_TIMEOUT_MS)

    setInput("")
    setErrorMessage("")

    const userMsg: ChatMessage = {
      id: messageId,
      role: "user",
      content: text,
      status: "sending",
      createdAt: new Date().toISOString(),
    }
    upsertMessage(userMsg)
    savePendingMessage(messageId, cid, text)
    setStatus("sending")
    setLoading(true)

    try {
      const history = messages
        .filter(m => m.status === "completed")
        .slice(-10)
        .map(m => ({
          role: m.role === "assistant" ? "assistant" as const : "user" as const,
          content: m.content,
        }))

      const res = await processElianaRequest(text, history, {
        userId: session?.id || "",
        page: ctx.source_app || "eliana",
        section: ctx.source_module,
        itemId: ctx.resource_id,
      })

      updateMessageStatus(messageId, "completed")
      removePendingMessage(messageId)

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: res.text,
        status: "completed",
        createdAt: new Date().toISOString(),
      }
      upsertMessage(assistantMsg)

      if (cid) {
        fetch("/api/eliana/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: cid, role: "user", content: text }),
        }).catch(() => {})
        fetch("/api/eliana/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: cid, role: "assistant", content: res.text }),
        }).catch(() => {})
      }

      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions)
      } else {
        setSuggestions(getContextualSuggestions(session?.id || "guest", ctx.source_app || "eliana", text))
      }
      setStatus("connected")
    } catch (err: unknown) {
      const e = err as Error & { code?: string }

      updateMessageStatus(messageId, "failed")

      if (!navigator.onLine) {
        setStatus("offline")
        setErrorMessage("Sin conexión tu mensaje quedó guardado y se enviará cuando regreses a internet")
      } else if (e?.code === "UNAUTHORIZED") {
        setStatus("unauthorized")
        return
      } else if (e?.name === "AbortError") {
        setErrorMessage("ELIANA tardó demasiado en responder.")
        setStatus("error")
      } else if (e?.code === "RATE_LIMITED" || e?.name === "RATE_LIMITED") {
        setStatus("rate_limited")
        setErrorMessage("ELIANA está recibiendo muchas solicitudes espera unos segundos y vuelve a intentarlo")
      } else if (e?.name === "API_ERROR" || e?.name === "NETWORK_ERROR" || e?.name === "EMPTY_RESPONSE") {
        setStatus("error")
        setErrorMessage(e.message || "ELIANA no pudo generar una respuesta real en este momento pulsa Reintentar")
      } else {
        const curMsg = messages.find(m => m.id === messageId)
        const retryCount = (curMsg?.status === "failed" ? 1 : 0)
        if (retryCount < MAX_RETRIES) {
          setStatus("reconnecting")
          setErrorMessage(`ELIANA está reconectándose. Intento ${retryCount + 1} de ${MAX_RETRIES}.`)
          const delay = RETRY_DELAYS[retryCount] + Math.floor(Math.random() * 300)
          setTimeout(() => {
            // eslint-disable-next-line react-hooks/immutability
            sendMessage(text, messageId)
          }, delay)
        } else {
          setStatus("error")
          setErrorMessage("ELIANA no pudo generar una respuesta real en este momento pulsa Reintentar")
        }
      }
    } finally {
      window.clearTimeout(timeoutId)
      if (requestRef.current === controller) {
        requestRef.current = null
      }
      isSendingRef.current = false
      setLoading(false)
    }
  }, [input, messages, ctx, session, upsertMessage, updateMessageStatus])

  // Pending messages recovery
  useEffect(() => {
    const pending = getPendingMessages(conversationIdRef.current)
    if (pending.length > 0 && navigator.onLine && status === "connected") {
      for (const msg of pending) {
        sendMessage(msg.content, msg.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, conversationId])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      if (!mountedRef.current) return
      setStatus("connecting")
      setErrorMessage("")
      const pending = getPendingMessages(conversationIdRef.current)
      if (pending.length > 0) {
        for (const msg of pending) {
          sendMessage(msg.content, msg.id)
        }
      }
    }
    const handleOffline = () => {
      if (!mountedRef.current) return
      setStatus("offline")
      setErrorMessage("Sin conexión. Tu mensaje quedó guardado.")
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const speakText = useCallback((text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const clean = text.replace(/[*_`#>\-]/g, "").replace(/\n+/g, ". ")
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = "es-MX"
    utterance.rate = 0.95
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    synthRef.current.speak(utterance)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    if (!recognitionRef.current) return
    setIsListening(true)
    try {
      recognitionRef.current.start()
    } catch {
      setIsListening(false)
    }
  }, [isListening])

  const connectionLabel = status === "connecting" ? "Conectando con ELIANA..." :
    status === "reconnecting" ? errorMessage :
    status === "offline" ? "Sin conexión" :
    status === "error" ? "Error de conexión" :
    status === "unauthorized" ? "Sesión expirada" :
    status === "connected" ? "En línea" :
    status === "sending" ? "Enviando..." :
    status === "rate_limited" ? "Muchas solicitudes" : ""

  const statusColor = status === "connected" ? "bg-emerald-400" :
    status === "connecting" || status === "reconnecting" || status === "sending" ? "bg-amber-400" :
    "bg-rose-500"

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
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${statusColor} ring-1 ring-[#050816]`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white">ELIANA</p>
              <p className="text-[7px] text-slate-500">
                {connectionLabel || (ctx.source_app ? `Asistencia para ${ctx.source_app}` : "Guía Inteligente MSM")}
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
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20"
                  : "glass text-slate-200"
              } ${msg.status === "failed" ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 [&_p]:mb-1 [&_ul]:mb-1 [&_ol]:mb-1">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => speakText(msg.content)}
                      className="p-1 rounded-lg hover:bg-slate-700/40 transition-colors text-slate-500 hover:text-[#00D9FF] shrink-0 mt-0.5 cursor-pointer"
                      title="Escuchar mensaje"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {msg.status === "failed" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => sendMessage(msg.content, msg.id)}
                      className="text-[8px] text-amber-400 hover:underline cursor-pointer">
                      Reintentar
                    </button>
                    <button onClick={() => {
                      navigator.clipboard?.writeText(msg.content)
                    }} className="text-[8px] text-slate-500 hover:text-slate-300 cursor-pointer">
                      Copiar mensaje
                    </button>
                  </div>
                )}
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
      {suggestions.length > 0 && !loading && status !== "offline" && status !== "error" && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="text-[9px] px-3 py-1.5 rounded-lg glass text-slate-300 hover:text-white hover:border-[#00D9FF]/30 transition-all border border-slate-700/30 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Connection banner */}
      {(status === "offline" || status === "error" || status === "unauthorized" || status === "rate_limited") && (
        <div className="max-w-3xl mx-auto w-full px-4 py-2">
          <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] ${
            status === "offline" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
            status === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
            status === "rate_limited" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
            "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            <span>{errorMessage || "No pudimos conectar con ELIANA."}</span>
            <div className="flex gap-2">
              {(status === "error" || status === "offline") && (
                <button onClick={() => {
                  const pending = getPendingMessages(conversationIdRef.current)
                  if (pending.length > 0) {
                    for (const msg of pending) {
                      sendMessage(msg.content, msg.id)
                    }
                  }
                }}
                  className="px-2 py-1 rounded-lg bg-slate-800/60 text-white font-bold cursor-pointer hover:bg-slate-700/60">
                  Reintentar
                </button>
              )}
              {status === "unauthorized" && (
                <button onClick={() => window.location.href = "/auth/login"}
                  className="px-2 py-1 rounded-lg bg-slate-800/60 text-white font-bold cursor-pointer hover:bg-slate-700/60">
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800/60 bg-[#0B1220]/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-slate-700/30 focus-within:border-[#00D9FF]/40 transition-colors">
            {hasSpeech && (
              <button
                onClick={toggleListening}
                disabled={loading}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-500/20 text-rose-400 animate-pulse"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                } disabled:opacity-30`}
                title={isListening ? "Detener grabación" : "Hablar"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={status === "offline" ? "Sin conexión..." : "Escribe tu pregunta..."}
              className="flex-1 bg-transparent text-[12px] text-white placeholder-slate-500 outline-none"
              disabled={loading || status === "offline" || status === "unauthorized"}
            />
            <button
              onClick={() => sendMessage()}
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
