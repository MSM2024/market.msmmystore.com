-- ============================================================
-- 00055: Categoría de privacidad de 4 niveles para Biblioteca Viva
-- Aditiva y reversible (DROP COLUMN basta para revertir).
-- Los 7 niveles de library_privacy_level se agrupan en 4
-- categorías PÚBLICO / INTERNO / PRIVADO / CONFIDENCIAL según
-- ROADMAP_ZAFIRO.md C6. No cambia políticas RLS existentes
-- (00046 sigue restringiendo lectura/escritura a owner/superadmin);
-- esta columna habilita la futura publicación selectiva.
-- ============================================================

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS privacy_category TEXT;

UPDATE public.library_books
  SET privacy_category = CASE privacy_level
    WHEN 'publico' THEN 'publico'
    WHEN 'comunidad' THEN 'interno'
    WHEN 'interno_eliana' THEN 'interno'
    WHEN 'equipo_msm' THEN 'privado'
    WHEN 'familia' THEN 'privado'
    WHEN 'privado_don_miguel' THEN 'privado'
    WHEN 'legado_futuro' THEN 'confidencial'
    ELSE 'interno'
  END
  WHERE privacy_category IS NULL;

ALTER TABLE public.library_books
  ADD CONSTRAINT library_books_privacy_category_check
  CHECK (privacy_category IN ('publico', 'interno', 'privado', 'confidencial'));

ALTER TABLE public.library_books
  ALTER COLUMN privacy_category SET DEFAULT 'interno',
  ALTER COLUMN privacy_category SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_library_books_privacy_category
  ON public.library_books (privacy_category);
