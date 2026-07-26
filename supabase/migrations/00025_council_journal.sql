-- ================================================================
-- 00025 — CONSEJO INVISIBLE: Diario Personal
-- Diario privado con texto, audio, imagen, emoción, gratitud
-- ================================================================

CREATE TYPE journal_entry_type AS ENUM (
  'text',
  'audio',
  'image',
  'document',
  'emotion',
  'gratitude',
  'dream',
  'idea',
  'prayer',
  'decision',
  'learning',
  'action',
  'result'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_journal_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type          journal_entry_type NOT NULL DEFAULT 'text',
  title               TEXT DEFAULT '',
  content             TEXT DEFAULT '',
  audio_id            UUID REFERENCES public.invisible_council_audio_files(id),
  image_url           TEXT DEFAULT '',
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  time                TIME,
  location_consent    BOOLEAN NOT NULL DEFAULT false,
  location_lat        DECIMAL(10,8),
  location_lng        DECIMAL(11,8),
  tags                TEXT[] DEFAULT '{}',
  linked_guide_id     UUID REFERENCES public.invisible_council_guides(id),
  linked_goal_id      UUID REFERENCES public.invisible_council_goals(id),
  linked_session_id   UUID REFERENCES public.invisible_council_sessions(id),
  privacy             content_visibility NOT NULL DEFAULT 'private',
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.invisible_council_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_journal_date ON public.invisible_council_journal_entries(date);
CREATE INDEX idx_council_journal_type ON public.invisible_council_journal_entries(entry_type);
CREATE INDEX idx_council_journal_created ON public.invisible_council_journal_entries(created_by);
CREATE INDEX idx_council_journal_tags ON public.invisible_council_journal_entries USING GIN(tags);
