-- ================================================================
-- 00045 — KNOWLEDGE CORE: esquema completo del módulo de conocimiento
-- Tablas: documents, chunks, sources, tags, document_tags, versions,
-- permissions, queries, answers, feedback, ingestion_jobs, approvals,
-- gaps, settings, audit_logs. RLS acorde al modelo (público publicado,
-- admin/editor para escritura, owner de documento para drafts).
-- ================================================================

-- ================================================================
-- HELPERS
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_knowledge_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.council_user_roles
    WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

-- ================================================================
-- ENUMS
-- ================================================================
DO $$ BEGIN
  CREATE TYPE knowledge_doc_type AS ENUM ('policy','faq','guide','tutorial','reference','changelog','identity','operations','legal','marketing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_status AS ENUM ('draft','review','published','archived','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_visibility AS ENUM ('public','internal','confidential','restricted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_source_type AS ENUM ('markdown','pdf','url','api','manual','import');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_permission_level AS ENUM ('read','write','admin','none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_feedback_type AS ENUM ('helpful','not_helpful','outdated','incorrect','incomplete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_job_status AS ENUM ('pending','processing','completed','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_approval_status AS ENUM ('pending','approved','rejected','revision_needed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_gap_type AS ENUM ('missing_topic','outdated_info','low_coverage','contradiction','user_request');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- SOURCES (debe crearse antes que documents por la FK)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            knowledge_source_type NOT NULL DEFAULT 'manual',
  url             TEXT DEFAULT '',
  config          JSONB DEFAULT '{}'::jsonb,
  last_synced_at  TIMESTAMPTZ,
  sync_status     TEXT NOT NULL DEFAULT 'idle',
  error_message   TEXT DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- DOCUMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  doc_type        knowledge_doc_type NOT NULL DEFAULT 'reference',
  status          knowledge_status NOT NULL DEFAULT 'draft',
  visibility      knowledge_visibility NOT NULL DEFAULT 'internal',
  content         TEXT NOT NULL DEFAULT '',
  summary         TEXT DEFAULT '',
  language        TEXT NOT NULL DEFAULT 'es',
  embedding       REAL[],
  metadata        JSONB DEFAULT '{}'::jsonb,
  priority        INTEGER NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  updated_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_doc_type ON public.knowledge_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visibility ON public.knowledge_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_priority ON public.knowledge_documents(priority);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created ON public.knowledge_documents(created_at);

-- ================================================================
-- CHUNKS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index     INTEGER NOT NULL DEFAULT 0,
  content         TEXT NOT NULL,
  heading         TEXT DEFAULT '',
  embedding       REAL[],
  token_count     INTEGER DEFAULT 0,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON public.knowledge_chunks(document_id);

-- ================================================================
-- TAGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  color           TEXT NOT NULL DEFAULT '#6B7280',
  description     TEXT DEFAULT '',
  usage_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.knowledge_document_tags (
  document_id     UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, tag_id)
);

ALTER TABLE public.knowledge_document_tags ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- VERSIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL DEFAULT 1,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  summary         TEXT DEFAULT '',
  changelog       TEXT DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, version_number)
);

ALTER TABLE public.knowledge_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_versions_document ON public.knowledge_versions(document_id);

-- ================================================================
-- PERMISSIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  role            TEXT DEFAULT '',
  level           knowledge_permission_level NOT NULL DEFAULT 'read',
  granted_by      UUID REFERENCES auth.users(id),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id)
);

ALTER TABLE public.knowledge_permissions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- QUERIES & ANSWERS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_queries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id),
  query             TEXT NOT NULL,
  query_embedding   REAL[],
  results_count     INTEGER NOT NULL DEFAULT 0,
  top_score         REAL DEFAULT 0,
  response_time_ms  INTEGER DEFAULT 0,
  source            TEXT DEFAULT 'eliana',
  channel           TEXT DEFAULT 'web',
  session_id        TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_queries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_user ON public.knowledge_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_queries_created ON public.knowledge_queries(created_at);

CREATE TABLE IF NOT EXISTS public.knowledge_answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id           UUID REFERENCES public.knowledge_queries(id) ON DELETE SET NULL,
  user_id            UUID REFERENCES auth.users(id),
  answer             TEXT NOT NULL,
  documents_used     TEXT[] DEFAULT '{}',
  confidence         REAL DEFAULT 0,
  model              TEXT DEFAULT '',
  tokens_used        INTEGER DEFAULT 0,
  feedback_count     INTEGER NOT NULL DEFAULT 0,
  avg_feedback_score REAL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_answers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_answers_query ON public.knowledge_answers(query_id);

CREATE TABLE IF NOT EXISTS public.knowledge_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id       UUID NOT NULL REFERENCES public.knowledge_answers(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  feedback_type   knowledge_feedback_type NOT NULL DEFAULT 'helpful',
  comment         TEXT DEFAULT '',
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_answer ON public.knowledge_feedback(answer_id);

-- ================================================================
-- INGESTION JOBS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_ingestion_jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id             UUID REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  status                knowledge_job_status NOT NULL DEFAULT 'pending',
  job_type              TEXT NOT NULL DEFAULT 'batch_ingest',
  documents_processed   INTEGER NOT NULL DEFAULT 0,
  documents_total       INTEGER NOT NULL DEFAULT 0,
  chunks_created        INTEGER NOT NULL DEFAULT 0,
  embeddings_generated  INTEGER NOT NULL DEFAULT 0,
  error_count           INTEGER NOT NULL DEFAULT 0,
  errors                JSONB DEFAULT '[]'::jsonb,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_jobs_status ON public.knowledge_ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_jobs_created ON public.knowledge_ingestion_jobs(created_at);

-- ================================================================
-- APPROVALS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  version_number  INTEGER DEFAULT 1,
  status          knowledge_approval_status NOT NULL DEFAULT 'pending',
  requested_by    UUID REFERENCES auth.users(id),
  reviewed_by     UUID REFERENCES auth.users(id),
  review_notes    TEXT DEFAULT '',
  requested_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at     TIMESTAMPTZ
);

ALTER TABLE public.knowledge_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_approvals_document ON public.knowledge_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_approvals_status ON public.knowledge_approvals(status);

-- ================================================================
-- GAPS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_type            knowledge_gap_type NOT NULL DEFAULT 'user_request',
  title               TEXT NOT NULL,
  description         TEXT DEFAULT '',
  related_query       TEXT DEFAULT '',
  related_documents   TEXT[] DEFAULT '{}',
  suggested_content   TEXT DEFAULT '',
  priority            INTEGER NOT NULL DEFAULT 5,
  status              knowledge_status NOT NULL DEFAULT 'draft',
  assigned_to         UUID REFERENCES auth.users(id),
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON public.knowledge_gaps(status);

-- ================================================================
-- SETTINGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL DEFAULT '{}'::jsonb,
  description     TEXT DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'general',
  updated_by      UUID REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.knowledge_settings (key, value, description, category) VALUES
  ('rag', '{"max_results": 5, "max_context_tokens": 4000, "threshold": 0.3}'::jsonb, 'Configuración de RAG', 'rag'),
  ('embeddings', '{"model": "text-embedding-ada-002", "chunk_size": 1000}'::jsonb, 'Configuración de embeddings', 'embeddings'),
  ('model', '{"default": "gemini-2.0-flash", "fallback": "gpt-4o-mini"}'::jsonb, 'Modelos de generación', 'ai')
ON CONFLICT (key) DO NOTHING;

-- ================================================================
-- AUDIT LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID REFERENCES auth.users(id),
  actor_email     TEXT DEFAULT '',
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  resource_title  TEXT DEFAULT '',
  previous_value  JSONB,
  new_value       JSONB,
  ip_address      TEXT DEFAULT '',
  user_agent      TEXT DEFAULT '',
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_audit_created ON public.knowledge_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_audit_resource ON public.knowledge_audit_logs(resource_type, resource_id);

-- ================================================================
-- RPC: search_knowledge_chunks (fallback sin pgvector)
-- El motor de búsqueda lo invoca cuando hay embedding; con este
-- fallback nunca devuelve error y funciona sin la extensión vector.
-- ================================================================
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  query_embedding REAL[] DEFAULT NULL,
  match_count INTEGER DEFAULT 10,
  match_threshold REAL DEFAULT 0.5
)
RETURNS TABLE(chunk_id UUID, document_id UUID, chunk_index INTEGER, content TEXT, heading TEXT, similarity REAL)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id::uuid, c.document_id::uuid, c.chunk_index::integer, c.content::text, c.heading::text, 1.0::real
  FROM public.knowledge_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  WHERE d.status = 'published'
  ORDER BY c.created_at DESC
  LIMIT GREATEST(1, match_count);
END;
$$;

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- DOCUMENTS
CREATE POLICY "knowledge_documents_select" ON public.knowledge_documents
  FOR SELECT USING (status = 'published' OR is_knowledge_admin() OR created_by = auth.uid());

CREATE POLICY "knowledge_documents_insert_auth" ON public.knowledge_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "knowledge_documents_update" ON public.knowledge_documents
  FOR UPDATE USING (is_knowledge_admin() OR created_by = auth.uid());

CREATE POLICY "knowledge_documents_delete_admin" ON public.knowledge_documents
  FOR DELETE USING (is_knowledge_admin());

-- CHUNKS
CREATE POLICY "knowledge_chunks_select" ON public.knowledge_chunks
  FOR SELECT USING (is_knowledge_admin() OR EXISTS (
    SELECT 1 FROM public.knowledge_documents d
    WHERE d.id = document_id AND (d.status = 'published' OR d.created_by = auth.uid())
  ));

CREATE POLICY "knowledge_chunks_insert_admin" ON public.knowledge_chunks
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_chunks_update_admin" ON public.knowledge_chunks
  FOR UPDATE USING (is_knowledge_admin());

CREATE POLICY "knowledge_chunks_delete_admin" ON public.knowledge_chunks
  FOR DELETE USING (is_knowledge_admin());

-- SOURCES
CREATE POLICY "knowledge_sources_select" ON public.knowledge_sources
  FOR SELECT USING (true);

CREATE POLICY "knowledge_sources_insert_admin" ON public.knowledge_sources
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_sources_update_admin" ON public.knowledge_sources
  FOR UPDATE USING (is_knowledge_admin());

CREATE POLICY "knowledge_sources_delete_admin" ON public.knowledge_sources
  FOR DELETE USING (is_knowledge_admin());

-- TAGS
CREATE POLICY "knowledge_tags_select" ON public.knowledge_tags
  FOR SELECT USING (true);

CREATE POLICY "knowledge_tags_insert_admin" ON public.knowledge_tags
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_tags_update_admin" ON public.knowledge_tags
  FOR UPDATE USING (is_knowledge_admin());

CREATE POLICY "knowledge_tags_delete_admin" ON public.knowledge_tags
  FOR DELETE USING (is_knowledge_admin());

-- DOCUMENT TAGS
CREATE POLICY "knowledge_document_tags_select" ON public.knowledge_document_tags
  FOR SELECT USING (true);

CREATE POLICY "knowledge_document_tags_insert_admin" ON public.knowledge_document_tags
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_document_tags_delete_admin" ON public.knowledge_document_tags
  FOR DELETE USING (is_knowledge_admin());

-- VERSIONS
CREATE POLICY "knowledge_versions_select" ON public.knowledge_versions
  FOR SELECT USING (is_knowledge_admin() OR EXISTS (
    SELECT 1 FROM public.knowledge_documents d
    WHERE d.id = document_id AND (d.status = 'published' OR d.created_by = auth.uid())
  ));

CREATE POLICY "knowledge_versions_insert_admin" ON public.knowledge_versions
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_versions_delete_admin" ON public.knowledge_versions
  FOR DELETE USING (is_knowledge_admin());

-- PERMISSIONS
CREATE POLICY "knowledge_permissions_select" ON public.knowledge_permissions
  FOR SELECT USING (is_knowledge_admin() OR EXISTS (
    SELECT 1 FROM public.knowledge_documents d
    WHERE d.id = document_id AND d.created_by = auth.uid()
  ));

CREATE POLICY "knowledge_permissions_insert_admin" ON public.knowledge_permissions
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_permissions_update_admin" ON public.knowledge_permissions
  FOR UPDATE USING (is_knowledge_admin());

CREATE POLICY "knowledge_permissions_delete_admin" ON public.knowledge_permissions
  FOR DELETE USING (is_knowledge_admin());

-- QUERIES
CREATE POLICY "knowledge_queries_select" ON public.knowledge_queries
  FOR SELECT USING (user_id = auth.uid() OR is_knowledge_admin());

CREATE POLICY "knowledge_queries_insert_auth" ON public.knowledge_queries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ANSWERS
CREATE POLICY "knowledge_answers_select" ON public.knowledge_answers
  FOR SELECT USING (user_id = auth.uid() OR is_knowledge_admin());

CREATE POLICY "knowledge_answers_insert_auth" ON public.knowledge_answers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- FEEDBACK
CREATE POLICY "knowledge_feedback_select" ON public.knowledge_feedback
  FOR SELECT USING (user_id = auth.uid() OR is_knowledge_admin());

CREATE POLICY "knowledge_feedback_insert_auth" ON public.knowledge_feedback
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- INGESTION JOBS
CREATE POLICY "knowledge_jobs_select" ON public.knowledge_ingestion_jobs
  FOR SELECT USING (created_by = auth.uid() OR is_knowledge_admin());

CREATE POLICY "knowledge_jobs_insert_admin" ON public.knowledge_ingestion_jobs
  FOR INSERT WITH CHECK (is_knowledge_admin());

CREATE POLICY "knowledge_jobs_update_admin" ON public.knowledge_ingestion_jobs
  FOR UPDATE USING (is_knowledge_admin());

-- APPROVALS
CREATE POLICY "knowledge_approvals_select_admin" ON public.knowledge_approvals
  FOR SELECT USING (is_knowledge_admin());

CREATE POLICY "knowledge_approvals_insert_auth" ON public.knowledge_approvals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "knowledge_approvals_update_admin" ON public.knowledge_approvals
  FOR UPDATE USING (is_knowledge_admin());

-- GAPS
CREATE POLICY "knowledge_gaps_select_admin" ON public.knowledge_gaps
  FOR SELECT USING (is_knowledge_admin());

CREATE POLICY "knowledge_gaps_insert_auth" ON public.knowledge_gaps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "knowledge_gaps_update_admin" ON public.knowledge_gaps
  FOR UPDATE USING (is_knowledge_admin());

-- SETTINGS
CREATE POLICY "knowledge_settings_select" ON public.knowledge_settings
  FOR SELECT USING (true);

CREATE POLICY "knowledge_settings_update_admin" ON public.knowledge_settings
  FOR UPDATE USING (is_knowledge_admin());

-- AUDIT LOGS
CREATE POLICY "knowledge_audit_select_admin" ON public.knowledge_audit_logs
  FOR SELECT USING (is_knowledge_admin());

CREATE POLICY "knowledge_audit_insert_auth" ON public.knowledge_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
