-- ================================================================
-- 00022 — CONSEJO INVISIBLE: Sesiones del Consejo
-- Práctica guiada de reflexión basada en contenidos registrados
-- ================================================================

CREATE TYPE session_type AS ENUM (
  'oracion',
  'reflexion',
  'escritura',
  'metas',
  'negocios',
  'familia',
  'tecnologia',
  'proyecto',
  'salud',
  'discernimiento',
  'gratitud'
);

CREATE TYPE session_status AS ENUM (
  'draft',
  'in_progress',
  'completed',
  'reviewed',
  'archived'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_title       TEXT NOT NULL,
  purpose             TEXT DEFAULT '',
  question            TEXT DEFAULT '',
  session_type        session_type NOT NULL DEFAULT 'reflexion',
  opening_prayer      TEXT DEFAULT '',
  reflection          TEXT DEFAULT '',
  ideas               TEXT DEFAULT '',
  decision            TEXT DEFAULT '',
  action_plan         TEXT DEFAULT '',
  review_date         DATE,
  mood                TEXT DEFAULT '',
  privacy             content_visibility NOT NULL DEFAULT 'private',
  status              session_status NOT NULL DEFAULT 'draft',
  god_first_mode      BOOLEAN NOT NULL DEFAULT false,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_sessions ENABLE ROW LEVEL SECURITY;

-- Tabla de relación sesiones <-> guías
CREATE TABLE IF NOT EXISTS public.invisible_council_session_guides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES public.invisible_council_sessions(id) ON DELETE CASCADE,
  guide_id    UUID REFERENCES public.invisible_council_guides(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, guide_id)
);

ALTER TABLE public.invisible_council_session_guides ENABLE ROW LEVEL SECURITY;

-- Tabla de relación sesiones <-> enseñanzas
CREATE TABLE IF NOT EXISTS public.invisible_council_session_teachings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES public.invisible_council_sessions(id) ON DELETE CASCADE,
  teaching_id UUID REFERENCES public.invisible_council_teachings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, teaching_id)
);

ALTER TABLE public.invisible_council_session_teachings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_sessions_status ON public.invisible_council_sessions(status);
CREATE INDEX idx_council_sessions_type ON public.invisible_council_sessions(session_type);
CREATE INDEX idx_council_sessions_created ON public.invisible_council_sessions(created_by);
CREATE INDEX idx_council_session_guides_session ON public.invisible_council_session_guides(session_id);
CREATE INDEX idx_council_session_teachings_session ON public.invisible_council_session_teachings(session_id);
