'use client'

import Link from "next/link"
import { ArrowLeft, Brain, Plus, Search } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function MemoriaPage() {
  usePageTitle("Memoria — ELIANA")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/chat" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Chat
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black mb-1">Memoria</h1>
            <p className="text-xs text-slate-400">Preferencias, contexto y conocimiento autorizado</p>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer">
            <Plus className="w-3 h-3" /> Nuevo
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar en memoria..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-all"
          />
        </div>

        <div className="p-12 rounded-2xl glass border border-slate-800/30 text-center">
          <Brain className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-xs text-slate-500">La memoria se poblará con tus interacciones</p>
          <p className="text-[10px] text-slate-600 mt-1">ELIANA recordará tu contexto autorizado</p>
        </div>
      </div>
    </div>
  )
}
