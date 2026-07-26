-- ================================================================
-- 00007 — MARKETPLACE PRODUCTS + VARIANTS + IMAGES
-- Productos del marketplace con variantes e imágenes
-- ================================================================

CREATE TYPE product_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'out_of_stock',
  'paused',
  'rejected',
  'archived'
);

CREATE TYPE product_source AS ENUM (
  'own',
  'supplier',
  'affiliate'
);

-- TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id              UUID REFERENCES public.marketplace_stores(id) ON DELETE CASCADE NOT NULL,
  category_id           UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  provider_id           UUID REFERENCES public.marketplace_providers(id) ON DELETE SET NULL,
  
  -- Identidad
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  description           TEXT DEFAULT '',
  short_description     TEXT DEFAULT '',
  
  -- Fuente
  source                product_source NOT NULL DEFAULT 'own',
  
  -- Identificadores externos
  sku                   TEXT DEFAULT '',
  external_id           TEXT DEFAULT '',
  external_url          TEXT DEFAULT '',
  
  -- Precios
  base_price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'USD',
  tax_rate              NUMERIC(5,2) DEFAULT 0,
  service_fee           NUMERIC(10,2) DEFAULT 0,
  margin                NUMERIC(10,2) DEFAULT 0,
  
  -- Envío
  estimated_shipping    NUMERIC(10,2) DEFAULT 0,
  shipping_from_country TEXT DEFAULT '',
  free_shipping         BOOLEAN DEFAULT false,
  
  -- Inventario
  stock                 INTEGER DEFAULT 0,
  low_stock_threshold   INTEGER DEFAULT 5,
  track_inventory       BOOLEAN DEFAULT true,
  
  -- Físico
  weight_grams          INTEGER DEFAULT 0,
  width_cm              NUMERIC(8,2) DEFAULT 0,
  height_cm             NUMERIC(8,2) DEFAULT 0,
  depth_cm              NUMERIC(8,2) DEFAULT 0,
  
  -- Entrega
  estimated_delivery_days INTEGER DEFAULT 7,
  delivery_modes        TEXT[] DEFAULT '{"seller_delivery"}',
  
  -- Devolución
  return_policy         TEXT DEFAULT '',
  return_days           INTEGER DEFAULT 30,
  
  -- País de entrega
  countries_deliver_to  TEXT[] DEFAULT '{"US"}',
  
  -- SEO
  tags                  TEXT[] DEFAULT '{}',
  
  -- Estado
  status                product_status NOT NULL DEFAULT 'draft',
  rejection_reason      TEXT DEFAULT '',
  
  -- Sincronización
  sync_status           TEXT DEFAULT 'manual',
  last_synced_at        TIMESTAMPTZ,
  
  -- Métricas
  view_count            INTEGER DEFAULT 0,
  sales_count           INTEGER DEFAULT 0,
  average_rating        NUMERIC(3,2) DEFAULT 0,
  review_count          INTEGER DEFAULT 0,
  favorite_count        INTEGER DEFAULT 0,
  
  -- Timestamps
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_store ON public.marketplace_products(store_id);
CREATE INDEX idx_products_category ON public.marketplace_products(category_id);
CREATE INDEX idx_products_provider ON public.marketplace_products(provider_id);
CREATE INDEX idx_products_slug ON public.marketplace_products(slug);
CREATE INDEX idx_products_status ON public.marketplace_products(status);
CREATE INDEX idx_products_source ON public.marketplace_products(source);
CREATE INDEX idx_products_price ON public.marketplace_products(final_price);
CREATE INDEX idx_products_country ON public.marketplace_products USING GIN(countries_deliver_to);
CREATE INDEX idx_products_tags ON public.marketplace_products USING GIN(tags);

-- TABLA VARIANTES
CREATE TABLE IF NOT EXISTS public.marketplace_product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  
  name            TEXT NOT NULL,
  sku             TEXT DEFAULT '',
  
  -- Precios (override del producto base)
  price_override  NUMERIC(10,2),
  
  -- Stock por variante
  stock           INTEGER DEFAULT 0,
  
  -- Atributos (JSON: {color: "Rojo", size: "XL"})
  attributes      JSONB NOT NULL DEFAULT '{}',
  
  -- Imagen principal de la variante
  image_url       TEXT DEFAULT '',
  
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_product_variants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_variants_product ON public.marketplace_product_variants(product_id);

-- TABLA IMÁGENES
CREATE TABLE IF NOT EXISTS public.marketplace_product_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  
  url             TEXT NOT NULL,
  alt_text        TEXT DEFAULT '',
  sort_order      INTEGER DEFAULT 0,
  is_primary      BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_product_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_images_product ON public.marketplace_product_images(product_id);

-- RLS PRODUCTOS
-- Público puede ver productos publicados
CREATE POLICY "products_select_public" ON public.marketplace_products
  FOR SELECT USING (status = 'published');

-- Owner de tienda puede ver sus productos (cualquier estado)
CREATE POLICY "products_select_owner" ON public.marketplace_products
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Admin puede ver todos
CREATE POLICY "products_select_admin" ON public.marketplace_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Owner de tienda puede insertar productos
CREATE POLICY "products_insert_owner" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Owner de tienda puede actualizar sus productos
CREATE POLICY "products_update_owner" ON public.marketplace_products
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Admin puede actualizar cualquier producto
CREATE POLICY "products_update_admin" ON public.marketplace_products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Owner de tienda puede eliminar sus productos (solo draft/rejected)
CREATE POLICY "products_delete_owner" ON public.marketplace_products
  FOR DELETE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
    AND status IN ('draft', 'rejected')
  );

-- RLS VARIANTES: mismo patrón que productos
CREATE POLICY "variants_select_public" ON public.marketplace_product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_products WHERE id = product_id AND status = 'published')
  );

CREATE POLICY "variants_select_owner" ON public.marketplace_product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "variants_insert_owner" ON public.marketplace_product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "variants_update_owner" ON public.marketplace_product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "variants_delete_owner" ON public.marketplace_product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

-- RLS IMÁGENES: mismo patrón
CREATE POLICY "images_select_public" ON public.marketplace_product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_products WHERE id = product_id AND status = 'published')
  );

CREATE POLICY "images_insert_owner" ON public.marketplace_product_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "images_delete_owner" ON public.marketplace_product_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );
