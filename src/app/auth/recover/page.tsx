'use client'

import Link from "next/link"
import { Gem, Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { useState } from "react"
import { usePageTitle } from "@/lib/usePageTitle"
import { recoverPassword } from "@/lib/auth"

export default function RecoverPage() {
  usePageTitle("Recuperar Contraseña")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await recoverPassword(email)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || "Error al enviar el enlace")
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-black mb-2">Revisa tu Correo</h1>
            <p className="text-xs text-slate-400 mb-4">Hemos enviado un enlace a <span className="text-white font-bold">{email}</span> para restablecer tu contraseña.</p>
            <p className="text-[10px] text-slate-500 mb-6">(Demo: los datos se almacenan localmente. Puedes cerrar esta ventana.)</p>
            <Link href="/auth/login" className="text-[#00D9FF] text-xs hover:underline font-bold">Volver a Inicio de Sesión</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60">
          <h1 className="text-xl font-black mb-1">Recuperar Contraseña</h1>
          <p className="text-xs text-slate-400 mb-6">Te enviaremos un enlace para restablecer tu contraseña</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" placeholder="tu@correo.com" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[10px] text-red-300">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
              {loading ? "Enviando..." : "Enviar Enlace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
