'use client'

import { useState, useRef, useCallback } from "react"
import { motion } from "motion/react"
import { Mic, MicOff, Save, Lock, Globe, Archive, BookOpen, Lightbulb, Sparkles, Eye, Loader2 } from "lucide-react"
import ElianaDiamond from "@/components/ElianaDiamond"

const CLASSIFICATIONS = [
  { id: "oracion", label: "Oración", icon: <Sparkles className="w-3 h-3" /> },
  { id: "ensenanza", label: "Enseñanza", icon: <BookOpen className="w-3 h-3" /> },
  { id: "reflexion", label: "Reflexión", icon: <Lightbulb className="w-3 h-3" /> },
  { id: "recuerdo", label: "Recuerdo", icon: <Archive className="w-3 h-3" /> },
  { id: "testimonio", label: "Testimonio", icon: <Eye className="w-3 h-3" /> },
  { id: "sueno", label: "Sueño", icon: <Sparkles className="w-3 h-3" /> },
  { id: "idea", label: "Idea", icon: <Lightbulb className="w-3 h-3" /> },
  { id: "invento", label: "Invento", icon: <Sparkles className="w-3 h-3" /> },
  { id: "proyecto", label: "Proyecto", icon: <BookOpen className="w-3 h-3" /> },
  { id: "tarea", label: "Tarea", icon: <Archive className="w-3 h-3" /> },
  { id: "libro", label: "Libro", icon: <BookOpen className="w-3 h-3" /> },
  { id: "mensaje_familiar", label: "Mensaje familiar", icon: <Eye className="w-3 h-3" /> },
  { id: "contenido_comercial", label: "Contenido comercial", icon: <Globe className="w-3 h-3" /> },
]

const VISIBILITY_OPTIONS = [
  { id: "privado", label: "Privado", icon: <Lock className="w-3 h-3" />, desc: "Solo tú" },
  { id: "publico", label: "Publicar", icon: <Globe className="w-3 h-3" />, desc: "Visible en ZAFIRO" },
  { id: "recuerdo", label: "Guardar como recuerdo", icon: <Archive className="w-3 h-3" />, desc: "Para tu legado" },
  { id: "ensenanza", label: "Convertir en enseñanza", icon: <BookOpen className="w-3 h-3" />, desc: "Compartir conocimiento" },
  { id: "proyecto", label: "Crear proyecto", icon: <Sparkles className="w-3 h-3" />, desc: "Desarrollar idea" },
]

export default function VozVivaPage() {
  const [content, setContent] = useState("")
  const [classification, setClassification] = useState("")
  const [, setVisibility] = useState("privado")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recog = new SR()
    recog.continuous = false
    recog.interimResults = false
    recog.lang = "es-MX"
    recog.onresult = (e: { results: { transcript: string }[][] }) => {
      const transcript = e.results[0][0].transcript
      setContent(prev => prev + (prev ? " " : "") + transcript)
      setIsListening(false)
    }
    recog.onerror = () => setIsListening(false)
    recog.onend = () => setIsListening(false)
    recog.start()
    recognitionRef.current = recog
    setIsListening(true)
  }, [isListening])

  const saveToApi = useCallback(async (v: string) => {
    if (!content.trim() || saving) return
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/voz-viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, classification, visibility: v }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      setSaved(true)
      setShowPrompt(false)
      setContent("")
      setClassification("")
      setVisibility("privado")
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }, [content, classification, saving])

  const handleSave = () => {
    if (!content.trim()) return
    setShowPrompt(true)
  }

  const handleVisibilitySelect = async (v: string) => {
    setVisibility(v)
    await saveToApi(v)
  }

  return (
    <div className="min-h-screen zafiro-page text-white flex flex-col">
      <div className="border-b border-slate-800/60 bg-[#0B1220]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ElianaDiamond size={24} variant="animated" />
            <div>
              <p className="text-[10px] font-bold text-white">La Voz Viva</p>
              <p className="text-[7px] text-slate-500">Convierte tu voz en conocimiento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] px-4 py-3 rounded-xl text-center">
            Contenido guardado exitosamente en tu álbum.
          </motion.div>
        )}
        {saveError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] px-4 py-3 rounded-xl text-center">
            {saveError}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value); setShowPrompt(false) }}
          placeholder="Escribe, dicta o pega aquí tu oración, enseñanza, reflexión, recuerdo, idea o proyecto..."
          className="w-full min-h-[200px] bg-[#0B1220]/60 border border-slate-700/30 rounded-xl p-4 text-[12px] text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/40 resize-y"
        />

        <div className="flex flex-wrap gap-2">
          {CLASSIFICATIONS.map(c => (
            <button
              key={c.id}
              onClick={() => setClassification(c.id === classification ? "" : c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] border transition-all cursor-pointer ${
                classification === c.id
                  ? "bg-[#00D9FF]/10 border-[#00D9FF]/40 text-[#00D9FF]"
                  : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-500/50"
              }`}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVoice}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] border transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                : "bg-slate-800/40 border-slate-700/30 text-slate-300 hover:text-white hover:border-slate-500/50"
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isListening ? "Grabando..." : "Grabar audio"}
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-all disabled:opacity-30 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {showPrompt && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#00D9FF]/5 to-purple-500/5 border border-[#00D9FF]/20 rounded-xl p-5 space-y-3">
            <p className="text-[12px] text-slate-300 font-bold">¿Qué deseas hacer con este contenido?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVisibilitySelect(v.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-[#00D9FF]/30 transition-all text-left cursor-pointer"
                >
                  {v.icon}
                  <div>
                    <p className="text-[11px] text-white font-medium">{v.label}</p>
                    <p className="text-[8px] text-slate-500">{v.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="text-[9px] text-slate-600 text-center pt-4 border-t border-slate-800/40">
          La Voz Viva — MSM & ZAFIRO · Tu conocimiento, tu legado
        </div>
      </div>
    </div>
  )
}
