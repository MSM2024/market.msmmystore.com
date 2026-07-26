'use client'

import Link from "next/link"
import { ArrowLeft, Send, Search, Check, MoreHorizontal, Phone, Video } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { usePageTitle } from "@/lib/usePageTitle"

const conversations = [
  { id: "1", name: "Dr. Alejandro Ramos", avatar: "AR", lastMsg: "La criptografía lattice es el futuro", time: "12:30", unread: 2, online: true },
  { id: "2", name: "Ana García", avatar: "AG", lastMsg: "¿Viste el nuevo paper sobre síntesis?", time: "11:15", unread: 0, online: true },
  { id: "3", name: "Ing. Mariana López", avatar: "ML", lastMsg: "Te compartí el análisis espectral", time: "ayer", unread: 0, online: false },
  { id: "4", name: "Coach Eduardo Mendoza", avatar: "EM", lastMsg: "Excelente pregunta en el círculo", time: "ayer", unread: 1, online: false },
]

export default function MessagesPage() {
  usePageTitle("Mensajes")
  const [activeChat, setActiveChat] = useState("1")
  const [msg, setMsg] = useState("")
  const [allMessages, setAllMessages] = useState<Record<string, Array<{ role: string; text: string; time: string }>>>(() => {
    if (typeof window === "undefined") return {}
    const stored = localStorage.getItem("zafiro_messages")
    if (stored) {
      try { return JSON.parse(stored) } catch {}
    }
    return {}
  })
  const [isInitialized, setIsInitialized] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isInitialized) localStorage.setItem("zafiro_messages", JSON.stringify(allMessages))
  }, [allMessages, isInitialized])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages])

  const defaultMessages: Array<{ role: string; text: string; time: string }> = allMessages[activeChat] || [
    { role: "them", text: "He estado revisando el paper de criptografía lattice que mencionaste", time: "11:30" },
    { role: "me", text: "Sí, Kyber-1024 está avanzando rápido. ¿Qué te pareció la sección de implementación?", time: "11:32" },
    { role: "them", text: "Fascinante. La reducción de latencia es significativa. Deberíamos integrarlo en nuestro stack.", time: "11:35" },
    { role: "me", text: "Completamente de acuerdo. Podríamos hacer un PoC la próxima semana.", time: "11:36" },
  ]

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    const newMsg = { role: "me" as const, text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setAllMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || defaultMessages), newMsg]
    }))
    setMsg("")
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="h-screen flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-black flex-1">Mensajes</h1>
          <button className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
            <Search className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r border-slate-800 overflow-y-auto shrink-0 hidden md:block">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveChat(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer ${
                  activeChat === c.id ? "bg-[#00D9FF]/10 border-l-2 border-[#00D9FF]" : "hover:bg-slate-900/40 border-l-2 border-transparent"
                }`}>
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center text-sm font-black shrink-0">
                  {c.avatar}
                  {c.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050816]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <span className="text-[8px] text-slate-500 shrink-0">{c.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D9FF] text-[7px] font-black text-[#050816] flex items-center justify-center shrink-0">{c.unread}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center text-xs font-black">AR</div>
                <div>
                  <p className="text-xs font-bold">Dr. Alejandro Ramos</p>
                  <p className="text-[8px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En línea</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"><Phone className="w-4 h-4 text-slate-400" /></button>
                <button className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"><Video className="w-4 h-4 text-slate-400" /></button>
                <button className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(allMessages[activeChat] || defaultMessages).map((m, i) => (
                <div key={i} className={`flex ${m.role === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[75%] ${
                    m.role === "me"
                      ? "bg-gradient-to-r from-[#00D9FF]/20 to-blue-600/20 border border-[#00D9FF]/20 text-white"
                      : "bg-slate-900/60 border border-slate-800 text-slate-200"
                  }`}>
                    <p>{m.text}</p>
                    <p className="text-[8px] text-slate-500 mt-1 text-right">{m.time}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSendMsg} className="p-3 border-t border-slate-800 flex items-center gap-2">
              <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#00D9FF] outline-none" />
              <button type="submit" disabled={!msg.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 flex items-center justify-center disabled:opacity-50 cursor-pointer">
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
