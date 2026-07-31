export type LibraryBookStatus =
  | "descubierto" | "pendiente_revision" | "aprobado" | "importado"
  | "duplicado" | "excluido" | "error" | "actualizado"

export type LibraryPrivacyLevel =
  | "privado_don_miguel" | "familia" | "equipo_msm" | "interno_eliana"
  | "comunidad" | "publico" | "legado_futuro"

export type LibraryClaimType =
  | "hecho_biografico" | "experiencia_personal" | "recuerdo" | "oracion"
  | "reflexion_espiritual" | "interpretacion_biblica" | "sueno" | "simbolismo"
  | "hipotesis" | "idea_invento" | "ficcion" | "proyecto"
  | "politica_empresarial" | "informacion_verificada" | "pendiente_confirmar"

export type LibraryImportJobStatus =
  | "pending" | "scanning" | "scan_complete" | "importing"
  | "completed" | "failed" | "cancelled"

export type LibrarySourceType = "google_drive" | "manual" | "upload" | "import"

export interface LibrarySource {
  id: string
  source_type: LibrarySourceType
  drive_folder_id?: string
  drive_folder_name?: string
  name: string
  description?: string
  config: Record<string, unknown>
  last_synced_at?: string
  sync_status: string
  error_message?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface LibraryBook {
  id: string
  source_id?: string
  drive_file_id?: string
  title: string
  normalized_title: string
  author: string
  work_type?: string
  series?: string
  volume_number?: number
  language: string
  description?: string
  summary?: string
  cover_url?: string
  isbn?: string
  publisher?: string
  page_count?: number
  chapter_count?: number
  creation_date?: string
  modification_date?: string
  source_url?: string
  format?: string
  status: LibraryBookStatus
  privacy_level: LibraryPrivacyLevel
  version: number
  checksum?: string
  owner_id?: string
  metadata: Record<string, unknown>
  tags: string[]
  import_decision?: string
  imported_at?: string
  created_at: string
  updated_at: string
}

export interface LibraryVersion {
  id: string
  book_id: string
  version_number: number
  title?: string
  content?: string
  summary?: string
  checksum?: string
  changelog?: string
  file_size?: number
  created_by?: string
  created_at: string
}

export interface LibraryChapter {
  id: string
  book_id: string
  chapter_number: number
  title?: string
  summary?: string
  content_original?: string
  word_count?: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface LibraryChunk {
  id: string
  book_id: string
  chapter_id?: string
  source_file_id?: string
  chunk_index: number
  section?: string
  content: string
  summary?: string
  claim_type?: LibraryClaimType
  main_concepts: string[]
  people_mentioned: string[]
  places_mentioned: string[]
  token_count?: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface LibraryPerson {
  id: string
  name: string
  normalized_name: string
  biography?: string
  relationship_to_author?: string
  birth_date?: string
  death_date?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface LibraryPlace {
  id: string
  name: string
  normalized_name: string
  location_type?: string
  country?: string
  description?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface LibraryTopic {
  id: string
  name: string
  slug: string
  description?: string
  parent_topic_id?: string
  color: string
  usage_count: number
  created_at: string
}

export interface LibraryRelationship {
  id: string
  source_book_id: string
  target_book_id: string
  relationship_type: string
  description?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface LibraryImportJob {
  id: string
  source_id?: string
  status: LibraryImportJobStatus
  job_type: string
  files_found: number
  files_scanned: number
  books_identified: number
  duplicates_found: number
  exclusions_applied: number
  books_imported: number
  chunks_created: number
  embeddings_generated: number
  errors: unknown[]
  error_count: number
  started_at?: string
  completed_at?: string
  created_by?: string
  created_at: string
}

export interface LibraryApproval {
  id: string
  book_id: string
  version_number?: number
  status: string
  requested_by?: string
  reviewed_by?: string
  review_notes?: string
  requested_at: string
  reviewed_at?: string
}

export interface LibraryAccessLog {
  id: string
  book_id?: string
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

export interface LibrarySearchOptions {
  query: string
  limit?: number
  threshold?: number
  status?: LibraryBookStatus
  privacy_level?: LibraryPrivacyLevel
  series?: string
  tags?: string[]
  claim_type?: LibraryClaimType
  source_id?: string
}

export interface LibrarySearchResult {
  book: LibraryBook
  score: number
  matched_chunks?: LibraryChunk[]
  highlights?: string[]
}
