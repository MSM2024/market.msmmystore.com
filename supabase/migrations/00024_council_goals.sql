-- ================================================================
-- 00024 — CONSEJO INVISIBLE: Metas y Visualización
-- Área de metas conectada al Consejo Invisible
-- ================================================================

CREATE TYPE goal_status AS ENUM (
  'idea',
  'active',
  'paused',
  'completed',
  'changed',
  'archived'
);

CREATE TYPE goal_category AS ENUM (
  'spiritual',
  'family',
  'health',
  'business',
  'financial',
  'technology',
  'education',
  'travel',
  'legacy',
  'community',
  'personal'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_goals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT DEFAULT '',
  category            goal_category NOT NULL DEFAULT 'personal',
  why                 TEXT DEFAULT '',
  desired_result      TEXT DEFAULT '',
  start_date          DATE,
  target_date         DATE,
  status              goal_status NOT NULL DEFAULT 'idea',
  progress            INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  next_action         TEXT DEFAULT '',
  evidence            TEXT DEFAULT '',
  owner_reflection    TEXT DEFAULT '',
  visibility          content_visibility NOT NULL DEFAULT 'private',
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_goals ENABLE ROW LEVEL SECURITY;

-- Tabla de seguimiento de metas
CREATE TABLE IF NOT EXISTS public.invisible_council_goal_updates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id             UUID REFERENCES public.invisible_council_goals(id) ON DELETE CASCADE,
  update_text         TEXT NOT NULL,
  progress            INTEGER CHECK (progress BETWEEN 0 AND 100),
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invisible_council_goal_updates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_goals_status ON public.invisible_council_goals(status);
CREATE INDEX idx_council_goals_category ON public.invisible_council_goals(category);
CREATE INDEX idx_council_goals_created ON public.invisible_council_goals(created_by);
CREATE INDEX idx_council_goal_updates_goal ON public.invisible_council_goal_updates(goal_id);
