-- ================================================================
-- 00033 — ELIANA CORE: Intakes, Handoffs, Actions, Audit
-- Fichas, escalados, acciones y auditoría
-- ================================================================

-- ================================================================
-- INTAKES (Fichas estructuradas)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_intakes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         UUID REFERENCES public.eliana_conversations(id) ON DELETE CASCADE,
  intake_type             TEXT NOT NULL,
  data                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed               BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eliana_intakes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_intakes_conversation ON public.eliana_intakes(conversation_id);
CREATE INDEX idx_eliana_intakes_type ON public.eliana_intakes(intake_type);

-- ================================================================
-- HANDOFFS (Escalado humano)
-- ================================================================
CREATE TYPE eliana_handoff_status AS ENUM (
  'pending', 'assigned', 'in_progress', 'resolved', 'cancelled'
);

CREATE TABLE IF NOT EXISTS public.eliana_handoffs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         UUID REFERENCES public.eliana_conversations(id) ON DELETE CASCADE,
  reason                  TEXT NOT NULL,
  status                  eliana_handoff_status NOT NULL DEFAULT 'pending',
  priority                TEXT NOT NULL DEFAULT 'medium',
  summary                 TEXT DEFAULT '',
  assigned_to             UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  resolved_at             TIMESTAMPTZ
);

ALTER TABLE public.eliana_handoffs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_handoffs_status ON public.eliana_handoffs(status);
CREATE INDEX idx_eliana_handoffs_priority ON public.eliana_handoffs(priority);
CREATE INDEX idx_eliana_handoffs_assigned ON public.eliana_handoffs(assigned_to);

-- ================================================================
-- ACTIONS (Acciones ejecutadas por ELIANA)
-- ================================================================
CREATE TYPE eliana_action_status AS ENUM (
  'pending_confirmation', 'confirmed', 'executed', 'failed'
);

CREATE TABLE IF NOT EXISTS public.eliana_actions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         UUID REFERENCES public.eliana_conversations(id) ON DELETE CASCADE,
  action_type             TEXT NOT NULL,
  parameters              JSONB NOT NULL DEFAULT '{}'::jsonb,
  status                  eliana_action_status NOT NULL DEFAULT 'pending_confirmation',
  result                  JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now(),
  executed_at             TIMESTAMPTZ
);

ALTER TABLE public.eliana_actions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_actions_conversation ON public.eliana_actions(conversation_id);
CREATE INDEX idx_eliana_actions_status ON public.eliana_actions(status);

-- ================================================================
-- AUDIT LOGS (Extensión para ELIANA)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_audit_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id                UUID REFERENCES auth.users(id),
  event_type              TEXT NOT NULL,
  resource_type           TEXT NOT NULL,
  resource_id             UUID,
  channel                 TEXT,
  previous_value          JSONB,
  new_value               JSONB,
  metadata                JSONB DEFAULT '{}'::jsonb,
  ip_address              TEXT DEFAULT '',
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eliana_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_audit_event ON public.eliana_audit_logs(event_type);
CREATE INDEX idx_eliana_audit_resource ON public.eliana_audit_logs(resource_type, resource_id);
CREATE INDEX idx_eliana_audit_created ON public.eliana_audit_logs(created_at);

-- ================================================================
-- SETTINGS (Configuración de ELIANA)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                     TEXT NOT NULL UNIQUE,
  value                   JSONB NOT NULL DEFAULT '{}'::jsonb,
  description             TEXT DEFAULT '',
  updated_by              UUID REFERENCES auth.users(id),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eliana_settings ENABLE ROW LEVEL SECURITY;

-- Insertar configuración por defecto
INSERT INTO public.eliana_settings (key, value, description) VALUES
  ('identity', '{"name": "ELIANA MSM", "presentation": "Soy ELIANA, asistente virtual de MSM MY STORE", "greeting": "Bendiciones", "default_language": "es"}'::jsonb, 'Identidad de ELIANA'),
  ('rate_limits', '{"web": 30, "whatsapp": 20, "marketplace": 30, "zafiro": 30}'::jsonb, 'Límites de rate por canal'),
  ('human_handoff', '{"auto_assign": false, "business_hours": "9:00-18:00", "timezone": "America/New_York"}'::jsonb, 'Configuración de escalado humano')
ON CONFLICT (key) DO NOTHING;

-- ================================================================
-- FEEDBACK (Retroalimentación de usuarios)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_feedback (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         UUID REFERENCES public.eliana_conversations(id) ON DELETE CASCADE,
  message_id              UUID REFERENCES public.eliana_messages(id),
  rating                  INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment                 TEXT DEFAULT '',
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eliana_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_feedback_conversation ON public.eliana_feedback(conversation_id);
