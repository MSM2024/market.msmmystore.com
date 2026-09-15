"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArrowUpRight, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react"
import { buildElianaCentralUrl, ELIANA_CENTRAL_URL, type ElianaCentralView } from "@/lib/eliana-central/config"

interface Props {
  source: string
  context?: string
  view?: ElianaCentralView
  returnUrl?: string
  className?: string
  title?: string
}

/**
 * WIDGET / SDK REUTILIZABLE de ELIANA CENTRAL.
 *
 * Monta la MISMA ELIANA que vive en eliana.msmmystore.com dentro de la
 * app actual (ZAFIRO, MARKET, Villa Esperanza...). La app solo aporta
 * el acceso visual y el `source`; la inteligencia, voz, estados y
 * lógica de conversación permanecen en ELIANA CENTRAL.
 *
 * Fallbacks honestos, sin duplicar ELIANA:
 * 1. iframe → la ELIANA CENTRAL real embebida (source específico).
 * 2. Botón "Abrir en ELIANA" → si el iframe no carga (red/bloqueo),
 *    se abre elianthat.mmsmystore.com en pestaña nueva para no fingir.
 * 3. Reintentar manual → tras un error de carga.
 */
export default function ElianaCentralWidget({
  source,
  context,
  view = "chat",
  returnUrl,
  className = "",
  title = "ELIANA Central",
}: Props) {
  const [url] = useState(() => buildElianaCentralUrl({ source, context, view, returnUrl }))
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = useCallback(() => {
    setStatus("ready")
    setError(null)
  }, [])

  const handleError = useCallback(() => {
    setStatus("error")
    setError("No se pudo cargar ELIANA Central incrustado.")
  }, [])

  const retry = useCallback(() => {
    setStatus("loading")
    setError(null)
    // Forzar recarga del iframe
    const frame = frameRef.current
    if (frame) {
      frame.src = buildElianaCentralUrl({ source, context, view, returnUrl }) + "&t=" + Date.now()
    }
  }, [source, context, view, returnUrl])

  const openExternal = useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer")
  }, [url])

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si el iframe queda en loading > 10s (host bloquea el embed), pasar a error honesto.
  useEffect(() => {
    if (status !== "loading") return
    typingTimer.current = setTimeout(() => {
      setStatus("error")
      setError("ELIANA Central no respondió al cargarse incrustada.")
    }, 10_000)
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [status])

  return (
    <div className={`relative flex min-h-0 w-full flex-col overflow-hidden ${className}`}>
      {/* Barra superior: marca + fuente */}
      <div className="flex items-center justify-between border-b border-[#DAA520]/15 bg-[#050A1A]/90 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-[#9CC5FF] via-[#2563EB] to-[#0B2A5B]">
            <span className="block h-2 w-2 rotate-45 rounded-[2px] border border-[#DAA520]/70 bg-white/20" />
          </span>
          <span className="text-[11px] font-bold tracking-widest text-[#E8C766]">{title}</span>
          <span className="rounded-full border border-[#DAA520]/25 bg-[#DAA520]/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#E8C766]">
            Central · {source}
          </span>
          <span className="hidden rounded-full border border-neutral-700/50 px-2 py-0.5 text-[8px] tracking-wider text-neutral-500 sm:inline-block">
            eliana.msmmystore.com
          </span>
        </div>
        <button
          type="button"
          onClick={openExternal}
          title="Abrir ELIANA Central en pestaña nueva"
          aria-label="Abrir ELIANA Central en pestaña nueva"
          className="grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-[#DAA520]/30 text-[#E8C766] transition-colors hover:bg-[#DAA520]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAA520]/60"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Contenido: iframe ELIANA CENTRAL real */}
      <div className="relative min-h-0 flex-1">
        <iframe
          ref={frameRef}
          src={url}
          title={`ELIANA Central — ${source}`}
          className="absolute inset-0 h-full w-full border-0 bg-[#050A1A]"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />

        {/* Estado CARGANDO */}
        <AnimatePresence>
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#050A1A] text-center"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#E8C766]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#E8C766]" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#E8C766]" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-[11px] tracking-wider text-neutral-400">
                Conectando con ELIANA Central...
              </p>
              <p className="text-[9px] text-neutral-600">una sola ELIANA · todas las apps</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estado ERROR: honesto, abre la central en pestaña nueva */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#050A1A] px-6 text-center"
            >
              <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] text-red-200">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#DAA520]/50 bg-[#DAA520]/15 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#F9E7B0] transition-colors hover:bg-[#DAA520]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAA520]/60"
                >
                  <RefreshCw className="h-3 w-3" /> Reintentar
                </button>
                <button
                  type="button"
                  onClick={openExternal}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-600 px-4 py-2 text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50"
                >
                  <ArrowUpRight className="h-3 w-3" /> Abrir en ELIANA
                </button>
              </div>
              <p className="text-[9px] text-neutral-500">La inteligencia vive en eliana.msmmystore.com · {ELIANA_CENTRAL_URL}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}