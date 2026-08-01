import { describe, it, expect, vi, beforeEach } from "vitest"
import { extractSectionsFromMarkdown, sanitizeGeneratedText } from "@/lib/autor-ia/engine"
import {
  buildAuthorSystemPrompt,
  buildOutlinePrompt,
  buildChapterPrompt,
  buildSectionPrompt,
} from "@/lib/autor-ia/prompts"

const libraryMock = vi.hoisted(() => ({
  createBook: vi.fn(async (b: Record<string, unknown>) => ({
    ...b, id: "lib-1", version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  })),
  createChapter: vi.fn(async (c: Record<string, unknown>) => ({
    ...c, id: `libch-${c.chapter_number}`, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  })),
  createChunk: vi.fn(async (c: Record<string, unknown>) => ({ ...c, id: `libck-${c.chunk_index}` })),
  createVersion: vi.fn(async (v: Record<string, unknown>) => ({ ...v, id: "libv-1" })),
}))

vi.mock("@/lib/biblioteca/repository", () => ({
  BibliotecaRepository: class {
    createBook = libraryMock.createBook
    createChapter = libraryMock.createChapter
    createChunk = libraryMock.createChunk
    createVersion = libraryMock.createVersion
  },
}))

import { AutorIaRepository } from "@/lib/autor-ia/repository"

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

const baseBook = () => ({
  id: "book-1",
  title: "El Poder de la Palabra",
  subtitle: "Enseñanzas",
  purpose: "Transmitir fe",
  target_reader: "Público hispano",
  outline: "## Capítulos\n- 1: Introducción",
  voice: "Don Miguel",
  style_guide: "",
  visibility: "private",
  status: "draft",
  published_book_id: null,
  generation_metadata: {},
  created_by: "u1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
})

beforeEach(() => {
  libraryMock.createBook.mockClear()
  libraryMock.createChapter.mockClear()
  libraryMock.createChunk.mockClear()
  libraryMock.createVersion.mockClear()
})

describe("Autor IA: extractSectionsFromMarkdown", () => {
  it("divide por encabezados de nivel 2 y 3", () => {
    const sections = extractSectionsFromMarkdown(
      "## Introducción\n\nTexto introductorio.\n\n### Ejemplo\n\nOtro texto.",
    )
    expect(sections.map(s => s.title)).toEqual(["Introducción", "Ejemplo"])
    expect(sections[0].content).toContain("Texto introductorio.")
  })

  it("agrupa texto sin encabezados como 'Contenido'", () => {
    const sections = extractSectionsFromMarkdown("Solo prosa.\nSegunda línea.")
    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBe("Contenido")
    expect(sections[0].content).toContain("Segunda línea.")
  })

  it("recorta espacios y devuelve vacío para texto vacío", () => {
    expect(extractSectionsFromMarkdown("   \n  ")).toEqual([])
    expect(extractSectionsFromMarkdown("")).toEqual([])
  })
})

describe("Autor IA: sanitizeGeneratedText", () => {
  it("aprueba texto seguro y preserva el contenido", () => {
    const res = sanitizeGeneratedText("Capítulo sobre la oración y la fe.")
    expect(res.ok).toBe(true)
    expect(res.sanitized).toContain("oración")
  })

  it("rechaza temas bloqueados", () => {
    const res = sanitizeGeneratedText("Instrucciones sobre trata de personas.")
    expect(res.ok).toBe(false)
    expect(res.reason).toBeTruthy()
  })
})

describe("Autor IA: prompts", () => {
  const book = {
    title: "El Poder de la Palabra",
    purpose: "Transmitir fe",
    targetReader: "Público hispano",
    voice: "Don Miguel",
    outline: "Cap 1: Introducción",
  }

  it("buildAuthorSystemPrompt conserva la voz y la identidad", () => {
    const p = buildAuthorSystemPrompt(book)
    expect(p).toContain("Autor IA de ZAFIRO")
    expect(p).toContain("Voz: Don Miguel")
  })

  it("buildOutlinePrompt incluye título, propósito y lector", () => {
    const p = buildOutlinePrompt(book)
    expect(p).toContain("El Poder de la Palabra")
    expect(p).toContain("Transmitir fe")
    expect(p).toContain("Público hispano")
  })

  it("buildChapterPrompt incluye capítulo, resumen y contexto RAG", () => {
    const p = buildChapterPrompt(book, { title: "Introducción", number: 1, summary: "Arranque" }, undefined, "Referencia: Salmos")
    expect(p).toContain("capítulo 1")
    expect(p).toContain("Introducción")
    expect(p).toContain("Arranque")
    expect(p).toContain("Salmos")
  })

  it("buildSectionPrompt incluye sección y capítulo", () => {
    const p = buildSectionPrompt(book, { title: "Introducción", number: 1 }, { title: "Definición", number: 1 })
    expect(p).toContain("Definición")
    expect(p).toContain("Introducción")
  })
})

describe("Autor IA: repositorio", () => {
  it("createBook crea el libro con estado idea", async () => {
    const admin = adminMock({})
    const repo = new AutorIaRepository(admin as never)
    const book = await repo.createBook({ title: "Mi Libro" })
    expect(book?.title).toBe("Mi Libro")
    expect(book?.status).toBe("idea")
    expect(book?.voice).toBe("Don Miguel")
  })

  it("nextChapterNumber devuelve 1 para libro vacío y siguiente número", async () => {
    const admin = adminMock({
      invisible_council_books: [baseBook()],
      invisible_council_book_chapters: [
        { id: "c1", book_id: "book-1", chapter_number: 1 },
        { id: "c2", book_id: "book-1", chapter_number: 2 },
      ],
    })
    const repo = new AutorIaRepository(admin as never)
    expect(await repo.nextChapterNumber("book-1")).toBe(3)
    expect(await repo.nextChapterNumber("otro")).toBe(1)
  })

  it("publishToLibrary construye libro, capítulos, fragmentos y versión en la biblioteca", async () => {
    const admin = adminMock({
      invisible_council_books: [baseBook()],
      invisible_council_book_chapters: [
        { id: "c1", book_id: "book-1", chapter_number: 1, title: "Introducción", summary: "", content: "Texto del capítulo uno.", status: "draft", generation_metadata: {}, created_at: "x", updated_at: "x" },
      ],
    })
    const repo = new AutorIaRepository(admin as never)
    const res = await repo.publishToLibrary("book-1")

    expect(res.ok).toBe(true)
    expect(res.libraryBookId).toBe("lib-1")

    expect(libraryMock.createBook).toHaveBeenCalledWith(
      expect.objectContaining({ title: "El Poder de la Palabra", status: "pendiente_revision", privacy_level: "privado_don_miguel" }),
    )
    expect(libraryMock.createChapter).toHaveBeenCalledWith(
      expect.objectContaining({ chapter_number: 1, content_original: "Texto del capítulo uno." }),
    )
    expect(libraryMock.createChunk).toHaveBeenCalled()
    expect(libraryMock.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({ version_number: 1, changelog: "Generado por Autor IA (C7)" }),
    )

    const updated = admin._store.invisible_council_books[0]
    expect(updated.status).toBe("published")
    expect(updated.published_book_id).toBe("lib-1")
  })

  it("publishToLibrary falla cuando el libro no existe", async () => {
    const admin = adminMock({})
    const repo = new AutorIaRepository(admin as never)
    const res = await repo.publishToLibrary("missing")
    expect(res.ok).toBe(false)
    expect(res.error).toBe("book_not_found")
  })

  it("publishToLibrary con visibilidad pública usa nivel público", async () => {
    const admin = adminMock({
      invisible_council_books: [{ ...baseBook(), visibility: "public" }],
      invisible_council_book_chapters: [
        { id: "c1", book_id: "book-1", chapter_number: 1, title: "Intro", summary: "", content: "Contenido.", status: "draft", generation_metadata: {}, created_at: "x", updated_at: "x" },
      ],
    })
    const repo = new AutorIaRepository(admin as never)
    await repo.publishToLibrary("book-1")
    expect(libraryMock.createBook).toHaveBeenCalledWith(
      expect.objectContaining({ privacy_level: "publico", privacy_category: "publico" }),
    )
  })
})
