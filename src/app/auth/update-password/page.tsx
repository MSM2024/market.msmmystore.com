'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gem, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

type Status = "loading" | "form" | "success" | "error" | "no-session"

export default function UpdatePasswordPage() {
  usePageTitle("Nueva Contraseña — ZAFIRO")
  const router = useRouter()

  const [status, setStatus] = useState<Status>("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error")
      setErrorMsg("El servicio de recuperación no está disponible temporalmente.")
      return
    }

    // Supabase sends the recovery token in the URL hash fragment.
    // The @supabase/ssr client handles exchanging it for a session automatically.
    // We just need to check if a session was established.
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setStatus("error")
          setErrorMsg("El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.")
          return
        }
        if (data.session) {
          setStatus("form")
        } else {
          // Wait a moment — the session exchange may still be in progress
          // after redirect from Supabase email link
          await new Promise(r => setTimeout(r, 2000))
          const { data: retry, error: retryErr } = await supabase.auth.getSession()
          if (retry.session) {
            setStatus("form")
          } else {
            setStatus("no-session")
          }
        }
      } catch {
        setStatus("error")
        setErrorMsg("No pudimos conectar con el servidor. Revisa tu conexión.")
      }
    }

    checkSession()
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.")
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setErrorMsg("Servicio no disponible.")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        if (error.message.includes("session_not_found") || error.message.includes("invalid")) {
          setErrorMsg("La sesión de recuperación ha expirado. Solicita un nuevo enlace.")
        } else {
          setErrorMsg("No pudimos actualizar la contraseña. Inténtalo de nuevo.")
        }
        setSubmitting(false)
        return
      }
      setStatus("success")
      setTimeout(() => router.push("/auth/login"), 3000)
    } catch {
      setErrorMsg("No pudimos conectar con el servidor. Revisa tu conexión.")
      setSubmitting(false)
    }
  }, [password, confirmPassword, router])

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Gem className="w-8 h-8 text-[#00D9FF]" />
          <span className="text-lg font-black">ZAFIRO</span>
        </Link>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60">
          {status === "loading" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Lock className="w-7 h-7 text-[#00D9FF]" />
              </div>
              <p className="text-xs text-slate-400">Verificando enlace de recuperación...</p>
            </div>
          )}

          {status === "no-session" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-xl font-black mb-2">Enlace no válido</h1>
              <p className="text-xs text-slate-400 mb-6">
                El enlace de recuperación no es válido o ya fue utilizado.
                Solicita un nuevo enlace desde la página de inicio de sesión.
              </p>
              <Link href="/auth/recover"
                className="inline-block text-[#00D9FF] text-xs hover:underline font-bold">
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-xl font-black mb-2">Error</h1>
              <p className="text-xs text-slate-400 mb-6">{errorMsg}</p>
              <Link href="/auth/recover"
                className="inline-block text-[#00D9FF] text-xs hover:underline font-bold">
                Intentar de nuevo
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-xl font-black mb-2">¡Contraseña Actualizada!</h1>
              <p className="text-xs text-slate-400 mb-2">Tu contraseña ha sido cambiada correctamente.</p>
              <p className="text-[10px] text-slate-500">Redirigiendo al inicio de sesión...</p>
            </div>
          )}

          {status === "form" && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-[#00D9FF]" />
                </div>
                <h1 className="text-xl font-black mb-1">Nueva Contraseña</h1>
                <p className="text-xs text-slate-400">Establece una contraseña segura para tu cuenta</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Nueva Contraseña
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Confirmar Contraseña
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none"
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-amber-400">Las contraseñas no coinciden</p>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-[10px] text-red-300">{errorMsg}</p>
                  </div>
                )}

                <button type="submit" disabled={submitting || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                  {submitting ? "Guardando..." : "Guardar Nueva Contraseña"}
                </button>
              </form>

              <p className="text-[10px] text-slate-500 mt-4 text-center">
                <Link href="/auth/login" className="text-[#00D9FF] hover:underline">Volver al inicio de sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
