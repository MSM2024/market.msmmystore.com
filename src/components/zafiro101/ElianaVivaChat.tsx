'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { Send, Mic, MicOff, Volume2, VolumeX, RotateCcw, AlertTriangle, ArrowLeft } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import ElianaPresence from "@/components/zafiro101/ElianaPresence"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { processElianaRequest, getElianaContext } from "@/lib/eliana/engine"
import { getSession } from "@/lib/auth"
import {
  ElianaStateMachine,
  STATE_LABELS,
  STATE_DESCRIPTIONS,
  type ElianaState,
} from "@/lib/eliana/core/state"
import {
  validateInput,
  filterOutput,
  clientRateCheck,
  getRemainingMessages,
} from "@/lib/eliana/core/security"
import {
  loadMessages,
  saveMessage,
  clearHistory,
  canSendMessage,
  type PersistedMessage,
} from "@/lib/eliana/core/persistence"

type ChatMessage = PersistedMessage

const CHIP: Record<ElianaState, { bg: string; text: string; dot: string }> = {
  VIVA: { bg: "bg-[#DAA520]/10", text: "text-[#E8C766]", dot: "bg-[#DAA520]" },
  ESCUCHANDO: { bg: "bg-[#F1C75B]/10", text: "text-[#F9E7B0]", dot: "bg-[#F1C75B]" },
  PENSANDO: { bg: "bg-[#E8C766]/10", text: "text-[#E8C766]", dot: "bg-[#E8C766]" },
  HABLANDO: { bg: "bg-[#F9E7B0]/10", text: "text-[#F9E7B0]", dot: "bg-[#F9E7B0]" },
  ERROR: { bg: "bg-red-500/10", text: "text-red-300", dot: "bg-red-400" },
  DESCONECTADA: { bg: "bg-neutral-500/10", text: "text-neutral-400", dot: "bg-neutral-400" },
}

const SUGGESTIONS = [
  "¿Qué es ELIANA y cómo me ayuda?",
  "Cuéntame sobre el ecosistema ZAFIRO",
  "¿Qué servicios ofrece MSM?",
  "Habla sobre gemología y zafiros",
]

const DISCLAIMER = "Herramienta de orientación. Las decisiones financieras, legales o médicas deben examinarse responsablemente."

function createStateMachine() {
  return new ElianaStateMachine()
}

function detectContext(messages: ChatMessage[]): string {
  const recent = messages.slice(-6).map((m) => m.text.toLowerCase()).join(" ")
  if (/zafiro|rubi|gema|piedra|diamante|corindon|kashmir|padparadscha/.test(recent)) return "gemología"
  if (/marketplace|vender|tienda|producto|compra/.test(recent)) return "marketplace"
  if (/escuela|curso|clase|aprender|certific/.test(recent)) return "escuela"
  if (/servicio|marca|web|diseño|branding|app/.test(recent)) return "servicios"
  if (/pago|stripe|tarjeta|transferencia|paypal/.test(recent)) return "pagos"
  if (/envio|entrega|delivery|transporte/.test(recent)) return "envíos"
  return "general"
}

function buildHistory(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "eliana" ? ("assistant" as const) : ("user" as const),
    content: m.text,
  }))
}

const WELCOME = (name?: string) =>
  name
    ? `**Bendiciones**, ${name}. Soy **ELIANA**, la guía inteligente del ecosistema **MSM & ZAFIRO**.\n\nPuedo orientarte sobre productos, servicios digitales, cursos, gemología, pagos, envíos y el mundo ZAFIRO.\n\n¿En qué puedo ayudarte?`
    : `**Bendiciones**. Soy **ELIANA**, la guía inteligente del ecosistema **MSM & ZAFIRO**.\n\nPuedo orientarte sobre productos, servicios digitales, cursos, gemología, pagos, envíos y el mundo ZAFIRO.\n\n¿En qué puedo ayudarte?`

type ProviderStatus = "unknown" | "configured" | "not_configured" | "error"

export default function ElianaVivaChat() {
  const session = getSession()
  const [sm] = useState<ElianaStateMachine>(() => createStateMachine())

  const [elianaState, setElianaState] = useState<ElianaState>(sm.getState())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [securityWarning, setSecurityWarning] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(50)
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("unknown")
  const [lastFailedText, setLastFailedText] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Voz (APIs reales del navegador; sin audio simulado)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasSpeech] = useState(() =>
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  )
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecogRef = useRef<any>(null)

  // Suscripción a la máquina de estados
  useEffect(() => {
    const unsub = sm.subscribe((s) => setElianaState(s))
    return unsub
  }, [sm])

  // Estado DESCONECTADA ante pérdida real de red
  useEffect(() => {
    const onOffline = () => sm.disconnect()
    const onOnline = () => sm.reconnect()
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    return () => {
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [sm])

  // Carga persistida + APIs de voz
  useEffect(() => {
    loadMessages().then((loaded) => {
      if (loaded.length > 0) {
        setMessages(loaded)
        setShowSuggestions(false)
      }
      setIsLoaded(true)
      setRemaining(getRemainingMessages())
    })

    if (typeof window !== "undefined") {
      speechSynthRef.current = window.speechSynthesis || null
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR && hasSpeech) {
        try {
          const recog = new SR()
          recog.continuous = false
          recog.interimResults = false
          recog.lang = "es-ES"
          recog.onresult = (e: { results: { transcript: string }[][] }) => {
            const transcript = e.results[0][0].transcript
            setInput((prev) => (prev ? prev + " " + transcript : transcript))
            setIsListening(false)
          }
          recog.onerror = () => {
            setIsListening(false)
            if (sm.getState() === "ESCUCHANDO") {
              sm.returnToIdle()
            }
          }
          recog.onend = () => {
            setIsListening(false)
          }
          speechRecogRef.current = recog
        } catch {
          speechRecogRef.current = null
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, elianaState])

  // Bienvenida honesta
  useEffect(() => {
    if (isLoaded && messages.length === 0) {
      const welcome: ChatMessage = {
        id: `welcome_${Date.now()}`,
        role: "eliana",
        text: WELCOME(session?.name),
        timestamp: Date.now(),
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([welcome])
      saveMessage(welcome)
    }
  }, [isLoaded, session, messages.length])

  const currentSuggestion = useMemo(() => {
    if (messages.length < 2) return SUGGESTIONS
    const ctx = detectContext(messages)
    const map: Record<string, string[]> = {
      gemología: ["Natural vs sintético", "Tratamientos en zafiros", "Valoración por origen"],
      marketplace: ["Cómo vender en MSM", "Métodos de pago", "Envíos disponibles"],
      escuela: ["Cursos de la Escuela", "Membresías disponibles", "Certificaciones"],
      servicios: ["Marca personal", "Sitio web profesional", "E-commerce"],
      pagos: ["Stripe y tarjetas", "Transferencia bancaria", "Política de reembolsos"],
      envíos: ["Envío estándar", "Envío exprés", "Seguimiento de pedidos"],
      general: ["¿Quién es Don Miguel?", "Rangos del ecosistema", "Sistema de referidos"],
    }
    return map[ctx] || map.general
  }, [messages])

  const safeIdle = useCallback(() => {
    if (sm.getState() === "HABLANDO") sm.returnToIdle()
  }, [sm])

  const stopSpeaking = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setIsSpeaking(false)
      safeIdle()
    }
  }, [safeIdle])

  const speakText = useCallback(
    (text: string) => {
      const synth = speechSynthRef.current
      if (!synth || !voiceEnabled) return
      synth.cancel()
      const clean = text.replace(/[*_`#>\-]/g, "").replace(/\n+/g, ". ")
      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.lang = "es-ES"
      utterance.rate = 0.95
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        safeIdle()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        safeIdle()
      }
      synth.speak(utterance)
      // Red de seguridad: si el navegador no habló, volver a VIVA
      setTimeout(() => {
        if (!synth.speaking && !isSpeaking) safeIdle()
      }, 2500)
    },
    [voiceEnabled, isSpeaking, safeIdle],
  )

  const startListening = useCallback(() => {
    if (!speechRecogRef.current) return
    if (sm.getState() === "VIVA") sm.startListening()
    setIsListening(true)
    try {
      speechRecogRef.current.start()
    } catch {
      setIsListening(false)
      safeIdle()
    }
  }, [sm, safeIdle])

  const stopListening = useCallback(() => {
    if (speechRecogRef.current) {
      try {
        speechRecogRef.current.stop()
      } catch {
        // ya detenida
      }
    }
    setIsListening(false)
    if (sm.getState() === "ESCUCHANDO" && !input.trim()) {
      sm.returnToIdle()
    }
  }, [sm, input])

  // ─── Envío real ───
  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim()
      if (!msg) return
      if (elianaState === "PENSANDO" || elianaState === "HABLANDO" || elianaState === "DESCONECTADA") return
      if (!navigator.onLine) {
        sm.disconnect()
        return
      }

      setSecurityWarning(null)
      if (sm.getState() === "ERROR") sm.returnToIdle()

      const rl = clientRateCheck()
      if (!rl.allowed) {
        setSecurityWarning(`Espera ${Math.ceil((rl.waitMs || 60000) / 1000)} segundos antes de volver a escribir.`)
        return
      }

      const msgLimit = canSendMessage()
      if (!msgLimit.allowed) {
        setSecurityWarning(msgLimit.reason || "Límite alcanzado")
        return
      }

      const security = validateInput(msg, session?.id)
      if (!security.allowed) {
        setSecurityWarning(security.reason || "Mensaje no permitido")
        return
      }
      if (security.reason && security.riskLevel === "warning") {
        setSecurityWarning(security.reason)
      }

      const finalMsg = security.filteredMessage || msg
      setInput("")
      setShowSuggestions(false)
      setLastFailedText(null)

      if (sm.getState() === "VIVA") sm.startListening()
      sm.startThinking()
      setIsListening(false)

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        text: finalMsg,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      saveMessage(userMsg)
      setRemaining(getRemainingMessages())

      // Pausa corta de UX mientras procesa (estado PENSANDO visible)
      await new Promise((r) => setTimeout(r, 650))

      try {
        const context = getElianaContext("eliana_domain", "viva_101")
        const res = await processElianaRequest(finalMsg, buildHistory(messages), context)

        const outputFilter = filterOutput(res.text)

        sm.startSpeaking()

        const elianaMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          role: "eliana",
          text: outputFilter.filtered,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, elianaMsg])
        saveMessage(elianaMsg)
        setProviderStatus("configured")

        if (voiceEnabled) {
          speakText(outputFilter.filtered)
        } else {
          window.setTimeout(safeIdle, 900)
        }
      } catch (err) {
        const e = err as Error & { code?: string }
        setProviderStatus(e.code === "ai_provider_not_configured" ? "not_configured" : "error")
        setLastFailedText(finalMsg)
        sm.reportError()

        const honestText =
          e.code === "ai_provider_not_configured"
            ? "Bendiciones. Aún no estoy conectada a un proveedor de inteligencia artificial. Respuestas provienen del conocimiento local del ecosistema hasta que termine la configuración."
            : "Bendiciones. No pude obtener una respuesta en este momento. Pulsa Reintentar y lo intento de nuevo."

        const errorMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          role: "eliana",
          text: honestText,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errorMsg])
        saveMessage(errorMsg)
        sm.autoRecover(5000)
      }
    },
    [input, elianaState, messages, session, voiceEnabled, speakText, safeIdle, sm],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInput(v)
    if (v.trim() && sm.getState() === "VIVA") {
      sm.startListening()
    } else if (!v.trim() && sm.getState() === "ESCUCHANDO") {
      sm.returnToIdle()
    }
  }

  const resetChat = async () => {
    if (isSpeaking) stopSpeaking()
    if (isListening) stopListening()
    sm.reset()
    await clearHistory()
    const welcome: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: "eliana",
      text: WELCOME(session?.name),
      timestamp: Date.now(),
    }
    setMessages([welcome])
    saveMessage(welcome)
    setShowSuggestions(true)
    setSecurityWarning(null)
    setProviderStatus("unknown")
    setLastFailedText(null)
    setRemaining(getRemainingMessages())
  }

  const chip = CHIP[elianaState]
  const stateDesc = STATE_DESCRIPTIONS[elianaState]
  const canCompose = elianaState === "VIVA" || elianaState === "ESCUCHANDO"

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#050A1A]">
        <div className="text-center">
          <ElianaPresence sm={sm} size="sm" />
          <p className="mt-4 text-[11px] text-neutral-500">Cargando ELIANA...</p>
        </div>
      </div>
    )
  }

  const providerNote =
    providerStatus === "not_configured"
      ? "Modo orientación local · proveedor de IA pendiente de configurar"
      : providerStatus === "configured"
        ? "Proveedor de IA conectado"
        : "Orientación del ecosistema MSM · conversación privada"

  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-hidden bg-[#050A1A] text-white">
      {/* Resplandores de fondo */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[380px] w-[380px] rounded-full bg-[#DAA520] opacity-[0.06] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[360px] w-[360px] rounded-full bg-[#B8860B] opacity-[0.05] blur-3xl" aria-hidden="true" />

      {/* Cabecera */}
      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-[#DAA520]/15 px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 transition-colors hover:text-[#E8C766]"
          >
            <ArrowLeft className="h-3 w-3" /> ZAFIRO
          </Link>
          <span className="hidden h-4 w-px bg-[#DAA520]/20 sm:block" />
          <div className="flex items-center gap-2">
            <h1 className="zaf101-gold-text text-base font-black tracking-[0.24em] sm:text-lg">ELIANA</h1>
            <span className="hidden rounded-full border border-[#DAA520]/25 bg-[#DAA520]/5 px-2 py-0.5 text-[9px] tracking-wider text-[#E8C766] sm:inline-block">
              VIVA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:inline-flex ${chip.bg} ${chip.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${chip.dot} ${elianaState === "VIVA" ? "animate-pulse" : ""}`} />
            {STATE_LABELS[elianaState]}
          </span>
          <button
            type="button"
            onClick={() => {
              setVoiceEnabled((v) => !v)
              if (isSpeaking) stopSpeaking()
            }}
            className={`cursor-pointer rounded-full p-2 transition-colors ${
              voiceEnabled
                ? "bg-[#DAA520]/15 text-[#E8C766]"
                : "text-neutral-400 hover:bg-[#DAA520]/10 hover:text-[#E8C766]"
            }`}
            title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
            aria-label={voiceEnabled ? "Desactivar voz" : "Activar voz"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={resetChat}
            className="cursor-pointer rounded-full p-2 text-neutral-400 transition-colors hover:bg-[#DAA520]/10 hover:text-[#E8C766]"
            title="Nueva conversación"
            aria-label="Nueva conversación"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6 lg:px-8 lg:py-6 lg:pb-8">
        {/* Panel de presencia (escritorio) */}
        <section className="relative hidden min-h-0 flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#DAA520]/15 bg-[#04081A]/60 lg:flex">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true" />
          <ElianaPresence sm={sm} size="lg" />
          <h2 className="zaf101-gold-text mt-10 text-2xl font-black tracking-[0.3em]">ELIANA</h2>
          <p className="mt-2 text-xs tracking-[0.28em] text-neutral-400">{stateDesc}</p>
          <div className={`mt-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-medium ${chip.bg} ${chip.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${chip.dot} ${elianaState === "VIVA" ? "animate-pulse" : ""}`} />
            {STATE_LABELS[elianaState]} · {providerNote}
          </div>
        </section>

        {/* Chat */}
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Presencia compacta (móvil) */}
          <div className="flex items-center justify-center gap-5 py-5 lg:hidden">
            <ElianaPresence sm={sm} size="sm" />
            <div>
              <h2 className="zaf101-gold-text text-lg font-black tracking-[0.26em]">ELIANA</h2>
              <p className="mt-0.5 text-[10px] tracking-wider text-neutral-400">{stateDesc}</p>
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${chip.bg} ${chip.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${chip.dot} ${elianaState === "VIVA" ? "animate-pulse" : ""}`} />
                {STATE_LABELS[elianaState]}
              </div>
            </div>
          </div>

          {/* Tarjeta de conversación */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#DAA520]/20 bg-[#03060F]/70 backdrop-blur-sm">
            {/* Mensajes */}
            <div ref={chatRef} className="eliana-chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {messages.length === 0 && (
                <p className="py-6 text-center text-[11px] text-neutral-500">Aún no he escrito... envíame tu primera pregunta.</p>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || `${msg.timestamp}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "eliana" && (
                      <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                        <span className="block h-2.5 w-2.5 rotate-45 rounded-[3px] border border-[#DAA520]/50 bg-gradient-to-br from-[#F1C75B] via-[#DAA520] to-[#B8860B]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-md border border-[#DAA520]/25 bg-[#DAA520]/15 text-[#F9E7B0]"
                          : "rounded-bl-md border border-[#DAA520]/15 bg-[#0B1120] text-neutral-200"
                      }`}
                    >
                      <MarkdownRenderer content={msg.text} />
                      {lastFailedText && msg.role === "eliana" && msg.text.includes("Pulsa Reintentar") && (
                        <button
                          type="button"
                          onClick={() => sendMessage(lastFailedText)}
                          className="mt-2 cursor-pointer rounded-full border border-[#DAA520]/40 px-3 py-1 text-[10px] font-medium text-[#E8C766] transition-colors hover:bg-[#DAA520]/10"
                        >
                          Reintentar
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {elianaState === "PENSANDO" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                    <span className="block h-2.5 w-2.5 rotate-45 rounded-[3px] border border-[#DAA520]/50 bg-gradient-to-br from-[#F1C75B] via-[#DAA520] to-[#B8860B]" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-[#DAA520]/15 bg-[#0B1120] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8C766] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8C766] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8C766] animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="ml-1 text-[10px] text-neutral-400">ELIANA está pensando...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sugerencias iniciales */}
            <AnimatePresence>
              {showSuggestions && messages.length <= 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-1 sm:px-6"
                >
                  <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-neutral-500">Sugerencias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendMessage(s)}
                        disabled={!canCompose}
                        className="cursor-pointer rounded-lg border border-[#DAA520]/25 bg-[#0B1120] px-2.5 py-1.5 text-[10px] text-neutral-300 transition-colors hover:border-[#DAA520]/50 hover:text-[#F9E7B0] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sugerencias contextuales */}
            <AnimatePresence>
              {!showSuggestions && messages.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-1 sm:px-6"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {currentSuggestion.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendMessage(s)}
                        disabled={!canCompose}
                        className="cursor-pointer rounded-lg border border-[#DAA520]/20 bg-[#0B1120] px-2.5 py-1 text-[10px] text-neutral-400 transition-colors hover:border-[#DAA520]/45 hover:text-[#E8C766] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Aviso de seguridad */}
            <AnimatePresence>
              {securityWarning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-red-500/20 bg-red-500/10"
                >
                  <div className="flex items-center gap-2 px-4 py-2 sm:px-6">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-red-300" />
                    <span className="min-w-0 flex-1 text-[10px] text-red-200">{securityWarning}</span>
                    <button
                      type="button"
                      onClick={() => setSecurityWarning(null)}
                      className="cursor-pointer text-xs text-red-300"
                      aria-label="Cerrar aviso"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entrada */}
            <div className="border-t border-[#DAA520]/10 px-4 pb-3 pt-3 sm:px-6">
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#DAA520]/20 bg-[#0B1120] px-3 py-2.5 transition-colors focus-within:border-[#DAA520]/45">
                {hasSpeech && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={!canCompose}
                    className={`cursor-pointer rounded-xl p-2 transition-all ${
                      isListening
                        ? "bg-[#DAA520]/20 text-[#F1C75B] animate-pulse"
                        : "text-neutral-400 hover:bg-[#DAA520]/10 hover:text-[#E8C766]"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                    title={isListening ? "Detener dictado" : "Hablar"}
                    aria-label={isListening ? "Detener dictado" : "Hablar por micrófono"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                )}

                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={elianaState === "DESCONECTADA" ? "Sin conexión..." : "Escribe tu pregunta..."}
                  disabled={!canCompose}
                  aria-label="Escribe tu pregunta a ELIANA"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-neutral-600"
                />

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="cursor-pointer rounded-xl bg-[#DAA520]/15 p-2 text-[#E8C766] transition-colors hover:bg-[#DAA520]/25"
                    title="Detener voz"
                    aria-label="Detener voz"
                  >
                    <VolumeX className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!canCompose || !input.trim()}
                  aria-label="Enviar mensaje"
                  className="cursor-pointer rounded-xl bg-gradient-to-b from-[#F1C75B] via-[#DAA520] to-[#B8860B] p-2 text-[#0B0A02] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <p className="truncate text-[9px] text-neutral-600">{providerNote}</p>
                <p className="shrink-0 text-[9px] text-neutral-600">
                  {session ? "Sesión iniciada" : `${remaining} mensajes restantes`} · {DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}