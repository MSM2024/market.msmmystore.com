export function isUsableApiKey(value: string | undefined | null): value is string {
  if (!value) return false
  const trimmed = value.trim()
  if (trimmed.length < 20) return false
  if (/^\[.*\]$/.test(trimmed)) return false
  if (/^(xxx+|your[_-]?api[_-]?key|your-anon-key-here|change[_-]?me|placeholder|<.+>|null|undefined)$/i.test(trimmed)) return false
  return true
}

export function getErrorStatus(error: unknown): number | undefined {
  const e = error as { status?: unknown; statusCode?: unknown; code?: unknown; response?: { status?: unknown }; httpStatus?: unknown; message?: unknown }
  const candidates = [e?.status, e?.statusCode, e?.code, e?.response?.status, e?.httpStatus]
  for (const candidate of candidates) {
    const n = Number(candidate)
    if (Number.isInteger(n) && n >= 100 && n <= 599) return n
  }
  const msg = typeof e?.message === "string" ? e.message : String(error ?? "")
  const match = msg.match(/\b(4\d\d|5\d\d)\b/)
  if (match) return Number(match[1])
  if (/RESOURCE_EXHAUSTED|rate\s*limit|quota/i.test(msg)) return 429
  if (/UNAVAILABLE|overloaded|deadline exceeded|timed?\s*out|temporarily/i.test(msg)) return 503
  return undefined
}

export function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504
}

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  sleep?: (ms: number) => Promise<void>
}

export type RetryResult<T> = { ok: true; value: T } | { ok: false; status: number | undefined }

export async function callWithRetry<T>(
  attempt: () => Promise<T>,
  getStatus: (err: unknown) => number | undefined,
  options?: RetryOptions,
): Promise<RetryResult<T>> {
  const maxAttempts = options?.maxAttempts ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 1000
  const maxDelayMs = options?.maxDelayMs ?? 4000
  const sleep = options?.sleep ?? ((ms: number) => new Promise(resolve => setTimeout(resolve, ms)))

  let lastStatus: number | undefined
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await sleep(Math.min(baseDelayMs * Math.pow(2, i - 1), maxDelayMs))
    }
    try {
      return { ok: true, value: await attempt() }
    } catch (err) {
      lastStatus = getStatus(err)
      if (!isRetryableStatus(lastStatus)) break
    }
  }
  return { ok: false, status: lastStatus }
}
