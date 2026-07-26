'use client'

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Gem, Star, Zap, Trophy, Gift, Flame, Users, Target, Award, Compass, ChevronRight } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getPTSAccount, getStreak, checkAndAwardBadges, getEarnedBadges, markDailyLogin, ACTION_REWARDS, BADGE_DEFS, type RewardAction, type PTSAccount } from "@/lib/rewards"

const REWARD_LIST: { action: RewardAction }[] = [
  { action: "create_question" }, { action: "answer_question" }, { action: "received_like" },
  { action: "explore_sponsor" }, { action: "create_sponsor_campaign" }, { action: "daily_login" },
  { action: "join_circle" }, { action: "refer_friend" }, { action: "streak_7_days" },
]

const BADGE_ICONS: Record<string, typeof Star> = { Star, Flame, Compass, Users, Target, Trophy, Award }

export default function RewardsPage() {
  usePageTitle("MSM Rewards")
  const session = getSession()
  const userId = session?.id || ""
  const [account, setAccount] = useState<PTSAccount>(() => {
    if (userId && userId !== "guest") {
      markDailyLogin(userId)
      checkAndAwardBadges(userId)
      return getPTSAccount(userId)
    }
    return { userId, balance: 0, totalEarned: 0, totalSpent: 0, level: 1, levelProgress: 0, nextLevelAt: 1000 }
  })
  const [streak, setStreak] = useState(() => userId && userId !== "guest" ? getStreak(userId) : 0)
  const [earnedBadges, setEarnedBadges] = useState<string[]>(() => userId && userId !== "guest" ? getEarnedBadges(userId) : [])
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 glow-cyan">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gradient">MSM Rewards</h1>
            <p className="text-xs text-slate-400">Gana PTS y desbloquea logros en ZAFIRO</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-amber-500/10 to-[#00D9FF]/5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tus Puntos de Sintonía</p>
              <p className="text-4xl font-black mt-1">{account.balance.toLocaleString()} <span className="text-lg font-mono text-[#00D9FF]">PTS</span></p>
              <p className="text-[8px] text-slate-500">Nivel {account.level} · {account.totalEarned.toLocaleString()} PTS ganados</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Racha actual</p>
              <p className="text-lg font-black text-amber-400 flex items-center gap-1"><Flame className="w-5 h-5" /> {streak} días</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-[#00D9FF] rounded-full transition-all" style={{ width: `${account.levelProgress}%` }} />
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{account.nextLevelAt - account.totalEarned} PTS para el siguiente nivel</p>
        </div>

        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-[#00D9FF]" /> Formas de Ganar PTS</h2>
        <div className="space-y-2 mb-10">
          {REWARD_LIST.map((r, i) => {
            const def = ACTION_REWARDS[r.action]
            return (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl glass hover:bg-[#0B1220]/80 transition-all">
                <div>
                  <p className="text-sm font-bold text-white">{def.label}</p>
                  <p className="text-[9px] font-mono text-slate-500">{def.dailyMax >= 999 ? "Ilimitado" : `${def.dailyMax} veces/día`}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#00D9FF]">+{def.pts} PTS</p>
                </div>
              </div>
            )
          })}
        </div>

        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> Logros</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BADGE_DEFS.map((badge, i) => {
            const Icon = BADGE_ICONS[badge.icon] || Star
            const earned = earnedBadges.includes(badge.id)
            return (
              <div key={i} className={`p-4 rounded-xl border text-center transition-all ${earned ? "border-slate-700 bg-[#0B1220]/40" : "border-slate-800/50 bg-slate-900/20 opacity-50"}`}>
                <Icon className={`w-6 h-6 mx-auto mb-2 ${earned ? "text-amber-400" : "text-slate-600"}`} />
                <p className="text-xs font-bold text-white">{badge.name}</p>
                <p className="text-[8px] text-slate-500 mt-0.5">{badge.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
