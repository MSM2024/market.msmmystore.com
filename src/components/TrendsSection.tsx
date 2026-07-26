'use client'

import type { Trend } from "@/lib/zafiro-data"
import { TrendingUp } from "lucide-react"

interface TrendsSectionProps {
  trends: Trend[]
  onSearch?: (query: string) => void
}

const sparklinePath = (points: number[]): string => {
  if (!points.length) return ""
  const w = 14
  const h = 5
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  return points
    .map(
      (y, i) =>
        `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((y - min) / range) * h}`
    )
    .join(" ")
}

const TrendsSection = ({ trends, onSearch }: TrendsSectionProps) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Tendencias en Conocimiento</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {trends.map((trend) => (
          <button
            key={trend.id}
            onClick={() => onSearch?.(trend.category)}
            className="p-3.5 rounded-2xl border bg-slate-950/20 hover:bg-[#050816]/50 border-slate-800/80 text-left w-full transition-colors"
          >
            <span className="inline-block px-1.5 py-[1px] rounded text-[8.5px] text-purple-400 bg-purple-500/5 font-medium uppercase tracking-wider mb-1.5">
              {trend.category}
            </span>
            <h4 className="text-xs font-bold text-white mb-0.5">{trend.title}</h4>
            <p className="text-[9.5px] text-slate-500">{trend.volume}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-emerald-400 text-[10.5px] font-medium">{trend.growth}</span>
              <svg
                width="14"
                height="5"
                viewBox="0 0 14 5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d={sparklinePath(trend.sparkline)}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default TrendsSection
