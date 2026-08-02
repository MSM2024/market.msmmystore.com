'use client'

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import ElianaDiamond from "./ElianaDiamond"

interface ElianaContext {
  source_app: string
  source_module?: string
  resource_type?: string
  resource_id?: string
  requested_action?: string
  return_url?: string
}

interface Props {
  context?: ElianaContext
  variant?: "floating" | "button" | "card" | "inline"
  label?: string
  showStatus?: boolean
  className?: string
}

function buildElianaPath(context?: ElianaContext): string {
  const params = new URLSearchParams()
  if (context) {
    if (context.source_app) params.set("src", context.source_app)
    if (context.source_module) params.set("mod", context.source_module)
    if (context.resource_type) params.set("rt", context.resource_type)
    if (context.resource_id) params.set("rid", context.resource_id)
    if (context.requested_action) params.set("action", context.requested_action)
    if (context.return_url) params.set("return", context.return_url)
  }
  const qs = params.toString()
  return `/eliana/chat${qs ? `?${qs}` : ""}`
}

export default function ElianaUniversalLauncher({
  context,
  variant = "floating",
  label = "Hablar con ELIANA",
  showStatus = true,
  className = "",
}: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  const handleOpen = useCallback(() => {
    router.push(buildElianaPath(context))
  }, [router, context])

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-6 right-4 z-[9999] ${className}`}>
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute bottom-16 right-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#0B1220] border border-[#00D9FF]/30 shadow-lg"
            >
              <p className="text-[10px] font-bold text-white">{label}</p>
              {context?.source_app && (
                <p className="text-[8px] text-slate-400">Asistencia para {context.source_app}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleOpen}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative w-14 h-14 rounded-2xl bg-[#050816]/80 backdrop-blur-lg border border-[#00D9FF]/30 shadow-[0_0_30px_rgba(0,217,255,0.25)] flex items-center justify-center cursor-pointer group hover:scale-105 active:scale-95 transition-all"
          whileHover={{ boxShadow: "0 0 40px rgba(0,217,255,0.4)" }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00D9FF]/20 via-[#7c3aed]/10 to-transparent animate-pulse-glow" />
          <span className="relative z-10">
            <ElianaDiamond size={28} variant="animated" />
          </span>
          {showStatus && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#050816] z-20" />
          )}
        </motion.button>
      </div>
    )
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF]/10 to-blue-600/10 border border-[#00D9FF]/20 text-[#00D9FF] text-xs font-bold hover:from-[#00D9FF]/20 hover:to-blue-600/20 transition-all cursor-pointer ${className}`}
      >
        <ElianaDiamond size={16} variant="animated" />
        {label}
      </button>
    )
  }

  if (variant === "card") {
    return (
      <button
        onClick={handleOpen}
        className={`p-4 rounded-2xl glass border border-[#00D9FF]/10 hover:border-[#00D9FF]/30 transition-all text-left cursor-pointer w-full ${className}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] via-[#2563eb] to-[#7c3aed] flex items-center justify-center">
            <ElianaDiamond size={20} variant="animated" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{label}</p>
            <p className="text-[9px] text-slate-400">Guía Inteligente MSM</p>
          </div>
        </div>
        {context?.source_app && (
          <p className="text-[9px] text-slate-500">Asistencia para {context.source_app}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-[9px] text-[#00D9FF]">
          Abrir ELIANA
        </div>
      </button>
    )
  }

  // variant === "inline"
  return (
    <button
      onClick={handleOpen}
      className={`inline-flex items-center gap-1.5 text-[10px] text-[#00D9FF] hover:underline cursor-pointer ${className}`}
    >
      <ElianaDiamond size={12} variant="animated" />
      {label}
    </button>
  )
}
