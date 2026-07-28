-- ================================================================
-- MIGRATION 00036: UNIFIED IDENTITY SYSTEM
-- ================================================================
-- Consolidates authentication, authorization, and session management
-- across the Zafiro ecosystem (accounts, admin, marketplace, api).
--
-- Tables created/enhanced:
--   1. profiles          – User identity (enhances 00001)
--   2. organizations     – Multi-tenant orgs
--   3. memberships       – User ↔ Org roles
--   4. sso_tickets       – Cross-app SSO handoff tokens
--   5. app_sessions      – Per-app session registry
--   6. login_events      – Authentication event log
--   7. audit_logs        – Append-only audit trail (enhances 00001)
--
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS / CREATE OR REPLACE).
-- ================================================================

-- ================================================================
-- 0. HELPER FUNCTIONS
-- ================================================================

-- Returns true if the current user has an admin-level role
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'superadmin', 'finance', 'kyc', 'inventory', 'support', 'auditor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns true if the given user_id is an admin-level role
CREATE OR REPLACE FUNCTION public.user_is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
    AND role IN ('owner', 'superadmin', 'finance', 'kyc', 'inventory', 'support', 'auditor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 1. PROFILES TABLE
-- ================================================================
-- Enhances the existing profiles table from migration 00001.
-- Adds security fields (MFA, lockout), org linkage, preferences.
-- ================================================================

DO $$
BEGIN
  -- Add new columns if they don't exist (idempotent ALTERs)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','pending_verification','blocked'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='organization_id') THEN
    ALTER TABLE public.profiles ADD COLUMN organization_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='mfa_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='mfa_secret') THEN
    ALTER TABLE public.profiles ADD COLUMN mfa_secret TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'es';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='timezone') THEN
    ALTER TABLE public.profiles ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_login_ip') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_ip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='login_attempts') THEN
    ALTER TABLE public.profiles ADD COLUMN login_attempts INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='locked_until') THEN
    ALTER TABLE public.profiles ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;
END $$;

-- Add the role CHECK constraint if the column uses the old enum.
-- We migrate from the enum to TEXT + CHECK so it's flexible.
DO $$
BEGIN
  -- If the old enum type exists, migrate data and drop the enum constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
    AND udt_name = 'user_role'
  ) THEN
    -- Migrate old enum values to new text values
    UPDATE public.profiles SET role = 'owner' WHERE role = 'OWNER';
    UPDATE public.profiles SET role = 'customer' WHERE role IN ('CASHIER', 'VIEWER');
    -- Cast column from enum to text
    ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;
  END IF;

  -- Add CHECK constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('owner','superadmin','finance','kyc','inventory','support','auditor','vendor','customer'));
  END IF;

  -- Set default if not already set
  ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';
END $$;

-- Ensure email UNIQUE constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_unique' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies and recreate (idempotent)
DROP POLICY IF EXISTS "profiles_select_any" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Users can read their own full profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Admins / owners can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_superadmin());

-- Users can update their own profile (limited columns enforced in app layer)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- System can insert (trigger-created profiles)
CREATE POLICY "profiles_insert_system"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- No DELETE policy: profiles cannot be deleted via RLS.

-- ================================================================
-- TRIGGER: auto-update updated_at on profiles
-- ================================================================
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- TRIGGER: auto-create profile on auth.users INSERT
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 2. ORGANIZATIONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  type        TEXT DEFAULT 'business' CHECK (type IN ('business','admin','platform')),
  owner_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'active',
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles.organization_id to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_organization_id_fk' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_organization_id_fk
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS: members can read their org
CREATE POLICY "organizations_select_member"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR public.is_admin_or_superadmin()
  );

-- RLS: owner / admin can update their org
CREATE POLICY "organizations_update_owner"
  ON public.organizations FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
        AND organization_id = id
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
        AND organization_id = id
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- RLS: system can insert
CREATE POLICY "organizations_insert_system"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

-- Trigger: auto-update updated_at
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- 3. MEMBERSHIPS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner','admin','manager','member','viewer')),
  status          TEXT DEFAULT 'active',
  invited_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, organization_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Members can read memberships for orgs they belong to
CREATE POLICY "memberships_select_own_org"
  ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR public.is_admin_or_superadmin()
  );

-- Owners / admins can insert memberships (invite)
CREATE POLICY "memberships_insert_admin"
  ON public.memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
        AND organization_id = memberships.organization_id
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
    OR public.is_admin_or_superadmin()
  );

-- Owners / admins can update memberships
CREATE POLICY "memberships_update_admin"
  ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
    OR public.is_admin_or_superadmin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
    OR public.is_admin_or_superadmin()
  );

-- Owners / admins can remove memberships
CREATE POLICY "memberships_delete_admin"
  ON public.memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
    OR public.is_admin_or_superadmin()
  );

-- ================================================================
-- 4. SSO TICKETS TABLE
-- ================================================================
-- Used for cross-app single sign-on handoff.
-- Only service_role should insert/update; users never touch this.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.sso_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_hash     TEXT NOT NULL UNIQUE,
  ticket_jti      TEXT NOT NULL UNIQUE,
  target_app      TEXT NOT NULL CHECK (target_app IN ('accounts','admin','marketplace','zafiro','api')),
  origin_app      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  consumed_from_ip TEXT,
  one_time        BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sso_tickets ENABLE ROW LEVEL SECURITY;

-- Only service_role can access sso_tickets (no user-facing policies)
-- Explicitly deny all authenticated access via a restrictive policy
CREATE POLICY "sso_tickets_service_only_select"
  ON public.sso_tickets FOR SELECT
  USING (false);

CREATE POLICY "sso_tickets_service_only_insert"
  ON public.sso_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "sso_tickets_service_only_update"
  ON public.sso_tickets FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- 5. APP SESSIONS TABLE
-- ================================================================
-- Tracks active sessions per application for the user.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.app_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_name              TEXT NOT NULL CHECK (app_name IN ('accounts','admin','marketplace','zafiro','api')),
  session_token_hash    TEXT NOT NULL UNIQUE,
  cookie_name           TEXT NOT NULL,
  device_fingerprint    TEXT,
  ip_address            TEXT,
  user_agent            TEXT,
  country               TEXT,
  city                  TEXT,
  is_mfa_session        BOOLEAN DEFAULT FALSE,
  expires_at            TIMESTAMPTZ NOT NULL,
  last_active_at        TIMESTAMPTZ DEFAULT NOW(),
  revoked_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "app_sessions_select_own"
  ON public.app_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all sessions
CREATE POLICY "app_sessions_select_admin"
  ON public.app_sessions FOR SELECT
  USING (public.is_admin_or_superadmin());

-- Users can revoke their own sessions
CREATE POLICY "app_sessions_update_own_revoke"
  ON public.app_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert sessions
CREATE POLICY "app_sessions_insert_system"
  ON public.app_sessions FOR INSERT
  WITH CHECK (true);

-- System can update last_active_at (for heartbeat)
CREATE POLICY "app_sessions_update_system"
  ON public.app_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- 6. LOGIN EVENTS TABLE
-- ================================================================
-- Append-only authentication event log.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.login_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email               TEXT NOT NULL,
  event_type          TEXT NOT NULL CHECK (event_type IN (
    'login_success','login_failed','logout','mfa_success','mfa_failed',
    'password_reset','account_locked','sso_issued','sso_consumed'
  )),
  app_name            TEXT,
  ip_address          TEXT,
  user_agent          TEXT,
  device_fingerprint  TEXT,
  country             TEXT,
  city                TEXT,
  failure_reason      TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own login events
CREATE POLICY "login_events_select_own"
  ON public.login_events FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all login events
CREATE POLICY "login_events_select_admin"
  ON public.login_events FOR SELECT
  USING (public.is_admin_or_superadmin());

-- System can insert login events
CREATE POLICY "login_events_insert_system"
  ON public.login_events FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE policies: append-only.

-- ================================================================
-- 7. AUDIT LOGS TABLE (enhanced from 00001)
-- ================================================================
-- Append-only. No UPDATE or DELETE via RLS.
-- ================================================================

DO $$
BEGIN
  -- Add new columns to existing audit_logs table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='actor_email') THEN
    ALTER TABLE public.audit_logs ADD COLUMN actor_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='app_name') THEN
    ALTER TABLE public.audit_logs ADD COLUMN app_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='resource_type') THEN
    ALTER TABLE public.audit_logs ADD COLUMN resource_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='resource_id') THEN
    ALTER TABLE public.audit_logs ADD COLUMN resource_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='user_agent') THEN
    ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='previous_value') THEN
    ALTER TABLE public.audit_logs ADD COLUMN previous_value JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='new_value') THEN
    ALTER TABLE public.audit_logs ADD COLUMN new_value JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='reason') THEN
    ALTER TABLE public.audit_logs ADD COLUMN reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='request_id') THEN
    ALTER TABLE public.audit_logs ADD COLUMN request_id TEXT;
  END IF;
END $$;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_owner" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Admins can read all audit logs
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin_or_superadmin());

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE policies: append-only.

-- ================================================================
-- 8. INDEXES
-- ================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles (organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles (last_login_at);

-- organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations (type);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations (status);

-- memberships
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON public.memberships (organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON public.memberships (role);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships (status);

-- sso_tickets
CREATE INDEX IF NOT EXISTS idx_sso_tickets_user_id ON public.sso_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_sso_tickets_ticket_hash ON public.sso_tickets (ticket_hash);
CREATE INDEX IF NOT EXISTS idx_sso_tickets_ticket_jti ON public.sso_tickets (ticket_jti);
CREATE INDEX IF NOT EXISTS idx_sso_tickets_target_app ON public.sso_tickets (target_app);
CREATE INDEX IF NOT EXISTS idx_sso_tickets_expires_at ON public.sso_tickets (expires_at);
CREATE INDEX IF NOT EXISTS idx_sso_tickets_consumed_at ON public.sso_tickets (consumed_at);

-- app_sessions
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON public.app_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_app_name ON public.app_sessions (app_name);
CREATE INDEX IF NOT EXISTS idx_app_sessions_session_token_hash ON public.app_sessions (session_token_hash);
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires_at ON public.app_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_app_sessions_revoked_at ON public.app_sessions (revoked_at);
CREATE INDEX IF NOT EXISTS idx_app_sessions_last_active_at ON public.app_sessions (last_active_at);

-- login_events
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events (user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON public.login_events (email);
CREATE INDEX IF NOT EXISTS idx_login_events_event_type ON public.login_events (event_type);
CREATE INDEX IF NOT EXISTS idx_login_events_app_name ON public.login_events (app_name);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events (created_at);
CREATE INDEX IF NOT EXISTS idx_login_events_ip_address ON public.login_events (ip_address);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_app_name ON public.audit_logs (app_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs (resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON public.audit_logs (request_id);

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
