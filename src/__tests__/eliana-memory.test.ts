import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(() => null),
}))

import {
  getElianaMemory,
  addShortTermMemory,
  addLongTermFact,
  setPreference,
  getContextSummary,
  clearElianaMemory,
} from "@/lib/eliana/memory"

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
  global.fetch = vi.fn() as unknown as typeof fetch
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("eliana memory - SOLO sesión (sin persistencia permanente)", () => {
  it("crea memoria vacía para un nuevo usuario", () => {
    const mem = getElianaMemory("u1")
    expect(mem.shortTerm).toHaveLength(0)
    expect(mem.longTerm).toHaveLength(0)
    expect(mem.preferences).toEqual({})
  })

  it("almacena entrada de corto plazo de inmediato en la sesión", () => {
    addShortTermMemory("u1", { role: "user", text: "hola", page: "/", timestamp: 123 })
    expect(getElianaMemory("u1").shortTerm).toHaveLength(1)
  })

  it("deduplica hechos de largo plazo y sube confianza", () => {
    addLongTermFact("u1", { fact: "Le gusta el café", category: "personal", confidence: 0.5 })
    addLongTermFact("u1", { fact: "Le gusta el café", category: "personal", confidence: 0.5 })
    const mem = getElianaMemory("u1")
    expect(mem.longTerm).toHaveLength(1)
    expect(mem.longTerm[0].confidence).toBe(0.6)
  })

  it("guarda preferencias", () => {
    setPreference("u1", "idioma", "es")
    expect(getElianaMemory("u1").preferences.idioma).toBe("es")
  })

  it("genera resumen de contexto", () => {
    addShortTermMemory("u1", { role: "user", text: "Hola ELIANA", page: "/", timestamp: 1 })
    addLongTermFact("u1", { fact: "Ama las historias", category: "personal", confidence: 0.9 })
    setPreference("u1", "tono", "formal")
    const summary = getContextSummary("u1")
    expect(summary).toContain("Hola ELIANA")
    expect(summary).toContain("Ama las historias")
    expect(summary).toContain("tono=formal")
  })

  it("limpia el almacén permanente legado de localStorage al leer", () => {
    window.localStorage.setItem("zafiro_eliana_memory", JSON.stringify({ u1: { userId: "u1" } }))
    getElianaMemory("u1")
    expect(window.localStorage.getItem("zafiro_eliana_memory")).toBeNull()
  })

  it("nunca llama al servidor (sin histórico permanente)", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    addShortTermMemory("u1", { role: "user", text: "hola", page: "/", timestamp: 1 })
    addLongTermFact("u1", { fact: "Le gusta el café", category: "personal", confidence: 0.5 })
    await clearElianaMemory("u1")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("es efímera: los datos NO sobreviven entre sesiones (sessionStorage)", () => {
    addShortTermMemory("u1", { role: "user", text: "hola", page: "/", timestamp: 123 })
    expect(getElianaMemory("u1").shortTerm).toHaveLength(1)
    window.sessionStorage.clear()
    const mem = getElianaMemory("u1")
    expect(mem.shortTerm).toHaveLength(0)
    expect(mem.longTerm).toHaveLength(0)
  })
})