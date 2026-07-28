'use client'

import Link from "next/link"
import { ArrowLeft, Volume2 } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function VozPage() {
  usePageTitle("Audio y Voz — ELIANA")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
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
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Voz</label>
            <select className="w-full mt-2 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none">
              <option>ELIANA (Femenina)</option>
              <option>ELIANA (Masculina)</option>
              <option>Ninguna (Solo texto)</option>
            </select>
          </div>

          <div className="p-4 rounded-2xl glass border border-slate-800/30">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Velocidad</label>
            <input type="range" min="0.5" max="2" step="0.1" defaultValue="1"
              className="w-full mt-2 accent-[#00D9FF]" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>Lenta</span><span>Normal</span><span>Rápida</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass border border-slate-800/30">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Reproducción automática</label>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-300">Reproducir respuestas de voz automáticamente</p>
              <button className="w-10 h-6 rounded-full bg-[#00D9FF]/20 border border-[#00D9FF]/30 relative cursor-pointer">
                <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-[#00D9FF] transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
