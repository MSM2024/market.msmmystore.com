-- ================================================================
-- 00020 — CONSEJO INVISIBLE: Transcripciones
-- Sistema de transcripción por segmentos
-- ================================================================

CREATE TYPE transcript_review_status AS ENUM (
  'generated',
  'pending_review',
  'corrected',
  'approved',
  'rejected'
);

CREATE TABLE IF NOT EXISTS public.invisible_council_transcripts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id            UUID REFERENCES public.invisible_council_audio_files(id) ON DELETE CASCADE,
  full_text           TEXT DEFAULT '',
  language            TEXT DEFAULT 'es',
  version             INTEGER NOT NULL DEFAULT 1,
  review_status       transcript_review_status NOT NULL DEFAULT 'generated',
  reviewed_by         UUID REFERENCES auth.users(id),
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invisible_council_transcripts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invisible_council_transcript_segments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id       UUID REFERENCES public.invisible_council_transcripts(id) ON DELETE CASCADE,
  segment_index       INTEGER NOT NULL,
  start_time_ms       INTEGER NOT NULL,
  end_time_ms         INTEGER NOT NULL,
  speaker_label       TEXT DEFAULT '',
  raw_text            TEXT DEFAULT '',
  corrected_text      TEXT DEFAULT '',
  language            TEXT DEFAULT 'es',
  confidence          DECIMAL(3,2),
  review_status       transcript_review_status NOT NULL DEFAULT 'generated',
  reviewed_by         UUID REFERENCES auth.users(id),
  guide_id            UUID REFERENCES public.invisible_council_guides(id),
  tags                TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invisible_council_transcript_segments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_council_transcripts_audio ON public.invisible_council_transcripts(audio_id);
CREATE INDEX idx_council_segments_transcript ON public.invisible_council_transcript_segments(transcript_id);
CREATE INDEX idx_council_segments_guide ON public.invisible_council_transcript_segments(guide_id);
