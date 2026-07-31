-- 00040_eliana_memory_tasks.sql
-- Persistent memory, tasks, and session tickets for ELIANA

-- ================================================================
-- 1. ELIANA MEMORY (replaces localStorage zafiro_eliana_memory)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.eliana_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type     TEXT NOT NULL CHECK (memory_type IN ('short_term', 'long_term', 'preference', 'fact')),
  key             TEXT,
  content         TEXT NOT NULL,
  category        TEXT DEFAULT 'general',
  confidence      REAL DEFAULT 1.0,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eliana_memory_user_id ON public.eliana_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_eliana_memory_type ON public.eliana_memory(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_eliana_memory_category ON public.eliana_memory(user_id, category);

-- ================================================================
-- 2. ELIANA TASKS
-- ================================================================

DO $$ BEGIN
  CREATE TYPE public.eliana_task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.eliana_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  status          public.eliana_task_status NOT NULL DEFAULT 'pending',
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date        TIMESTAMPTZ,
  assigned_by     UUID REFERENCES auth.users(id),
  source          TEXT DEFAULT 'eliana' CHECK (source IN ('eliana', 'user', 'voz_viva', 'system')),
  source_id       TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_eliana_tasks_user_id ON public.eliana_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_eliana_tasks_status ON public.eliana_tasks(user_id, status);

-- ================================================================
-- 3. ELIANA SESSION TICKETS (secure ZAFIRO <-> ELIANA handoff)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.eliana_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app      TEXT NOT NULL CHECK (source_app IN ('zafiro', 'marketplace', 'whatsapp', 'eliana')),
  target_app      TEXT NOT NULL CHECK (target_app IN ('zafiro', 'eliana', 'whatsapp')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'revoked')),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  consumed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_eliana_tickets_status ON public.eliana_tickets(status, expires_at);

-- ================================================================
-- 4. RLS POLICIES
-- ================================================================

ALTER TABLE public.eliana_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eliana_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eliana_tickets ENABLE ROW LEVEL SECURITY;

-- Memory: users see only their own
CREATE POLICY eliana_memory_user_select ON public.eliana_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY eliana_memory_user_insert ON public.eliana_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY eliana_memory_user_update ON public.eliana_memory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY eliana_memory_user_delete ON public.eliana_memory
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks: users see their own
CREATE POLICY eliana_tasks_user_select ON public.eliana_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY eliana_tasks_user_insert ON public.eliana_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY eliana_tasks_user_update ON public.eliana_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY eliana_tasks_user_delete ON public.eliana_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Tickets: readable only by server (no user access)
CREATE POLICY eliana_tickets_no_select ON public.eliana_tickets
  FOR SELECT USING (false);

CREATE POLICY eliana_tickets_service_insert ON public.eliana_tickets
  FOR INSERT WITH CHECK (true);
