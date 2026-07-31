'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gem, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

type PageStatus = "processing-link" | "form" | "success" | "error"

const LINK_TIMEOUT_MS = 15000
const UPDATE_TIMEOUT_MS = 10000

export default function ResetPasswordPage() {
  usePageTitle("Nueva Contraseña — ZAFIRO")
  const router = useRouter()
  const requestRef = useRef<AbortController | null>(null)

  const [status, setStatus] = useState<PageStatus>("processing-link")
  const [errorMsg, setErrorMsg] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState("")
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const mountedRef = useRef(true)
  const submittingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()
    requestRef.current = controller

    // Check for recovery code in URL
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get("code")
    if (codeFromUrl) {
      Promise.resolve().then(() => {
        setRecoveryCode(codeFromUrl)
        setUseRecoveryCode(true)
        setStatus("form")
      })
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase || !isSupabaseAvailable()) {
      Promise.resolve().then(() => {
        setStatus("error")
        setErrorMsg("El servicio de recuperación no está disponible temporalmente.")
      })
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) {
        setStatus("error")
        setErrorMsg("El enlace de recuperación ha expirado o no es válido. Solicita uno nuevo.")
      }
    }, LINK_TIMEOUT_MS)

    const processLink = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.replace("#", ""))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const type = hashParams.get("type")

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken && refreshToken && type === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else {
          const { data: existingSession } = await supabase.auth.getSession()
          if (!existingSession.session) {
            throw new Error("no_session")
          }
        }

        await new Promise(r => setTimeout(r, 500))
        if (!mountedRef.current) return

        const { data: sessionCheck } = await supabase.auth.getSession()
        if (sessionCheck.session) {
          if (mountedRef.current) {
            setStatus("form")
            window.clearTimeout(timeoutId)
          }
        } else {
          throw new Error("no_session_after_exchange")
        }
      } catch (err) {
        if (!mountedRef.current) return
        window.clearTimeout(timeoutId)
        const msg = err instanceof Error ? err.message : ""
        if (msg.includes("expired") || msg.includes("invalid") || msg.includes("no_session")) {
          setErrorMsg("El enlace de recuperación ha expirado o ya fue utilizado. Solicita uno nuevo.")
        } else {
          setErrorMsg("No pudimos verificar el enlace de recuperación. Solicita uno nuevo.")
        }
        setStatus("error")
      }
    }

    processLink()

    return () => {
      mountedRef.current = false
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [])

  const updatePasswordViaAPI = useCallback(async (accessToken: string | null, refreshToken: string | null): Promise<boolean> => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException("UPDATE_API_TIMEOUT", "AbortError"))
    }, UPDATE_TIMEOUT_MS)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ password, accessToken, refreshToken }),
        signal: controller.signal,
      })
      const data = await res.json()
      return data?.success === true
    } catch {
      return false
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [password])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    setErrorMsg("")

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMsg("La contraseña debe incluir al menos una mayúscula.")
      return
    }
    if (!/\d/.test(password)) {
      setErrorMsg("La contraseña debe incluir al menos un número.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.")
      return
    }

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException("UPDATE_TIMEOUT", "AbortError"))
    }, UPDATE_TIMEOUT_MS)

    submittingRef.current = true
    setSubmitting(true)

    try {
      // Recovery code path
      if (useRecoveryCode && recoveryCode) {
        const codeRes = await fetch("/api/auth/reset-with-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: recoveryCode, password }),
        })
        const codeData = await codeRes.json()
        if (codeData?.success) {
          setStatus("success")
          window.setTimeout(() => router.push("/auth/login"), 2500)
          return
        }
        setErrorMsg(codeData?.error || "Código inválido o expirado. Solicita uno nuevo.")
        return
      }

      // Client-side update via Supabase session
      const supabase = getSupabaseClient()
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password })
        if (!error) {
          setStatus("success")
          window.setTimeout(() => {
            supabase.auth.signOut().then(() => {
              if (mountedRef.current) router.push("/auth/login")
            })
          }, 2500)
          return
        }
        if (error.message?.includes("expired") || error.message?.includes("session")) {
          setErrorMsg("Tu sesión ha expirado. Solicita un nuevo enlace de recuperación.")
          return
        }
      }

      // API fallback
      const hash = window.location.hash
      const hashParams = hash ? new URLSearchParams(hash.replace("#", "")) : null
      const accessToken = hashParams?.get("access_token") ?? null
      const refreshToken = hashParams?.get("refresh_token") ?? null
      const apiOk = await updatePasswordViaAPI(accessToken, refreshToken)
      if (apiOk) {
        setStatus("success")
        window.setTimeout(() => router.push("/auth/login"), 2500)
      } else {
        setErrorMsg("No pudimos actualizar la contraseña. Inténtalo de nuevo.")
      }
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("expired") || msg.includes("session")) {
        setErrorMsg("Tu sesión ha expirado. Solicita un nuevo enlace de recuperación.")
      } else {
        setErrorMsg("No pudimos actualizar la contraseña. Inténtalo de nuevo.")
      }
    } finally {
      window.clearTimeout(timeoutId)
      submittingRef.current = false
      if (mountedRef.current) setSubmitting(false)
    }
  }, [password, confirmPassword, recoveryCode, useRecoveryCode, router, updatePasswordViaAPI])

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

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60">
          {status === "processing-link" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Lock className="w-7 h-7 text-[#00D9FF]" />
              </div>
              <p className="text-xs text-slate-400">Verificando enlace de recuperación...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-xl font-black mb-2">Enlace no válido</h1>
              <p className="text-xs text-slate-400 mb-6">{errorMsg}</p>
              <Link href="/auth/recover"
                className="inline-block bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:opacity-90 transition-all">
                Solicitar nuevo enlace
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
                {useRecoveryCode ? (
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Código de Recuperación
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-4 py-2.5 text-sm text-white font-mono tracking-widest focus:border-[#00D9FF] outline-none"
                        placeholder="Ej: A1B2C3D4"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Si no tienes un código, solicita uno en{" "}
                      <Link href="/auth/recover" className="text-[#00D9FF] hover:underline">
                        recuperar contraseña
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Código de recuperación
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      ¿No recibiste el correo?{" "}
                      <button type="button" onClick={() => setUseRecoveryCode(true)}
                        className="text-[#00D9FF] hover:underline cursor-pointer bg-transparent border-none p-0 text-xs font-bold">
                        Usar código de recuperación
                      </button>
                    </p>
                  </div>
                )}

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
                      placeholder="Mínimo 8 caracteres, mayúscula y número"
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
