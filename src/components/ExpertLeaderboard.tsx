'use client'

import { Expert } from '@/lib/zafiro-data'
import { Award } from 'lucide-react'

interface ExpertLeaderboardProps {
  experts: Expert[]
}

export default function ExpertLeaderboard({ experts }: ExpertLeaderboardProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-amber-500" />
        <h2 className="text-sm font-bold text-white">Sintonizadores Top de la Red</h2>
      </div>
      <div className="space-y-2">
        {experts.map((expert) => (
          <div
            key={expert.rank}
            className="p-3 rounded-xl border border-slate-800 bg-slate-950/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${expert.color}`}
              >
                {expert.rank}
              </span>
              <img
                src={expert.avatar}
                alt={expert.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-bold text-white">{expert.name}</p>
                <p className="text-[9px] text-slate-400">{expert.title}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#00D9FF]">
              {expert.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
