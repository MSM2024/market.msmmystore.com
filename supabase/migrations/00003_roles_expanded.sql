-- ================================================================
-- 00003 — ROLES EXPANDIDOS + USER_ROLES TABLE
-- Ejecutar DESPUÉS de 00001 y 00002
-- ================================================================

-- 1. NUEVO ENUM CON TODOS LOS ROLES
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'customer',
  'seller',
  'vip',
  'referrer',
  'supplier',
  'support',
  'finance',
  'admin',
  'superadmin'
);

-- 2. ACTUALIZAR PROFILES TABLE
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles ADD COLUMN role user_role NOT NULL DEFAULT 'customer';

-- 3. TABLA USER_ROLES (multi-rol por usuario)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        user_role NOT NULL,
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ DEFAULT now(),
  notes       TEXT DEFAULT '',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS PARA USER_ROLES
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- 5. TRIGGER PARA ASIGNAR ROL customer AL REGISTRARSE
-- Drop old trigger and function from 00001 (used 'VIEWER' which no longer exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user_marketplace()
RETURNS TRIGGER AS $$
BEGIN
  -- Asignar rol customer por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Actualizar profiles.role por defecto
  UPDATE public.profiles SET role = 'customer' WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_marketplace ON auth.users;
CREATE TRIGGER on_auth_user_created_marketplace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_marketplace();

-- 6. PROMOVER AL ADMIN INICIAL
-- Descomentar después del primer registro:
-- UPDATE public.profiles SET role = 'superadmin' WHERE email = 'msmmystore@gmail.com';
-- INSERT INTO public.user_roles (user_id, role, notes) 
-- SELECT id, 'superadmin', 'Admin principal del sistema' FROM auth.users WHERE email = 'msmmystore@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
-- INSERT INTO public.user_roles (user_id, role, notes)
-- SELECT id, 'admin', 'Administrador del sistema' FROM auth.users WHERE email = 'msmmystore@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
-- INSERT INTO public.user_roles (user_id, role, notes)
-- SELECT id, 'seller', 'Vendedor MSM' FROM auth.users WHERE email = 'msmmystore@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
-- INSERT INTO public.user_roles (user_id, role, notes)
-- SELECT id, 'finance', 'Finanzas MSM' FROM auth.users WHERE email = 'msmmystore@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
-- INSERT INTO public.user_roles (user_id, role, notes)
-- SELECT id, 'support', 'Soporte MSM' FROM auth.users WHERE email = 'msmmystore@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
