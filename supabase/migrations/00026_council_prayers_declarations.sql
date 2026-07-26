-- ================================================================
-- 00026 — CONSEJO INVISIBLE: Oraciones y Declaraciones
-- Dos bibliotecas separadas: Oraciones y Declaraciones
-- ================================================================

CREATE TYPE prayer_declaration_type AS ENUM (
  'prayer',
  'declaration'
);

CREATE TYPE prayer_declaration_status AS ENUM (
  'draft',
  'reviewed',
  'approved',
  'archived'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_prayers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  type                prayer_declaration_type NOT NULL DEFAULT 'prayer',
  content             TEXT NOT NULL,
  biblical_references JSONB DEFAULT '[]'::jsonb,
  author              TEXT DEFAULT '',
  source              TEXT DEFAULT '',
  status              prayer_declaration_status NOT NULL DEFAULT 'draft',
  visibility          content_visibility NOT NULL DEFAULT 'private',
  approved_by         UUID REFERENCES auth.users(id),
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_prayers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_prayers_type ON public.invisible_council_prayers(type);
CREATE INDEX idx_council_prayers_status ON public.invisible_council_prayers(status);
CREATE INDEX idx_council_prayers_created ON public.invisible_council_prayers(created_by);

-- Oración predeterminada "DIOS DELANTE"
INSERT INTO public.invisible_council_prayers (title, type, content, status, visibility, biblical_references)
VALUES (
  'Oración de Apertura — Modo Dios Delante',
  'prayer',
  'Padre amado, pongo esta sesión delante de Ti.
Dame sabiduría, entendimiento, paz y discernimiento.
Ayúdame a examinar cada enseñanza y retener lo bueno.
Guía mis pensamientos, mis decisiones y mis acciones.
En el nombre de Jesús. Amén.',
  'approved',
  'members',
  '["Proverbios 2:6", "Santiago 1:5", "1 Tesalonicenses 5:21", "Proverbios 3:5-6", "Habacuc 2:2"]'::jsonb
) ON CONFLICT DO NOTHING;
