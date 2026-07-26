-- ================================================================
-- 00030 — CONSEJO INVISIBLE: Interacciones con IA
-- Registro de consultas al Consejero de Estudio
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invisible_council_ai_interactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id),
  query               TEXT NOT NULL,
  response            TEXT NOT NULL,
  sources_used        JSONB DEFAULT '[]'::jsonb,
  teachings_referenced UUID[] DEFAULT '{}',
  guides_referenced   UUID[] DEFAULT '{}',
  confidence          DECIMAL(3,2),
  feedback_rating     INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_text       TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invisible_council_ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_ai_user ON public.invisible_council_ai_interactions(user_id);
CREATE INDEX idx_council_ai_created ON public.invisible_council_ai_interactions(created_at);
