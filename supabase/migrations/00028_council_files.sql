-- ================================================================
-- 00028 — CONSEJO INVISIBLE: Gestión de Archivos
-- Archivos privados con URLs firmadas temporales
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invisible_council_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name           TEXT NOT NULL,
  original_name       TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL DEFAULT 0,
  mime_type            TEXT NOT NULL,
  file_category       TEXT NOT NULL DEFAULT 'document', -- 'audio', 'image', 'document', 'transcript'
  content_type        TEXT, -- 'teaching', 'guide', 'session', 'book', 'journal', 'prayer'
  content_id          UUID,
  uploaded_by         UUID REFERENCES auth.users(id),
  visibility          content_visibility NOT NULL DEFAULT 'private',
  version             INTEGER NOT NULL DEFAULT 1,
  checksum            TEXT DEFAULT '',
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_files ENABLE ROW LEVEL SECURITY;

-- Tabla de versiones de archivos
CREATE TABLE IF NOT EXISTS public.invisible_council_versions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id             UUID REFERENCES public.invisible_council_files(id) ON DELETE CASCADE,
  version_number      INTEGER NOT NULL,
  file_path           TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL DEFAULT 0,
  checksum            TEXT DEFAULT '',
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(file_id, version_number)
);

ALTER TABLE public.invisible_council_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_files_content ON public.invisible_council_files(content_type, content_id);
CREATE INDEX idx_council_files_uploaded ON public.invisible_council_files(uploaded_by);
CREATE INDEX idx_council_files_category ON public.invisible_council_files(file_category);
CREATE INDEX idx_council_versions_file ON public.invisible_council_versions(file_id);
