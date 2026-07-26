-- ================================================================
-- 00019 — CONSEJO INVISIBLE: Archivos de Audio
-- Biblioteca privada de audios
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invisible_council_audio_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT DEFAULT '',
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL DEFAULT 0,
  mime_type            TEXT NOT NULL,
  duration_ms         INTEGER DEFAULT 0,
  language            TEXT DEFAULT 'es',
  version             INTEGER NOT NULL DEFAULT 1,
  uploaded_by         UUID REFERENCES auth.users(id),
  visibility          content_visibility NOT NULL DEFAULT 'private',
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_audio_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_audio_uploaded ON public.invisible_council_audio_files(uploaded_by);
CREATE INDEX idx_council_audio_visibility ON public.invisible_council_audio_files(visibility);
CREATE INDEX idx_council_audio_deleted ON public.invisible_council_audio_files(deleted_at) WHERE deleted_at IS NULL;
