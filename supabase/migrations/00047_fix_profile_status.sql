-- ================================================================
-- MIGRATION 00047: FIX PROFILE STATUS ON SIGNUP
-- ================================================================
-- BUG: 00043 insertaba status='activo' en handle_new_user() y
-- auto_confirm_user(), pero el CHECK de profiles.status (00036)
-- solo permite ('active','suspended','pending_verification','blocked').
-- Resultado: la inserción del trigger FALLABA al crear una cuenta y
-- NUNCA se creaba la fila en public.profiles (rompe roles, RLS, login).
-- ================================================================

-- 1. AUTO-CONFIRM FUNCTION (fixed)
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
    'customer', 'free', 'active',
    NOW(), NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id
  );

  RETURN TRUE;
END;
$$;

-- 2. PROFILE AUTO-CREATE TRIGGER (fixed)
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
    'customer', 'free', 'active',
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

-- 3. REPARAR FILAS EXISTENTES CON status INVÁLIDO (si las hubiera)
UPDATE public.profiles
SET status = 'active'
WHERE status NOT IN ('active', 'suspended', 'pending_verification', 'blocked');

-- MIGRATION COMPLETE
