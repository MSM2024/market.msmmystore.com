"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Sparkles } from "lucide-react"
import ElianaDiamond from "./ElianaDiamond"
import { PORTALS, PORTAL_STATUS_LABEL, isOpenable, type PortalDef, type PortalStatus } from "@/lib/zafiro101/portals"

const STATUS_LABEL = PORTAL_STATUS_LABEL

// Apps/módulos del ecosistema: cada esfera es un PORTAL.
// Se abre la plataforma correspondiente (externa en pestaña nueva,
// interna cuando aún vive dentro de ZAFIRO) según la configuración
// ÚNICA en src/lib/zafiro101/portals.ts. Los no publicados se
// muestran honestamente como "Próximamente" (sin ABRIR).
const OUTER_MODULES: PortalDef[] = PORTALS

const SPRING = { type: "spring", stiffness: 170, damping: 22, mass: 0.9 } as const
const STILL = { duration: 0.01 } as const

const MODULE_W = "clamp(40px, 9.5vw, 58px)"
const MODULE_H = "clamp(40px, 9.5vw, 58px)"
const CORE_W = "clamp(76px, 15vw, 116px)"
const CORE_H = "clamp(76px, 15vw, 116px)"

const BUBBLE_CLASS: Record<PortalStatus, { orb: string; icon: string; dot: string }> = {
  disponible: {
    orb: "border-[#7DB4FF]/40 shadow-[0_0_18px_rgba(37,99,235,0.18)]",
    icon: "text-[#E8C766]",
    dot: "bg-[#34D399]",
  },
  acceso: {
    orb: "border-[#DAA520]/50 shadow-[0_0_18px_rgba(218,165,32,0.18)]",
    icon: "text-[#F0B429]",
    dot: "bg-[#F0B429]",
  },
  futuro: {
    orb: "border-[#3B475F]/50 shadow-[0_0_12px_rgba(148,163,184,0.1)]",
    icon: "text-neutral-400",
    dot: "bg-[#64748B]",
  },
}

interface Props {
  onEnter: () => void
}

export default function ZafiroModuleHub({ onEnter }: Props) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0, ready: false })
  const [active, setActive] = useState<number | null>(null)
  const [coreFocus, setCoreFocus] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect
        setBox({ w: r.width, h: r.height, ready: r.width > 0 && r.height > 0 })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const N = OUTER_MODULES.length
  const core = useMemo(() => ({ cx: box.w / 2, cy: box.h / 2 }), [box])

  // Posición base de cada esfera en el anillo (radio adaptativo al contenedor).
  const base = useMemo(() => {
    const R = Math.min(box.w, box.h) * 0.41
    return OUTER_MODULES.map((_, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2
      return { x: core.cx + Math.cos(angle) * R, y: core.cy + Math.sin(angle) * R }
    })
  }, [box, N, core])

  const go = useCallback(
    (portal: PortalDef) => {
      // Portal externo: se abre en otra pestaña para "entrar a otro
      // universo". Portal interno: navegación SPA dentro de ZAFIRO.
      if (typeof window !== "undefined" && portal.external) {
        window.open(portal.url, "_blank", "noopener,noreferrer")
        return
      }
      router.push(portal.url)
    },
    [router],
  )

  const transition = reduce ? STILL : SPRING

  const leave = useCallback(() => {
    setActive(null)
    setCoreFocus(false)
  }, [])

  const posFor = (i: number) => {
    const p = base[i]
    if (active === null) return { x: p.x, y: p.y }
    if (active === i) {
      // La esfera enfocada "se acerca" al núcleo para su lectura.
      const k = 0.66
      return { x: core.cx + (p.x - core.cx) * k, y: core.cy + (p.y - core.cy) * k }
    }
    // El resto "se alejan" suavemente y se reorganizan.
    const k = 1.18
    return { x: core.cx + (p.x - core.cx) * k, y: core.cy + (p.y - core.cy) * k }
  }

  const scaleFor = (i: number) => {
    if (active === null) return 1
    return active === i ? 1.32 : 0.9
  }

  const opacityFor = (i: number) => (active === null || active === i ? 1 : 0.5)

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={rootRef} className="relative aspect-square w-[min(88vw,44vh,460px)]" onPointerLeave={leave}>
        {box.ready && (
          <>
            {/* Anillos orbitales decorativos del núcleo (static; girar es decorativo) */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-full rounded-full"
              aria-hidden="true"
            >
              <span className="zaf101-module-ring zaf101-module-ring--outer" />
              <span className="zaf101-module-ring zaf101-module-ring--mid" />
              <span className="zaf101-module-ring zaf101-module-ring--inner" />
            </div>

            {/* Núcleo: ELIANA (entra al chat real, FASE 2) */}
            <motion.div
              className="absolute left-0 top-0 z-20"
              animate={{ x: core.cx, y: core.cy }}
              transition={transition}
            >
              <div
                className="absolute"
                style={{
                  width: CORE_W,
                  height: CORE_H,
                  marginLeft: `calc(${CORE_W} / -2)`,
                  marginTop: `calc(${CORE_H} / -2)`,
                }}
              >
                <div className="zaf101-module-float h-full w-full">
                  <motion.div
                    className="h-full w-full"
                    animate={{ scale: active === null ? 1 : 0.94 }}
                    initial={{ scale: 0.94 }}
                    transition={{ delay: mounted ? 0 : 0.1, ...transition }}
                  >
                    <button
                      type="button"
                      onClick={onEnter}
                      onFocus={() => setCoreFocus(true)}
                      onBlur={() => setCoreFocus(false)}
                      onPointerEnter={() => setCoreFocus(true)}
                      onPointerLeave={() => setCoreFocus(false)}
                      aria-label="ELIANA — Guía Inteligente. Entrar a la conversación."
                      title="ELIANA — Guía Inteligente"
                      className={`group relative flex h-full w-full cursor-pointer items-center justify-center rounded-full border transition-[box-shadow,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF3C4]/80 ${
                        coreFocus
                          ? "border-[#FFF3C4]/70 shadow-[0_0_34px_rgba(218,165,32,0.4)]"
                          : "border-[#DAA520]/45 shadow-[0_0_22px_rgba(218,165,32,0.22)]"
                      }`}
                    >
                      <span
                        className="absolute inset-1 rounded-full border border-[#7DB4FF]/30 bg-gradient-to-br from-[#12244D]/85 to-[#05102B]/90 backdrop-blur-sm"
                        aria-hidden="true"
                      />
                      <span className="eliana-diamond-mini relative z-10 h-[68%] w-[68%]">
                        <ElianaDiamond />
                      </span>
                      {/* Píldora de etiqueta */}
                      <span
                        className={`pointer-events-none absolute -top-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#DAA520]/35 bg-[#050A1A]/90 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#F5EEDC] backdrop-blur transition-opacity duration-200 ${
                          coreFocus ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <Sparkles className="mr-1 inline h-2.5 w-2.5 text-[#E8C766]" />
                        ELIANA · Guía IA
                      </span>
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Módulos: esferas-portales flotantes (se acercan/alejan con la interacción) */}
            {OUTER_MODULES.map((mod, i) => {
              const p = posFor(i)
              const scale = scaleFor(i)
              const opacity = opacityFor(i)
              const styles = BUBBLE_CLASS[mod.estado]
              const Icon = mod.icono
              const openable = isOpenable(mod)
              return (
                <motion.div
                  key={mod.id}
                  className={`absolute left-0 top-0 ${active === i ? "z-30" : "z-10"}`}
                  animate={{ x: p.x, y: p.y, opacity }}
                  initial={{ x: base[i].x, y: base[i].y, opacity: 0 }}
                  transition={{ delay: mounted ? 0 : 0.06 * Math.min(i, 6), ...transition }}
                >
                  <div
                    className="absolute"
                    style={{
                      width: MODULE_W,
                      height: MODULE_H,
                      marginLeft: `calc(${MODULE_W} / -2)`,
                      marginTop: `calc(${MODULE_H} / -2)`,
                    }}
                  >
                    <div
                      className="zaf101-module-float-sm h-full w-full"
                      style={{ animationDelay: `${(i % 5) * -1.1}s` }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => {
                          if (openable) go(mod)
                          else setActive(i)
                        }}
                        onPointerEnter={() => setActive(i)}
                        onPointerLeave={() => setActive(null)}
                        onFocus={() => setActive(i)}
                        onBlur={() => setActive(null)}
                        aria-label={`${mod.nombre} — ${STATUS_LABEL[mod.estado]}. ${mod.descripcion}${openable ? " Pulsa para abrir la plataforma." : ""}`}
                        title={mod.nombre}
                        initial={{ scale: 0.8 }}
                        animate={{ scale }}
                        transition={transition}
                        className={`group relative flex h-full w-full cursor-pointer items-center justify-center rounded-full border bg-gradient-to-br from-[#0D1B3A]/85 to-[#050A1A]/90 backdrop-blur-sm transition-[box-shadow,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF3C4]/70 ${styles.orb} ${
                          active === i ? "shadow-[0_0_30px_rgba(218,165,32,0.28)]" : ""
                        }`}
                      >
                        <Icon className={`h-[46%] w-[46%] ${styles.icon}`} aria-hidden="true" />
                        <span
                          className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#050A1A] ${styles.dot}`}
                          aria-hidden="true"
                        />
                        {/* Píldora de etiqueta */}
                        <span
                          className={`pointer-events-none absolute -top-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#DAA520]/35 bg-[#050A1A]/90 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#F5EEDC] backdrop-blur transition-opacity duration-200 ${
                            active === i ? "opacity-100" : "opacity-0 group-focus-within:opacity-100"
                          }`}
                        >
                          {mod.nombre}
                          <span className="mx-1 text-neutral-500">·</span>
                          <span
                            className={
                              mod.estado === "disponible"
                                ? "text-[#34D399]"
                                : mod.estado === "acceso"
                                  ? "text-[#F0B429]"
                                  : "text-neutral-400"
                            }
                          >
                            {STATUS_LABEL[mod.estado]}
                          </span>
                        </span>
                      </motion.button>

                      {/* Acción ABRIR (portal) o estado Próximamente */}
                      <motion.div
                        initial={false}
                        animate={{ opacity: active === i ? 1 : 0, y: active === i ? 0 : 6 }}
                        transition={{ duration: 0.18 }}
                        className={`pointer-events-none absolute left-1/2 top-full z-40 mt-2.5 flex -translate-x-1/2 flex-col items-center gap-1 ${
                          active === i ? "pointer-events-auto" : ""
                        }`}
                        aria-hidden={active !== i}
                      >
                        {openable ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              go(mod)
                            }}
                            className="cursor-pointer whitespace-nowrap rounded-full border border-[#DAA520]/55 bg-[#050A1A]/95 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#F5EEDC] shadow-[0_0_16px_rgba(218,165,32,0.25)] backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF3C4]/70 hover:bg-[#DAA520]/15 hover:text-[#E8C766]"
                          >
                            Abrir {mod.nombre} →
                          </button>
                        ) : (
                          <span className="whitespace-nowrap rounded-full border border-neutral-700/50 bg-[#0B1120]/90 px-3 py-1 text-[9px] font-medium tracking-[0.16em] text-neutral-500 backdrop-blur">
                            Próximamente
                          </span>
                        )}
                        <span className="max-w-[180px] text-center text-[9px] leading-snug text-neutral-400">
                          {mod.descripcion}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </>
        )}
      </div>

      {/* Leyenda honesta de estados */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] tracking-wider text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" aria-hidden="true" /> Disponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F0B429]" aria-hidden="true" /> Acceso público
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" aria-hidden="true" /> Próximamente
        </span>
      </div>
    </div>
  )
}