-- ================================================================
-- 00017 — CONSEJO INVISIBLE: Tabla de Guías
-- Los 22 guías espirituales del Consejo Invisible
-- ================================================================

CREATE TYPE guide_category AS ENUM (
  'biblical',
  'spiritual',
  'philosopher',
  'inventor',
  'scientist',
  'entrepreneur',
  'writer',
  'leader',
  'family',
  'personal_identity',
  'other'
);

CREATE TYPE guide_status AS ENUM (
  'draft',
  'pending_confirmation',
  'confirmed',
  'active',
  'archived'
);

CREATE TYPE content_visibility AS ENUM (
  'private',
  'trusted_circle',
  'family',
  'team',
  'members',
  'public'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_guides (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name        TEXT NOT NULL DEFAULT 'Pendiente de confirmar',
  slug                TEXT UNIQUE NOT NULL,
  guide_number        INTEGER NOT NULL CHECK (guide_number BETWEEN 1 AND 22),
  category            guide_category NOT NULL DEFAULT 'other',
  short_description   TEXT DEFAULT '',
  biography_summary   TEXT DEFAULT '',
  verified_sources    JSONB DEFAULT '[]'::jsonb,
  principal_teachings JSONB DEFAULT '[]'::jsonb,
  quotes              JSONB DEFAULT '[]'::jsonb,
  books               JSONB DEFAULT '[]'::jsonb,
  audio_fragments     JSONB DEFAULT '[]'::jsonb,
  transcript_fragments JSONB DEFAULT '[]'::jsonb,
  themes              TEXT[] DEFAULT '{}',
  personal_notes      TEXT DEFAULT '',
  relationship_to_miguel TEXT DEFAULT '',
  status              guide_status NOT NULL DEFAULT 'pending_confirmation',
  visibility          content_visibility NOT NULL DEFAULT 'private',
  is_confirmed        BOOLEAN NOT NULL DEFAULT false,
  created_by          UUID REFERENCES auth.users(id),
  approved_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guide_number)
);

ALTER TABLE public.invisible_council_guides ENABLE ROW LEVEL SECURITY;

-- Índices para búsquedas frecuentes
CREATE INDEX idx_council_guides_number ON public.invisible_council_guides(guide_number);
CREATE INDEX idx_council_guides_status ON public.invisible_council_guides(status);
CREATE INDEX idx_council_guides_category ON public.invisible_council_guides(category);
CREATE INDEX idx_council_guides_slug ON public.invisible_council_guides(slug);

-- Seed: Crear los 22 espacios pendientes de confirmar
INSERT INTO public.invisible_council_guides (display_name, slug, guide_number, category, status, visibility, is_confirmed)
SELECT
  'Guía ' || LPAD(n::text, 2, '0') || ' — Pendiente de confirmar',
  'guia-' || LPAD(n::text, 2, '0'),
  n,
  'other'::guide_category,
  'pending_confirmation'::guide_status,
  'private'::content_visibility,
  false
FROM generate_series(1, 22) AS n
ON CONFLICT (guide_number) DO NOTHING;
