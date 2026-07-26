-- ================================================================
-- 00032 — ELIANA CORE: Tablas principales
-- Inteligencia Central del Ecosistema MSM
-- ================================================================

-- ================================================================
-- KNOWLEDGE (Fuente maestra de conocimiento)
-- ================================================================
CREATE TYPE eliana_knowledge_status AS ENUM (
  'draft', 'pending_review', 'approved', 'published', 'archived'
);

CREATE TABLE IF NOT EXISTS public.eliana_knowledge (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category                TEXT NOT NULL,
  title                   TEXT NOT NULL,
  content                 TEXT NOT NULL,
  source                  TEXT DEFAULT '',
  version                 INTEGER NOT NULL DEFAULT 1,
  status                  eliana_knowledge_status NOT NULL DEFAULT 'draft',
  priority                INTEGER NOT NULL DEFAULT 5,
  valid_from              TIMESTAMPTZ,
  valid_until             TIMESTAMPTZ,
  requires_human_review   BOOLEAN NOT NULL DEFAULT false,
  approved_by             UUID REFERENCES auth.users(id),
  approved_at             TIMESTAMPTZ,
  tags                    TEXT[] DEFAULT '{}',
  channel                 TEXT NOT NULL DEFAULT 'all',
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE public.eliana_knowledge ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_knowledge_category ON public.eliana_knowledge(category);
CREATE INDEX idx_eliana_knowledge_status ON public.eliana_knowledge(status);
CREATE INDEX idx_eliana_knowledge_tags ON public.eliana_knowledge USING GIN(tags);
CREATE INDEX idx_eliana_knowledge_channel ON public.eliana_knowledge(channel);

-- ================================================================
-- CHANNELS (Configuración de canales)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_channels (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name            TEXT NOT NULL UNIQUE,
  enabled                 BOOLEAN NOT NULL DEFAULT true,
  welcome_message         TEXT DEFAULT '',
  system_prompt_addition  TEXT DEFAULT '',
  max_context_length      INTEGER NOT NULL DEFAULT 4000,
  requires_auth           BOOLEAN NOT NULL DEFAULT false,
  webhook_url             TEXT DEFAULT '',
  config                  JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eliana_channels ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- CONTACTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_contacts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id             TEXT NOT NULL,
  channel                 TEXT NOT NULL,
  name                    TEXT DEFAULT '',
  phone                   TEXT DEFAULT '',
  email                   TEXT DEFAULT '',
  country                 TEXT DEFAULT '',
  language                TEXT NOT NULL DEFAULT 'es',
  consent                 BOOLEAN NOT NULL DEFAULT false,
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(external_id, channel)
);

ALTER TABLE public.eliana_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_contacts_external ON public.eliana_contacts(external_id);
CREATE INDEX idx_eliana_contacts_channel ON public.eliana_contacts(channel);

-- ================================================================
-- IDENTITIES (Unificación multi-canal)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_identities (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id),
  contact_id              UUID REFERENCES public.eliana_contacts(id) ON DELETE CASCADE,
  channel                 TEXT NOT NULL,
  verified                BOOLEAN NOT NULL DEFAULT false,
  linked_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel)
);

ALTER TABLE public.eliana_identities ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- CONVERSATIONS
-- ================================================================
CREATE TYPE eliana_conversation_status AS ENUM (
  'active', 'waiting_human', 'resolved', 'cancelled', 'expired'
);

CREATE TABLE IF NOT EXISTS public.eliana_conversations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id              UUID REFERENCES public.eliana_contacts(id),
  channel                 TEXT NOT NULL,
  status                  eliana_conversation_status NOT NULL DEFAULT 'active',
  intent                  TEXT,
  risk_level              TEXT NOT NULL DEFAULT 'low',
  assigned_to             UUID REFERENCES auth.users(id),
  summary                 TEXT DEFAULT '',
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  resolved_at             TIMESTAMPTZ
);

ALTER TABLE public.eliana_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_conversations_contact ON public.eliana_conversations(contact_id);
CREATE INDEX idx_eliana_conversations_status ON public.eliana_conversations(status);
CREATE INDEX idx_eliana_conversations_channel ON public.eliana_conversations(channel);
CREATE INDEX idx_eliana_conversations_created ON public.eliana_conversations(created_at);

-- ================================================================
-- MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.eliana_messages (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         UUID REFERENCES public.eliana_conversations(id) ON DELETE CASCADE,
  role                    TEXT NOT NULL CHECK (role IN ('user', 'eliana', 'human_agent')),
  content                 TEXT NOT NULL,
  channel                 TEXT NOT NULL,
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eliana_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_eliana_messages_conversation ON public.eliana_messages(conversation_id);
CREATE INDEX idx_eliana_messages_created ON public.eliana_messages(created_at);
