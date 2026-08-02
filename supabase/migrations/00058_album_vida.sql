-- ============================================================
-- 00058: ÁLBUM DE LA VIDA (C8) — familia, árbol y línea de tiempo
-- Aditiva y reversible (DROP TABLE revierte). RLS por propietario
-- con visibilidad pública/comunidad para compartir el legado.
-- Reutiliza handle_updated_at() y is_admin_or_superadmin() ya
-- existentes (00042 / 00031).
-- ============================================================

-- 1. FAMILIAS (raíz del árbol)
CREATE TABLE IF NOT EXISTS public.album_families (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  subtitle      TEXT DEFAULT '',
  privacy       TEXT NOT NULL DEFAULT 'solo_yo' CHECK (privacy IN ('solo_yo','familia','comunidad','publica')),
  accent_color  TEXT DEFAULT '#7C3AED',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MIEMBROS (nodos del árbol)
CREATE TABLE IF NOT EXISTS public.album_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.album_families(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES public.album_members(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  birth_date      DATE,
  death_date      DATE,
  bio             TEXT DEFAULT '',
  relation        TEXT DEFAULT 'hijo' CHECK (relation IN ('raiz','pareja','hijo','otro')),
  avatar_media_id UUID,
  legacy_notes    TEXT DEFAULT '',
  sort_order      INT DEFAULT 0,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EVENTOS DE LÍNEA DE TIEMPO
CREATE TABLE IF NOT EXISTS public.album_timeline_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES public.album_families(id) ON DELETE CASCADE,
  member_id     UUID REFERENCES public.album_members(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  event_date    DATE,
  category      TEXT DEFAULT 'recuerdo' CHECK (category IN ('nacimiento','boda','viaje','logro','recuerdo','otro')),
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEDIA DE EVENTOS
CREATE TABLE IF NOT EXISTS public.album_event_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.album_timeline_events(id) ON DELETE CASCADE,
  member_id     UUID REFERENCES public.album_members(id) ON DELETE SET NULL,
  media_type    TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video','audio','document')),
  url           TEXT NOT NULL,
  storage_path  TEXT DEFAULT '',
  filename      TEXT DEFAULT '',
  caption       TEXT DEFAULT '',
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_album_families_owner   ON public.album_families (owner_id);
CREATE INDEX IF NOT EXISTS idx_album_members_family   ON public.album_members (family_id);
CREATE INDEX IF NOT EXISTS idx_album_members_parent   ON public.album_members (parent_id);
CREATE INDEX IF NOT EXISTS idx_album_events_family    ON public.album_timeline_events (family_id);
CREATE INDEX IF NOT EXISTS idx_album_events_member    ON public.album_timeline_events (member_id);
CREATE INDEX IF NOT EXISTS idx_album_events_date      ON public.album_timeline_events (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_album_media_event      ON public.album_event_media (event_id);

-- 6. ROW LEVEL SECURITY
ALTER TABLE public.album_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_event_media ENABLE ROW LEVEL SECURITY;

-- 6a. FAMILIAS RLS
DROP POLICY IF EXISTS "album_families_select" ON public.album_families;
CREATE POLICY "album_families_select"
  ON public.album_families FOR SELECT
  USING (
    owner_id = auth.uid()
    OR privacy IN ('publica','comunidad')
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "album_families_insert" ON public.album_families;
CREATE POLICY "album_families_insert"
  ON public.album_families FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "album_families_update" ON public.album_families;
CREATE POLICY "album_families_update"
  ON public.album_families FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "album_families_delete" ON public.album_families;
CREATE POLICY "album_families_delete"
  ON public.album_families FOR DELETE
  USING (owner_id = auth.uid());

-- 6b. MIEMBROS RLS
DROP POLICY IF EXISTS "album_members_select" ON public.album_members;
CREATE POLICY "album_members_select"
  ON public.album_members FOR SELECT
  USING (
    family_id IN (
      SELECT id FROM public.album_families
      WHERE owner_id = auth.uid() OR privacy IN ('publica','comunidad')
    )
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "album_members_insert" ON public.album_members;
CREATE POLICY "album_members_insert"
  ON public.album_members FOR INSERT
  WITH CHECK (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "album_members_update" ON public.album_members;
CREATE POLICY "album_members_update"
  ON public.album_members FOR UPDATE
  USING (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "album_members_delete" ON public.album_members;
CREATE POLICY "album_members_delete"
  ON public.album_members FOR DELETE
  USING (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
  );

-- 6c. EVENTOS RLS
DROP POLICY IF EXISTS "album_events_select" ON public.album_timeline_events;
CREATE POLICY "album_events_select"
  ON public.album_timeline_events FOR SELECT
  USING (
    family_id IN (
      SELECT id FROM public.album_families
      WHERE owner_id = auth.uid() OR privacy IN ('publica','comunidad')
    )
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "album_events_insert" ON public.album_timeline_events;
CREATE POLICY "album_events_insert"
  ON public.album_timeline_events FOR INSERT
  WITH CHECK (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "album_events_update" ON public.album_timeline_events;
CREATE POLICY "album_events_update"
  ON public.album_timeline_events FOR UPDATE
  USING (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "album_events_delete" ON public.album_timeline_events;
CREATE POLICY "album_events_delete"
  ON public.album_timeline_events FOR DELETE
  USING (
    family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
  );

-- 6d. MEDIA RLS
DROP POLICY IF EXISTS "album_media_select" ON public.album_event_media;
CREATE POLICY "album_media_select"
  ON public.album_event_media FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.album_timeline_events
      WHERE family_id IN (
        SELECT id FROM public.album_families
        WHERE owner_id = auth.uid() OR privacy IN ('publica','comunidad')
      )
    )
    OR public.is_admin_or_superadmin()
  );

DROP POLICY IF EXISTS "album_media_insert" ON public.album_event_media;
CREATE POLICY "album_media_insert"
  ON public.album_event_media FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.album_timeline_events
      WHERE family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "album_media_update" ON public.album_event_media;
CREATE POLICY "album_media_update"
  ON public.album_event_media FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.album_timeline_events
      WHERE family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "album_media_delete" ON public.album_event_media;
CREATE POLICY "album_media_delete"
  ON public.album_event_media FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.album_timeline_events
      WHERE family_id IN (SELECT id FROM public.album_families WHERE owner_id = auth.uid())
    )
  );

-- 7. TRIGGERS: auto-update updated_at
DROP TRIGGER IF EXISTS trg_album_families_updated_at ON public.album_families;
CREATE TRIGGER trg_album_families_updated_at
  BEFORE UPDATE ON public.album_families
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_album_members_updated_at ON public.album_members;
CREATE TRIGGER trg_album_members_updated_at
  BEFORE UPDATE ON public.album_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_album_events_updated_at ON public.album_timeline_events;
CREATE TRIGGER trg_album_events_updated_at
  BEFORE UPDATE ON public.album_timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- MIGRATION COMPLETE
