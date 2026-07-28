export type KnowledgeStatus = "draft" | "review" | "published" | "archived" | "rejected"
export type KnowledgeDocType = "policy" | "faq" | "guide" | "tutorial" | "reference" | "changelog" | "identity" | "operations" | "legal" | "marketing"
export type KnowledgeSourceType = "markdown" | "pdf" | "url" | "api" | "manual" | "import"
export type KnowledgePermissionLevel = "read" | "write" | "admin" | "none"
export type KnowledgeFeedbackType = "helpful" | "not_helpful" | "outdated" | "incorrect" | "incomplete"
export type KnowledgeJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled"
export type KnowledgeApprovalStatus = "pending" | "approved" | "rejected" | "revision_needed"
export type KnowledgeGapType = "missing_topic" | "outdated_info" | "low_coverage" | "contradiction" | "user_request"
export type KnowledgeVisibility = "public" | "internal" | "confidential" | "restricted"

export interface KnowledgeSource {
  id: string
  name: string
  type: KnowledgeSourceType
  url?: string
  config: Record<string, unknown>
  last_synced_at?: string
  sync_status: string
  error_message?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface KnowledgeDocument {
  id: string
  source_id?: string
  title: string
  slug: string
  doc_type: KnowledgeDocType
  status: KnowledgeStatus
  visibility: KnowledgeVisibility
  content: string
  summary?: string
  language: string
  embedding?: number[]
  metadata: Record<string, unknown>
  priority: number
  valid_from?: string
  valid_until?: string
  published_at?: string
  archived_at?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface KnowledgeChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  heading?: string
  embedding?: number[]
  token_count?: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface KnowledgeVersion {
  id: string
  document_id: string
  version_number: number
  title: string
  content: string
  summary?: string
  changelog?: string
  created_by?: string
  created_at: string
}

export interface KnowledgeTag {
  id: string
  name: string
  slug: string
  color: string
  description?: string
  usage_count: number
  created_at: string
}

export interface KnowledgeDocumentTag {
  document_id: string
  tag_id: string
  created_at: string
}

export interface KnowledgePermission {
  id: string
  document_id: string
  user_id?: string
  role?: string
  level: KnowledgePermissionLevel
  granted_by?: string
  expires_at?: string
  created_at: string
}

export interface KnowledgeQuery {
  id: string
  user_id?: string
  query: string
  query_embedding?: number[]
  results_count: number
  top_score?: number
  response_time_ms?: number
  source: string
  channel: string
  session_id?: string
  created_at: string
}

export interface KnowledgeAnswer {
  id: string
  query_id?: string
  user_id?: string
  answer: string
  documents_used: string[]
  confidence?: number
  model?: string
  tokens_used?: number
  feedback_count: number
  avg_feedback_score?: number
  created_at: string
}

export interface KnowledgeFeedback {
  id: string
  answer_id: string
  user_id?: string
  feedback_type: KnowledgeFeedbackType
  comment?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface KnowledgeIngestionJob {
  id: string
  source_id?: string
  status: KnowledgeJobStatus
  job_type: string
  documents_processed: number
  documents_total: number
  chunks_created: number
  embeddings_generated: number
  error_count: number
  errors: unknown[]
  started_at?: string
  completed_at?: string
  created_by?: string
  created_at: string
}

export interface KnowledgeAuditLog {
  id: string
  actor_id?: string
  actor_email?: string
  action: string
  resource_type: string
  resource_id?: string
  resource_title?: string
  previous_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface KnowledgeApproval {
  id: string
  document_id: string
  version_number?: number
  status: KnowledgeApprovalStatus
  requested_by?: string
  reviewed_by?: string
  review_notes?: string
  requested_at: string
  reviewed_at?: string
}

export interface KnowledgeGap {
  id: string
  gap_type: KnowledgeGapType
  title: string
  description?: string
  related_query?: string
  related_documents: string[]
  suggested_content?: string
  priority: number
  status: KnowledgeStatus
  assigned_to?: string
  resolved_at?: string
  created_at: string
}

export interface KnowledgeSetting {
  key: string
  value: unknown
  description?: string
  category: string
  updated_by?: string
  updated_at: string
}

export interface SearchOptions {
  query: string
  embedding?: number[]
  limit?: number
  threshold?: number
  status?: KnowledgeStatus
  doc_type?: KnowledgeDocType
  visibility?: KnowledgeVisibility
  tags?: string[]
  source_id?: string
}

export interface SearchResult {
  document: KnowledgeDocument
  score: number
  matched_chunks?: KnowledgeChunk[]
  highlights?: string[]
}

export interface RAGContext {
  query: string
  results: SearchResult[]
  total_chunks: number
  context_text: string
  sources: Array<{ title: string; slug: string; doc_type: string }>
  confidence: number
}

export interface RAGOptions {
  max_results?: number
  max_tokens?: number
  include_chunks?: boolean
  include_metadata?: boolean
  threshold?: number
}

export interface EmbeddingRequest {
  text: string
  model?: string
}

export interface EmbeddingResponse {
  embedding: number[]
  model: string
  tokens: number
}
