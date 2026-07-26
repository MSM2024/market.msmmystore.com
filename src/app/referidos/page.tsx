'use client'

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Share2, Users, Gem, Copy, CheckCircle, Gift, UserPlus, TrendingUp } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { generateReferralCode, getReferrals, getReferralEarnings, getReferralCount, type ReferralRecord } from "@/lib/referidos"

export default function ReferidosPage() {
  usePageTitle("Mis Referidos — ZAFIRO")
  const session = getSession()
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState(() => session ? generateReferralCode(session.id).code : "")
  const [referralCount, setReferralCount] = useState(() => session ? getReferralCount(session.id) : 0)
  const [earnings, setEarnings] = useState(() => session ? getReferralEarnings(session.id) : 0)
  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => session ? getReferrals(session.id) : [])

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/register?ref=${code}`
    : ""

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Mis Referidos</h1>
            <p className="text-sm text-slate-400">Invita y gana PTS por cada creador que se sume a ZAFIRO</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl glass">
            <UserPlus className="w-5 h-5 text-[#00D9FF] mb-2" />
            <p className="text-xl font-black">{referralCount}</p>
            <p className="text-[9px] text-slate-400">Personas invitadas</p>
          </div>
          <div className="p-4 rounded-2xl glass">
            <Gem className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xl font-black">{earnings.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">PTS ganados</p>
          </div>
          <div className="p-4 rounded-2xl glass">
            <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xl font-black">{referralCount * 5}%</p>
            <p className="text-[9px] text-slate-400">Tasa de retención</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/5 mb-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00D9FF]" /> Tu enlace de referido
          </h2>
          <p className="text-[10px] text-slate-400 mb-3">
            Comparte este enlace con otros creadores. Ganas <strong className="text-emerald-400">100 PTS</strong> por cada
            persona que se registre con tu código.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-xl bg-slate-950/80 border border-slate-700 text-[10px] text-slate-300 font-mono truncate">
              {shareUrl || "Inicia sesión para ver tu enlace"}
            </div>
            <button onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer">
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass mb-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00D9FF]" /> Personas que has invitado
          </h2>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Aún no has invitado a nadie</p>
              <p className="text-[9px] text-slate-600 mt-1">Comparte tu enlace y empieza a ganar PTS</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-300">{r.referredEmail}</p>
                      <p className="text-[8px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">+{r.bonusAwarded} PTS</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl glass p-5">
          <h3 className="text-xs font-bold text-white mb-2">Cómo funciona</h3>
          <ol className="space-y-2 text-[10px] text-slate-400 list-decimal list-inside">
            <li>Comparte tu enlace único de referido</li>
            <li>La persona se registra con tu código</li>
            <li>Ambos reciben <strong className="text-emerald-400">100 PTS</strong> de bonificación</li>
            <li>No hay límite de referidos — invita a todos los que quieras</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
