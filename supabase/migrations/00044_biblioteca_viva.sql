-- BIBLIOTECA VIVA DE DON MIGUEL
-- Catálogo maestro de obras creadas por Miguel Soria Martínez
-- Integración con Google Drive, RAG para ELIANA, control de versiones y privacidad

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE library_book_status AS ENUM (
  'descubierto', 'pendiente_revision', 'aprobado', 'importado', 'duplicado', 'excluido', 'error', 'actualizado'
);

CREATE TYPE library_privacy_level AS ENUM (
  'privado_don_miguel', 'familia', 'equipo_msm', 'interno_eliana', 'comunidad', 'publico', 'legado_futuro'
);

CREATE TYPE library_claim_type AS ENUM (
  'hecho_biografico', 'experiencia_personal', 'recuerdo', 'oracion', 'reflexion_espiritual',
  'interpretacion_biblica', 'sueno', 'simbolismo', 'hipotesis', 'idea_invento',
  'ficcion', 'proyecto', 'politica_empresarial', 'informacion_verificada', 'pendiente_confirmar'
);

CREATE TYPE library_import_job_status AS ENUM (
  'pending', 'scanning', 'scan_complete', 'importing', 'completed', 'failed', 'cancelled'
);

CREATE TYPE library_source_type AS ENUM (
  'google_drive', 'manual', 'upload', 'import'
);

-- ============================================================================
-- TABLE: library_sources
-- ============================================================================

CREATE TABLE library_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type library_source_type NOT NULL DEFAULT 'google_drive',
  drive_folder_id TEXT,
  drive_folder_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_sources_type ON library_sources(source_type);
CREATE INDEX idx_library_sources_sync_status ON library_sources(sync_status);

ALTER TABLE library_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sources_select_owner_admin" ON library_sources
  FOR SELECT USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sources_insert_admin" ON library_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sources_update_admin" ON library_sources
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- TABLE: library_books
-- ============================================================================

CREATE TABLE library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES library_sources(id) ON DELETE SET NULL,
  drive_file_id TEXT,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Miguel Soria Martínez',
  work_type TEXT,
  series TEXT,
  volume_number INT,
  language TEXT DEFAULT 'es',
  description TEXT,
  summary TEXT,
  cover_url TEXT,
  isbn TEXT,
  publisher TEXT,
  page_count INT,
  chapter_count INT,
  creation_date DATE,
  modification_date TIMESTAMPTZ,
  source_url TEXT,
  format TEXT,
  status library_book_status NOT NULL DEFAULT 'descubierto',
  privacy_level library_privacy_level NOT NULL DEFAULT 'interno_eliana',
  version INT NOT NULL DEFAULT 1,
  checksum TEXT,
  owner_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  import_decision TEXT,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_books_status ON library_books(status);
CREATE INDEX idx_library_books_privacy ON library_books(privacy_level);
CREATE INDEX idx_library_books_series ON library_books(series);
CREATE INDEX idx_library_books_normalized_title ON library_books(normalized_title);
CREATE INDEX idx_library_books_drive_file ON library_books(drive_file_id);
CREATE INDEX idx_library_books_checksum ON library_books(checksum);
CREATE INDEX idx_library_books_tags ON library_books USING GIN(tags);

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "books_select_privacy" ON library_books
  FOR SELECT USING (
    privacy_level = 'publico'
    OR privacy_level = 'comunidad'
    OR (privacy_level = 'interno_eliana' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')))
    OR (privacy_level IN ('equipo_msm') AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()))
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "books_insert_admin" ON library_books
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "books_update_admin" ON library_books
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "books_delete_owner" ON library_books
  FOR DELETE USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- ============================================================================
-- TABLE: library_versions
-- ============================================================================

CREATE TABLE library_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  checksum TEXT,
  changelog TEXT,
  file_size BIGINT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_versions_book ON library_versions(book_id);
CREATE UNIQUE INDEX idx_library_versions_unique ON library_versions(book_id, version_number);

ALTER TABLE library_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "versions_select_owner_admin" ON library_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM library_books WHERE id = book_id AND privacy_level IN ('publico', 'comunidad'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "versions_insert_admin" ON library_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- TABLE: library_chapters
-- ============================================================================

CREATE TABLE library_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT,
  summary TEXT,
  content_original TEXT,
  word_count INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_chapters_book ON library_chapters(book_id);
CREATE INDEX idx_library_chapters_number ON library_chapters(book_id, chapter_number);

ALTER TABLE library_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_select_privacy" ON library_chapters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM library_books WHERE id = book_id AND privacy_level IN ('publico', 'comunidad'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "chapters_insert_admin" ON library_chapters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "chapters_update_admin" ON library_chapters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- TABLE: library_chunks
-- ============================================================================

CREATE TABLE library_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES library_chapters(id) ON DELETE SET NULL,
  source_file_id TEXT,
  chunk_index INT NOT NULL,
  section TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(768),
  claim_type library_claim_type,
  main_concepts TEXT[] DEFAULT '{}',
  people_mentioned TEXT[] DEFAULT '{}',
  places_mentioned TEXT[] DEFAULT '{}',
  token_count INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_chunks_book ON library_chunks(book_id);
CREATE INDEX idx_library_chunks_chapter ON library_chunks(chapter_id);
CREATE INDEX idx_library_chunks_chunk_index ON library_chunks(book_id, chunk_index);
CREATE INDEX idx_library_chunks_claim_type ON library_chunks(claim_type);

ALTER TABLE library_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chunks_select_privacy" ON library_chunks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM library_books WHERE id = book_id AND privacy_level IN ('publico', 'comunidad'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "chunks_insert_admin" ON library_chunks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- TABLE: library_people
-- ============================================================================

CREATE TABLE library_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  biography TEXT,
  relationship_to_author TEXT,
  birth_date TEXT,
  death_date TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_library_people_normalized ON library_people(normalized_name);

ALTER TABLE library_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "people_select_all" ON library_people FOR SELECT USING (true);
CREATE POLICY "people_insert_admin" ON library_people FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "people_update_admin" ON library_people FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_places
-- ============================================================================

CREATE TABLE library_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  location_type TEXT,
  country TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_library_places_normalized ON library_places(normalized_name);

ALTER TABLE library_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_select_all" ON library_places FOR SELECT USING (true);
CREATE POLICY "places_insert_admin" ON library_places FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "places_update_admin" ON library_places FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_topics
-- ============================================================================

CREATE TABLE library_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_topic_id UUID REFERENCES library_topics(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#6366f1',
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_topics_slug ON library_topics(slug);
CREATE INDEX idx_library_topics_parent ON library_topics(parent_topic_id);

ALTER TABLE library_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics_select_all" ON library_topics FOR SELECT USING (true);
CREATE POLICY "topics_insert_admin" ON library_topics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "topics_update_admin" ON library_topics FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_book_people (M:N)
-- ============================================================================

CREATE TABLE library_book_people (
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES library_people(id) ON DELETE CASCADE,
  relevance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, person_id)
);

ALTER TABLE library_book_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_people_select" ON library_book_people FOR SELECT USING (true);
CREATE POLICY "book_people_insert_admin" ON library_book_people FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_book_places (M:N)
-- ============================================================================

CREATE TABLE library_book_places (
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES library_places(id) ON DELETE CASCADE,
  relevance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, place_id)
);

ALTER TABLE library_book_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_places_select" ON library_book_places FOR SELECT USING (true);
CREATE POLICY "book_places_insert_admin" ON library_book_places FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_book_topics (M:N)
-- ============================================================================

CREATE TABLE library_book_topics (
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES library_topics(id) ON DELETE CASCADE,
  relevance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, topic_id)
);

ALTER TABLE library_book_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_topics_select" ON library_book_topics FOR SELECT USING (true);
CREATE POLICY "book_topics_insert_admin" ON library_book_topics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_relationships (cross-work relationships)
-- ============================================================================

CREATE TABLE library_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  target_book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_relationships_source ON library_relationships(source_book_id);
CREATE INDEX idx_library_relationships_target ON library_relationships(target_book_id);

ALTER TABLE library_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relationships_select" ON library_relationships FOR SELECT USING (true);
CREATE POLICY "relationships_insert_admin" ON library_relationships FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================================
-- TABLE: library_import_jobs
-- ============================================================================

CREATE TABLE library_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES library_sources(id) ON DELETE SET NULL,
  status library_import_job_status NOT NULL DEFAULT 'pending',
  job_type TEXT NOT NULL DEFAULT 'scan',
  files_found INT DEFAULT 0,
  files_scanned INT DEFAULT 0,
  books_identified INT DEFAULT 0,
  duplicates_found INT DEFAULT 0,
  exclusions_applied INT DEFAULT 0,
  books_imported INT DEFAULT 0,
  chunks_created INT DEFAULT 0,
  embeddings_generated INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  error_count INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_import_jobs_status ON library_import_jobs(status);
CREATE INDEX idx_library_import_jobs_source ON library_import_jobs(source_id);

ALTER TABLE library_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_jobs_select_admin" ON library_import_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "import_jobs_insert_admin" ON library_import_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "import_jobs_update_admin" ON library_import_jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- TABLE: library_approvals
-- ============================================================================

CREATE TABLE library_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  version_number INT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_library_approvals_book ON library_approvals(book_id);
CREATE INDEX idx_library_approvals_status ON library_approvals(status);

ALTER TABLE library_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals_select_admin" ON library_approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "approvals_insert_admin" ON library_approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "approvals_update_owner" ON library_approvals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- ============================================================================
-- TABLE: library_access_logs
-- ============================================================================

CREATE TABLE library_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES library_books(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_title TEXT,
  previous_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_access_logs_book ON library_access_logs(book_id);
CREATE INDEX idx_library_access_logs_actor ON library_access_logs(actor_id);
CREATE INDEX idx_library_access_logs_action ON library_access_logs(action);
CREATE INDEX idx_library_access_logs_created ON library_access_logs(created_at);

ALTER TABLE library_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_logs_select_admin" ON library_access_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- TRIGGER: updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION library_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_library_sources_updated_at
  BEFORE UPDATE ON library_sources FOR EACH ROW EXECUTE FUNCTION library_update_timestamp();

CREATE TRIGGER trg_library_books_updated_at
  BEFORE UPDATE ON library_books FOR EACH ROW EXECUTE FUNCTION library_update_timestamp();

CREATE TRIGGER trg_library_chapters_updated_at
  BEFORE UPDATE ON library_chapters FOR EACH ROW EXECUTE FUNCTION library_update_timestamp();

CREATE TRIGGER trg_library_people_updated_at
  BEFORE UPDATE ON library_people FOR EACH ROW EXECUTE FUNCTION library_update_timestamp();

CREATE TRIGGER trg_library_places_updated_at
  BEFORE UPDATE ON library_places FOR EACH ROW EXECUTE FUNCTION library_update_timestamp();

-- ============================================================================
-- AUTO-CONFIRM: ensure Don Miguel gets confirmed if not
-- ============================================================================

CREATE OR REPLACE FUNCTION library_auto_confirm_don_miguel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'cm8msm@gmail.com' AND NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEARCH FUNCTION: vector search
-- ============================================================================

CREATE OR REPLACE FUNCTION search_library_chunks(
  query_embedding vector(768),
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.5,
  privacy_filter TEXT DEFAULT 'publico'
)
RETURNS TABLE (
  chunk_id UUID,
  book_id UUID,
  chapter_id UUID,
  chunk_index INT,
  content TEXT,
  claim_type TEXT,
  similarity FLOAT,
  book_title TEXT,
  privacy_level TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.id,
    lc.book_id,
    lc.chapter_id,
    lc.chunk_index,
    lc.content,
    lc.claim_type::TEXT,
    1 - (lc.embedding <=> query_embedding) AS similarity,
    lb.title,
    lb.privacy_level::TEXT
  FROM library_chunks lc
  JOIN library_books lb ON lb.id = lc.book_id
  WHERE lc.embedding IS NOT NULL
    AND 1 - (lc.embedding <=> query_embedding) > match_threshold
    AND (
      privacy_filter = 'publico' AND lb.privacy_level IN ('publico', 'comunidad')
      OR privacy_filter = 'interno'
      OR privacy_filter = 'all'
    )
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
