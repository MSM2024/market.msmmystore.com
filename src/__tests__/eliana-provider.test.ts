import { describe, it, expect } from "vitest"
import {
  isUsableApiKey,
  getErrorStatus,
  isRetryableStatus,
  callWithRetry,
} from "@/lib/eliana/provider"

describe("isUsableApiKey", () => {
  it("rechaza placeholders entre corchetes", () => {
    expect(isUsableApiKey("[SENSITIVE]")).toBe(false)
    expect(isUsableApiKey("[REDACTED]")).toBe(false)
  })

  it("rechaza valores cortos y patrones de ejemplo", () => {
    expect(isUsableApiKey("abc")).toBe(false)
    expect(isUsableApiKey("xxxxxxxxxxxxxxxxxxxxxx")).toBe(false)
    expect(isUsableApiKey("your-anon-key-here")).toBe(false)
    expect(isUsableApiKey("your-api-key")).toBe(false)
    expect(isUsableApiKey("change-me")).toBe(false)
    expect(isUsableApiKey("placeholder")).toBe(false)
    expect(isUsableApiKey("<API_KEY>")).toBe(false)
    expect(isUsableApiKey("")).toBe(false)
    expect(isUsableApiKey(undefined)).toBe(false)
    expect(isUsableApiKey(null)).toBe(false)
  })

  it("acepta claves reales con longitud suficiente", () => {
    expect(isUsableApiKey("AIza".padEnd(35, "x"))).toBe(true)
    expect(isUsableApiKey(" A".padEnd(40, "b") + " ")).toBe(true)
  })
})

describe("getErrorStatus", () => {
  it("extrae de status, statusCode, code y response.status", () => {
    expect(getErrorStatus({ status: 429 })).toBe(429)
    expect(getErrorStatus({ statusCode: 503 })).toBe(503)
    expect(getErrorStatus({ code: 500 })).toBe(500)
    expect(getErrorStatus({ response: { status: 504 } })).toBe(504)
    expect(getErrorStatus({ httpStatus: 401 })).toBe(401)
  })

  it("extrae desde el mensaje", () => {
    expect(getErrorStatus(new Error("request failed with status 502"))).toBe(502)
    expect(getErrorStatus(new Error("RESOURCE_EXHAUSTED: quota exceeded"))).toBe(429)
    expect(getErrorStatus(new Error("rate limit reached"))).toBe(429)
    expect(getErrorStatus(new Error("service unavailable"))).toBe(503)
    expect(getErrorStatus(new Error("deadline exceeded"))).toBe(503)
  })

  it("devuelve undefined sin coincidencias", () => {
    expect(getErrorStatus(new Error("algo salió mal"))).toBeUndefined()
    expect(getErrorStatus(undefined)).toBeUndefined()
  })
})

describe("isRetryableStatus", () => {
  it("reintenta 429, 502, 503 y 504", () => {
    for (const status of [429, 502, 503, 504]) {
      expect(isRetryableStatus(status)).toBe(true)
    }
  })

  it("no reintenta otros códigos", () => {
    for (const status of [200, 400, 401, 404, 500, 501, undefined]) {
      expect(isRetryableStatus(status)).toBe(false)
    }
  })
})

describe("callWithRetry", () => {
  const noSleep = () => Promise.resolve()

  it("tiene éxito en el primer intento sin reintentos", async () => {
    let calls = 0
    const result = await callWithRetry(
      async () => {
        calls++
        return "ok"
      },
      () => undefined,
      { sleep: noSleep },
    )
    expect(result).toEqual({ ok: true, value: "ok" })
    expect(calls).toBe(1)
  })

  it("reintenta ante 429 y acaba con éxito", async () => {
    const delays: number[] = []
    let calls = 0
    const result = await callWithRetry(
      async () => {
        calls++
        if (calls <= 2) throw new Error("quota exceeded")
        return "final"
      },
      (err) => getErrorStatus(err),
      { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 4000, sleep: async (ms) => { delays.push(ms) } },
    )
    expect(result).toEqual({ ok: true, value: "final" })
    expect(calls).toBe(3)
    expect(delays).toEqual([1000, 2000])
  })

  it("agota los reintentos tras 429 persistente y devuelve el último estado", async () => {
    const delays: number[] = []
    let calls = 0
    const result = await callWithRetry(
      async () => {
        calls++
        throw new Error("rate limit reached")
      },
      (err) => getErrorStatus(err),
      { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 400, sleep: async (ms) => { delays.push(ms) } },
    )
    expect(result).toEqual({ ok: false, status: 429 })
    expect(calls).toBe(3)
    expect(delays.length).toBe(2)
  })

  it("no reintenta errores 4xx permanentes (401/404)", async () => {
    let calls = 0
    const result = await callWithRetry(
      async () => {
        calls++
        throw new Error("invalid credentials")
      },
      () => 401,
      { maxAttempts: 3, sleep: noSleep },
    )
    expect(result).toEqual({ ok: false, status: 401 })
    expect(calls).toBe(1)
  })

  it("no reintenta 500 (no retryable)", async () => {
    let calls = 0
    const result = await callWithRetry(
      async () => {
        calls++
        throw new Error("internal error")
      },
      () => 500,
      { maxAttempts: 3, sleep: noSleep },
    )
    expect(result).toEqual({ ok: false, status: 500 })
    expect(calls).toBe(1)
  })
})
