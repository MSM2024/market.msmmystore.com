import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import type {
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeSource,
  KnowledgeTag,
  KnowledgeVersion,
  KnowledgePermission,
  KnowledgeQuery,
  KnowledgeAnswer,
  KnowledgeFeedback,
  KnowledgeIngestionJob,
  KnowledgeAuditLog,
  KnowledgeApproval,
  KnowledgeGap,
  KnowledgeSetting,
  KnowledgeStatus,
  SearchOptions,
  SearchResult,
} from "./types"

export class KnowledgeRepository {
  private get client() {
    return getSupabaseClient()
  }

  private get available() {
    return isSupabaseAvailable()
  }

  // ============================================================================
  // Documents
  // ============================================================================

  async getDocument(id: string): Promise<KnowledgeDocument | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_documents")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return null
    return data
  }

  async getDocumentBySlug(slug: string): Promise<KnowledgeDocument | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_documents")
      .select("*")
      .eq("slug", slug)
      .single()
    if (error) return null
    return data
  }

  async listDocuments(options: {
    status?: KnowledgeStatus
    doc_type?: string
    visibility?: string
    source_id?: string
    tags?: string[]
    limit?: number
    offset?: number
    order_by?: string
    order?: "asc" | "desc"
  } = {}): Promise<{ documents: KnowledgeDocument[]; total: number }> {
    if (!this.available) return { documents: [], total: 0 }

    let query = this.client.from("knowledge_documents").select("*", { count: "exact" })

    if (options.status) query = query.eq("status", options.status)
    if (options.doc_type) query = query.eq("doc_type", options.doc_type)
    if (options.visibility) query = query.eq("visibility", options.visibility)
    if (options.source_id) query = query.eq("source_id", options.source_id)

    if (options.tags && options.tags.length > 0) {
      query = query.contains("metadata->tags", options.tags)
    }

    const orderBy = options.order_by || "created_at"
    const order = options.order || "desc"
    query = query.order(orderBy, { ascending: order === "asc" })

    if (options.limit) query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)

    const { data, error, count } = await query
    if (error) return { documents: [], total: 0 }
    return { documents: data || [], total: count || 0 }
  }

  async createDocument(doc: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_documents")
      .insert(doc)
      .select()
      .single()
    if (error) return null
    return data
  }

  async updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) return null
    return data
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client
      .from("knowledge_documents")
      .delete()
      .eq("id", id)
    return !error
  }

  async searchDocuments(options: SearchOptions): Promise<SearchResult[]> {
    if (!this.available || !options.query) return []

    const query = options.query.trim()
    const limit = options.limit || 10
    const threshold = options.threshold || 0.3

    let dbQuery = this.client
      .from("knowledge_documents")
      .select("*")
      .eq("status", options.status || "published")

    if (options.doc_type) dbQuery = dbQuery.eq("doc_type", options.doc_type)
    if (options.visibility) dbQuery = dbQuery.eq("visibility", options.visibility)
    if (options.source_id) dbQuery = dbQuery.eq("source_id", options.source_id)

    const orConditions = [
      `title.ilike.%${query}%`,
      `content.ilike.%${query}%`,
      `summary.ilike.%${query}%`,
    ].join(",")

    dbQuery = dbQuery.or(orConditions)
    dbQuery = dbQuery.order("priority", { ascending: false })
    dbQuery = dbQuery.limit(limit)

    const { data, error } = await dbQuery
    if (error) return []

    return (data || []).map((doc: KnowledgeDocument) => ({
      document: doc as KnowledgeDocument,
      score: this.calculateRelevanceScore(doc as KnowledgeDocument, query),
      highlights: this.extractHighlights(doc as KnowledgeDocument, query),
    })).sort((a: { score: number }, b: { score: number }) => b.score - a.score)
  }

  private calculateRelevanceScore(doc: KnowledgeDocument, query: string): number {
    let score = 0
    const q = query.toLowerCase()
    const words = q.split(/\s+/).filter(w => w.length > 2)

    if (doc.title.toLowerCase().includes(q)) score += 10
    if (doc.summary?.toLowerCase().includes(q)) score += 5

    for (const word of words) {
      if (doc.title.toLowerCase().includes(word)) score += 3
      if (doc.content.toLowerCase().includes(word)) score += 1
    }

    const exactMatches = (doc.content.toLowerCase().match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length
    score += Math.min(exactMatches * 2, 10)

    if (doc.priority > 0) score += doc.priority
    if (doc.status === "published") score += 2

    return Math.min(score / 20, 1)
  }

  private extractHighlights(doc: KnowledgeDocument, query: string): string[] {
    const highlights: string[] = []
    const q = query.toLowerCase()
    const words = q.split(/\s+/).filter(w => w.length > 2)

    if (doc.title.toLowerCase().includes(q)) {
      highlights.push(`Title: "${doc.title}"`)
    }

    const content = doc.content
    const lines = content.split("\n")
    for (const line of lines) {
      if (words.some(w => line.toLowerCase().includes(w))) {
        highlights.push(line.trim().substring(0, 200))
        if (highlights.length >= 3) break
      }
    }

    return highlights
  }

  // ============================================================================
  // Chunks
  // ============================================================================

  async getChunks(documentId: string): Promise<KnowledgeChunk[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_chunks")
      .select("*")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true })
    if (error) return []
    return data || []
  }

  async createChunk(chunk: Partial<KnowledgeChunk>): Promise<KnowledgeChunk | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_chunks")
      .insert(chunk)
      .select()
      .single()
    if (error) return null
    return data
  }

  async deleteChunks(documentId: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client
      .from("knowledge_chunks")
      .delete()
      .eq("document_id", documentId)
    return !error
  }

  // ============================================================================
  // Sources
  // ============================================================================

  async listSources(): Promise<KnowledgeSource[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_sources")
      .select("*")
      .order("name", { ascending: true })
    if (error) return []
    return data || []
  }

  async getSource(id: string): Promise<KnowledgeSource | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_sources")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return null
    return data
  }

  async createSource(source: Partial<KnowledgeSource>): Promise<KnowledgeSource | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_sources")
      .insert(source)
      .select()
      .single()
    if (error) return null
    return data
  }

  async updateSource(id: string, updates: Partial<KnowledgeSource>): Promise<KnowledgeSource | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) return null
    return data
  }

  // ============================================================================
  // Tags
  // ============================================================================

  async listTags(): Promise<KnowledgeTag[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_tags")
      .select("*")
      .order("usage_count", { ascending: false })
    if (error) return []
    return data || []
  }

  async createTag(tag: Partial<KnowledgeTag>): Promise<KnowledgeTag | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_tags")
      .insert(tag)
      .select()
      .single()
    if (error) return null
    return data
  }

  async addDocumentTag(documentId: string, tagId: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client
      .from("knowledge_document_tags")
      .insert({ document_id: documentId, tag_id: tagId })
    return !error
  }

  async removeDocumentTag(documentId: string, tagId: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client
      .from("knowledge_document_tags")
      .delete()
      .eq("document_id", documentId)
      .eq("tag_id", tagId)
    return !error
  }

  async getDocumentTags(documentId: string): Promise<KnowledgeTag[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_document_tags")
      .select("tag_id, knowledge_tags(*)")
      .eq("document_id", documentId)
    if (error) return []
    return (data || []).map((d: Record<string, unknown>) => d.knowledge_tags).filter(Boolean)
  }

  // ============================================================================
  // Versions
  // ============================================================================

  async getVersions(documentId: string): Promise<KnowledgeVersion[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
    if (error) return []
    return data || []
  }

  async createVersion(version: Partial<KnowledgeVersion>): Promise<KnowledgeVersion | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_versions")
      .insert(version)
      .select()
      .single()
    if (error) return null
    return data
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  async getDocumentPermissions(documentId: string): Promise<KnowledgePermission[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_permissions")
      .select("*")
      .eq("document_id", documentId)
    if (error) return []
    return data || []
  }

  async setPermission(perm: Partial<KnowledgePermission>): Promise<KnowledgePermission | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_permissions")
      .upsert(perm, { onConflict: "document_id,user_id" })
      .select()
      .single()
    if (error) return null
    return data
  }

  async removePermission(documentId: string, userId: string): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client
      .from("knowledge_permissions")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", userId)
    return !error
  }

  // ============================================================================
  // Queries & Answers
  // ============================================================================

  async logQuery(query: Partial<KnowledgeQuery>): Promise<KnowledgeQuery | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_queries")
      .insert(query)
      .select()
      .single()
    if (error) return null
    return data
  }

  async logAnswer(answer: Partial<KnowledgeAnswer>): Promise<KnowledgeAnswer | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_answers")
      .insert(answer)
      .select()
      .single()
    if (error) return null
    return data
  }

  async getQueryStats(): Promise<{
    total_queries: number
    avg_response_time: number
    avg_top_score: number
    queries_today: number
    queries_this_week: number
  }> {
    if (!this.available) return { total_queries: 0, avg_response_time: 0, avg_top_score: 0, queries_today: 0, queries_this_week: 0 }

    const { data: total } = await this.client
      .from("knowledge_queries")
      .select("id", { count: "exact", head: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayCount } = await this.client
      .from("knowledge_queries")
      .select("id", { count: "exact" })
      .gte("created_at", today.toISOString())

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: weekCount } = await this.client
      .from("knowledge_queries")
      .select("id", { count: "exact" })
      .gte("created_at", weekAgo.toISOString())

    const { data: avgData } = await this.client
      .from("knowledge_queries")
      .select("response_time_ms, top_score")

    const avgResponseTime = avgData?.length
      ? avgData.reduce((sum: number, q: Record<string, unknown>) => sum + ((q.response_time_ms as number) || 0), 0) / avgData.length
      : 0
    const avgTopScore = avgData?.length
      ? avgData.reduce((sum: number, q: Record<string, unknown>) => sum + ((q.top_score as number) || 0), 0) / avgData.length
      : 0

    return {
      total_queries: total?.count || 0,
      avg_response_time: Math.round(avgResponseTime),
      avg_top_score: Math.round(avgTopScore * 100) / 100,
      queries_today: todayCount || 0,
      queries_this_week: weekCount || 0,
    }
  }

  // ============================================================================
  // Feedback
  // ============================================================================

  async addFeedback(feedback: Partial<KnowledgeFeedback>): Promise<KnowledgeFeedback | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_feedback")
      .insert(feedback)
      .select()
      .single()
    if (error) return null
    return data
  }

  async getFeedbackStats(): Promise<{
    total: number
    helpful: number
    not_helpful: number
    avg_score: number
  }> {
    if (!this.available) return { total: 0, helpful: 0, not_helpful: 0, avg_score: 0 }

    const { data } = await this.client
      .from("knowledge_feedback")
      .select("feedback_type")

    if (!data) return { total: 0, helpful: 0, not_helpful: 0, avg_score: 0 }

    const helpful = data.filter((f: Record<string, unknown>) => f.feedback_type === "helpful").length
    const notHelpful = data.filter((f: Record<string, unknown>) => f.feedback_type === "not_helpful").length

    return {
      total: data.length,
      helpful,
      not_helpful: notHelpful,
      avg_score: data.length > 0 ? helpful / data.length : 0,
    }
  }

  // ============================================================================
  // Gaps
  // ============================================================================

  async listGaps(): Promise<KnowledgeGap[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_gaps")
      .select("*")
      .order("priority", { ascending: false })
    if (error) return []
    return data || []
  }

  async createGap(gap: Partial<KnowledgeGap>): Promise<KnowledgeGap | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_gaps")
      .insert(gap)
      .select()
      .single()
    if (error) return null
    return data
  }

  async updateGap(id: string, updates: Partial<KnowledgeGap>): Promise<KnowledgeGap | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_gaps")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) return null
    return data
  }

  // ============================================================================
  // Settings
  // ============================================================================

  async getSetting(key: string): Promise<unknown> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_settings")
      .select("value")
      .eq("key", key)
      .single()
    if (error) return null
    return data?.value
  }

  async setSetting(key: string, value: unknown): Promise<boolean> {
    if (!this.available) return false
    const { error } = await this.client
      .from("knowledge_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    return !error
  }

  async getAllSettings(): Promise<KnowledgeSetting[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_settings")
      .select("*")
      .order("category", { ascending: true })
    if (error) return []
    return data || []
  }

  // ============================================================================
  // Ingestion Jobs
  // ============================================================================

  async createJob(job: Partial<KnowledgeIngestionJob>): Promise<KnowledgeIngestionJob | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_ingestion_jobs")
      .insert(job)
      .select()
      .single()
    if (error) return null
    return data
  }

  async updateJob(id: string, updates: Partial<KnowledgeIngestionJob>): Promise<KnowledgeIngestionJob | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_ingestion_jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) return null
    return data
  }

  async listJobs(): Promise<KnowledgeIngestionJob[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_ingestion_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) return []
    return data || []
  }

  // ============================================================================
  // Approvals
  // ============================================================================

  async listApprovals(): Promise<KnowledgeApproval[]> {
    if (!this.available) return []
    const { data, error } = await this.client
      .from("knowledge_approvals")
      .select("*")
      .order("requested_at", { ascending: false })
    if (error) return []
    return data || []
  }

  async createApproval(approval: Partial<KnowledgeApproval>): Promise<KnowledgeApproval | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_approvals")
      .insert(approval)
      .select()
      .single()
    if (error) return null
    return data
  }

  async updateApproval(id: string, updates: Partial<KnowledgeApproval>): Promise<KnowledgeApproval | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_approvals")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) return null
    return data
  }

  // ============================================================================
  // Audit Logs
  // ============================================================================

  async logAudit(entry: Partial<KnowledgeAuditLog>): Promise<KnowledgeAuditLog | null> {
    if (!this.available) return null
    const { data, error } = await this.client
      .from("knowledge_audit_logs")
      .insert(entry)
      .select()
      .single()
    if (error) return null
    return data
  }

  async getAuditLogs(options: { limit?: number; action?: string; resource_type?: string } = {}): Promise<KnowledgeAuditLog[]> {
    if (!this.available) return []
    let query = this.client
      .from("knowledge_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (options.action) query = query.eq("action", options.action)
    if (options.resource_type) query = query.eq("resource_type", options.resource_type)
    if (options.limit) query = query.limit(options.limit)

    const { data, error } = await query
    if (error) return []
    return data || []
  }

  // ============================================================================
  // Dashboard Stats
  // ============================================================================

  async getDashboardStats(): Promise<{
    total_documents: number
    published_documents: number
    draft_documents: number
    total_chunks: number
    total_queries: number
    total_feedback: number
    total_gaps: number
    open_gaps: number
    pending_approvals: number
    documents_by_type: Record<string, number>
    documents_by_status: Record<string, number>
    recent_queries: KnowledgeQuery[]
    recent_feedback: KnowledgeFeedback[]
  }> {
    if (!this.available) {
      return {
        total_documents: 0, published_documents: 0, draft_documents: 0,
        total_chunks: 0, total_queries: 0, total_feedback: 0,
        total_gaps: 0, open_gaps: 0, pending_approvals: 0,
        documents_by_type: {}, documents_by_status: {},
        recent_queries: [], recent_feedback: [],
      }
    }

    const [docs, chunks, queries, feedback, gaps, approvals, recentQueries, recentFeedback] = await Promise.all([
      this.client.from("knowledge_documents").select("doc_type, status"),
      this.client.from("knowledge_chunks").select("id", { count: "exact", head: true }),
      this.client.from("knowledge_queries").select("id", { count: "exact", head: true }),
      this.client.from("knowledge_feedback").select("id", { count: "exact", head: true }),
      this.client.from("knowledge_gaps").select("status"),
      this.client.from("knowledge_approvals").select("status"),
      this.client.from("knowledge_queries").select("*").order("created_at", { ascending: false }).limit(10),
      this.client.from("knowledge_feedback").select("*").order("created_at", { ascending: false }).limit(10),
    ])

    const docsByType: Record<string, number> = {}
    const docsByStatus: Record<string, number> = {}
    for (const doc of (docs.data || []) as Record<string, unknown>[]) {
      docsByType[String(doc.doc_type)] = (docsByType[String(doc.doc_type)] || 0) + 1
      docsByStatus[String(doc.status)] = (docsByStatus[String(doc.status)] || 0) + 1
    }

    return {
      total_documents: (docs.data || []).length,
      published_documents: docsByStatus["published"] || 0,
      draft_documents: docsByStatus["draft"] || 0,
      total_chunks: chunks.count || 0,
      total_queries: queries.count || 0,
      total_feedback: feedback.count || 0,
      total_gaps: (gaps.data || []).length,
      open_gaps: (gaps.data || []).filter((g: Record<string, unknown>) => g.status !== "archived").length,
      pending_approvals: (approvals.data || []).filter((a: Record<string, unknown>) => a.status === "pending").length,
      documents_by_type: docsByType,
      documents_by_status: docsByStatus,
      recent_queries: recentQueries.data || [],
      recent_feedback: recentFeedback.data || [],
    }
  }
}

export const knowledgeRepo = new KnowledgeRepository()
