-- ================================================================
-- 00029 — CONSEJO INVISIBLE: Permisos Granulares
-- Control de acceso por contenido y usuario
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invisible_council_permissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type        TEXT NOT NULL, -- 'guide', 'teaching', 'audio', 'session', 'book', 'journal', 'prayer', 'goal'
  content_id          UUID,
  permission_level    TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'approve', 'admin'
  granted_by          UUID REFERENCES auth.users(id),
  granted_at          TIMESTAMPTZ DEFAULT now(),
  revoked_at          TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  notes               TEXT DEFAULT '',
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE public.invisible_council_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_permissions_user ON public.invisible_council_permissions(user_id);
CREATE INDEX idx_council_permissions_content ON public.invisible_council_permissions(content_type, content_id);
