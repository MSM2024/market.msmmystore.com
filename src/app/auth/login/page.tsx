'use client'

import Link from "next/link"
import { Gem, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { loginUser } from "@/lib/auth"

export default function LoginPage() {
  usePageTitle("Iniciar Sesión")
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await loginUser(email, password)
    setLoading(false)
    if (result.ok) {
      router.push("/")
    } else {
      setError(result.error || "Error al iniciar sesión")
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
          <h1 className="text-xl font-black mb-1">Iniciar Sesión</h1>
          <p className="text-xs text-slate-400 mb-6">Accede a tu cuenta de sintonizador</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
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

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">¿No tienes cuenta? <Link href="/auth/register" className="text-[#00D9FF] hover:underline font-bold">Crear Cuenta</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
