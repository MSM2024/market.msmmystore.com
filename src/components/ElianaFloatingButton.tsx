'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"
import { Send, Minus } from "lucide-react"
import ElianaDiamond from "./ElianaDiamond"
import { processElianaRequest, getElianaContext } from "@/lib/eliana/engine"
import { getContextualSuggestions } from "@/lib/eliana/recommendations"
import { getSession } from "@/lib/auth"
import type { ElianaContext } from "@/lib/eliana/types"

type ConnectionStatus = "online" | "processing" | "offline"

const STATUS_CONFIG = {
  online: { label: "En línea", dot: "bg-emerald-400", ring: "border-emerald-400/50" },
  processing: { label: "Procesando", dot: "bg-amber-400", ring: "border-amber-400/50" },
  offline: { label: "Sin conexión", dot: "bg-rose-500", ring: "border-rose-500/50" },
}

export function openElianaChat() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("eliana:open"))
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Inicio", "/dashboard": "Dashboard", "/universo": "Universo Digital",
  "/perfil/": "Perfil", "/rewards": "MSM Rewards", "/eliana": "ELIANA",
  "/sponsors-page": "Sponsors", "/memberships": "Membresías",
  "/referidos": "Referidos", "/admin": "Panel Admin", "/settings": "Configuración",
}

function getPageFromPath(path: string): string {
  for (const [key, label] of Object.entries(PAGE_LABELS)) {
    if (path.startsWith(key)) return label
  }
  return "ZAFIRO"
}

export default function ElianaFloatingButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>("online")
  const [messages, setMessages] = useState<{ role: "user" | "eliana"; text: string }[]>(() => {
    const session = getSession()
    return [{
      role: "eliana",
      text: session
        ? `Soy ELIANA, tu copiloto en ${getPageFromPath(pathname)}. ¿En qué puedo ayudarte?`
        : "Soy ELIANA, el copiloto inteligente de ZAFIRO. Conéctate para una experiencia personalizada.",
    }]
  })
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(() => getContextualSuggestions(getElianaContext(getPageFromPath(pathname)).userId, getElianaContext(getPageFromPath(pathname)).page))
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("eliana:open", handler)
    return () => window.removeEventListener("eliana:open", handler)
  }, [])

  const context = useMemo(() => getElianaContext(getPageFromPath(pathname)), [pathname])
  const prevPathnameRef = useRef(pathname)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      const session = getSession()
      setMessages([{
        role: "eliana",
        text: session
          ? `Soy ELIANA, tu copiloto en ${getPageFromPath(pathname)}. ¿En qué puedo ayudarte?`
          : "Soy ELIANA, el copiloto inteligente de ZAFIRO. Conéctate para una experiencia personalizada.",
      }])
      setSuggestions(getContextualSuggestions(context.userId, context.page))
    }
  }, [pathname, context])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", text }])
    setStatus("processing")
    setLoading(true)
    try {
      const elianaContext = getElianaContext(getPageFromPath(pathname), undefined, context.itemId)
      const history = messages.map(m => ({ role: m.role === "eliana" ? "assistant" : "user" as const, content: m.text }))
      const res = await processElianaRequest(text, history, elianaContext)
      setMessages(prev => [...prev, { role: "eliana", text: res.text }])
      if (res.suggestions) setSuggestions(res.suggestions)
      setStatus("online")
    } catch {
      setMessages(prev => [...prev, { role: "eliana", text: "Lo siento, tengo problemas de conexión. Intenta de nuevo." }])
      setStatus("offline")
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, pathname, context])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleSuggestion = (s: string) => {
    setInput(s)
    setTimeout(() => sendMessageRef.current?.(), 50)
  }
  const sendMessageRef = useRef(sendMessage)
  useEffect(() => { sendMessageRef.current = sendMessage }, [sendMessage])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 z-[9999] w-[340px] max-w-[calc(100vw-32px)]"
            style={{ maxHeight: "min(500px, calc(100vh - 140px))" }}
          >
            <div className="relative rounded-2xl border border-slate-700/50 glass-strong shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/30 bg-gradient-to-r from-[#00D9FF]/5 via-[#7c3aed]/5 to-transparent">
                <div className="relative">
                  <ElianaDiamond size={28} variant="animated" />
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot} ring-1 ring-[#050816]`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white">ELIANA · {getPageFromPath(pathname)}</p>
                  <p className={`text-[7px] ${status === "online" ? "text-emerald-400" : status === "processing" ? "text-amber-400" : "text-rose-400"}`}>
                    {STATUS_CONFIG[status].label}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-800/60 transition-colors">
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-thin" style={{ minHeight: 200, maxHeight: 320 }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${msg.role === "user" ? "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20" : "glass text-slate-200"}`}>
                      {msg.text.split("\n").map((line, j) => <p key={j}>{line}</p>)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-2xl glass flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
              {suggestions.length > 0 && !loading && (
                <div className="px-3 pb-1 flex flex-wrap gap-1">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s)}
                      className="text-[7px] px-2 py-1 rounded-lg glass text-slate-300 hover:text-white hover:border-[#00D9FF]/30 transition-all border border-slate-700/30 cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="p-3 border-t border-slate-700/30">
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-slate-700/30 focus-within:border-[#00D9FF]/40 transition-colors">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent text-[11px] text-white placeholder-slate-500 outline-none"
                    disabled={loading}
                  />
                  <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-1 rounded-lg hover:bg-[#00D9FF]/10 disabled:opacity-30 transition-all cursor-pointer">
                    <Send className="w-3.5 h-3.5 text-[#00D9FF]" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-4 z-[9999] w-14 h-14 rounded-2xl bg-[#050816]/80 backdrop-blur-lg border border-[#00D9FF]/30 shadow-[0_0_30px_rgba(0,217,255,0.25)] flex items-center justify-center cursor-pointer group hover:scale-105 active:scale-95 transition-all"
        whileHover={{ boxShadow: "0 0 40px rgba(0,217,255,0.4)" }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00D9FF]/20 via-[#7c3aed]/10 to-transparent animate-pulse-glow" />
        <span className={`absolute inset-[-2px] rounded-2xl border ${STATUS_CONFIG[status].ring} animate-ping opacity-20`} />
        <span className="relative z-10">
          <ElianaDiamond size={28} variant="animated" />
        </span>
        <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${STATUS_CONFIG[status].dot} ring-2 ring-[#050816] z-20`} />
      </motion.button>
    </>
  )
}
