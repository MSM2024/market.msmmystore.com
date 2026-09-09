'use client'

import { useEffect, useRef, useState } from "react"
import { ElianaStateMachine, type ElianaState } from "@/lib/eliana/core/state"
import ElianaDiamond from "./ElianaDiamond"

interface Props {
  sm: ElianaStateMachine
  size?: "sm" | "lg"
}

function stateClass(state: ElianaState): string {
  switch (state) {
    case "ESCUCHANDO":
      return "eliana-state--escuchando"
    case "PENSANDO":
      return "eliana-state--pensando"
    case "HABLANDO":
      return "eliana-state--hablando"
    case "ERROR":
      return "eliana-state--error"
    case "DESCONECTADA":
      return "eliana-state--desconectada"
    default:
      return "eliana-state--viva"
  }
}

export default function ElianaPresence({ sm, size = "lg" }: Props) {
  const [state, setState] = useState<ElianaState>(sm.getState())
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = sm.subscribe((s) => setState(s))
    return unsub
  }, [sm])

  // Tilt 3D sutil del núcleo (solo puntero fino/escritorio; respeta reduced-motion)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const pointerFine = typeof window !== "undefined" && (window.matchMedia?.("(pointer: fine)").matches ?? false)
    if (!pointerFine) return
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    if (reduced) return

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      if (rect.width === 0) return
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      host.style.setProperty("--zaf101-tilt-x", `${(py * 6).toFixed(2)}deg`)
      host.style.setProperty("--zaf101-tilt-y", `${(px * -6).toFixed(2)}deg`)
    }
    const onLeave = () => {
      host.style.setProperty("--zaf101-tilt-x", "0deg")
      host.style.setProperty("--zaf101-tilt-y", "0deg")
    }
    host.addEventListener("pointermove", onMove)
    host.addEventListener("pointerleave", onLeave)
    return () => {
      host.removeEventListener("pointermove", onMove)
      host.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  const scale = size === "sm" ? "scale-75" : ""

  return (
    <div
      ref={hostRef}
      className={`eliana-presence ${stateClass(state)} ${scale}`}
      role="status"
      aria-live="polite"
      aria-label={`ELIANA está ${state.toLowerCase()}`}
    >
      <div className="eliana-tilt">
        <div className="eliana-core">
          <div className="eliana-parallax">
            {/* Red de luz del universo (núcleo zafiro) */}
            <div className="zaf101-network" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>

            {/* Aura de energía: cambia de color con el estado de ELIANA */}
            <div className="eliana-aura" aria-hidden="true" />

            {/* Anillos continuos de vida */}
            <div className="eliana-ring" aria-hidden="true" />
            <div className="eliana-ring eliana-ring--inner" aria-hidden="true" />

            {/* ESCUCHANDO: ecualizador */}
            {state === "ESCUCHANDO" && (
              <div className="eliana-swap" aria-hidden="true">
                <div className="eliana-eq">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {/* PENSANDO: órbita giratoria + puntos de procesamiento */}
            {state === "PENSANDO" && (
              <div className="eliana-swap" aria-hidden="true">
                <div className="eliana-orbit">
                  <span className="eliana-orbit-dot eliana-orbit-dot--a" />
                  <span className="eliana-orbit-dot eliana-orbit-dot--b" />
                </div>
                <div className="eliana-think-dots eliana-think-dots--l">
                  <i className="dot" />
                  <i className="dot" />
                  <i className="dot" />
                </div>
                <div className="eliana-think-dots eliana-think-dots--r">
                  <i className="dot" />
                  <i className="dot" />
                  <i className="dot" />
                </div>
              </div>
            )}

            {/* HABLANDO: ondas sonoras en expansión */}
            {state === "HABLANDO" && (
              <div className="eliana-swap" aria-hidden="true">
                <div className="eliana-sonar" />
                <div className="eliana-sonar eliana-sonar--b" />
                <div className="eliana-sonar eliana-sonar--c" />
              </div>
            )}

            {/* Presencia abstracta (diamante zafiro facetado, CSS + SVG) */}
            <div className="eliana-diamond" aria-hidden="true">
              <ElianaDiamond />
            </div>
            <div className="eliana-sheen" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}