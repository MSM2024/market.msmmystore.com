-- BIBLIOTECA PRIVADA: restringir todo el acceso RLS a OWNER / SUPERADMIN
-- 2026-07-31 — Retiro de la Biblioteca Viva del área pública de ZAFIRO.
-- Sustituye todas las políticas de 00044: se eliminan los SELECT públicos
-- (privacy 'publico'/'comunidad', *_select_all) y los INSERT/UPDATE de 'admin'.
-- Tras esta migración, SOLO los roles 'owner' y 'superadmin' leen o escriben
-- en las tablas library_*. 'admin' deja de tener acceso (la instrucción es
-- mantener el conocimiento de Don Miguel únicamente para OWNER_SUPERADMIN).

-- ============================================================================
-- DROP de políticas de 00044
-- ============================================================================

DROP POLICY IF EXISTS "sources_select_owner_admin" ON library_sources;
DROP POLICY IF EXISTS "sources_insert_admin" ON library_sources;
DROP POLICY IF EXISTS "sources_update_admin" ON library_sources;

DROP POLICY IF EXISTS "books_select_privacy" ON library_books;
DROP POLICY IF EXISTS "books_insert_admin" ON library_books;
DROP POLICY IF EXISTS "books_update_admin" ON library_books;
DROP POLICY IF EXISTS "books_delete_owner" ON library_books;

DROP POLICY IF EXISTS "versions_select_owner_admin" ON library_versions;
DROP POLICY IF EXISTS "versions_insert_admin" ON library_versions;

DROP POLICY IF EXISTS "chapters_select_privacy" ON library_chapters;
DROP POLICY IF EXISTS "chapters_insert_admin" ON library_chapters;
DROP POLICY IF EXISTS "chapters_update_admin" ON library_chapters;

DROP POLICY IF EXISTS "chunks_select_privacy" ON library_chunks;
DROP POLICY IF EXISTS "chunks_insert_admin" ON library_chunks;

DROP POLICY IF EXISTS "people_select_all" ON library_people;
DROP POLICY IF EXISTS "people_insert_admin" ON library_people;
DROP POLICY IF EXISTS "people_update_admin" ON library_people;

DROP POLICY IF EXISTS "places_select_all" ON library_places;
DROP POLICY IF EXISTS "places_insert_admin" ON library_places;
DROP POLICY IF EXISTS "places_update_admin" ON library_places;

DROP POLICY IF EXISTS "topics_select_all" ON library_topics;
DROP POLICY IF EXISTS "topics_insert_admin" ON library_topics;
DROP POLICY IF EXISTS "topics_update_admin" ON library_topics;

DROP POLICY IF EXISTS "book_people_select" ON library_book_people;
DROP POLICY IF EXISTS "book_people_insert_admin" ON library_book_people;

DROP POLICY IF EXISTS "book_places_select" ON library_book_places;
DROP POLICY IF EXISTS "book_places_insert_admin" ON library_book_places;

DROP POLICY IF EXISTS "book_topics_select" ON library_book_topics;
DROP POLICY IF EXISTS "book_topics_insert_admin" ON library_book_topics;

DROP POLICY IF EXISTS "relationships_select" ON library_relationships;
DROP POLICY IF EXISTS "relationships_insert_admin" ON library_relationships;

DROP POLICY IF EXISTS "import_jobs_select_admin" ON library_import_jobs;
DROP POLICY IF EXISTS "import_jobs_insert_admin" ON library_import_jobs;
DROP POLICY IF EXISTS "import_jobs_update_admin" ON library_import_jobs;

DROP POLICY IF EXISTS "approvals_select_admin" ON library_approvals;
DROP POLICY IF EXISTS "approvals_insert_admin" ON library_approvals;
DROP POLICY IF EXISTS "approvals_update_owner" ON library_approvals;

DROP POLICY IF EXISTS "access_logs_select_admin" ON library_access_logs;

-- ============================================================================
-- Nuevas políticas: SOLO owner / superadmin
-- ============================================================================

-- library_sources
CREATE POLICY "sources_select_owner" ON library_sources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "sources_insert_owner" ON library_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "sources_update_owner" ON library_sources
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_books
CREATE POLICY "books_select_owner" ON library_books
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "books_insert_owner" ON library_books
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "books_update_owner" ON library_books
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "books_delete_owner" ON library_books
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_versions
CREATE POLICY "versions_select_owner" ON library_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "versions_insert_owner" ON library_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_chapters
CREATE POLICY "chapters_select_owner" ON library_chapters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "chapters_insert_owner" ON library_chapters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "chapters_update_owner" ON library_chapters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_chunks
CREATE POLICY "chunks_select_owner" ON library_chunks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "chunks_insert_owner" ON library_chunks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_people
CREATE POLICY "people_select_owner" ON library_people
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "people_insert_owner" ON library_people
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "people_update_owner" ON library_people
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_places
CREATE POLICY "places_select_owner" ON library_places
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "places_insert_owner" ON library_places
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "places_update_owner" ON library_places
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_topics
CREATE POLICY "topics_select_owner" ON library_topics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "topics_insert_owner" ON library_topics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "topics_update_owner" ON library_topics
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_book_people
CREATE POLICY "book_people_select_owner" ON library_book_people
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "book_people_insert_owner" ON library_book_people
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_book_places
CREATE POLICY "book_places_select_owner" ON library_book_places
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "book_places_insert_owner" ON library_book_places
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_book_topics
CREATE POLICY "book_topics_select_owner" ON library_book_topics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "book_topics_insert_owner" ON library_book_topics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_relationships
CREATE POLICY "relationships_select_owner" ON library_relationships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "relationships_insert_owner" ON library_relationships
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_import_jobs
CREATE POLICY "import_jobs_select_owner" ON library_import_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "import_jobs_insert_owner" ON library_import_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "import_jobs_update_owner" ON library_import_jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_approvals
CREATE POLICY "approvals_select_owner" ON library_approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "approvals_insert_owner" ON library_approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

CREATE POLICY "approvals_update_owner" ON library_approvals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );

-- library_access_logs
CREATE POLICY "access_logs_select_owner" ON library_access_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'superadmin'))
  );
