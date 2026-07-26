'use client'

import type { SponsorCampaign } from "@/lib/zafiro-data"
import { getContextualAdMatch } from "@/lib/zafiro-data"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useMemo } from "react"

interface SponsorFloatingBarProps {
  sponsors: SponsorCampaign[]
  selectedTag: string
  searchQuery: string
  joinedCommunities: string[]
  onSponsorClick: (sponsor: SponsorCampaign) => void
  isVisible: boolean
}

const SPONSOR_COLORS = [
  "bg-cyan-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-pink-500",
]

const SponsorFloatingBar = ({
  sponsors,
  selectedTag,
  searchQuery,
  joinedCommunities,
  onSponsorClick,
  isVisible,
}: SponsorFloatingBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const sponsorMatches = useMemo(() => {
    return sponsors
      .map((s) => ({
        sponsor: s,
        match: getContextualAdMatch(s, selectedTag, searchQuery, joinedCommunities),
      }))
      .sort((a, b) => b.match.percentage - a.match.percentage)
  }, [sponsors, selectedTag, searchQuery, joinedCommunities])

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
  }

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })
  }

  if (sponsorMatches.length === 0) return null

  return (
    <div
      className={`sticky top-0 z-40 w-full transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-16"
      } backdrop-blur-md border-b bg-[#050816]/70 border-cyan-500/10`}
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          onClick={scrollLeft}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          aria-label="Scroll sponsors left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          id="sponsor-floating-scroll-bar"
          ref={scrollRef}
          className="flex-1 flex gap-2 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`#sponsor-floating-scroll-bar::-webkit-scrollbar { display: none; }`}</style>
          {sponsorMatches.map(({ sponsor, match }, index) => {
            const isHighMatch = match.percentage > 90
            return (
              <div
                key={sponsor.id}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 shrink-0 whitespace-nowrap transition-all ${
                  isHighMatch
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                    : "bg-slate-900/60 border border-slate-700/50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    SPONSOR_COLORS[index % SPONSOR_COLORS.length]
                  }`}
                >
                  {sponsor.logo}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-semibold text-white">{sponsor.companyName}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider">Sponsored</span>
                </div>
                {isHighMatch && (
                  <span className="text-[9px] font-medium text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded-full">
                    {match.percentage}% AI Match
                  </span>
                )}
                <button
                  onClick={() => onSponsorClick(sponsor)}
                  className="text-[10px] font-semibold text-white bg-cyan-500/20 hover:bg-cyan-500/30 px-2.5 py-1 rounded-full transition-colors border border-cyan-400/20"
                >
                  Conocer más
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={scrollRight}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          aria-label="Scroll sponsors right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default SponsorFloatingBar
