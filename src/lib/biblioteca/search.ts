import { bibliotecaRepo } from "./repository"
import type { LibraryBook, LibraryChunk, LibraryClaimType } from "./types"

export interface ImportResult {
  bookId: string
  chaptersCreated: number
  chunksCreated: number
  errors: string[]
}

export class BibliotecaIndexer {
  async importBook(
    book: Partial<LibraryBook>,
    chapters: Array<{ title?: string; number: number; content: string }>
  ): Promise<ImportResult | null> {
    const existing = book.drive_file_id
      ? await bibliotecaRepo.getBookByDriveFileId(book.drive_file_id)
      : await bibliotecaRepo.getBook(book.id || "")

    const created = existing
      ? await bibliotecaRepo.updateBook(existing.id, {
          ...book,
          status: "actualizado",
          version: existing.version + 1,
        })
      : await bibliotecaRepo.createBook({
          ...book,
          status: "importado",
          version: 1,
        } as Partial<LibraryBook>)

    if (!created) return null

    const errors: string[] = []
    let chaptersCreated = 0
    let chunksCreated = 0

    await bibliotecaRepo.deleteChunks(created.id)

    for (const ch of chapters) {
      const chapter = await bibliotecaRepo.createChapter({
        book_id: created.id,
        chapter_number: ch.number,
        title: ch.title,
        content_original: ch.content,
        word_count: ch.content.split(/\s+/).length,
      })

      if (!chapter) {
        errors.push(`Failed to create chapter ${ch.number}: ${ch.title}`)
        continue
      }
      chaptersCreated++

      const sectionChunks = this.chunkContent(ch.content)
      for (let i = 0; i < sectionChunks.length; i++) {
        await bibliotecaRepo.createChunk({
          book_id: created.id,
          chapter_id: chapter.id,
          chunk_index: i,
          section: ch.title,
          content: sectionChunks[i].content,
          main_concepts: [],
          people_mentioned: [],
          places_mentioned: [],
          token_count: sectionChunks[i].tokenCount,
        })
        chunksCreated++
      }
    }

    await bibliotecaRepo.logAccess({
      book_id: created.id,
      action: existing ? "update" : "import",
      resource_type: "book",
      resource_id: created.id,
      resource_title: book.title,
      new_value: { chapters: chaptersCreated, chunks: chunksCreated },
    })

    return { bookId: created.id, chaptersCreated, chunksCreated, errors }
  }

  private chunkContent(
    content: string,
    maxTokens = 800
  ): Array<{ content: string; tokenCount: number }> {
    const lines = content.split("\n")
    const chunks: Array<{ content: string; tokenCount: number }> = []
    let current = ""
    let currentTokens = 0

    for (const line of lines) {
      const lineTokens = Math.ceil(line.length / 4)
      if (currentTokens + lineTokens > maxTokens && current) {
        chunks.push({ content: current.trim(), tokenCount: currentTokens })
        current = ""
        currentTokens = 0
      }
      current += line + "\n"
      currentTokens += lineTokens
    }
    if (current.trim()) {
      chunks.push({ content: current.trim(), tokenCount: currentTokens })
    }
    return chunks
  }
}

export const bibliotecaIndexer = new BibliotecaIndexer()
