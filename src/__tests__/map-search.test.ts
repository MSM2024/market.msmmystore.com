import { describe, it, expect } from "vitest"
import { parseMapIntent, mentionsWorldMap } from "@/lib/world-map/search"

describe("MapSearch — parseMapIntent", () => {
  it("interpreta 'muéstrame negocios cerca de Madrid'", () => {
    const intent = parseMapIntent("muéstrame negocios cerca de Madrid")
    expect(intent).not.toBeNull()
    expect(intent!.intent).toBe("MAP_SEARCH")
    expect(intent!.entityTypes).toContain("BUSINESS")
    expect(intent!.location?.name).toBe("Madrid")
    expect(intent!.location?.center).toBeDefined()
  })

  it("interpreta categoría producto y país", () => {
    const intent = parseMapIntent("hay neveras en Cuba")
    expect(intent).not.toBeNull()
    expect(intent!.entityTypes).toContain("PRODUCT")
    expect(intent!.location?.name).toBe("Cuba")
    expect(intent!.filters.category).toBe("neveras")
  })

  it("interpreta radio y ciudad", () => {
    const intent = parseMapIntent("encuentra proyectos a 30 km de La Habana")
    expect(intent).not.toBeNull()
    expect(intent!.entityTypes).toContain("PROJECT")
    expect(intent!.location?.name).toBe("La Habana")
    expect(intent!.radiusKm).toBe(30)
  })

  it("no secuestra conversaciones sin intención geográfica", () => {
    expect(mentionsWorldMap("cuéntame un cuento")).toBe(false)
    expect(parseMapIntent("cuéntame un cuento")).toBeNull()
    expect(parseMapIntent("")).toBeNull()
    expect(parseMapIntent("hola")).toBeNull()
  })

  it("respeta la regla: nunca inventar coordenadas si no hay lugar conocido", () => {
    const intent = parseMapIntent("muéstrame negocios cerca de Springfield")
    expect(intent).not.toBeNull()
    expect(intent!.location).toBeNull()
  })
})