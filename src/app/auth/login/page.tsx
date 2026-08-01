'use client'

import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { loginUser, verifyLoginMfa } from "@/lib/auth"
import BrandEmblem from "@/components/ui/BrandEmblem"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen zafiro-page flex items-center justify-center"><BrandEmblem size={48} decorative className="animate-pulse" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  usePageTitle("Iniciar Sesión")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState("")
  const [mfaBusy, setMfaBusy] = useState(false)

  const redirectTo = searchParams.get("redirect") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await loginUser(email, password)
      if (result.ok && result.mfaFactorId) {
        setMfaFactorId(result.mfaFactorId)
      } else if (result.ok) {
        router.push(redirectTo)
      } else {
        setError(result.error || "Error al iniciar sesión")
        if (result.needsEmailConfirm) {
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
        }
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaFactorId || mfaCode.length < 6) return
    setError("")
    setMfaBusy(true)
    try {
      const result = await verifyLoginMfa(mfaFactorId, mfaCode)
      if (result.ok) {
        router.push(redirectTo)
      } else {
        setError(result.error || "El código no es válido")
        setMfaCode("")
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setMfaBusy(false)
    }
  }

  return (
    <div className="min-h-screen zafiro-page text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <BrandEmblem size={32} decorative />
          <span className="text-lg font-black zafiro-gold-text">ZAFIRO</span>
        </Link>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60">
          {mfaFactorId ? (
            <form className="space-y-4" onSubmit={handleMfaSubmit}>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#00D9FF]" />
                <h1 className="text-xl font-black">Verificación en dos pasos</h1>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Ingresa el código de 6 dígitos de tu app autenticadora para completar el inicio de sesión.
              </p>
              <div>
                <label htmlFor="login-mfa-code" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Código de seguridad</label>
                <input
                  id="login-mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white text-center tracking-[0.4em] focus:border-[#00D9FF] outline-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-[10px] text-red-300">{error}</p>
                </div>
              )}
              <button type="submit" disabled={mfaBusy || mfaCode.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                {mfaBusy ? <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-1.5" /> : null}
                {mfaBusy ? "Verificando..." : "Verificar y continuar"}
              </button>
              <button type="button" onClick={() => { setMfaFactorId(null); setMfaCode(""); setError("") }}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-500 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
              </button>
            </form>
          ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <h1 className="text-xl font-black mb-1">Iniciar Sesión</h1>
            <p className="text-xs text-slate-400 mb-6">Accede a tu cuenta de sintonizador</p>
            <div>
              <label htmlFor="login-email" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" placeholder="tu@correo.com" />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="login-password" type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/auth/recover" className="text-[10px] text-[#00D9FF] hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[10px] text-red-300">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">¿No tienes cuenta? <Link href="/auth/register" className="text-[#00D9FF] hover:underline font-bold">Crear Cuenta</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
