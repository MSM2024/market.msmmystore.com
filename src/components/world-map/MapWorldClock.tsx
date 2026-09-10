"use client"

import { Clock } from "lucide-react"
import { formatTimeAt } from "@/lib/world-map/time"

/**
 * Reloj de una zona IANA determinada (respeta horario de verano).
 * timezone inválida o ausente → "-" (nunca se inventa un huso).
 */
export default function MapWorldClock({
  timezone,
  label,
}: {
  timezone: string | null | undefined
  label: string
}) {
  const time = formatTimeAt(timezone)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
      <Clock className="w-3.5 h-3.5" />
      <span>{label}</span>
      <span className="text-white/90 tabular-nums">{time}</span>
    </span>
  )
}