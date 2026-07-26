'use client'

// ================================================================
// CONSEJO INVISIBLE MSM — Tipos TypeScript
// Módulo privado dentro de ZAFIRO
// ================================================================

// --- Roles y Permisos ---
export type CouncilRole = 'OWNER_SUPERADMIN' | 'COUNCIL_EDITOR' | 'COUNCIL_REVIEWER' | 'FAMILY_VIEWER' | 'TRUSTED_VIEWER' | 'MEMBER' | 'PUBLIC'

export type ContentVisibility = 'private' | 'trusted_circle' | 'family' | 'team' | 'members' | 'public'

// --- Guías ---
export type GuideCategory = 'biblical' | 'spiritual' | 'philosopher' | 'inventor' | 'scientist' | 'entrepreneur' | 'writer' | 'leader' | 'family' | 'personal_identity' | 'other'

export type GuideStatus = 'draft' | 'pending_confirmation' | 'confirmed' | 'active' | 'archived'

export interface CouncilGuide {
  id: string
  display_name: string
  slug: string
  guide_number: number
  category: GuideCategory
  short_description: string
  biography_summary: string
  verified_sources: unknown[]
  principal_teachings: unknown[]
  quotes: unknown[]
  books: unknown[]
  audio_fragments: unknown[]
  transcript_fragments: unknown[]
  themes: string[]
  personal_notes: string
  relationship_to_miguel: string
  status: GuideStatus
  visibility: ContentVisibility
  is_confirmed: boolean
  created_by: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

// --- Fuentes ---
export type SourceType = 'audio_original' | 'transcript' | 'book' | 'bible' | 'personal_memory' | 'personal_note' | 'video' | 'interview' | 'document' | 'family_testimony' | 'web_source' | 'ai_generated_draft'

export type VerificationStatus = 'unverified' | 'partially_verified' | 'verified' | 'owner_confirmed' | 'rejected'

export interface CouncilSource {
  id: string
  source_title: string
  source_type: SourceType
  author: string
  source_reference: string
  file_id: string | null
  page: number | null
  chapter: number | null
  timestamp_start_ms: number | null
  timestamp_end_ms: number | null
  language: string
  verification_status: VerificationStatus
  approved_by: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
}

// --- Audio ---
export interface CouncilAudioFile {
  id: string
  title: string
  description: string
  file_name: string
  file_path: string
  file_size_bytes: number
  mime_type: string
  duration_ms: number
  language: string
  version: number
  uploaded_by: string | null
  visibility: ContentVisibility
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// --- Transcripciones ---
export type TranscriptReviewStatus = 'generated' | 'pending_review' | 'corrected' | 'approved' | 'rejected'

export interface CouncilTranscript {
  id: string
  audio_id: string | null
  full_text: string
  language: string
  version: number
  review_status: TranscriptReviewStatus
  reviewed_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CouncilTranscriptSegment {
  id: string
  transcript_id: string
  segment_index: number
  start_time_ms: number
  end_time_ms: number
  speaker_label: string
  raw_text: string
  corrected_text: string
  language: string
  confidence: number
  review_status: TranscriptReviewStatus
  reviewed_by: string | null
  guide_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

// --- Enseñanzas ---
export interface CouncilTeaching {
  id: string
  title: string
  summary: string
  full_content: string
  guide_id: string | null
  source_id: string | null
  themes: string[]
  biblical_references: unknown[]
  practical_application: string
  questions: unknown[]
  personal_interpretation: string
  ai_summary: string
  owner_notes: string
  verification_status: VerificationStatus
  visibility: ContentVisibility
  approved_at: string | null
  approved_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// --- Sesiones ---
export type SessionType = 'oracion' | 'reflexion' | 'escritura' | 'metas' | 'negocios' | 'familia' | 'tecnologia' | 'proyecto' | 'salud' | 'discernimiento' | 'gratitud'

export type SessionStatus = 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'archived'

export interface CouncilSession {
  id: string
  session_title: string
  purpose: string
  question: string
  session_type: SessionType
  opening_prayer: string
  reflection: string
  ideas: string
  decision: string
  action_plan: string
  review_date: string | null
  mood: string
  privacy: ContentVisibility
  status: SessionStatus
  god_first_mode: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// --- Libros ---
export type BookStatus = 'idea' | 'outline' | 'draft' | 'review' | 'approved' | 'published' | 'archived'

export interface CouncilBook {
  id: string
  title: string
  subtitle: string
  purpose: string
  target_reader: string
  status: BookStatus
  visibility: ContentVisibility
  created_by: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CouncilBookChapter {
  id: string
  book_id: string
  chapter_number: number
  title: string
  summary: string
  content: string
  status: BookStatus
  created_at: string
  updated_at: string
}

// --- Metas ---
export type GoalStatus = 'idea' | 'active' | 'paused' | 'completed' | 'changed' | 'archived'

export type GoalCategory = 'spiritual' | 'family' | 'health' | 'business' | 'financial' | 'technology' | 'education' | 'travel' | 'legacy' | 'community' | 'personal'

export interface CouncilGoal {
  id: string
  title: string
  description: string
  category: GoalCategory
  why: string
  desired_result: string
  start_date: string | null
  target_date: string | null
  status: GoalStatus
  progress: number
  next_action: string
  evidence: string
  owner_reflection: string
  visibility: ContentVisibility
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// --- Diario ---
export type JournalEntryType = 'text' | 'audio' | 'image' | 'document' | 'emotion' | 'gratitude' | 'dream' | 'idea' | 'prayer' | 'decision' | 'learning' | 'action' | 'result'

export interface CouncilJournalEntry {
  id: string
  entry_type: JournalEntryType
  title: string
  content: string
  audio_id: string | null
  image_url: string
  date: string
  time: string | null
  location_consent: boolean
  tags: string[]
  linked_guide_id: string | null
  linked_goal_id: string | null
  linked_session_id: string | null
  privacy: ContentVisibility
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// --- Oraciones y Declaraciones ---
export type PrayerDeclarationType = 'prayer' | 'declaration'

export type PrayerDeclarationStatus = 'draft' | 'reviewed' | 'approved' | 'archived'

export interface CouncilPrayer {
  id: string
  title: string
  type: PrayerDeclarationType
  content: string
  biblical_references: unknown[]
  author: string
  source: string
  status: PrayerDeclarationStatus
  visibility: ContentVisibility
  approved_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// --- Etiquetas ---
export interface CouncilTag {
  id: string
  name: string
  slug: string
  color: string
  created_at: string
}

// --- Auditoría ---
export type CouncilAuditEvent =
  | 'GUIDE_CREATED' | 'GUIDE_CONFIRMED' | 'GUIDE_UPDATED'
  | 'SOURCE_ADDED'
  | 'AUDIO_UPLOADED' | 'AUDIO_DELETED'
  | 'TRANSCRIPT_GENERATED' | 'TRANSCRIPT_CORRECTED' | 'TRANSCRIPT_APPROVED'
  | 'TEACHING_CREATED' | 'TEACHING_APPROVED'
  | 'SESSION_STARTED' | 'SESSION_COMPLETED'
  | 'BOOK_CREATED' | 'BOOK_UPDATED'
  | 'GOAL_CREATED' | 'GOAL_COMPLETED'
  | 'JOURNAL_ENTRY_CREATED'
  | 'CONTENT_SHARED' | 'CONTENT_PUBLISHED' | 'CONTENT_ARCHIVED'
  | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED'
  | 'AI_DRAFT_CREATED' | 'AI_DRAFT_APPROVED' | 'AI_DRAFT_REJECTED'
  | 'EXPORT_CREATED'

export interface CouncilAuditLog {
  id: string
  actor_id: string | null
  event_type: CouncilAuditEvent
  resource_type: string
  resource_id: string
  previous_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  timestamp: string
  device: string
  ip_hash: string
  metadata: Record<string, unknown>
}

// --- Constantes ---
export const COUNCIL_THEMES = [
  'fe', 'sabiduria', 'disciplina', 'amor', 'familia',
  'liderazgo', 'negocios', 'prosperidad', 'tecnologia', 'inventos',
  'escritura', 'metas', 'visualizacion', 'salud', 'servicio',
  'legado', 'perdon', 'gratitud', 'caracter', 'discernimiento'
] as const

export const GUIDE_NUMBERS = Array.from({ length: 22 }, (_, i) => i + 1)

export const SESSION_PURPOSES: Record<SessionType, string> = {
  oracion: 'Conectar con Dios y buscar dirección',
  reflexion: 'Examnar enseñanzas y extraer principios',
  escritura: 'Avanzar en la escritura de libros o documentos',
  metas: 'Definir, revisar o avanzar metas concretas',
  negocios: 'Tomar decisiones de negocio informadas',
  familia: 'Fortalecer la vida familiar y el legado',
  tecnologia: 'Explorar ideas técnicas y creativas',
  proyecto: 'Avanzar un proyecto específico',
  salud: 'Cuidar el bienestar físico y mental',
  discernimiento: 'Evaluar una situación con sabiduría',
  gratitud: 'Reconocer bendiciones y avances'
}

export const GOD_FIRST_OPENING = `Padre amado, pongo esta sesión delante de Ti.
Dame sabiduría, entendimiento, paz y discernimiento.
Ayúdame a examinar cada enseñanza y retener lo bueno.
Guía mis pensamientos, mis decisiones y mis acciones.
En el nombre de Jesús. Amén.`

export const GOD_FIRST_VERSES = [
  'Proverbios 2:6',
  'Santiago 1:5',
  '1 Tesalonicenses 5:21',
  'Proverbios 3:5-6',
  'Habacuc 2:2'
]

export const AI_DISCLAIMER = `Este contenido es una herramienta de reflexión y estudio.
Las decisiones espirituales, personales, médicas, legales o financieras deben ser examinadas responsablemente.`

export const AI_ASSISTANT_MESSAGE = `Soy una herramienta de organización y estudio.
Responderé utilizando únicamente fuentes autorizadas.
Cuando no exista información confirmada, lo indicaré claramente.`
