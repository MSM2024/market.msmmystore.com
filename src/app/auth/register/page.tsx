'use client'

import Link from "next/link"
import { Suspense } from "react"
import { Gem, Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, Gift } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { registerUser } from "@/lib/auth"

function RegisterForm() {
  usePageTitle("Crear Cuenta")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refCode, setRefCode] = useState(searchParams.get("ref") || "")
  const [showPw, setShowPw] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!agree) { setError("Debes aceptar los términos y condiciones"); return }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return }
    setLoading(true)
    const result = await registerUser(name, email, password, refCode)
    setLoading(false)
    if (result.ok) {
      router.push("/")
    } else {
      setError(result.error || "Error al crear cuenta")
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Gem className="w-8 h-8 text-[#00D9FF]" />
          <span className="text-lg font-black">ZAFIRO</span>
        </Link>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0B1220]/60">
          <h1 className="text-xl font-black mb-1">Crear Cuenta</h1>
          <p className="text-xs text-slate-400 mb-6">Conviértete en sintonizador de conocimiento</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Nombre de Usuario</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" placeholder="sintonizador" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" placeholder="tu@correo.com" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Mínimo 8 caracteres, incluye mayúscula y número</p>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Código de referido (opcional)</label>
              <div className="relative mt-1">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={refCode} onChange={e => setRefCode(e.target.value)} placeholder="Ej: ABC1234Z"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none" />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 accent-[#00D9FF]" />
              <p className="text-[10px] text-slate-400">Acepto los <Link href="/terms" className="text-[#00D9FF] hover:underline">Términos</Link> y la <Link href="/privacy" className="text-[#00D9FF] hover:underline">Política de Privacidad</Link></p>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[10px] text-red-300">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">¿Ya tienes cuenta? <Link href="/auth/login" className="text-[#00D9FF] hover:underline font-bold">Iniciar Sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Gem className="w-8 h-8 text-[#00D9FF] mx-auto mb-4 animate-pulse" />
          <p className="text-xs text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
