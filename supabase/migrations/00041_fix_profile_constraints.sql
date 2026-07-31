-- ================================================================
-- MIGRATION 00041: FIX PROFILE CONSTRAINTS + SEED OWNER
-- ================================================================
-- Fixes the profiles_plan_check constraint to include all valid plans
-- and seeds the owner profile for cm8msm@gmail.com
-- ================================================================

-- 1. Drop old constraint and recreate with correct values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro_monthly', 'pro_annual', 'cuba_plus_monthly', 'cuba_plus_annual', 'lifetime_unlimited'));

-- 2. Set Don Miguel as OWNER + LIFETIME_UNLIMITED
UPDATE public.profiles
SET role = 'owner',
    plan = 'lifetime_unlimited',
    updated_at = NOW()
WHERE id = 'e3747041-d9e6-4b86-b41c-b1517cc066f0';

-- 3. Update msmmystore@gmail.com admin/recovery account (same person, unify name)
UPDATE public.profiles
SET role = 'admin',
    plan = 'lifetime_unlimited',
    full_name = 'Miguel Soria Martínez',
    updated_at = NOW()
WHERE email = 'msmmystore@gmail.com';

-- 4. Audit log entries for both accounts
INSERT INTO public.audit_logs (user_id, action, resource, details)
SELECT
  id,
  'identity_unified',
  'profile',
  jsonb_build_object(
    'description', 'OPENCODE: Identidad unificada - OWNER_SUPERADMIN + LIFETIME_UNLIMITED + billing_required=false + expires_at=null',
    'email', email,
    'permissions', '*',
    'expires_at', null,
    'billing_required', false
  )
FROM public.profiles
WHERE email IN ('cm8msm@gmail.com', 'msmmystore@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.audit_logs
    WHERE action = 'identity_unified' AND resource = 'profile'
      AND user_id = public.profiles.id
  );
