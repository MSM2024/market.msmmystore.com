-- ================================================================
-- 00006 — MARKETPLACE STORES + STORE MEMBERS
-- Tiendas de vendedores y miembros autorizados
-- ================================================================

CREATE TYPE store_status AS ENUM (
  'draft',
  'pending_review',
  'active',
  'paused',
  'suspended',
  'rejected'
);

CREATE TYPE store_verification_level AS ENUM (
  'none',
  'email_verified',
  'identity_verified',
  'business_verified',
  'premium'
);

CREATE TYPE store_member_role AS ENUM (
  'owner',
  'admin',
  'manager',
  'member',
  'viewer'
);

-- TABLA TIENDAS
CREATE TABLE IF NOT EXISTS public.marketplace_stores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identidad
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  description           TEXT DEFAULT '',
  
  -- Branding
  logo_url              TEXT DEFAULT '',
  cover_url             TEXT DEFAULT '',
  
  -- Ubicación
  country               TEXT NOT NULL DEFAULT 'US',
  city                  TEXT DEFAULT '',
  
  -- Contacto
  whatsapp              TEXT DEFAULT '',
  email                 TEXT DEFAULT '',
  website               TEXT DEFAULT '',
  
  -- Redes sociales
  social_instagram      TEXT DEFAULT '',
  social_facebook       TEXT DEFAULT '',
  social_tiktok         TEXT DEFAULT '',
  social_youtube        TEXT DEFAULT '',
  
  -- Configuración
  currency              TEXT NOT NULL DEFAULT 'USD',
  timezone              TEXT DEFAULT 'America/New_York',
  
  -- Políticas
  return_policy         TEXT DEFAULT '',
  shipping_policy       TEXT DEFAULT '',
  
  -- Estado
  status                store_status NOT NULL DEFAULT 'draft',
  verification_level    store_verification_level NOT NULL DEFAULT 'none',
  rejection_reason      TEXT DEFAULT '',
  
  -- Métricas
  product_count         INTEGER DEFAULT 0,
  total_sales           INTEGER DEFAULT 0,
  total_revenue         NUMERIC(12,2) DEFAULT 0,
  average_rating        NUMERIC(3,2) DEFAULT 0,
  review_count          INTEGER DEFAULT 0,
  follower_count        INTEGER DEFAULT 0,
  
  -- Configuración de comisiones
  commission_rate       NUMERIC(5,2) DEFAULT 10.0,
  
  -- Timestamps
  approved_at           TIMESTAMPTZ,
  suspended_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_stores ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_stores_slug ON public.marketplace_stores(slug);
CREATE INDEX idx_stores_owner ON public.marketplace_stores(owner_id);
CREATE INDEX idx_stores_status ON public.marketplace_stores(status);
CREATE INDEX idx_stores_country ON public.marketplace_stores(country);

-- TABLA MIEMBROS DE TIENDA
CREATE TABLE IF NOT EXISTS public.marketplace_store_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID REFERENCES public.marketplace_stores(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        store_member_role NOT NULL DEFAULT 'member',
  invited_by  UUID REFERENCES auth.users(id),
  joined_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, user_id)
);

ALTER TABLE public.marketplace_store_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_store_members_store ON public.marketplace_store_members(store_id);
CREATE INDEX idx_store_members_user ON public.marketplace_store_members(user_id);

-- RLS TIENDAS
-- Público puede ver tiendas activas
CREATE POLICY "stores_select_public" ON public.marketplace_stores
  FOR SELECT USING (status = 'active');

-- Propietario puede ver su propia tienda (cualquier estado)
CREATE POLICY "stores_select_owner" ON public.marketplace_stores
  FOR SELECT USING (auth.uid() = owner_id);

-- Admin puede ver todas
CREATE POLICY "stores_select_admin" ON public.marketplace_stores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Seller puede crear tienda
CREATE POLICY "stores_insert_seller" ON public.marketplace_stores
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller', 'admin', 'superadmin'))
  );

-- Propietario puede actualizar su tienda
CREATE POLICY "stores_update_owner" ON public.marketplace_stores
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admin puede actualizar cualquier tienda
CREATE POLICY "stores_update_admin" ON public.marketplace_stores
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Propietario puede eliminar su tienda (solo draft)
CREATE POLICY "stores_delete_owner" ON public.marketplace_stores
  FOR DELETE USING (auth.uid() = owner_id AND status = 'draft');

-- RLS MIEMBROS
-- Miembros pueden ver quién está en su tienda
CREATE POLICY "store_members_select_own_store" ON public.marketplace_store_members
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Owner/Admin puede agregar miembros
CREATE POLICY "store_members_insert_owner" ON public.marketplace_store_members
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Owner/Admin puede actualizar miembros
CREATE POLICY "store_members_update_owner" ON public.marketplace_store_members
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Owner/Admin puede eliminar miembros
CREATE POLICY "store_members_delete_owner" ON public.marketplace_store_members
  FOR DELETE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );
