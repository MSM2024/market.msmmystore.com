-- 00060 - Perfil público por username (lookup seguro con SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.get_public_profile(p_username TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  role TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id,
         COALESCE(NULLIF(p.full_name, ''), NULLIF(p.name, ''), '') AS name,
         p.username,
         p.role,
         COALESCE(NULLIF(p.avatar_url, ''), NULLIF(p.avatar, ''), '') AS avatar,
         p.created_at,
         p.status
  FROM public.profiles p
  WHERE p.username = p_username
    AND (p.status IS NULL OR p.status = 'active')
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(TEXT) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
