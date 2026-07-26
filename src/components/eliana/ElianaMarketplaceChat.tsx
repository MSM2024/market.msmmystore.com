'use client'

import React, { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Send, ChevronDown, Headphones, RotateCcw } from "lucide-react"
import ElianaDiamond from "@/components/ElianaDiamond"
import { processElianaRequest } from "@/lib/eliana/engine"
import { getSession } from "@/lib/auth"
import { getStateMachine } from "@/lib/eliana/core/state"
import type { ElianaState } from "@/lib/eliana/core/state"
import type { ElianaContext } from "@/lib/eliana/types"

interface Props {
  productName: string
  productSlug: string
  productPrice: number
  productCurrency: string
  storeName: string
  className?: string
}

const STATE_UI: Record<ElianaState, { dot: string; label: string; color: string }> = {
  VIVA: { dot: "bg-emerald-400", label: "VIVA", color: "text-emerald-400" },
  ESCUCHANDO: { dot: "bg-blue-400", label: "ESCUCHANDO", color: "text-blue-400" },
  PENSANDO: { dot: "bg-amber-400", label: "PENSANDO", color: "text-amber-400" },
  HABLANDO: { dot: "bg-purple-400", label: "HABLANDO", color: "text-purple-400" },
  ERROR: { dot: "bg-rose-500", label: "ERROR", color: "text-rose-400" },
  DESCONECTADA: { dot: "bg-slate-500", label: "OFFLINE", color: "text-slate-400" },
}

const QUICK_ACTIONS = [
  { label: "Preguntar precio", query: `¿Cuál es el precio de ${"{product}"}?` },
  { label: "Disponibilidad", query: `¿${"{product}"} está disponible?` },
  { label: "Envío", query: `¿Hacen envío de ${"{product}"}? ¿Cuáles son las opciones?` },
  { label: "Hablar con soporte", query: "Necesito hablar con una persona" },
]

const ESCALATION_KEYWORD = "[ESCALAR_A_HUMANO]"

type ChatMessage = {
  id: string
  role: "user" | "eliana" | "system"
  text: string
  timestamp: number
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function parseMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-[#DAA520]">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function ElianaMarketplaceChat({
  productName,
  productSlug,
  productPrice,
  productCurrency,
  storeName,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [elianaState, setElianaState] = useState<ElianaState>("VIVA")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isEscalated, setIsEscalated] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const machine = useRef(getStateMachine())
  const greetingSent = useRef(false)

  const context: ElianaContext = {
    userId: getSession()?.id || "guest",
    page: "marketplace_product",
    section: "product_detail",
    itemId: productSlug,
    metadata: {
      product_name: productName,
      product_slug: productSlug,
      product_price: String(productPrice),
      product_currency: productCurrency,
      store_name: storeName,
    },
  }

  const priceFormatted = formatCurrency(productPrice, productCurrency)

  useEffect(() => {
    const unsub = machine.current.subscribe((s) => setElianaState(s))
    machine.current.reset()
    return unsub
  }, [])

  useEffect(() => {
    if (isOpen && !greetingSent.current) {
      greetingSent.current = true
      const greeting: ChatMessage = {
        id: generateId(),
        role: "eliana",
        text: `Hola, soy ELIANA. Veo que estás viendo **${productName}** de ${storeName}. El precio actual es **${priceFormatted}**. ¿Qué necesitas saber?`,
        timestamp: Date.now(),
      }
      setMessages([greeting])
    }
  }, [isOpen, productName, storeName, priceFormatted])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isEscalated) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    machine.current.startListening()

    try {
      machine.current.startThinking()

      const history = messages.map((m) => ({
        role: m.role === "eliana" ? "assistant" as const : "user" as const,
        content: m.text,
      }))

      const res = await processElianaRequest(text.trim(), history, context)

      machine.current.startSpeaking()

      const responseText = res.text

      if (responseText.includes(ESCALATION_KEYWORD)) {
        setIsEscalated(true)
        const cleaned = responseText.replace(ESCALATION_KEYWORD, "").trim()
        const elianaMsg: ChatMessage = {
          id: generateId(),
          role: "eliana",
          text: cleaned || "Voy a conectarte con una persona de soporte. Un momento...",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, elianaMsg])
        machine.current.transition("DESCONECTADA")
        return
      }

      const elianaMsg: ChatMessage = {
        id: generateId(),
        role: "eliana",
        text: responseText,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, elianaMsg])
    } catch {
      machine.current.reportError()

      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "system",
        text: "Hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMsg])
      machine.current.autoRecover(3000)
      return
    }

    machine.current.returnToIdle()
  }, [messages, context, isEscalated])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
  }, [input, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleQuickAction = useCallback((queryTemplate: string) => {
    const query = queryTemplate.replace("{product}", productName)
    sendMessage(query)
  }, [productName, sendMessage])

  const handleRetry = useCallback(() => {
    if (messages.length < 2) return
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMsg) {
      setMessages((prev) => prev.filter((m) => m.id !== lastUserMsg.id))
      sendMessage(lastUserMsg.text)
    }
  }, [messages, sendMessage])

  const isLoading = elianaState === "PENSANDO"
  const statusUI = STATE_UI[elianaState]

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08, boxShadow: "0 0 40px rgba(218,165,32,0.4)" }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-4 z-[9999] h-14 rounded-2xl bg-[#050A1A]/90 backdrop-blur-xl border border-[#DAA520]/40 shadow-[0_0_30px_rgba(218,165,32,0.2)] flex items-center gap-3 px-5 cursor-pointer group"
            aria-label="Abrir chat de ELIANA"
          >
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#DAA520]/10 via-[#DAA520]/5 to-transparent" />
            <ElianaDiamond size={24} variant="animated" />
            <span className="relative z-10 text-[#DAA520] font-bold text-sm tracking-wider">
              ELIANA
            </span>
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusUI.dot} ring-2 ring-[#050A1A] z-20`} />
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed bottom-6 right-4 z-[9999] w-[380px] max-w-[calc(100vw-32px)] flex flex-col"
            style={{ maxHeight: "min(600px, calc(100vh - 120px))" }}
            role="dialog"
            aria-label="Chat de ELIANA"
            aria-modal="false"
          >
            <div className="relative rounded-2xl border border-[#DAA520]/20 bg-[#050A1A]/95 backdrop-blur-xl shadow-[0_0_60px_rgba(218,165,32,0.12)] overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#DAA520]/10 bg-gradient-to-r from-[#DAA520]/5 via-transparent to-[#00D9FF]/5">
                <div className="relative shrink-0">
                  <ElianaDiamond size={28} variant="animated" />
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusUI.dot} ring-2 ring-[#050A1A]`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white tracking-wide">
                    ELIANA <span className="text-[#DAA520]">·</span> <span className="text-slate-400 font-normal">Asesora de Productos</span>
                  </p>
                  <p className={`text-[10px] ${statusUI.color} flex items-center gap-1`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusUI.dot}`} />
                    {statusUI.label}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Cerrar chat"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Product summary bar */}
              <div className="px-4 py-2 border-b border-[#DAA520]/5 bg-[#DAA520]/[0.03]">
                <p className="text-[10px] text-[#DAA520] font-medium truncate">
                  {productName}
                </p>
                <p className="text-[10px] text-slate-500">
                  {priceFormatted} · {storeName}
                </p>
              </div>

              {/* Messages */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-thin"
                style={{ minHeight: 240, maxHeight: 380 }}
                role="log"
                aria-live="polite"
                aria-label="Mensajes del chat"
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#DAA520]/10 text-[#DAA520] border border-[#DAA520]/20"
                          : msg.role === "system"
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          : "bg-[#00D9FF]/5 text-slate-200 border border-[#00D9FF]/10"
                      }`}
                    >
                      {parseMarkdown(msg.text)}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="px-3 py-2 rounded-2xl bg-[#00D9FF]/5 border border-[#00D9FF]/10 flex items-center gap-2">
                      <ElianaDiamond size={16} variant="loader" />
                      <span className="text-[10px] text-[#00D9FF]/60 italic">Pensando...</span>
                    </div>
                  </motion.div>
                )}

                {isEscalated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center pt-2"
                  >
                    <button
                      onClick={() => window.location.href = "/contact"}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DAA520]/10 border border-[#DAA520]/30 text-[#DAA520] text-[11px] font-medium hover:bg-[#DAA520]/20 transition-all cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      Hablar con soporte humano
                    </button>
                  </motion.div>
                )}

                {elianaState === "ERROR" && !isEscalated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center pt-2"
                  >
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium hover:bg-rose-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reintentar
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Quick actions */}
              {messages.length <= 1 && !isLoading && !isEscalated && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action) => {
                    const label = action.label === "Preguntar precio"
                      ? `Precio (${priceFormatted})`
                      : action.label === "Disponibilidad"
                      ? "Disponibilidad"
                      : action.label === "Envío"
                      ? "Envío"
                      : "Soporte humano"
                    return (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.query)}
                        disabled={isLoading || isEscalated}
                        className="text-[9px] px-2.5 py-1.5 rounded-lg bg-[#DAA520]/[0.06] border border-[#DAA520]/15 text-[#DAA520]/80 hover:text-[#DAA520] hover:border-[#DAA520]/30 hover:bg-[#DAA520]/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[#DAA520]/10">
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-[#DAA520]/10 focus-within:border-[#DAA520]/30 transition-colors px-3 py-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isEscalated ? "Canal directo a soporte activado..." : "Pregúntale a ELIANA..."}
                    className="flex-1 bg-transparent text-[11px] text-white placeholder-slate-600 outline-none"
                    disabled={isLoading || isEscalated}
                    aria-label="Escribe tu mensaje"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim() || isEscalated}
                    className="p-1.5 rounded-lg bg-[#DAA520]/10 hover:bg-[#DAA520]/20 disabled:opacity-25 transition-all cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Enviar mensaje"
                  >
                    <Send className="w-3.5 h-3.5 text-[#DAA520]" />
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="px-4 pb-3">
                <p className="text-[8px] text-slate-600 leading-relaxed text-center">
                  ELIANA consulta productos del catálogo publicado. Precios y disponibilidad sujetos a confirmación.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
