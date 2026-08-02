import { describe, it, expect, beforeEach } from "vitest"
import {
  albumFamilySchema,
  albumMemberSchema,
  albumEventSchema,
  albumMemberPatchSchema,
  albumEventPatchSchema,
  albumMediaSchema,
} from "@/lib/album/validation"
import { AlbumRepository } from "@/lib/album/repository"

interface Q {
  from(): Q
  select(): Q
  is(k: string, v: unknown): Q
  eq(k: string, v: unknown): Q
  order(): Q
  insert(row: Record<string, unknown>): Q
  update(patch: Record<string, unknown>): Q
  delete(): Q
  matches(r: Record<string, unknown>): boolean
  single(): Promise<{ data: Record<string, unknown> | null; error: null }>
  then(resolve: (v: unknown) => unknown): Promise<unknown>
}

function adminMock(initial: Record<string, Array<Record<string, unknown>>>) {
  const store: Record<string, Array<Record<string, unknown>>> = {}
  for (const [k, v] of Object.entries(initial)) store[k] = [...v]
  let nextId = 1000

  const makeQuery = (table: string): Q => {
    let lastInsert: Record<string, unknown> | null = null
    let lastPatch: Record<string, unknown> | null = null
    const matchers: Array<(r: Record<string, unknown>) => boolean> = []
    const q: Q = {
      from() { return q },
      select() { return q },
      is(k: string, v: unknown) { matchers.push(r => r[k] === v); return q },
      eq(k: string, v: unknown) { matchers.push(r => r[k] === v); return q },
      order() { return q },
      insert(row: Record<string, unknown>) { lastInsert = row; return q },
      update(patch: Record<string, unknown>) { lastPatch = patch; return q },
      delete() { return q },
      matches(r: Record<string, unknown>) { return matchers.every(m => m(r)) },
      single: () => Promise.resolve().then(() => {
        if (lastInsert) {
          const row = { ...lastInsert, id: `id-${nextId++}` }
          store[table] = store[table] || []
          store[table].push(row)
          return { data: row, error: null }
        }
        const rows = (store[table] || []).filter(r => q.matches(r))
        const row = rows[0] ?? null
        if (lastPatch && row) Object.assign(row, lastPatch)
        return { data: row, error: null }
      }),
      then(resolve: (v: unknown) => unknown) {
        return Promise.resolve().then(() => {
          const rows = (store[table] || []).filter(r => q.matches(r))
          return { data: rows, error: null }
        }).then(resolve)
      },
    }
    return q
  }

  return {
    from: (table: string) => makeQuery(table),
    _store: store,
  }
}

const baseFamily = () => ({
  id: "fam-1",
  owner_id: "u1",
  name: "Familia Soria",
  subtitle: "Legado",
  privacy: "solo_yo",
  accent_color: "#7C3AED",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
})

beforeEach(() => {})

describe("Álbum: validación Zod", () => {
  it("albumFamilySchema exige nombre y aplica defaults", () => {
    expect(albumFamilySchema.safeParse({}).success).toBe(false)
    const ok = albumFamilySchema.safeParse({ name: "  Familia  " })
    expect(ok.success).toBe(true)
    if (ok.success) {
      expect(ok.data.name).toBe("Familia")
      expect(ok.data.privacy).toBe("solo_yo")
      expect(ok.data.accent_color).toBe("#7C3AED")
    }
  })

  it("albumFamilySchema rechaza privacy inválida", () => {
    const res = albumFamilySchema.safeParse({ name: "X", privacy: "secreta" })
    expect(res.success).toBe(false)
  })

  it("albumMemberSchema exige family_id UUID y nombre", () => {
    expect(albumMemberSchema.safeParse({ family_id: "nope", full_name: "A" }).success).toBe(false)
    expect(albumMemberSchema.safeParse({ family_id: "123e4567-e89b-12d3-a456-426614174000", full_name: "" }).success).toBe(false)
    const ok = albumMemberSchema.safeParse({ family_id: "123e4567-e89b-12d3-a456-426614174000", full_name: "Ana" })
    expect(ok.success).toBe(true)
    if (ok.success) {
      expect(ok.data.relation).toBe("hijo")
      expect(ok.data.sort_order).toBe(0)
    }
  })

  it("albumMemberPatchSchema permite actualizar solo nombre", () => {
    const res = albumMemberPatchSchema.safeParse({ full_name: "Ana María" })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.full_name).toBe("Ana María")
  })

  it("albumEventSchema exige título y aplica categoría por defecto", () => {
    expect(albumEventSchema.safeParse({ family_id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(false)
    const ok = albumEventSchema.safeParse({ family_id: "123e4567-e89b-12d3-a456-426614174000", title: "Boda" })
    expect(ok.success).toBe(true)
    if (ok.success) expect(ok.data.category).toBe("recuerdo")
  })

  it("albumEventPatchSchema permite actualizar fecha", () => {
    const res = albumEventPatchSchema.safeParse({ event_date: "1990-05-01" })
    expect(res.success).toBe(true)
  })

  it("albumMediaSchema valida URL y tipo", () => {
    expect(albumMediaSchema.safeParse({ event_id: "123e4567-e89b-12d3-a456-426614174000", url: "no-es-url" }).success).toBe(false)
    const ok = albumMediaSchema.safeParse({ event_id: "123e4567-e89b-12d3-a456-426614174000", url: "https://cdn.zafiro/img.png" })
    expect(ok.success).toBe(true)
  })
})

describe("Álbum: repositorio", () => {
  it("devuelve listas vacías sin cliente", async () => {
    const repo = new AlbumRepository(null)
    expect(await repo.listFamilies()).toEqual([])
    expect(await repo.getFamily("x")).toBeNull()
    expect(await repo.createFamily({ owner_id: "u1", name: "X" })).toBeNull()
    expect(await repo.familyOwnedBy("x", "u1")).toBe(false)
    expect(await repo.deleteMember("x")).toBe(false)
  })

  it("createFamily crea con privacidad por defecto", async () => {
    const admin = adminMock({})
    const repo = new AlbumRepository(admin as never)
    const family = await repo.createFamily({ owner_id: "u1", name: "Familia Soria" })
    expect(family?.owner_id).toBe("u1")
    expect(family?.privacy).toBe("solo_yo")
    expect(family?.accent_color).toBe("#7C3AED")
  })

  it("getFamily devuelve miembros y eventos ordenados", async () => {
    const admin = adminMock({
      album_families: [baseFamily()],
      album_members: [
        { id: "m1", family_id: "fam-1", parent_id: null, full_name: "Padre", sort_order: 0, created_by: "u1" },
        { id: "m2", family_id: "fam-1", parent_id: "m1", full_name: "Hija", sort_order: 1, created_by: "u1" },
      ],
      album_timeline_events: [
        { id: "e1", family_id: "fam-1", member_id: null, title: "Boda", event_date: "1990-05-01", created_by: "u1" },
      ],
    })
    const repo = new AlbumRepository(admin as never)
    const family = await repo.getFamily("fam-1")
    expect(family?.name).toBe("Familia Soria")
    expect(family?.members).toHaveLength(2)
    expect(family?.events).toHaveLength(1)
  })

  it("getFamily devuelve null si no existe", async () => {
    const admin = adminMock({})
    const repo = new AlbumRepository(admin as never)
    expect(await repo.getFamily("missing")).toBeNull()
  })

  it("familyOwnedBy verifica al propietario", async () => {
    const admin = adminMock({ album_families: [baseFamily()] })
    const repo = new AlbumRepository(admin as never)
    expect(await repo.familyOwnedBy("fam-1", "u1")).toBe(true)
    expect(await repo.familyOwnedBy("fam-1", "u2")).toBe(false)
    expect(await repo.familyOwnedBy("missing", "u1")).toBe(false)
  })

  it("updateFamily actualiza campos", async () => {
    const admin = adminMock({ album_families: [baseFamily()] })
    const repo = new AlbumRepository(admin as never)
    const family = await repo.updateFamily("fam-1", { subtitle: "Nuevo legado", privacy: "comunidad" })
    expect(family?.subtitle).toBe("Nuevo legado")
    expect(family?.privacy).toBe("comunidad")
  })

  it("createMember crea con creador y relación por defecto", async () => {
    const admin = adminMock({ album_families: [baseFamily()] })
    const repo = new AlbumRepository(admin as never)
    const member = await repo.createMember({ family_id: "fam-1", created_by: "u1", full_name: "Ana" })
    expect(member?.full_name).toBe("Ana")
    expect(member?.relation).toBe("hijo")
    expect(member?.created_by).toBe("u1")
  })

  it("updateMember y deleteMember operan correctamente", async () => {
    const admin = adminMock({
      album_members: [{ id: "m1", family_id: "fam-1", full_name: "Ana", created_by: "u1" }],
    })
    const repo = new AlbumRepository(admin as never)
    const updated = await repo.updateMember("m1", { full_name: "Ana María", relation: "pareja" })
    expect(updated?.full_name).toBe("Ana María")
    expect(updated?.relation).toBe("pareja")
    expect(await repo.deleteMember("m1")).toBe(true)
  })

  it("createEvent crea con categoría recuerdo por defecto", async () => {
    const admin = adminMock({ album_families: [baseFamily()] })
    const repo = new AlbumRepository(admin as never)
    const event = await repo.createEvent({ family_id: "fam-1", created_by: "u1", title: "Primer viaje" })
    expect(event?.title).toBe("Primer viaje")
    expect(event?.category).toBe("recuerdo")
  })

  it("getEvent y updateEvent funcionan", async () => {
    const admin = adminMock({
      album_timeline_events: [{ id: "e1", family_id: "fam-1", title: "Boda", created_by: "u1" }],
    })
    const repo = new AlbumRepository(admin as never)
    const event = await repo.getEvent("e1")
    expect(event?.title).toBe("Boda")
    const updated = await repo.updateEvent("e1", { category: "boda" })
    expect(updated?.category).toBe("boda")
    expect(await repo.deleteEvent("e1")).toBe(true)
  })
})
