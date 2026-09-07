'use client'

import { useEffect, useState } from "react"
import { ElianaStateMachine, type ElianaState } from "@/lib/eliana/core/state"

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

  useEffect(() => {
    const unsub = sm.subscribe((s) => setState(s))
    return unsub
  }, [sm])

  const scale = size === "sm" ? "scale-75" : ""

  return (
    <div
      className={`eliana-presence ${stateClass(state)} ${scale}`}
      role="status"
      aria-live="polite"
      aria-label={`ELIANA está ${state.toLowerCase()}`}
    >
      {/* Anillos continuos de vida */}
      <div className="eliana-ring" aria-hidden="true" />
      <div className="eliana-ring eliana-ring--inner" aria-hidden="true" />

      {/* ESCUCHANDO: ecualizador */}
      {state === "ESCUCHANDO" && (
        <div className="eliana-eq" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

      {/* PENSANDO: órbita giratoria + puntos de procesamiento */}
      {state === "PENSANDO" && (
        <>
          <div className="eliana-orbit" aria-hidden="true">
            <span className="eliana-orbit-dot eliana-orbit-dot--a" />
            <span className="eliana-orbit-dot eliana-orbit-dot--b" />
          </div>
          <div className="eliana-think-dots eliana-think-dots--l" aria-hidden="true">
            <i className="dot" />
            <i className="dot" />
            <i className="dot" />
          </div>
          <div className="eliana-think-dots eliana-think-dots--r" aria-hidden="true">
            <i className="dot" />
            <i className="dot" />
            <i className="dot" />
          </div>
        </>
      )}

      {/* HABLANDO: ondas sonoras en expansión */}
      {state === "HABLANDO" && (
        <>
          <div className="eliana-sonar" aria-hidden="true" />
          <div className="eliana-sonar eliana-sonar--b" aria-hidden="true" />
          <div className="eliana-sonar eliana-sonar--c" aria-hidden="true" />
        </>
      )}

      {/* Presencia abstracta */}
      <div className="eliana-diamond" aria-hidden="true" />
    </div>
  )
}