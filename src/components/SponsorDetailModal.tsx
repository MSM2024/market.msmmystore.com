'use client'

import { motion, AnimatePresence } from "motion/react"
import { X, Sparkles, Gem, ExternalLink } from "lucide-react"
import { type SponsorCampaign, getContextualAdMatch } from "@/lib/zafiro-data"

interface SponsorDetailModalProps {
  sponsor: SponsorCampaign | null
  selectedTag: string
  searchQuery: string
  joinedCommunities: string[]
  onClose: () => void
  onExplore: (sponsor: SponsorCampaign) => void
}

export default function SponsorDetailModal({
  sponsor,
  selectedTag,
  searchQuery,
  joinedCommunities,
  onClose,
  onExplore,
}: SponsorDetailModalProps) {
  return (
    <AnimatePresence>
      {sponsor && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-w-md w-full rounded-3xl border border-slate-800 bg-[#050816]/98 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div
                className="h-32 bg-cover bg-center opacity-40"
                style={{ backgroundImage: `url(${sponsor.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050816]/80 to-[#050816]" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative px-5 pb-5">
              <div className="flex items-center justify-center -mt-10 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {sponsor.logo}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">{sponsor.companyName}</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-medium">
                  <Sparkles className="w-3 h-3" />
                  Sponsor Premium
                </span>
              </div>

              <p className="text-center text-slate-400 text-sm italic mb-4">
                &ldquo;{sponsor.campaignName}&rdquo;
              </p>

              {(() => {
                const match = getContextualAdMatch(sponsor, selectedTag, searchQuery, joinedCommunities)
                return (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-indigo-300 font-medium">{match.message}</span>
                      <span className="text-xs text-indigo-400 font-bold">{match.percentage}%</span>
                    </div>
                    <p className="text-xs text-slate-400">{match.details}</p>
                  </div>
                )
              })()}

              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Propuesta Intelectual
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">{sponsor.details}</p>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 mb-4">
                <Gem className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400">
                  Explorar este sponsor sintonizará +50 PTS
                </p>
              </div>

              <button
                onClick={() => onExplore(sponsor)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-[#00D9FF] to-blue-600 hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                {sponsor.ctaText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
