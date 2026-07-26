-- ================================================================
-- 00023 — CONSEJO INVISIBLE: Libros
-- Constructor de libros desde sesiones, enseñanzas y recuerdos
-- ================================================================

CREATE TYPE book_status AS ENUM (
  'idea',
  'outline',
  'draft',
  'review',
  'approved',
  'published',
  'archived'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_books (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL DEFAULT 'Libro sin título',
  subtitle            TEXT DEFAULT '',
  purpose             TEXT DEFAULT '',
  target_reader       TEXT DEFAULT '',
  status              book_status NOT NULL DEFAULT 'idea',
  visibility          content_visibility NOT NULL DEFAULT 'private',
  created_by          UUID REFERENCES auth.users(id),
  approved_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_books ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invisible_council_book_chapters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id             UUID REFERENCES public.invisible_council_books(id) ON DELETE CASCADE,
  chapter_number      INTEGER NOT NULL,
  title               TEXT NOT NULL DEFAULT 'Capítulo sin título',
  summary             TEXT DEFAULT '',
  content             TEXT DEFAULT '',
  status              book_status NOT NULL DEFAULT 'idea',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

ALTER TABLE public.invisible_council_book_chapters ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invisible_council_book_sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id          UUID REFERENCES public.invisible_council_book_chapters(id) ON DELETE CASCADE,
  section_number      INTEGER NOT NULL,
  title               TEXT NOT NULL DEFAULT '',
  content             TEXT DEFAULT '',
  source_type         TEXT DEFAULT '',
  source_id           UUID,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chapter_id, section_number)
);

ALTER TABLE public.invisible_council_book_sections ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_books_status ON public.invisible_council_books(status);
CREATE INDEX idx_council_books_created ON public.invisible_council_books(created_by);
CREATE INDEX idx_council_book_chapters_book ON public.invisible_council_book_chapters(book_id);
CREATE INDEX idx_council_book_sections_chapter ON public.invisible_council_book_sections(chapter_id);
