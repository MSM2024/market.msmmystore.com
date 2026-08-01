import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(() => null),
}))

vi.mock("@/lib/supabase", () => ({
  isSupabaseAvailable: vi.fn(() => false),
}))

import { getSession } from "@/lib/auth"
import { isSupabaseAvailable } from "@/lib/supabase"
import {
  getElianaMemory,
  addShortTermMemory,
  addLongTermFact,
  setPreference,
  getContextSummary,
  clearElianaMemory,
} from "@/lib/eliana/memory"

const mockSession = (id = "u1") => ({ id, email: "a@b.com", name: "A" })
const authMock = getSession as unknown as ReturnType<typeof vi.fn>
const supabaseMock = isSupabaseAvailable as unknown as ReturnType<typeof vi.fn>
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

beforeEach(() => {
  window.localStorage.clear()
  authMock.mockReturnValue(null)
  supabaseMock.mockReturnValue(false)
  global.fetch = vi.fn() as unknown as typeof fetch
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("eliana memory - capa local síncrona", () => {
  it("crea memoria vacía para un nuevo usuario", () => {
    const mem = getElianaMemory("u1")
    expect(mem.shortTerm).toHaveLength(0)
    expect(mem.longTerm).toHaveLength(0)
    expect(mem.preferences).toEqual({})
  })

  it("persiste entrada de corto plazo de inmediato en caché local", () => {
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

  it("no llama al servidor cuando no hay sesión", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    addShortTermMemory("u1", { role: "user", text: "hola", page: "/", timestamp: 1 })
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("eliana memory - persistencia en Supabase", () => {
  it("hidrata desde el servidor en la primera lectura autenticada", async () => {
    authMock.mockReturnValue(mockSession())
    supabaseMock.mockReturnValue(true)
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        rows: [
          {
            memory_type: "long_term",
            content: "Facto de servidor",
            category: "general",
            confidence: 0.7,
            metadata: { createdAt: 1, lastAccessed: 1 },
          },
        ],
      }),
    })

    const mem = getElianaMemory("u1")
    expect(mem.longTerm).toHaveLength(0)
    await flush()
    expect(getElianaMemory("u1").longTerm).toHaveLength(1)
    expect(getElianaMemory("u1").longTerm[0].fact).toBe("Facto de servidor")
    expect(fetchMock).toHaveBeenCalledWith("/api/eliana/memory")
  })

  it("sincroniza en modo replace cuando está autenticado", async () => {
    authMock.mockReturnValue(mockSession())
    supabaseMock.mockReturnValue(true)
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ inserted: 1 }) })

    addShortTermMemory("u1", { role: "user", text: "hola", page: "/", timestamp: 123 })
    await flush()

    expect(fetchMock).toHaveBeenCalledWith("/api/eliana/memory", expect.objectContaining({ method: "POST" }))
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.mode).toBe("replace")
    expect(body.rows).toHaveLength(1)
    expect(body.rows[0].content).toBe("hola")
  })

  it("clearElianaMemory borra local y servidor cuando está autenticado", async () => {
    authMock.mockReturnValue(mockSession())
    supabaseMock.mockReturnValue(true)
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    addShortTermMemory("u1", { role: "user", text: "hola", page: "/", timestamp: 123 })
    await clearElianaMemory("u1")

    expect(getElianaMemory("u1").shortTerm).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalledWith("/api/eliana/memory", expect.objectContaining({ method: "DELETE" }))
  })
})
