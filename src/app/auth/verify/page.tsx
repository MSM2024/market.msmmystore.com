'use client'

import { useState, Suspense, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Gem, Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

function VerifyContent() {
  usePageTitle("Verificar Cuenta — ZAFIRO")
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [resent, setResent] = useState(false)
  const [error, setError] = useState("")

  const handleResend = useCallback(async () => {
    setError("")
    setResent(false)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "No pudimos reenviar el correo.")
        return
      }
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.")
    }
  }, [email])

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Gem className="w-8 h-8 text-[#00D9FF]" />
          <span className="text-lg font-black">ZAFIRO</span>
        </Link>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black mb-2">Revisa tu Correo</h1>
          <p className="text-xs text-slate-400 mb-2">
            Te enviamos un enlace de verificación a <span className="text-white font-bold">{email || "tu correo"}</span>
          </p>
          <p className="text-[10px] text-slate-500 mb-6">
            Haz clic en el enlace para activar tu cuenta. Si no lo encuentras, revisa tu carpeta de spam.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[10px] text-red-300">{error}</p>
            </div>
          )}

          {resent ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-[10px] text-emerald-300">Correo reenviado. Revisa tu bandeja de entrada.</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <button onClick={handleResend}
              className="w-full py-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-center gap-2">
              <RefreshCw className="w-3 h-3" /> Reenviar correo
            </button>
            <Link href="/auth/login" className="block text-[#00D9FF] text-xs hover:underline font-bold">
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Gem className="w-8 h-8 text-[#00D9FF] mx-auto mb-4 animate-pulse" />
          <p className="text-xs text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
