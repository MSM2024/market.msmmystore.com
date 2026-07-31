import { getSupabaseClient } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  LibraryBook, LibrarySource, LibraryVersion, LibraryChapter, LibraryChunk,
  LibraryPerson, LibraryPlace, LibraryTopic, LibraryRelationship,
  LibraryImportJob, LibraryApproval, LibraryAccessLog,
  LibraryBookStatus, LibraryPrivacyLevel, LibrarySearchOptions, LibrarySearchResult,
} from "./types"

export class BibliotecaRepository {
  private readonly serverClient: SupabaseClient | null

  constructor(serverClient?: SupabaseClient | null) {
    this.serverClient = serverClient ?? null
  }

  private get client() { return this.serverClient ?? getSupabaseClient() }
  private get available() { return !!this.client }

  async getBook(id: string): Promise<LibraryBook | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_books").select("*").eq("id", id).single()
    return data
  }

  async getBookByDriveFileId(driveFileId: string): Promise<LibraryBook | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_books").select("*").eq("drive_file_id", driveFileId).single()
    return data
  }

  async listBooks(options: {
    status?: LibraryBookStatus
    privacy_level?: LibraryPrivacyLevel
    series?: string
    tags?: string[]
    limit?: number
    offset?: number
    order_by?: string
    order?: "asc" | "desc"
  } = {}): Promise<{ books: LibraryBook[]; total: number }> {
    if (!this.available) return { books: [], total: 0 }
    let query = this.client.from("library_books").select("*", { count: "exact" })
    if (options.status) query = query.eq("status", options.status)
    if (options.privacy_level) query = query.eq("privacy_level", options.privacy_level)
    if (options.series) query = query.eq("series", options.series)
    if (options.tags?.length) query = query.contains("tags", options.tags)
    const orderBy = options.order_by || "created_at"
    const order = options.order || "desc"
    query = query.order(orderBy, { ascending: order === "asc" })
    if (options.limit) query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    const { data, error, count } = await query
    if (error) return { books: [], total: 0 }
    return { books: data || [], total: count || 0 }
  }

  async createBook(book: Partial<LibraryBook>): Promise<LibraryBook | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_books").insert(book).select().single()
    return data
  }

  async updateBook(id: string, updates: Partial<LibraryBook>): Promise<LibraryBook | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_books").update(updates).eq("id", id).select().single()
    return data
  }

  async deleteBook(id: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client.from("library_books").delete().eq("id", id)
    return !error
  }

  async searchBooks(options: LibrarySearchOptions): Promise<LibrarySearchResult[]> {
    if (!this.available || !options.query) return []
    const query = options.query.trim()
    const limit = options.limit || 10
    let dbQuery = this.client.from("library_books").select("*")
    const orConditions = [`title.ilike.%${query}%`, `description.ilike.%${query}%`, `summary.ilike.%${query}%`].join(",")
    dbQuery = dbQuery.or(orConditions)
    if (options.status) dbQuery = dbQuery.eq("status", options.status)
    if (options.series) dbQuery = dbQuery.eq("series", options.series)
    if (options.privacy_level) dbQuery = dbQuery.eq("privacy_level", options.privacy_level)
    dbQuery = dbQuery.order("title", { ascending: true }).limit(limit)
    const { data, error } = await dbQuery
    if (error) return []
    return (data || []).map((book: LibraryBook) => ({
      book: book as LibraryBook,
      score: book.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.5,
    }))
  }

  async getChapters(bookId: string): Promise<LibraryChapter[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_chapters").select("*").eq("book_id", bookId).order("chapter_number", { ascending: true })
    return data || []
  }

  async createChapter(chapter: Partial<LibraryChapter>): Promise<LibraryChapter | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_chapters").insert(chapter).select().single()
    return data
  }

  async updateChapter(id: string, updates: Partial<LibraryChapter>): Promise<LibraryChapter | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_chapters").update(updates).eq("id", id).select().single()
    return data
  }

  async getChunks(bookId: string): Promise<LibraryChunk[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_chunks").select("*").eq("book_id", bookId).order("chunk_index", { ascending: true })
    return data || []
  }

  async getChunksByChapter(chapterId: string): Promise<LibraryChunk[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_chunks").select("*").eq("chapter_id", chapterId).order("chunk_index", { ascending: true })
    return data || []
  }

  async createChunk(chunk: Partial<LibraryChunk>): Promise<LibraryChunk | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_chunks").insert(chunk).select().single()
    return data
  }

  async deleteChunks(bookId: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client.from("library_chunks").delete().eq("book_id", bookId)
    return !error
  }

  async getVersions(bookId: string): Promise<LibraryVersion[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_versions").select("*").eq("book_id", bookId).order("version_number", { ascending: false })
    return data || []
  }

  async createVersion(version: Partial<LibraryVersion>): Promise<LibraryVersion | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_versions").insert(version).select().single()
    return data
  }

  async getSources(): Promise<LibrarySource[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_sources").select("*").order("name")
    return data || []
  }

  async createSource(source: Partial<LibrarySource>): Promise<LibrarySource | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_sources").insert(source).select().single()
    return data
  }

  async updateSource(id: string, updates: Partial<LibrarySource>): Promise<LibrarySource | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_sources").update(updates).eq("id", id).select().single()
    return data
  }

  async getPeople(): Promise<LibraryPerson[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_people").select("*").order("name")
    return data || []
  }

  async createPerson(person: Partial<LibraryPerson>): Promise<LibraryPerson | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_people").insert(person).select().single()
    return data
  }

  async getPlaces(): Promise<LibraryPlace[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_places").select("*").order("name")
    return data || []
  }

  async createPlace(place: Partial<LibraryPlace>): Promise<LibraryPlace | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_places").insert(place).select().single()
    return data
  }

  async getTopics(): Promise<LibraryTopic[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_topics").select("*").order("usage_count", { ascending: false })
    return data || []
  }

  async createTopic(topic: Partial<LibraryTopic>): Promise<LibraryTopic | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_topics").insert(topic).select().single()
    return data
  }

  async createJob(job: Partial<LibraryImportJob>): Promise<LibraryImportJob | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_import_jobs").insert(job).select().single()
    return data
  }

  async updateJob(id: string, updates: Partial<LibraryImportJob>): Promise<LibraryImportJob | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_import_jobs").update(updates).eq("id", id).select().single()
    return data
  }

  async listJobs(): Promise<LibraryImportJob[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_import_jobs").select("*").order("created_at", { ascending: false }).limit(20)
    return data || []
  }

  async createApproval(approval: Partial<LibraryApproval>): Promise<LibraryApproval | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_approvals").insert(approval).select().single()
    return data
  }

  async updateApproval(id: string, updates: Partial<LibraryApproval>): Promise<LibraryApproval | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_approvals").update(updates).eq("id", id).select().single()
    return data
  }

  async listApprovals(): Promise<LibraryApproval[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_approvals").select("*").order("requested_at", { ascending: false })
    return data || []
  }

  async logAccess(entry: Partial<LibraryAccessLog>): Promise<LibraryAccessLog | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_access_logs").insert(entry).select().single()
    return data
  }

  async getAccessLogs(bookId?: string): Promise<LibraryAccessLog[]> {
    if (!this.available) return []
    let query = this.client.from("library_access_logs").select("*").order("created_at", { ascending: false })
    if (bookId) query = query.eq("book_id", bookId)
    const { data } = await query.limit(50)
    return data || []
  }

  async linkPerson(bookId: string, personId: string, relevance?: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client.from("library_book_people").insert({ book_id: bookId, person_id: personId, relevance })
    return !error
  }

  async linkPlace(bookId: string, placeId: string, relevance?: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client.from("library_book_places").insert({ book_id: bookId, place_id: placeId, relevance })
    return !error
  }

  async linkTopic(bookId: string, topicId: string, relevance?: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client.from("library_book_topics").insert({ book_id: bookId, topic_id: topicId, relevance })
    return !error
  }

  async createRelationship(rel: Partial<LibraryRelationship>): Promise<LibraryRelationship | null> {
    if (!this.available) return null
    const { data } = await this.client.from("library_relationships").insert(rel).select().single()
    return data
  }

  async getRelationships(bookId: string): Promise<LibraryRelationship[]> {
    if (!this.available) return []
    const { data } = await this.client.from("library_relationships")
      .select("*, source:library_books!source_book_id(*), target:library_books!target_book_id(*)")
      .or(`source_book_id.eq.${bookId},target_book_id.eq.${bookId}`)
    return data || []
  }
}

export const bibliotecaRepo = new BibliotecaRepository()
