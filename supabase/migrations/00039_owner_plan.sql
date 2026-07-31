-- ================================================================
-- MIGRATION 00039: OWNER SUPERADMIN + PLANES DE MEMBRESÍA
-- ================================================================
-- Adds:
--   1. plan column to profiles for membership tier
--   2. OWNER role seed helper (execute after first user registers)
-- ================================================================

-- 1. Add plan column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='plan'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
  END IF;
END $$;

-- 2. Add CHECK constraint for valid plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_plan_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plan_check
      CHECK (plan IN ('free', 'pro_monthly', 'pro_annual', 'cuba_plus_monthly', 'cuba_plus_annual', 'lifetime_unlimited'));
  END IF;
END $$;

-- 3. Add stripe_customer_id column for Stripe integration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
END $$;

-- 4. Helper: seed Don Miguel as OWNER + LIFETIME_UNLIMITED
-- Run this AFTER Don Miguel registers at /auth/register
-- UPDATE public.profiles
-- SET role = 'owner', plan = 'lifetime_unlimited', updated_at = NOW()
-- WHERE email = 'msmmystore@gmail.com';
