'use client'

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePageTitle } from "@/lib/usePageTitle"
import ElianaEntrance from "@/components/zafiro101/ElianaEntrance"
import ElianaVivaChat from "@/components/zafiro101/ElianaVivaChat"

type Phase = "entrada" | "viva"

// Experiencia ENTRADA SOBERANA → ELIANA VIVA (ZAFIRO 1.0.1).
// Es EL entrypoint de ZAFIRO: lo renderizan tanto la raíz `/` como
// `/eliana` (y `eliana.msmmystore.com` reescribe su raíz aquí).
// No hay segunda interfaz: esta es la UNICA puerta.
export default function ElianaExperience() {
  usePageTitle("ELIANA Viva — ZAFIRO 1.0.1")
  const [phase, setPhase] = useState<Phase>("entrada")
  const [entering, setEntering] = useState(false)

  const handleEnter = () => {
    if (entering || phase !== "entrada") return
    const reduced =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
    if (reduced) {
      setPhase("viva")
      return
    }
    setEntering(true)
  }

  return (
    <div className="min-h-dvh bg-[#050A1A] text-white">
      <AnimatePresence mode="wait">
        {phase === "entrada" ? (
          <motion.div
            key="entrada"
            className="min-h-dvh"
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            <ElianaEntrance onEnter={handleEnter} />
          </motion.div>
        ) : (
          <motion.div
            key="viva"
            className="min-h-dvh"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            <ElianaVivaChat />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Túnel de luz: viaje hacia el núcleo ZAFIRO al entrar */}
      {entering && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
          <motion.div
            className="zaf101-tunnel-ring"
            initial={{ scale: 0, opacity: 0.95 }}
            animate={{ scale: 3.1, opacity: 0 }}
            transition={{ duration: 1.15, ease: "easeOut" }}
            onAnimationComplete={() => {
              setPhase("viva")
              setEntering(false)
            }}
          />
        </div>
      )}
    </div>
  )
}