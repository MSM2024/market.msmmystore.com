-- 00054 — GESTIÓN DE SESIONES PARA EL PROPIETARIO DE LA SESIÓN
-- Exponer al usuario autenticado el listado y revocación de SUS PROPIAS sesiones
-- (auth.sessions no es accesible vía PostgREST; funciones SECURITY DEFINER).

-- 1. Listar mis sesiones activas
CREATE OR REPLACE FUNCTION public.list_my_sessions()
RETURNS TABLE (
  session_id UUID,
  user_agent TEXT,
  ip INET,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  factor_id UUID,
  aal TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.user_agent, s.ip, s.created_at, s.updated_at, s.factor_id, s.aal
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.updated_at DESC;
$$;

-- 2. Revocar una de mis sesiones (solo la propia)
CREATE OR REPLACE FUNCTION public.revoke_my_session(p_session_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.sessions
  WHERE id = p_session_id AND user_id = auth.uid();
$$;

-- 3. Revocar todas mis sesiones excepto la actual
CREATE OR REPLACE FUNCTION public.revoke_other_sessions(p_current_session UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.sessions
  WHERE user_id = auth.uid() AND id <> p_current_session;
$$;

-- 4. Permisos: solo usuarios autenticados
GRANT EXECUTE ON FUNCTION public.list_my_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_my_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_other_sessions(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.list_my_sessions() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_my_session(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_other_sessions(UUID) FROM public, anon;
