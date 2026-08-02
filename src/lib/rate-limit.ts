import { NextResponse } from "next/server"

const store = new Map<string, number[]>()
const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX = 10

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const cf = request.headers.get("cf-connecting-ip")
  if (cf) return cf.trim()
  return "unknown"
}

export function rateLimitByIp(
  request: Request,
  options?: { max?: number; windowMs?: number; keyPrefix?: string },
): NextResponse | null {
  const max = options?.max ?? DEFAULT_MAX
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS
  const key = `${options?.keyPrefix || "rl"}:${getClientIp(request)}`
  const now = Date.now()

  const timestamps = (store.get(key) || []).filter(t => now - t < windowMs)
  if (timestamps.length >= max) {
    store.set(key, timestamps)
    return NextResponse.json(
      { success: false, error: "Demasiadas solicitudes. Inténtalo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } },
    )
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return null
}
