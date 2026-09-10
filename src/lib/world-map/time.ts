/**
 * ZAFIRO WORLD MAP — Utilidades de timezone (IANA, no solo offset).
 * Usa Intl.DateTimeFormat con zonas IANA (America/Havana, etc.) para que
 * el horario respete el horario de verano.
 */

export interface PlaceClock {
  label: string
  timezone: string
  time: string
  valid: boolean
}

/** Formatea la hora de una zona IANA. Devuelve "-" ante zona inválida. */
export function formatTimeAt(
  timezone: string | null | undefined,
  date: Date = new Date(),
  locale = "es-ES",
): string {
  if (!timezone) return "-"
  try {
    new Intl.DateTimeFormat(locale, { timeZone: timezone }).format(date)
  } catch {
    return "-"
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function formatTimeAtWithSeconds(
  timezone: string | null | undefined,
  date: Date = new Date(),
  locale = "es-ES",
): string {
  if (!timezone) return "-"
  try {
    new Intl.DateTimeFormat(locale, { timeZone: timezone }).format(date)
  } catch {
    return "-"
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

/** Reloj de varias zonas a la vez (para la tarjeta de ubicación). */
export function worldClocks(
  places: { label: string; timezone?: string | null }[],
  date: Date = new Date(),
): PlaceClock[] {
  return places.map((p) => {
    const tz = p.timezone && p.timezone.trim() ? p.timezone : null
    return {
      label: p.label,
      timezone: tz ?? "",
      time: tz ? formatTimeAt(tz, date) : "-",
      valid: !!tz && formatTimeAt(tz, date) !== "-",
    }
  })
}

/** Mapa de zona IANA a zona legible para la demo de claves globales. */
export const FIXED_WORLD_CLOCKS: { label: string; timezone: string }[] = [
  { label: "Madrid", timezone: "Europe/Madrid" },
  { label: "Tokio", timezone: "Asia/Tokyo" },
  { label: "Miami", timezone: "America/New_York" },
]