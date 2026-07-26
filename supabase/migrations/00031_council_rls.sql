-- ================================================================
-- 00031 — CONSEJO INVISIBLE: Políticas RLS
-- Row Level Security para todas las tablas del Consejo
-- ================================================================

-- ================================================================
-- GUIDES
-- ================================================================
CREATE POLICY "council_guides_select_owner" ON public.invisible_council_guides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_guides_select_members" ON public.invisible_council_guides
  FOR SELECT USING (
    visibility IN ('members', 'public') OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER', 'FAMILY_VIEWER', 'TRUSTED_VIEWER') AND revoked_at IS NULL)
  );

CREATE POLICY "council_guides_insert_editor" ON public.invisible_council_guides
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

CREATE POLICY "council_guides_update_editor" ON public.invisible_council_guides
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

CREATE POLICY "council_guides_delete_owner" ON public.invisible_council_guides
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- SOURCES
-- ================================================================
CREATE POLICY "council_sources_select_owner" ON public.invisible_council_sources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_sources_select_members" ON public.invisible_council_sources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
  );

CREATE POLICY "council_sources_insert_editor" ON public.invisible_council_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

CREATE POLICY "council_sources_update_editor" ON public.invisible_council_sources
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- AUDIO FILES
-- ================================================================
CREATE POLICY "council_audio_select_owner" ON public.invisible_council_audio_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_audio_select_members" ON public.invisible_council_audio_files
  FOR SELECT USING (
    deleted_at IS NULL AND (
      visibility IN ('members', 'public') OR
      EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
    )
  );

CREATE POLICY "council_audio_insert_editor" ON public.invisible_council_audio_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- TRANSCRIPTS
-- ================================================================
CREATE POLICY "council_transcripts_select_owner" ON public.invisible_council_transcripts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_transcripts_select_members" ON public.invisible_council_transcripts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
  );

CREATE POLICY "council_transcripts_insert_editor" ON public.invisible_council_transcripts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

CREATE POLICY "council_segments_select_owner" ON public.invisible_council_transcript_segments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_segments_select_members" ON public.invisible_council_transcript_segments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
  );

-- ================================================================
-- TEACHINGS
-- ================================================================
CREATE POLICY "council_teachings_select_owner" ON public.invisible_council_teachings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_teachings_select_members" ON public.invisible_council_teachings
  FOR SELECT USING (
    deleted_at IS NULL AND (
      visibility IN ('members', 'public') OR
      EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
    )
  );

CREATE POLICY "council_teachings_insert_editor" ON public.invisible_council_teachings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

CREATE POLICY "council_teachings_update_editor" ON public.invisible_council_teachings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- SESSIONS
-- ================================================================
CREATE POLICY "council_sessions_select_own" ON public.invisible_council_sessions
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_sessions_insert_auth" ON public.invisible_council_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
  );

CREATE POLICY "council_sessions_update_own" ON public.invisible_council_sessions
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- BOOKS
-- ================================================================
CREATE POLICY "council_books_select_own" ON public.invisible_council_books
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_books_insert_auth" ON public.invisible_council_books
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

CREATE POLICY "council_books_update_own" ON public.invisible_council_books
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- GOALS
-- ================================================================
CREATE POLICY "council_goals_select_own" ON public.invisible_council_goals
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_goals_insert_auth" ON public.invisible_council_goals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND revoked_at IS NULL)
  );

CREATE POLICY "council_goals_update_own" ON public.invisible_council_goals
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- JOURNAL
-- ================================================================
CREATE POLICY "council_journal_select_own" ON public.invisible_council_journal_entries
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_journal_insert_auth" ON public.invisible_council_journal_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND revoked_at IS NULL)
  );

CREATE POLICY "council_journal_update_own" ON public.invisible_council_journal_entries
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- PRAYERS
-- ================================================================
CREATE POLICY "council_prayers_select_members" ON public.invisible_council_prayers
  FOR SELECT USING (
    visibility IN ('members', 'public') OR
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_prayers_insert_auth" ON public.invisible_council_prayers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- COUNCIL ROLES
-- ================================================================
CREATE POLICY "council_roles_select_own" ON public.council_user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_roles_insert_owner" ON public.council_user_roles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_roles_update_owner" ON public.council_user_roles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- TAGS
-- ================================================================
CREATE POLICY "council_tags_select_all" ON public.invisible_council_tags
  FOR SELECT USING (true);

CREATE POLICY "council_tags_insert_editor" ON public.invisible_council_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- CONTENT TAGS
-- ================================================================
CREATE POLICY "council_content_tags_select_all" ON public.invisible_council_content_tags
  FOR SELECT USING (true);

CREATE POLICY "council_content_tags_insert_editor" ON public.invisible_council_content_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- FILES
-- ================================================================
CREATE POLICY "council_files_select_owner" ON public.invisible_council_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_files_select_members" ON public.invisible_council_files
  FOR SELECT USING (
    deleted_at IS NULL AND (
      visibility IN ('members', 'public') OR
      EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL)
    )
  );

CREATE POLICY "council_files_insert_editor" ON public.invisible_council_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );

-- ================================================================
-- PERMISSIONS
-- ================================================================
CREATE POLICY "council_permissions_select_own" ON public.invisible_council_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_permissions_insert_owner" ON public.invisible_council_permissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

-- ================================================================
-- AI INTERACTIONS
-- ================================================================
CREATE POLICY "council_ai_select_own" ON public.invisible_council_ai_interactions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_ai_insert_auth" ON public.invisible_council_ai_interactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND revoked_at IS NULL)
  );

-- ================================================================
-- SESSION GUIDES & SESSION TEACHINGS (junction tables)
-- ================================================================
CREATE POLICY "council_session_guides_select_own" ON public.invisible_council_session_guides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invisible_council_sessions WHERE id = session_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)))
  );

CREATE POLICY "council_session_guides_insert_own" ON public.invisible_council_session_guides
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invisible_council_sessions WHERE id = session_id AND created_by = auth.uid())
  );

CREATE POLICY "council_session_teachings_select_own" ON public.invisible_council_session_teachings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invisible_council_sessions WHERE id = session_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)))
  );

CREATE POLICY "council_session_teachings_insert_own" ON public.invisible_council_session_teachings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invisible_council_sessions WHERE id = session_id AND created_by = auth.uid())
  );

-- ================================================================
-- BOOK CHAPTERS & SECTIONS
-- ================================================================
CREATE POLICY "council_book_chapters_select_own" ON public.invisible_council_book_chapters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invisible_council_books WHERE id = book_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)))
  );

CREATE POLICY "council_book_chapters_insert_own" ON public.invisible_council_book_chapters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invisible_council_books WHERE id = book_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)))
  );

CREATE POLICY "council_book_sections_select_own" ON public.invisible_council_book_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invisible_council_book_chapters WHERE id = chapter_id AND EXISTS (SELECT 1 FROM public.invisible_council_books WHERE id = book_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL))))
  );

CREATE POLICY "council_book_sections_insert_own" ON public.invisible_council_book_sections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invisible_council_book_chapters WHERE id = chapter_id AND EXISTS (SELECT 1 FROM public.invisible_council_books WHERE id = book_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL))))
  );

-- ================================================================
-- GOAL UPDATES
-- ================================================================
CREATE POLICY "council_goal_updates_select_own" ON public.invisible_council_goal_updates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invisible_council_goals WHERE id = goal_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)))
  );

CREATE POLICY "council_goal_updates_insert_own" ON public.invisible_council_goal_updates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invisible_council_goals WHERE id = goal_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)))
  );

-- ================================================================
-- VERSIONS
-- ================================================================
CREATE POLICY "council_versions_select_owner" ON public.invisible_council_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "council_versions_insert_editor" ON public.invisible_council_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
  );
