'use client'

import Link from "next/link"
import { ArrowLeft, Send, Mail, MessageSquare, HelpCircle } from "lucide-react"
import { useState } from "react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function ContactPage() {
  usePageTitle("Contacto")
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const msgs = JSON.parse(localStorage.getItem("zafiro_contact_messages") || "[]")
    msgs.push({ ...form, timestamp: new Date().toISOString() })
    localStorage.setItem("zafiro_contact_messages", JSON.stringify(msgs))
    setTimeout(() => setSent(true), 600)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black mb-2">Mensaje Enviado</h1>
          <p className="text-sm text-slate-400 mb-6">Gracias por contactarnos. Nuestro equipo responderá a la brevedad.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold">
            Volver a ZAFIRO
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Contacto</h1>
            <p className="text-xs text-slate-400">Estamos aquí para ayudarte</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Asunto</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-colors">
                  <option value="">Selecciona un asunto</option>
                  <option value="soporte">Soporte Técnico</option>
                  <option value="reporte">Reportar Contenido</option>
                  <option value="cuenta">Problemas de Cuenta</option>
                  <option value="pagos">Pagos y Membresías</option>
                  <option value="sugerencia">Sugerencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Mensaje</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5}
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none transition-colors resize-none" />
              </div>
              <button type="submit" disabled={!form.name || !form.email || !form.message}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                <Send className="w-4 h-4" /> Enviar Mensaje
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl glass">
              <MessageSquare className="w-5 h-5 text-[#00D9FF] mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">Soporte Técnico</h3>
              <p className="text-xs text-slate-400">Problemas con la plataforma, errores o fallos técnicos.</p>
            </div>
            <div className="p-5 rounded-2xl glass">
              <HelpCircle className="w-5 h-5 text-amber-400 mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">Centro de Ayuda</h3>
              <p className="text-xs text-slate-400">Consulta nuestra <Link href="/help" className="text-[#00D9FF] hover:underline">guía de preguntas frecuentes</Link> antes de escribirnos.</p>
            </div>
            <div className="p-5 rounded-2xl glass">
              <Mail className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">Tiempo de Respuesta</h3>
              <p className="text-xs text-slate-400">Respondemos en un plazo de 24-48 horas hábiles.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
