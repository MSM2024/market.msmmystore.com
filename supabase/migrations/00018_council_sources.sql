-- ================================================================
-- 00018 — CONSEJO INVISIBLE: Fuentes del Conocimiento
-- Cada enseñanza debe indicar su fuente
-- ================================================================

CREATE TYPE source_type AS ENUM (
  'audio_original',
  'transcript',
  'book',
  'bible',
  'personal_memory',
  'personal_note',
  'video',
  'interview',
  'document',
  'family_testimony',
  'web_source',
  'ai_generated_draft'
);

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'partially_verified',
  'verified',
  'owner_confirmed',
  'rejected'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_title        TEXT NOT NULL,
  source_type         source_type NOT NULL,
  author              TEXT DEFAULT '',
  source_reference    TEXT DEFAULT '',
  file_id             UUID,
  page                INTEGER,
  chapter             INTEGER,
  timestamp_start_ms  INTEGER,
  timestamp_end_ms    INTEGER,
  language            TEXT DEFAULT 'es',
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  approved_by         UUID REFERENCES auth.users(id),
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invisible_council_sources ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_sources_type ON public.invisible_council_sources(source_type);
CREATE INDEX idx_council_sources_verification ON public.invisible_council_sources(verification_status);
CREATE INDEX idx_council_sources_created_by ON public.invisible_council_sources(created_by);
