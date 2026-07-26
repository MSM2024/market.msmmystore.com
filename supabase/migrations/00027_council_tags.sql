-- ================================================================
-- 00027 — CONSEJO INVISIBLE: Sistema de Etiquetas
-- Etiquetas para clasificar contenido
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invisible_council_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  color       TEXT DEFAULT '#197BD2',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invisible_council_tags ENABLE ROW LEVEL SECURITY;

-- Tabla de relación contenido <-> etiquetas
CREATE TABLE IF NOT EXISTS public.invisible_council_content_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id      UUID REFERENCES public.invisible_council_tags(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'teaching', 'guide', 'audio', 'transcript', 'session', 'book', 'journal', 'prayer'
  content_id  UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tag_id, content_type, content_id)
);

ALTER TABLE public.invisible_council_content_tags ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_content_tags_content ON public.invisible_council_content_tags(content_type, content_id);
CREATE INDEX idx_council_content_tags_tag ON public.invisible_council_content_tags(tag_id);

-- Etiquetas predeterminadas basadas en temas del Consejo
INSERT INTO public.invisible_council_tags (name, slug, color) VALUES
  ('Fe', 'fe', '#D4AF37'),
  ('Sabiduría', 'sabiduria', '#197BD2'),
  ('Disciplina', 'disciplina', '#0C3F6A'),
  ('Amor', 'amor', '#d946ef'),
  ('Familia', 'familia', '#7c3aed'),
  ('Liderazgo', 'liderazgo', '#2563eb'),
  ('Negocios', 'negocios', '#059669'),
  ('Prosperidad', 'prosperidad', '#D4AF37'),
  ('Tecnología', 'tecnologia', '#00D9FF'),
  ('Inventos', 'inventos', '#38bdf8'),
  ('Escritura', 'escritura', '#a78bfa'),
  ('Metas', 'metas', '#f59e0b'),
  ('Visualización', 'visualizacion', '#8b5cf6'),
  ('Salud', 'salud', '#10b981'),
  ('Servicio', 'servicio', '#6366f1'),
  ('Legado', 'legado', '#ec4899'),
  ('Perdón', 'perdon', '#14b8a6'),
  ('Gratitud', 'gratitud', '#f97316'),
  ('Carácter', 'caracter', '#ef4444'),
  ('Discernimiento', 'discernimiento', '#64748b')
ON CONFLICT (slug) DO NOTHING;
