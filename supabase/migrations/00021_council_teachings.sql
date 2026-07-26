-- ================================================================
-- 00021 — CONSEJO INVISIBLE: Enseñanzas
-- Cada enseñanza conecta con una fuente, un guía y temas
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invisible_council_teachings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  summary                 TEXT DEFAULT '',
  full_content            TEXT DEFAULT '',
  guide_id                UUID REFERENCES public.invisible_council_guides(id),
  source_id               UUID REFERENCES public.invisible_council_sources(id),
  themes                  TEXT[] DEFAULT '{}',
  biblical_references     JSONB DEFAULT '[]'::jsonb,
  practical_application   TEXT DEFAULT '',
  questions               JSONB DEFAULT '[]'::jsonb,
  personal_interpretation TEXT DEFAULT '',
  ai_summary              TEXT DEFAULT '',
  owner_notes             TEXT DEFAULT '',
  verification_status     verification_status NOT NULL DEFAULT 'unverified',
  visibility              content_visibility NOT NULL DEFAULT 'private',
  approved_at             TIMESTAMPTZ,
  approved_by             UUID REFERENCES auth.users(id),
  created_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_teachings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_teachings_guide ON public.invisible_council_teachings(guide_id);
CREATE INDEX idx_council_teachings_source ON public.invisible_council_teachings(source_id);
CREATE INDEX idx_council_teachings_themes ON public.invisible_council_teachings USING GIN(themes);
CREATE INDEX idx_council_teachings_verification ON public.invisible_council_teachings(verification_status);
CREATE INDEX idx_council_teachings_deleted ON public.invisible_council_teachings(deleted_at) WHERE deleted_at IS NULL;
