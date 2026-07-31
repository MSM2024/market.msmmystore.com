'use client'

import { useState } from "react"
import { Shield, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/seed-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: email, setupToken: token }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult({ ok: true, message: `Don Miguel asignado como OWNER exitosamente. Cierra sesión y vuelve a entrar para ver el panel completo.` })
      } else {
        setResult({ ok: false, message: data.error || "Error desconocido" })
      }
    } catch {
      setResult({ ok: false, message: "Error de conexión con el servidor" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/admin" className="text-slate-400 hover:text-white text-xs mb-6 inline-block">
          ← Volver al Admin
        </Link>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-black text-white">Configuración Inicial</h1>
          <p className="text-xs text-slate-400 mt-1">Asigna el rol OWNER al primer usuario administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Tu correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="don.miguel@msmmystore.com"
              required
              className="w-full bg-[#14171A] border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Setup Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="ZAFIRO_SETUP_TOKEN"
                required
                className="w-full bg-[#14171A] border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/40 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[9px] text-slate-600 mt-1">
              Token definido en ZAFIRO_SETUP_TOKEN (Vercel → Settings → Environment Variables)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !token}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Asignando Owner...</>
            ) : (
              <><Shield className="w-4 h-4" /> Asignar como OWNER</>
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
            result.ok
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}>
            {result.ok
              ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            }
            <p className={`text-xs ${result.ok ? "text-emerald-300" : "text-red-300"}`}>
              {result.message}
            </p>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Instrucciones</h3>
          <ol className="text-[9px] text-slate-500 space-y-1.5 list-decimal list-inside">
            <li>Ve a Vercel Dashboard → Project Settings → Environment Variables</li>
            <li>Agrega <code className="text-amber-300 bg-slate-800 px-1 rounded">ZAFIRO_SETUP_TOKEN</code> con un valor seguro</li>
            <li>Ingresa aquí tu correo y el token, y presiona el botón</li>
            <li>Una vez asignado, <strong className="text-white">elimina la variable</strong> ZAFIRO_SETUP_TOKEN por seguridad</li>
            <li>Cierra sesión y vuelve a entrar — verás el panel admin completo</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
