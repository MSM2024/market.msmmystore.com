'use client'

import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, Volume2, Play } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function VozPage() {
  usePageTitle("Audio y Voz — ELIANA")

  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [autoPlay, setAutoPlay] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    const updateVoices = () => {
      const v = synth.getVoices()
      voicesRef.current = v
      setAvailableVoices(v)
    }
    updateVoices()
    synth.onvoiceschanged = updateVoices

    const saved = localStorage.getItem("eliana_voice_settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.voice) setSelectedVoice(parsed.voice)
        if (parsed.rate) setRate(parsed.rate)
        if (parsed.pitch) setPitch(parsed.pitch)
        if (parsed.autoPlay !== undefined) setAutoPlay(parsed.autoPlay)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("eliana_voice_settings", JSON.stringify({ voice: selectedVoice, rate, pitch, autoPlay }))
  }, [selectedVoice, rate, pitch, autoPlay])

  const testVoice = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance("Hola, soy ELIANA. Esta es una prueba de voz.")
    utterance.lang = "es-MX"
    utterance.rate = rate
    utterance.pitch = pitch
    if (selectedVoice) {
      const voice = voicesRef.current.find(v => v.voiceURI === selectedVoice)
      if (voice) utterance.voice = voice
    }
    synth.speak(utterance)
  }, [rate, pitch, selectedVoice])

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/configuracion" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Configuración
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <h1 className="text-xl font-black mb-1">Audio y Voz</h1>
        <p className="text-xs text-slate-400 mb-6">Configura cómo ELIANA habla y escucha</p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass border border-slate-800/30">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Voz</label>
              <button
                onClick={testVoice}
                className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3" /> Probar
              </button>
            </div>
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              className="w-full mt-2 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none"
            >
              <option value="">Voz por defecto del sistema</option>
              {availableVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl glass border border-slate-800/30">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Velocidad ({rate.toFixed(1)}x)</label>
            <input type="range" min="0.5" max="2" step="0.1" value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="w-full mt-2 accent-[#00D9FF]" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>Lenta</span><span>Normal</span><span>Rápida</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass border border-slate-800/30">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tono ({pitch.toFixed(1)})</label>
            <input type="range" min="0.5" max="2" step="0.1" value={pitch}
              onChange={e => setPitch(parseFloat(e.target.value))}
              className="w-full mt-2 accent-[#00D9FF]" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>Grave</span><span>Normal</span><span>Agudo</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass border border-slate-800/30">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Reproducción automática</label>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-300">Reproducir respuestas de voz automáticamente</p>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                  autoPlay ? "bg-[#00D9FF]/40 border border-[#00D9FF]/50" : "bg-slate-800 border border-slate-700"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  autoPlay ? "left-5" : "left-1"
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
