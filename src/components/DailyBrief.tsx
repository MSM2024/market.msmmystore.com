'use client'

import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

interface DailyBriefProps {
  onAskEliana?: (message: string) => void
}

export default function DailyBrief({ onAskEliana }: DailyBriefProps) {
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7C3AED]/20 to-[#00D9FF]/10 rounded-2xl blur" />
      <motion.div
        className="relative bg-[#050816]/40 border border-slate-800/80 p-4 rounded-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
          <h2 className="text-sm font-semibold text-[#00D9FF] tracking-wide">
            Resumen IA de Hoy
          </h2>
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            SÍNTESIS GLOBAL
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          La red resuena hoy con intensos intercambios de cálculo biológico y
          enjambres criptográficos. Los nodos periféricos reportan alta
          actividad en patrones de sincronización neuronal distribuida.
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400">
            Consenso AI: 97.4% validado
          </span>
          {onAskEliana && (
            <button
              onClick={() => onAskEliana('¿Qué tendencias ves hoy?')}
              className="text-xs font-medium text-[#00D9FF] hover:text-purple-300 transition-colors"
            >
              Preguntar a Eliana &rarr;
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
