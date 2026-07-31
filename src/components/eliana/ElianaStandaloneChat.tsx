'use client'

import { useState, useCallback, useRef, useEffect } from "react"
import { Send, RotateCcw, Shield, Mic, MicOff, Volume2, VolumeX, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import ElianaDiamond from "@/components/ElianaDiamond"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { processElianaRequest, getElianaContext } from "@/lib/eliana/engine"
import { getSession } from "@/lib/auth"
import { CHANNEL_CONFIGS } from "@/lib/eliana/core/types"
import {
  ElianaStateMachine,
  STATE_LABELS,
  STATE_DESCRIPTIONS,
  STATE_COLORS,
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

const QUICK_ACTIONS = [
  { label: "Productos MSM", query: "¿Qué productos tienen disponibles?" },
  { label: "Precios", query: "¿Cuáles son sus precios de servicios digitales?" },
  { label: "Hacer Pedido", query: "Quiero hacer un pedido, ¿cómo empiezo?" },
  { label: "¿Qué es ZAFIRO?", query: "¿Qué es ZAFIRO y cómo funciona?" },
  { label: "Ser Vendedor", query: "¿Cómo puedo vender en el marketplace?" },
  { label: "Escuela MSM", query: "¿Qué cursos ofrece la Escuela MSM?" },
]

const DISCLAIMER = "Este contenido es una herramienta de orientación. Las decisiones financieras, legales o médicas deben ser examinadas responsablemente."

function createStateMachine() {
  return new ElianaStateMachine()
}

export default function ElianaStandaloneChat() {
  const session = getSession()
  const channelConfig = CHANNEL_CONFIGS.eliana_domain
  const smRef = useRef(createStateMachine())
  const [elianaState, setElianaState] = useState<ElianaStateMachine["state"]>("VIVA")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [securityWarning, setSecurityWarning] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(50)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasSpeech, setHasSpeech] = useState(false)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecogRef = useRef<any>(null)

  // Subscribe to state machine
  useEffect(() => {
    const unsub = smRef.current.subscribe((s) => setElianaState(s))
    return unsub
  }, [])

  // Load persisted messages on mount
  useEffect(() => {
    loadMessages().then((loaded) => {
      if (loaded.length > 0) {
        setMessages(loaded)
        setShowSuggestions(false)
      }
      setIsLoaded(true)
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(getRemainingMessages())

    // Init speech APIs
    if (typeof window !== "undefined") {
      speechSynthRef.current = window.speechSynthesis || null
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) {
        const recog = new SR()
        recog.continuous = false
        recog.interimResults = false
        recog.lang = "es-ES"
        recog.onresult = (e: { results: { transcript: string }[][] }) => {
          const transcript = e.results[0][0].transcript
          setInput((prev) => (prev ? prev + " " + transcript : transcript))
          setIsListening(false)
          smRef.current.returnToIdle()
        }
        recog.onerror = () => {
          setIsListening(false)
          smRef.current.returnToIdle()
        }
        recog.onend = () => {
          setIsListening(false)
          if (smRef.current.getState() === "ESCUCHANDO") {
            smRef.current.returnToIdle()
          }
        }
        speechRecogRef.current = recog
        setHasSpeech(true)
      }
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, elianaState])

  // Focus input
  useEffect(() => {
    if (elianaState === "VIVA" || elianaState === "ESCUCHANDO") {
      inputRef.current?.focus()
    }
  }, [elianaState])

  // Welcome message
  useEffect(() => {
    if (isLoaded && messages.length === 0) {
      const welcome: ChatMessage = {
        id: `welcome_${Date.now()}`,
        role: "eliana",
        text: session
          ? `Bendiciones, ${session.name}. Soy ELIANA, la Guía Inteligente de MSM & ZAFIRO. ¿Cómo puedo orientarte hoy?`
          : channelConfig.welcome_message,
        timestamp: Date.now(),
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([welcome])
      saveMessage(welcome)
    }
  }, [isLoaded, session, channelConfig.welcome_message, messages.length])

  // --- Voice Functions ---
  const speakText = useCallback((text: string) => {
    if (!speechSynthRef.current || !voiceEnabled) return
    speechSynthRef.current.cancel()
    const clean = text.replace(/[*_`#>\-]/g, "").replace(/\n+/g, ". ")
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = "es-ES"
    utterance.rate = 0.95
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      smRef.current.returnToIdle()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      smRef.current.returnToIdle()
    }
    speechSynthRef.current.speak(utterance)
  }, [voiceEnabled])

  const stopSpeaking = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setIsSpeaking(false)
      smRef.current.returnToIdle()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!speechRecogRef.current) return
    smRef.current.startListening()
    setIsListening(true)
    try {
      speechRecogRef.current.start()
    } catch {
      setIsListening(false)
      smRef.current.returnToIdle()
    }
  }, [])

  const stopListening = useCallback(() => {
    if (speechRecogRef.current) {
      speechRecogRef.current.stop()
    }
    setIsListening(false)
    smRef.current.returnToIdle()
  }, [])

  // --- Core Send Message ---
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || elianaState === "PENSANDO" || elianaState === "DESCONECTADA") return

    setSecurityWarning(null)

    // Client-side rate limit
    const rl = clientRateCheck()
    if (!rl.allowed) {
      setSecurityWarning(`Espera ${Math.ceil((rl.waitMs || 60000) / 1000)} segundos antes de enviar otro mensaje.`)
      return
    }

    // Visitor message limit
    const msgLimit = canSendMessage()
    if (!msgLimit.allowed) {
      setSecurityWarning(msgLimit.reason || "Límite alcanzado")
      return
    }

    // Security: validate input
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

    // State: VIVA → ESCUCHANDO
    smRef.current.startListening()

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      text: finalMsg,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    saveMessage(userMsg)
    setRemaining(getRemainingMessages())

    // State: ESCUCHANDO → PENSANDO
    smRef.current.startThinking()

    try {
      const context = getElianaContext("eliana_domain", "standalone")
      const history = messages.map((m) => ({
        role: m.role === "eliana" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }))
      const res = await processElianaRequest(finalMsg, history, context)

      // Security: filter output
      const outputFilter = filterOutput(res.text)

      // State: PENSANDO → HABLANDO
      smRef.current.startSpeaking()

      const elianaMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: "eliana",
        text: outputFilter.filtered,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, elianaMsg])
      saveMessage(elianaMsg)

      // Voice: speak the response
      if (voiceEnabled) {
        speakText(outputFilter.filtered)
      } else {
        // State: HABLANDO → VIVA (no voice)
        smRef.current.returnToIdle()
      }
    } catch {
      smRef.current.reportError()

      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: "eliana",
        text: "Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado; inténtalo nuevamente en unos segundos.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMsg])
      saveMessage(errorMsg)

      // Auto-recover after 5 seconds
      smRef.current.autoRecover(5000)
    }
  }, [input, elianaState, messages, session, voiceEnabled, speakText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = async () => {
    if (isSpeaking) stopSpeaking()
    if (isListening) stopListening()
    smRef.current.reset()
    await clearHistory()
    const welcome: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: "eliana",
      text: session
        ? `Bendiciones, ${session.name}. ¿En qué puedo ayudarte ahora?`
        : "Bendiciones. Soy ELIANA. ¿En qué puedo orientarte?",
      timestamp: Date.now(),
    }
    setMessages([welcome])
    saveMessage(welcome)
    setShowSuggestions(true)
    setSecurityWarning(null)
    setRemaining(getRemainingMessages())
  }

  const stateColor = STATE_COLORS[elianaState]
  const stateLabel = STATE_LABELS[elianaState]
  const stateDesc = STATE_DESCRIPTIONS[elianaState]

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <ElianaDiamond size={40} variant="animated" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/50 bg-[#0a0f1e]/60 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ElianaDiamond size={32} variant="animated" />
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#050816] ${stateColor.dot} ${elianaState === "VIVA" ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">ELIANA</h2>
            <p className={`text-[10px] ${stateColor.text}`}>
              {stateDesc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Voice toggle */}
          <button
            onClick={() => {
              setVoiceEnabled((v) => !v)
              if (isSpeaking) stopSpeaking()
            }}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              voiceEnabled ? "bg-[#00D9FF]/10 text-[#00D9FF]" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
            title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={resetChat}
            className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors text-slate-400 hover:text-white cursor-pointer"
            title="Nueva conversación"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* State Indicator Bar */}
      <AnimatePresence>
        {elianaState !== "VIVA" && elianaState !== "DESCONECTADA" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`${stateColor.bg} border-b border-slate-800/30`}
          >
            <div className="px-5 py-2 flex items-center gap-2">
              {elianaState === "PENSANDO" && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              {elianaState === "ESCUCHANDO" && (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              )}
              {elianaState === "HABLANDO" && isSpeaking && (
                <Volume2 className="w-3 h-3 text-purple-400 animate-pulse" />
              )}
              <span className={`text-[10px] font-medium ${stateColor.text}`}>{stateLabel}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Warning */}
      <AnimatePresence>
        {securityWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-500/10 border-b border-rose-500/20"
          >
            <div className="px-5 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="text-[10px] text-rose-400">{securityWarning}</span>
              <button onClick={() => setSecurityWarning(null)} className="ml-auto text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-thin">
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
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D9FF]/20 to-[#7c3aed]/20 flex items-center justify-center mr-2 mt-1 shrink-0 border border-[#00D9FF]/10">
                  <ElianaDiamond size={14} />
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#197BD2]/15 text-[#00D9FF] border border-[#197BD2]/20 rounded-br-md"
                  : "bg-[#14171A] text-slate-200 border border-slate-800/50 rounded-bl-md"
              }`}>
                <MarkdownRenderer content={msg.text} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {elianaState === "PENSANDO" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D9FF]/20 to-[#7c3aed]/20 flex items-center justify-center mr-2 mt-1 shrink-0 border border-[#00D9FF]/10">
              <ElianaDiamond size={14} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#14171A] border border-slate-800/50 flex gap-1.5">
              <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {showSuggestions && messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-2"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-medium">Acciones rápidas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.query)}
                  disabled={elianaState !== "VIVA"}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#14171A] border border-slate-800/40 hover:border-[#00D9FF]/30 hover:bg-[#197BD2]/5 transition-all text-left group disabled:opacity-40 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      {messages.length > 1 && (
        <div className="px-5 py-1">
          <p className="text-[9px] text-slate-600 flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" /> {DISCLAIMER}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-center gap-3 bg-[#14171A] border border-slate-800/50 rounded-2xl px-4 py-3 focus-within:border-[#00D9FF]/30 transition-colors">
          {/* Mic button */}
          {hasSpeech && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={elianaState !== "VIVA" && elianaState !== "ESCUCHANDO"}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={elianaState === "DESCONECTADA" ? "Sin conexión..." : "Escribe tu pregunta..."}
            className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none"
            disabled={elianaState === "PENSANDO" || elianaState === "DESCONECTADA"}
          />

          {/* Stop voice button (when speaking) */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 transition-all cursor-pointer"
              title="Detener voz"
            >
              <VolumeX className="w-4 h-4 text-rose-400" />
            </button>
          )}

          <button
            onClick={() => sendMessage()}
            disabled={elianaState !== "VIVA" || !input.trim()}
            className="p-2 rounded-xl bg-[#197BD2]/20 hover:bg-[#197BD2]/30 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#00D9FF]" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[9px] text-slate-600">
            Enter enviar · Shift+Enter nueva línea
          </p>
          <p className="text-[9px] text-slate-600">
            {session ? "Modo autenticado" : `Visitante · ${remaining} msgs restantes`}
          </p>
        </div>
      </div>
    </div>
  )
}
