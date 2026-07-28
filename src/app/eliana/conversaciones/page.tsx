'use client'

import Link from "next/link"
import { ArrowLeft, MessageSquare, Clock, Search } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function ConversacionesPage() {
  usePageTitle("Conversaciones — ELIANA")

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

        <h1 className="text-xl font-black mb-1">Conversaciones</h1>
        <p className="text-xs text-slate-400 mb-6">Historial de tus conversaciones con ELIANA</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <div className="p-4 rounded-2xl glass border border-slate-800/30 text-center py-12">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500">No hay conversaciones aún</p>
            <p className="text-[10px] text-slate-600 mt-1">Inicia una conversación con ELIANA desde el chat</p>
            <Link href="/eliana/chat"
              className="inline-block mt-4 text-[10px] text-[#00D9FF] hover:underline font-bold">
              Abrir Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
