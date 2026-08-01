-- ============================================================
-- 00057: Autor de libros con IA (C7) — columnas aditivas sobre
-- el esquema del Consejo Invisible (invisible_council_books).
-- Aditiva y reversible (DROP COLUMN/constraint revierte).
-- No toca políticas RLS existentes (00031/00035 se mantienen);
-- el acceso se controla por requireOwner() en la API (C7).
-- ============================================================

ALTER TABLE public.invisible_council_books
  ADD COLUMN IF NOT EXISTS outline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'Don Miguel',
  ADD COLUMN IF NOT EXISTS style_guide TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS published_book_id UUID REFERENCES public.library_books(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

ALTER TABLE public.invisible_council_book_chapters
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_council_books_published
  ON public.invisible_council_books (published_book_id);
