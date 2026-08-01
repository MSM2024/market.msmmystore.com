import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { CouncilBook, CouncilBookChapter, BookStatus } from "@/lib/consejo-invisible/types"
import { BibliotecaRepository } from "@/lib/biblioteca/repository"
import { chunkText, normalizeTitle } from "@/lib/biblioteca/ingest"

export interface AuthorBook extends CouncilBook {
  outline: string
  voice: string
  style_guide: string
  published_book_id: string | null
  generation_metadata: Record<string, unknown>
}

export interface AuthorChapter extends CouncilBookChapter {
  generation_metadata: Record<string, unknown>
}

export interface AuthorSection {
  id: string
  chapter_id: string
  section_number: number
  title: string
  content: string
  source_type: string
  source_id: string | null
  created_at: string
  updated_at: string
}

export type AuthorBookInput = Pick<AuthorBook, "title"> &
  Partial<Pick<AuthorBook, "subtitle" | "purpose" | "target_reader" | "outline" | "voice" | "style_guide" | "visibility">>

export type AuthorChapterInput = Partial<Pick<AuthorChapter, "title" | "summary" | "content" | "status">> & { chapter_number?: number }

const visibilityToPrivacy = (v: string): { privacy_level: string; privacy_category: string } => {
  switch (v) {
    case "public": return { privacy_level: "publico", privacy_category: "publico" }
    case "members":
    case "team": return { privacy_level: "comunidad", privacy_category: "interno" }
    case "family": return { privacy_level: "familia", privacy_category: "privado" }
    default: return { privacy_level: "privado_don_miguel", privacy_category: "privado" }
  }
}

const buildPublishMarkdown = (book: AuthorBook, chapters: AuthorChapter[]): string => {
  const parts: string[] = []
  if (book.subtitle) parts.push(`> ${book.subtitle}\n`)
  if (book.purpose) parts.push(`**Propósito:** ${book.purpose}\n`)
  if (book.target_reader) parts.push(`**Lector objetivo:** ${book.target_reader}\n`)
  for (const c of chapters) {
    parts.push(`\n# ${c.title}\n`)
    if (c.summary) parts.push(`\n${c.summary}\n`)
    if (c.content) parts.push(`\n${c.content}\n`)
  }
  return parts.join("\n")
}

export class AutorIaRepository {
  private readonly admin: SupabaseClient | null
  private readonly library: BibliotecaRepository

  constructor(admin?: SupabaseClient | null, server?: SupabaseClient | null) {
    this.admin = admin ?? null
    this.library = new BibliotecaRepository(server ?? null)
  }

  private get db(): SupabaseClient | null { return this.admin }

  // ---------- Libros ----------
  async listBooks(): Promise<AuthorBook[]> {
    if (!this.db) return []
    const { data } = await this.db
      .from("invisible_council_books")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
    return (data ?? []) as AuthorBook[]
  }

  async getBook(id: string): Promise<AuthorBook | null> {
    if (!this.db) return null
    const { data } = await this.db.from("invisible_council_books").select("*").eq("id", id).single()
    return data ? (data as AuthorBook) : null
  }

  async createBook(input: AuthorBookInput): Promise<AuthorBook | null> {
    if (!this.db) return null
    const row = {
      title: input.title,
      subtitle: input.subtitle ?? "",
      purpose: input.purpose ?? "",
      target_reader: input.target_reader ?? "",
      outline: input.outline ?? "",
      voice: input.voice ?? "Don Miguel",
      style_guide: input.style_guide ?? "",
      visibility: input.visibility ?? "private",
      status: "idea" as BookStatus,
      generation_metadata: {},
    }
    const { data, error } = await this.db.from("invisible_council_books").insert(row).select().single()
    if (error) { console.error("AutorIa createBook", error); return null }
    return data as AuthorBook
  }

  async updateBook(id: string, updates: Partial<AuthorBook>): Promise<AuthorBook | null> {
    if (!this.db) return null
    const patch: Record<string, unknown> = { ...updates }
    patch.updated_at = new Date().toISOString()
    const { data, error } = await this.db.from("invisible_council_books").update(patch).eq("id", id).select().single()
    if (error) { console.error("AutorIa updateBook", error); return null }
    return data as AuthorBook
  }

  async softDeleteBook(id: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db
      .from("invisible_council_books")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
    return !error
  }

  // ---------- Capítulos ----------
  async listChapters(bookId: string): Promise<AuthorChapter[]> {
    if (!this.db) return []
    const { data } = await this.db
      .from("invisible_council_book_chapters")
      .select("*")
      .eq("book_id", bookId)
      .order("chapter_number", { ascending: true })
    return (data ?? []) as AuthorChapter[]
  }

  async getChapter(id: string): Promise<AuthorChapter | null> {
    if (!this.db) return null
    const { data } = await this.db.from("invisible_council_book_chapters").select("*").eq("id", id).single()
    return data ? (data as AuthorChapter) : null
  }

  async nextChapterNumber(bookId: string): Promise<number> {
    const chapters = await this.listChapters(bookId)
    return chapters.length ? Math.max(...chapters.map(c => c.chapter_number)) + 1 : 1
  }

  async createChapter(bookId: string, input: AuthorChapterInput): Promise<AuthorChapter | null> {
    if (!this.db) return null
    const number = input.chapter_number ?? await this.nextChapterNumber(bookId)
    const row = {
      book_id: bookId,
      chapter_number: number,
      title: input.title ?? `Capítulo ${number}`,
      summary: input.summary ?? "",
      content: input.content ?? "",
      status: (input.status ?? "idea") as BookStatus,
      generation_metadata: {},
    }
    const { data, error } = await this.db.from("invisible_council_book_chapters").insert(row).select().single()
    if (error) { console.error("AutorIa createChapter", error); return null }
    return data as AuthorChapter
  }

  async updateChapter(id: string, updates: Partial<AuthorChapter>): Promise<AuthorChapter | null> {
    if (!this.db) return null
    const patch: Record<string, unknown> = { ...updates }
    patch.updated_at = new Date().toISOString()
    const { data, error } = await this.db.from("invisible_council_book_chapters").update(patch).eq("id", id).select().single()
    if (error) { console.error("AutorIa updateChapter", error); return null }
    return data as AuthorChapter
  }

  async deleteChapter(id: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("invisible_council_book_chapters").delete().eq("id", id)
    return !error
  }

  // ---------- Secciones ----------
  async listSections(chapterId: string): Promise<AuthorSection[]> {
    if (!this.db) return []
    const { data } = await this.db
      .from("invisible_council_book_sections")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("section_number", { ascending: true })
    return (data ?? []) as AuthorSection[]
  }

  async nextSectionNumber(chapterId: string): Promise<number> {
    const sections = await this.listSections(chapterId)
    return sections.length ? Math.max(...sections.map(s => s.section_number)) + 1 : 1
  }

  async createSection(chapterId: string, input: { title?: string; content?: string }): Promise<AuthorSection | null> {
    if (!this.db) return null
    const number = await this.nextSectionNumber(chapterId)
    const row = {
      chapter_id: chapterId,
      section_number: number,
      title: input.title ?? `Sección ${number}`,
      content: input.content ?? "",
      source_type: "ia",
      source_id: null,
    }
    const { data, error } = await this.db.from("invisible_council_book_sections").insert(row).select().single()
    if (error) { console.error("AutorIa createSection", error); return null }
    return data as AuthorSection
  }

  async updateSection(id: string, updates: Partial<AuthorSection>): Promise<AuthorSection | null> {
    if (!this.db) return null
    const patch: Record<string, unknown> = { ...updates }
    patch.updated_at = new Date().toISOString()
    const { data, error } = await this.db.from("invisible_council_book_sections").update(patch).eq("id", id).select().single()
    if (error) { console.error("AutorIa updateSection", error); return null }
    return data as AuthorSection
  }

  async deleteSection(id: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("invisible_council_book_sections").delete().eq("id", id)
    return !error
  }

  async clearSections(chapterId: string): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("invisible_council_book_sections").delete().eq("chapter_id", chapterId)
    return !error
  }

  async rebuildChapterFromSections(chapterId: string): Promise<AuthorChapter | null> {
    const sections = await this.listSections(chapterId)
    const content = sections
      .map(s => (s.title ? `## ${s.title}\n\n${s.content}` : s.content))
      .join("\n\n")
    return this.updateChapter(chapterId, { content })
  }

  // ---------- Auditoría ----------
  async logGeneration(input: { userId: string; query: string; response: string; sourcesUsed?: unknown[] }): Promise<boolean> {
    if (!this.db) return false
    const { error } = await this.db.from("invisible_council_ai_interactions").insert({
      user_id: input.userId,
      query: input.query,
      response: input.response,
      sources_used: input.sourcesUsed ?? [],
      feedback_rating: null,
      feedback_text: null,
    })
    if (error) console.error("AutorIa logGeneration", error)
    return !error
  }

  // ---------- Publicación a Biblioteca Viva ----------
  async publishToLibrary(bookId: string): Promise<{ ok: boolean; error?: string; libraryBookId?: string }> {
    const book = await this.getBook(bookId)
    if (!book) return { ok: false, error: "book_not_found" }
    const chapters = (await this.listChapters(bookId)).filter(c => c.content.trim())

    const { privacy_level, privacy_category } = visibilityToPrivacy(book.visibility)
    const markdown = buildPublishMarkdown(book, chapters)
    const checksum = createHash("sha256").update(markdown).digest("hex")
    const wordCount = markdown.split(/\s+/).filter(Boolean).length

    const libraryBook = await this.library.createBook({
      title: book.title,
      description: book.subtitle || undefined,
      normalized_title: normalizeTitle(book.title),
      author: "Miguel Soria Martínez",
      language: "es",
      format: "markdown",
      status: "pendiente_revision",
      privacy_level: privacy_level as "publico" | "comunidad" | "familia" | "privado_don_miguel",
      privacy_category: privacy_category as "publico" | "interno" | "privado",
      checksum,
      metadata: {
        authored_with: "autor_ia",
        voice: book.voice,
        source: "invisible_council",
        council_book_id: book.id,
      },
      tags: [],
    })
    if (!libraryBook) return { ok: false, error: "publish_create_failed" }

    for (const chapter of chapters) {
      const libChapter = await this.library.createChapter({
        book_id: libraryBook.id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        content_original: chapter.content,
        word_count: chapter.content.split(/\s+/).filter(Boolean).length,
        metadata: { source: "invisible_council", council_chapter_id: chapter.id },
      })
      if (!libChapter) continue
      const chunks = chunkText(chapter.content)
      let index = 0
      for (const chunk of chunks) {
        await this.library.createChunk({
          book_id: libraryBook.id,
          chapter_id: libChapter.id,
          chunk_index: index,
          content: chunk,
          token_count: chunk.split(/\s+/).filter(Boolean).length,
          main_concepts: [],
          people_mentioned: [],
          places_mentioned: [],
          metadata: { source: "invisible_council" },
        })
        index += 1
      }
    }

    await this.library.createVersion({
      book_id: libraryBook.id,
      version_number: 1,
      title: book.title,
      content: markdown,
      changelog: "Generado por Autor IA (C7)",
    })

    await this.updateBook(book.id, {
      status: "published" as BookStatus,
      published_book_id: libraryBook.id,
      generation_metadata: { ...book.generation_metadata, word_count: wordCount, published_at: new Date().toISOString() },
    })

    return { ok: true, libraryBookId: libraryBook.id }
  }
}
