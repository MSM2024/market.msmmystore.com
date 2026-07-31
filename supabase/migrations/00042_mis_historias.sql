-- ================================================================
-- MIGRATION 00042: MIS HISTORIAS — Stories Module
-- ================================================================
-- Complete stories system with media, people, tags, versions,
-- privacy levels, RLS, and audit trail.
-- ================================================================

-- 1. STORIES MAIN TABLE
CREATE TABLE IF NOT EXISTS public.stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  content         TEXT NOT NULL DEFAULT '',
  summary         TEXT DEFAULT '',
  category        TEXT DEFAULT 'general',
  privacy         TEXT NOT NULL DEFAULT 'solo_yo' CHECK (privacy IN ('solo_yo','familia','equipo','comunidad','publica')),
  status          TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador','publicada','archivada')),
  event_date      DATE,
  location        TEXT DEFAULT '',
  cover_media_id  UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at    TIMESTAMPTZ
);

-- 2. STORY MEDIA (photos, videos, audio)
CREATE TABLE IF NOT EXISTS public.story_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type      TEXT NOT NULL CHECK (media_type IN ('image','video','audio','document')),
  url             TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  filename        TEXT NOT NULL,
  mime_type       TEXT DEFAULT '',
  size_bytes      BIGINT DEFAULT 0,
  width           INT,
  height          INT,
  duration_secs   INT,
  caption         TEXT DEFAULT '',
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STORY PEOPLE (related people)
CREATE TABLE IF NOT EXISTS public.story_people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  relationship    TEXT DEFAULT '',
  birth_date      DATE,
  role            TEXT DEFAULT 'participant' CHECK (role IN ('participant','witness','author','family','friend')),
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STORY TAGS
CREATE TABLE IF NOT EXISTS public.story_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  tag             TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (story_id, tag)
);

-- 5. STORY VERSIONS (audit trail for edits)
CREATE TABLE IF NOT EXISTS public.story_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  summary         TEXT DEFAULT '',
  status          TEXT NOT NULL,
  privacy         TEXT NOT NULL,
  edited_by       UUID NOT NULL REFERENCES auth.users(id),
  edit_summary    TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_stories_owner_id ON public.stories (owner_id);
CREATE INDEX IF NOT EXISTS idx_stories_slug ON public.stories (slug);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories (status);
CREATE INDEX IF NOT EXISTS idx_stories_privacy ON public.stories (privacy);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories (category);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON public.stories (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_media_story_id ON public.story_media (story_id);
CREATE INDEX IF NOT EXISTS idx_story_people_story_id ON public.story_people (story_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_story_id ON public.story_tags (story_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_tag ON public.story_tags (tag);
CREATE INDEX IF NOT EXISTS idx_story_versions_story_id ON public.story_versions (story_id);

-- 7. ROW LEVEL SECURITY
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_versions ENABLE ROW LEVEL SECURITY;

-- 7a. STORIES RLS
DROP POLICY IF EXISTS "stories_select_own" ON public.stories;
CREATE POLICY "stories_select_own"
  ON public.stories FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (status = 'publicada' AND privacy = 'publica')
    OR (status = 'publicada' AND privacy = 'comunidad')
    OR (status = 'publicada' AND privacy = 'equipo' AND public.is_admin_or_superadmin())
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "stories_insert_own" ON public.stories;
CREATE POLICY "stories_insert_own"
  ON public.stories FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "stories_update_own" ON public.stories;
CREATE POLICY "stories_update_own"
  ON public.stories FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "stories_delete_own" ON public.stories;
CREATE POLICY "stories_delete_own"
  ON public.stories FOR DELETE
  USING (owner_id = auth.uid());

-- 7b. STORY MEDIA RLS
DROP POLICY IF EXISTS "story_media_select" ON public.story_media;
CREATE POLICY "story_media_select"
  ON public.story_media FOR SELECT
  USING (
    owner_id = auth.uid()
    OR story_id IN (SELECT id FROM public.stories WHERE status = 'publicada' AND privacy IN ('publica','comunidad'))
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "story_media_insert_own" ON public.story_media;
CREATE POLICY "story_media_insert_own"
  ON public.story_media FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "story_media_update_own" ON public.story_media;
CREATE POLICY "story_media_update_own"
  ON public.story_media FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "story_media_delete_own" ON public.story_media;
CREATE POLICY "story_media_delete_own"
  ON public.story_media FOR DELETE
  USING (owner_id = auth.uid());

-- 7c. STORY PEOPLE RLS
DROP POLICY IF EXISTS "story_people_select" ON public.story_people;
CREATE POLICY "story_people_select"
  ON public.story_people FOR SELECT
  USING (
    story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid() OR status = 'publicada')
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "story_people_insert_own" ON public.story_people;
CREATE POLICY "story_people_insert_own"
  ON public.story_people FOR INSERT
  WITH CHECK (story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "story_people_update_own" ON public.story_people;
CREATE POLICY "story_people_update_own"
  ON public.story_people FOR UPDATE
  USING (story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "story_people_delete_own" ON public.story_people;
CREATE POLICY "story_people_delete_own"
  ON public.story_people FOR DELETE
  USING (story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid()));

-- 7d. STORY TAGS RLS
DROP POLICY IF EXISTS "story_tags_select" ON public.story_tags;
CREATE POLICY "story_tags_select"
  ON public.story_tags FOR SELECT
  USING (
    story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid() OR status = 'publicada')
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "story_tags_insert_own" ON public.story_tags;
CREATE POLICY "story_tags_insert_own"
  ON public.story_tags FOR INSERT
  WITH CHECK (story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "story_tags_delete_own" ON public.story_tags;
CREATE POLICY "story_tags_delete_own"
  ON public.story_tags FOR DELETE
  USING (story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid()));

-- 7e. STORY VERSIONS RLS
DROP POLICY IF EXISTS "story_versions_select" ON public.story_versions;
CREATE POLICY "story_versions_select"
  ON public.story_versions FOR SELECT
  USING (
    story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid())
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "story_versions_insert" ON public.story_versions;
CREATE POLICY "story_versions_insert"
  ON public.story_versions FOR INSERT
  WITH CHECK (story_id IN (SELECT id FROM public.stories WHERE owner_id = auth.uid()));

-- 8. TRIGGER: auto-update updated_at on stories
DROP TRIGGER IF EXISTS trg_stories_updated_at ON public.stories;
CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. TRIGGER: save version on story update
CREATE OR REPLACE FUNCTION public.save_story_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title OR OLD.status IS DISTINCT FROM NEW.status OR OLD.privacy IS DISTINCT FROM NEW.privacy THEN
    INSERT INTO public.story_versions (story_id, title, content, summary, status, privacy, edited_by)
    VALUES (NEW.id, OLD.title, OLD.content, OLD.summary, OLD.status, OLD.privacy, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_story_version ON public.stories;
CREATE TRIGGER trg_story_version
  AFTER UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.save_story_version();

-- 10. AUTO GENERATE SLUG function
CREATE OR REPLACE FUNCTION public.generate_story_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9áéíóúñü ]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTR(NEW.id::TEXT, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_story_slug ON public.stories;
CREATE TRIGGER trg_story_slug
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.generate_story_slug();

-- MIGRATION COMPLETE
