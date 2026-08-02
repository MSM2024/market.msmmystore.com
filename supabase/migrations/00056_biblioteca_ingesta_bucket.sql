-- ============================================================
-- 00056: Bucket privado biblioteca_ingesta para copias originales
-- de la ingesta manual de txt/markdown (C6-D).
-- Reversible: DELETE FROM storage.buckets WHERE id='biblioteca_ingesta'
-- revierte. El bucket es PRIVADO (public = false): las copias
-- originales solo se sirven por Storage con sesión de owner/admin,
-- nunca por URL pública. La ingesta en BD no depende de este bucket.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'biblioteca_ingesta',
  'biblioteca_ingesta',
  false,
  5242880,
  ARRAY['text/plain', 'text/markdown', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Solo owner/admin pueden subir/leer copias originales de ingesta.
CREATE POLICY "ingesta_upload_owner_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'biblioteca_ingesta'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "ingesta_select_owner_admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'biblioteca_ingesta'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
