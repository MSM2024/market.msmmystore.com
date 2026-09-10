import { describe, it, expect } from "vitest"
import {
  parseBbox,
  parseEntityTypes,
  rateLimitByIp,
  resetIp,
  bboxWhere,
  DEFAULT_MAP_LAYERS,
} from "@/lib/world-map/spatial"

describe("Spatial API — helpers puros", () => {
  it("valida bbox correcto", () => {
    const r = parseBbox({ west: "-82", south: "20", east: "-77", north: "24", zoom: "5" })
    expect(r.error).toBeUndefined()
    expect(r.viewport).toMatchObject({ west: -82, south: 20, east: -77, north: 24, zoom: 5 })
  })

  it("rechaza bbox incompleto o área vacía sin devolver puntos inventados", () => {
    expect(parseBbox({}).error).toBeDefined()
    expect(parseBbox({ west: "1", south: "2", east: "1", north: "3" }).error).toBeDefined()
    expect(parseBbox({ west: "1", south: "2", east: "3", north: "abc" }).error).toBeDefined()
  })

  it("normaliza east<=west y clampa zoom", () => {
    const r = parseBbox({ west: "2", south: "1", east: "1", north: "3", zoom: "99" })
    expect(r.viewport!.east).toBeGreaterThan(r.viewport!.west)
    expect(r.viewport!.zoom).toBe(20)
  })

  it("whitelist de tipos con fallback honesto", () => {
    expect(parseEntityTypes("")).toEqual(DEFAULT_MAP_LAYERS)
    expect(parseEntityTypes("BUSINESS, FOOBAR")).toEqual(["BUSINESS"])
    expect(parseEntityTypes("bogus")).toEqual(DEFAULT_MAP_LAYERS)
  })

  it("construye el where del bounding box", () => {
    expect(bboxWhere({ west: -10, south: 10, east: 20, north: 30, zoom: 4 })).toEqual({
      "public_lng.gte": -10,
      "public_lng.lte": 20,
      "public_lat.gte": 10,
      "public_lat.lte": 30,
    })
  })
})

describe("Spatial API — rate limit", () => {
  it("corta superada la ventana y permite tras reset", () => {
    const ip = "test-ip-1"
    resetIp(ip)
    for (let i = 0; i < 3; i++) {
      expect(rateLimitByIp(ip, { max: 3, windowMs: 1000 }).allowed).toBe(true)
    }
    expect(rateLimitByIp(ip, { max: 3, windowMs: 1000 }).allowed).toBe(false)
    resetIp(ip)
    expect(rateLimitByIp(ip, { max: 3, windowMs: 1000 }).allowed).toBe(true)
  })

  it("devuelve retryAfter con la ventana restante", () => {
    resetIp("test-ip-2")
    for (let i = 0; i < 2; i++) rateLimitByIp("test-ip-2", { max: 2, windowMs: 5000 })
    const denied = rateLimitByIp("test-ip-2", { max: 2, windowMs: 5000 })
    expect(denied.allowed).toBe(false)
    expect(denied.retryAfterSeconds).toBeGreaterThan(0)
    resetIp("test-ip-2")
  })
})