'use client'

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePageTitle } from "@/lib/usePageTitle"
import ElianaEntrance from "@/components/zafiro101/ElianaEntrance"
import ElianaVivaChat from "@/components/zafiro101/ElianaVivaChat"

type Phase = "entrada" | "viva"

export default function ElianaPage() {
  usePageTitle("ELIANA Viva — ZAFIRO 1.0.1")
  const [phase, setPhase] = useState<Phase>("entrada")

  return (
    <div className="min-h-svh bg-[#050A1A] text-white">
      <AnimatePresence mode="wait">
        {phase === "entrada" ? (
          <motion.div
            key="entrada"
            className="min-h-svh"
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            <ElianaEntrance onEnter={() => setPhase("viva")} />
          </motion.div>
        ) : (
          <motion.div
            key="viva"
            className="min-h-svh"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            <ElianaVivaChat />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}