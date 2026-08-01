import { describe, it, expect } from "vitest"
import { getClientIp, rateLimitByIp } from "@/lib/rate-limit"

describe("rateLimitByIp", () => {
  it("permite solicitudes por debajo del límite", () => {
    const request = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "203.0.113.7" },
    })
    for (let i = 0; i < 5; i++) {
      expect(rateLimitByIp(request, { max: 5, keyPrefix: "test-a" })).toBeNull()
    }
  })

  it("devuelve 429 al superar el límite", () => {
    const request = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "203.0.113.8" },
    })
    for (let i = 0; i < 3; i++) {
      rateLimitByIp(request, { max: 3, keyPrefix: "test-b" })
    }
    const blocked = rateLimitByIp(request, { max: 3, keyPrefix: "test-b" })
    expect(blocked).not.toBeNull()
    expect(blocked?.status).toBe(429)
  })

  it("aisla los límites por prefijo", () => {
    const request = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "203.0.113.9" },
    })
    for (let i = 0; i < 4; i++) {
      rateLimitByIp(request, { max: 4, keyPrefix: "test-c-uno" })
    }
    expect(rateLimitByIp(request, { max: 4, keyPrefix: "test-c-dos" })).toBeNull()
    expect(rateLimitByIp(request, { max: 4, keyPrefix: "test-c-uno" })).not.toBeNull()
  })
})

describe("getClientIp", () => {
  it("extrae la primera IP de x-forwarded-for", () => {
    const request = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    })
    expect(getClientIp(request)).toBe("203.0.113.10")
  })

  it("devuelve unknown sin cabeceras", () => {
    expect(getClientIp(new Request("http://localhost/test"))).toBe("unknown")
  })
})
