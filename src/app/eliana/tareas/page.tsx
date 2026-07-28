'use client'

import Link from "next/link"
import { ArrowLeft, CheckSquare, Plus, Clock, CheckCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function TareasPage() {
  usePageTitle("Tareas — ELIANA")

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
            <h1 className="text-xl font-black mb-1">Tareas</h1>
            <p className="text-xs text-slate-400">Tareas creadas o sugeridas por ELIANA</p>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer">
            <Plus className="w-3 h-3" /> Nueva
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {["Todas", "Pendientes", "Completadas"].map((tab, i) => (
            <button key={tab}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                i === 0
                  ? "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-12 rounded-2xl glass border border-slate-800/30 text-center">
          <CheckSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-xs text-slate-500">No hay tareas pendientes</p>
          <p className="text-[10px] text-slate-600 mt-1">ELIANA creará tareas basadas en tus conversaciones</p>
        </div>
      </div>
    </div>
  )
}
