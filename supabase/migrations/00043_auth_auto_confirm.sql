-- ================================================================
-- MIGRATION 00043: AUTH AUTO-CONFIRM & PROFILE TRIGGER
-- ================================================================
-- SECURITY DEFINER function to auto-confirm users when SMTP is down.
-- Also creates profile and identity records atomically.
-- ================================================================

-- 1. AUTO-CONFIRM FUNCTION
-- Creates a confirmed user + identity + profile in one atomic call.
-- Can be called from the register API via Supabase REST.
CREATE OR REPLACE FUNCTION public.auto_confirm_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Confirm email in auth.users
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW()),
    updated_at = NOW()
  WHERE id = p_user_id
    AND email_confirmed_at IS NULL;

  -- Create identity record if not exists
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
  SELECT
    p_user_id, p_user_id,
    jsonb_build_object('sub', p_user_id::TEXT, 'email', p_email),
    'email', p_email,
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = p_user_id AND provider = 'email'
  );

  -- Create profile if not exists
  INSERT INTO public.profiles (id, email, name, full_name, role, plan, status, created_at, updated_at)
  SELECT
    p_user_id, p_email,
    COALESCE(p_name, split_part(p_email, '@', 1)),
    COALESCE(p_name, split_part(p_email, '@', 1)),
    'customer', 'free', 'activo',
    NOW(), NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id
  );

  RETURN TRUE;
END;
$$;

-- 2. PROFILE AUTO-CREATE TRIGGER
-- Ensures a profile row is created when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, full_name, role, plan, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer', 'free', 'activo',
    NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RECOVERY CODES TABLE
CREATE TABLE IF NOT EXISTS public.recovery_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON public.recovery_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON public.recovery_codes (code);

ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recovery_codes_insert" ON public.recovery_codes;
CREATE POLICY "recovery_codes_insert"
  ON public.recovery_codes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "recovery_codes_select" ON public.recovery_codes;
CREATE POLICY "recovery_codes_select"
  ON public.recovery_codes FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin_or_superadmin());

-- 4. GENERATE RECOVERY CODE FUNCTION
CREATE OR REPLACE FUNCTION public.generate_recovery_code(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_code TEXT;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8));

  INSERT INTO public.recovery_codes (user_id, code, expires_at)
  VALUES (v_user_id, v_code, NOW() + INTERVAL '15 minutes');

  RETURN v_code;
END;
$$;

-- 5. VALIDATE RECOVERY CODE FUNCTION
CREATE OR REPLACE FUNCTION public.validate_recovery_code(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.recovery_codes
  WHERE code = p_code
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE public.recovery_codes SET used_at = NOW() WHERE code = p_code;
  END IF;

  RETURN v_user_id;
END;
$$;

-- MIGRATION COMPLETE
