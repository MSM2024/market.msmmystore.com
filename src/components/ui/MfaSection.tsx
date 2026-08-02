"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, ShieldOff, Smartphone, Check, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

type MfaState = "loading" | "unavailable" | "disabled" | "enrolling" | "enabled" | "error"

export default function MfaSection() {
  const [state, setState] = useState<MfaState>("loading")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [factorId, setFactorId] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const loadFactors = useCallback(async () => {
    if (!isSupabaseAvailable()) {
      setState("unavailable")
      return
    }
    const supabase = getSupabaseClient()
    if (!supabase) {
      setState("unavailable")
      return
    }
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setState("error")
      return
    }
    const verified = data.all.some((f: { status: string }) => f.status === "verified")
    setState(verified ? "enabled" : "disabled")
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadFactors)
  }, [loadFactors])

  const handleEnroll = async () => {
    setBusy(true)
    setMessage(null)
    const supabase = getSupabaseClient()
    if (!supabase) {
      setBusy(false)
      return
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" })
    if (error || !data) {
      setMessage({ ok: false, text: error?.message || "No se pudo iniciar el registro" })
      setBusy(false)
      return
    }
    setFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setState("enrolling")
    setBusy(false)
  }

  const handleVerify = async () => {
    if (!code.trim() || !factorId) return
    setBusy(true)
    setMessage(null)
    const supabase = getSupabaseClient()
    if (!supabase) {
      setBusy(false)
      return
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challenge) {
      setMessage({ ok: false, text: challengeError?.message || "No se pudo generar el desafío" })
      setBusy(false)
      return
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
    if (verifyError) {
      setMessage({ ok: false, text: verifyError.message || "Código incorrecto" })
      setBusy(false)
      return
    }
    setCode("")
    setMessage({ ok: true, text: "Autenticación en dos pasos activada" })
    await loadFactors()
    setBusy(false)
  }

  const handleDisable = async () => {
    setBusy(true)
    setMessage(null)
    const supabase = getSupabaseClient()
    if (!supabase) {
      setBusy(false)
      return
    }
    const { data } = await supabase.auth.mfa.listFactors()
    const factor = data?.all.find((f: { type: string; status: string }) => f.type === "totp" && f.status === "verified")
    if (factor) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (error) {
        setMessage({ ok: false, text: error.message || "No se pudo desactivar" })
        setBusy(false)
        return
      }
    }
    setMessage({ ok: true, text: "Autenticación en dos pasos desactivada" })
    await loadFactors()
    setBusy(false)
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs py-3">
        <Loader2 className="w-4 h-4 animate-spin" /> Verificando estado de seguridad...
      </div>
    )
  }

  if (state === "unavailable") {
    return (
      <div className="p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60 text-slate-500 text-xs">
        La verificación en dos pasos estará disponible cuando el servicio de autenticación esté configurado.
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60">
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-xs font-bold text-slate-200">Autenticación en dos pasos</p>
          <p className="text-[10px] text-slate-500 mt-0.5">No se pudo consultar el estado</p>
        </div>
        <button onClick={loadFactors}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 cursor-pointer">
          <RefreshCw className="w-3 h-3" /> Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60">
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            {state === "enabled" ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldOff className="w-4 h-4 text-slate-500" />}
            Autenticación en dos pasos (MFA)
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {state === "enabled"
              ? "Tu cuenta está protegida con un código temporal de una app autenticadora."
              : "Agrega un segundo factor de seguridad con la app de tu preferencia (Google Authenticator, Authy, etc.)."}
          </p>
        </div>
        {state !== "enrolling" && (
          state === "enabled" ? (
            <button onClick={handleDisable} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />} Desactivar
            </button>
          ) : (
            <button onClick={handleEnroll} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Smartphone className="w-3 h-3" />} Activar
            </button>
          )
        )}
      </div>

      {state === "enrolling" && (
        <div className="p-4 rounded-xl bg-slate-900/20 border border-[#00D9FF]/20 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {qrCode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCode} alt="Código QR para configurar tu app autenticadora" className="w-36 h-36 rounded-lg bg-white p-2" />
            )}
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-slate-200">1. Escanea el código QR</p>
              <p className="text-[10px] text-slate-500 mt-1">O ingresa manualmente esta clave en tu app autenticadora:</p>
              {secret && (
                <code className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-[#00D9FF] font-mono break-all">
                  {secret}
                </code>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 mb-1">2. Ingresa el código de 6 dígitos</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") handleVerify() }}
                className="w-32 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white text-center tracking-[0.4em] focus:border-[#00D9FF] outline-none"
              />
              <button onClick={handleVerify} disabled={busy || code.length < 6}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Verificar y activar
              </button>
              <button onClick={() => { setState("disabled"); setCode(""); setMessage(null) }}
                className="text-[10px] text-slate-500 hover:text-white cursor-pointer">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-[10px] font-bold ${
          message.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-300"
        }`}>
          {message.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
