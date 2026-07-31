-- ================================================================
-- 00053 — CORREO ÚNICO DEL SISTEMA
-- ================================================================
-- Confirmado por Don Miguel: la cuenta única de login, recuperación,
-- notificaciones y administración es msmmystore@gmail.com.
--
-- cm8msm@gmail.com se CONSERVA como cuenta secundaria (no se elimina
-- información personal ni se tocan sus datos). Solo se consolida el
-- rol OWNER_SUPERADMIN en la cuenta única del sistema.
-- ================================================================

-- 1. Consolidar OWNER + LIFETIME_UNLIMITED en la cuenta única
UPDATE public.profiles
SET role = 'owner',
    plan = 'lifetime_unlimited',
    full_name = 'Miguel Soria Martínez',
    updated_at = NOW()
WHERE email = 'msmmystore@gmail.com'
  AND role <> 'owner';

-- 2. Guardar la auditoría de la consolidación
INSERT INTO public.audit_logs (user_id, action, resource, details)
SELECT
  id,
  'correo_unico',
  'profile',
  jsonb_build_object(
    'description', 'OPENCODE: Correo único del sistema consolidado en msmmystore@gmail.com (OWNER_SUPERADMIN + LIFETIME_UNLIMITED)',
    'email', email,
    'permissions', '*',
    'billing_required', false,
    'expires_at', null
  )
FROM public.profiles
WHERE email = 'msmmystore@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.audit_logs
    WHERE action = 'correo_unico' AND resource = 'profile'
      AND user_id = public.profiles.id
  );

-- MIGRATION COMPLETE
