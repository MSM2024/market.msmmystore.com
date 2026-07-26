-- ================================================================
-- 00016 — CONSEJO INVISIBLE: Roles del Consejo
-- Ejecutar DESPUÉS de 00015
-- ================================================================

-- 1. NUEVO ENUM CON ROLES DEL CONSEJO INVISIBLE
DROP TYPE IF EXISTS council_role CASCADE;
CREATE TYPE council_role AS ENUM (
  'OWNER_SUPERADMIN',
  'COUNCIL_EDITOR',
  'COUNCIL_REVIEWER',
  'FAMILY_VIEWER',
  'TRUSTED_VIEWER',
  'MEMBER',
  'PUBLIC'
);

-- 2. TABLA DE ROLES DEL CONSEJO POR USUARIO
CREATE TABLE IF NOT EXISTS public.council_user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        council_role NOT NULL,
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ DEFAULT now(),
  revoked_at  TIMESTAMPTZ,
  notes       TEXT DEFAULT '',
  UNIQUE(user_id, role)
);

ALTER TABLE public.council_user_roles ENABLE ROW LEVEL SECURITY;

-- 3. HIERARQUÍA DE ROLES (función helper)
CREATE OR REPLACE FUNCTION public.get_council_role_hierarchy(role_name council_role)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE role_name
    WHEN 'OWNER_SUPERADMIN' THEN 100
    WHEN 'COUNCIL_EDITOR' THEN 80
    WHEN 'COUNCIL_REVIEWER' THEN 60
    WHEN 'FAMILY_VIEWER' THEN 40
    WHEN 'TRUSTED_VIEWER' THEN 30
    WHEN 'MEMBER' THEN 20
    WHEN 'PUBLIC' THEN 10
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. FUNCIÓN PARA VERIFICAR SI UN USUARIO TIENE UN ROL DEL CONSEJO
CREATE OR REPLACE FUNCTION public.user_has_council_role(user_uuid UUID, required_role council_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.council_user_roles
    WHERE user_id = user_uuid
    AND role = required_role
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN PARA VERIFICAR jerarquía mínima
CREATE OR REPLACE FUNCTION public.user_has_council_role_or_higher(user_uuid UUID, min_role council_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_max_level INTEGER := 0;
  required_level INTEGER;
BEGIN
  SELECT COALESCE(MAX(public.get_council_role_hierarchy(role)), 0)
  INTO user_max_level
  FROM public.council_user_roles
  WHERE user_id = user_uuid
  AND revoked_at IS NULL;

  required_level := public.get_council_role_hierarchy(min_role);
  RETURN user_max_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN AUTO-ASIGNAR OWNER_SUPERADMIN AL PRIMER USUARIO
CREATE OR REPLACE FUNCTION public.handle_council_first_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo asignar si es el primer usuario del sistema
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    INSERT INTO public.council_user_roles (user_id, role, notes)
    VALUES (NEW.id, 'OWNER_SUPERADMIN', 'Primer usuario del sistema - propietario')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_council_roles ON auth.users;
CREATE TRIGGER on_auth_user_council_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_council_first_user();
