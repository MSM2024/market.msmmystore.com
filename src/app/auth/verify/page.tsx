'use client'

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gem, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"

const VALID_CODE = "000000"

export default function VerifyPage() {
  usePageTitle("Verificar Cuenta")
  const router = useRouter()
  const session = typeof window !== "undefined" ? getSession() : null
  const [code, setCode] = useState<string[]>(["","","","","",""])
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = useCallback((i: number, value: string) => {
    if (value.length > 1) return
    const next = [...code]
    next[i] = value.toUpperCase()
    setCode(next)
    if (value && i < 5) inputRefs.current[i + 1]?.focus()
  }, [code])

  const handleKeyDown = useCallback((i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }, [code])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("verifying")
    const codeStr = code.join("")
    if (codeStr.length !== 6) {
      setStatus("error"); setErrorMsg("Ingresa el código completo de 6 dígitos"); return
    }
    await new Promise(r => setTimeout(r, 800))
    if (codeStr === VALID_CODE) {
      setStatus("success")
      setTimeout(() => router.push("/"), 1500)
    } else {
      setStatus("error"); setErrorMsg("Código incorrecto. Intenta de nuevo.")
    }
  }, [code, router])

  const handleResend = useCallback(() => {
    setStatus("idle"); setCode(["","","","","",""]); setErrorMsg("")
    inputRefs.current[0]?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Gem className="w-8 h-8 text-[#00D9FF]" />
          <span className="text-lg font-black">ZAFIRO</span>
        </Link>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60 text-center">
          {status === "success" ? (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-xl font-black mb-2">¡Cuenta Verificada!</h1>
              <p className="text-xs text-slate-400">Redirigiendo a tu panel...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#00D9FF]" />
              </div>
              <h1 className="text-xl font-black mb-2">Verifica tu Correo</h1>
              <p className="text-xs text-slate-400 mb-4">
                {session ? `Enviamos un código a ${session.email}` : "Ingresa el código de verificación."}
              </p>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Código de Verificación</label>
                  <div className="flex gap-2 mt-1 justify-center">
                    {[0,1,2,3,4,5].map((i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el }}
                        type="text"
                        maxLength={1}
                        value={code[i]}
                        onChange={e => handleChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className="w-10 h-12 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-lg font-bold text-white focus:border-[#00D9FF] outline-none transition-all"
                      />
                    ))}
                  </div>
                  {status === "error" && (
                    <p className="text-[10px] text-red-400 mt-2 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errorMsg}
                    </p>
                  )}
                </div>
                <button type="submit" disabled={status === "verifying"} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
                  {status === "verifying" ? "Verificando..." : "Verificar"}
                </button>
              </form>
              <p className="text-[10px] text-slate-500 mt-4">
                ¿No recibiste el código?{" "}
                <button onClick={handleResend} className="text-[#00D9FF] hover:underline cursor-pointer">Reenviar</button>
              </p>
              <p className="text-[10px] text-slate-600 mt-2">Demo: usa 000000</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
