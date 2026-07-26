-- ================================================================
-- FASE 2.1 — Supabase Auth: Roles, Profiles, RLS
-- Execute in Supabase SQL Editor (in order)
-- ================================================================

-- 1. CUSTOM ROLES TYPE (OWNER > CASHIER > VIEWER)
CREATE TYPE user_role AS ENUM ('OWNER', 'CASHIER', 'VIEWER');

-- 2. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  username    TEXT UNIQUE,
  role        user_role NOT NULL DEFAULT 'VIEWER',
  avatar      TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS: users can read any profile, update only their own
CREATE POLICY "profiles_select_any" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    'VIEWER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  details     JSONB DEFAULT '{}',
  ip_address  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_logs_select_owner" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'OWNER')
  );

-- 6. REFERRALS TABLE (Supabase version)
CREATE TABLE IF NOT EXISTS public.referrals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id       UUID REFERENCES auth.users(id) NOT NULL,
  referred_email    TEXT NOT NULL,
  bonus_awarded     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "referrals_insert" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- 7. REWARDS LOG TABLE
CREATE TABLE IF NOT EXISTS public.rewards_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  action          TEXT NOT NULL,
  pts             INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rewards_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_log_select_own" ON public.rewards_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rewards_log_insert_own" ON public.rewards_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. HELPER: PROMOTE USER TO OWNER (run once after first signup)
-- UPDATE public.profiles SET role = 'OWNER' WHERE email = 'msmmystore@gmail.com';

-- 9. HELPER: CREATE DEMO CASHIER
-- INSERT INTO auth.users (email, encrypted_password) VALUES ('cashier@zafiro.app', crypt('cashier123', gen_salt('bf')));
-- INSERT INTO public.profiles (id, email, name, role) VALUES (lastval(), 'cashier@zafiro.app', 'Cajero Demo', 'CASHIER');
