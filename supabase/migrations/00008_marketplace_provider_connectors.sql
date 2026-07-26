-- ================================================================
-- 00008 — MARKETPLACE PROVIDER CONNECTORS
-- Mapeo productos↔proveedores, precios, inventario
-- ================================================================

-- TABLA MAPEO PRODUCTO ↔ PROVEEDOR
CREATE TABLE IF NOT EXISTS public.marketplace_provider_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  provider_id       UUID REFERENCES public.marketplace_providers(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificador en el proveedor
  external_product_id TEXT DEFAULT '',
  external_url      TEXT DEFAULT '',
  
  -- Precios del proveedor
  provider_price    NUMERIC(10,2) DEFAULT 0,
  currency          TEXT DEFAULT 'USD',
  
  -- Disponibilidad
  is_available      BOOLEAN DEFAULT true,
  
  -- Última sincronización
  last_synced_at    TIMESTAMPTZ,
  sync_error        TEXT DEFAULT '',
  
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, provider_id)
);

ALTER TABLE public.marketplace_provider_products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pproducts_product ON public.marketplace_provider_products(product_id);
CREATE INDEX idx_pproducts_provider ON public.marketplace_provider_products(provider_id);

-- TABLA HISTORIAL DE PRECIOS DEL PROVEEDOR
CREATE TABLE IF NOT EXISTS public.marketplace_provider_prices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_product_id UUID REFERENCES public.marketplace_provider_products(id) ON DELETE CASCADE NOT NULL,
  
  price             NUMERIC(10,2) NOT NULL,
  currency          TEXT DEFAULT 'USD',
  
  source            TEXT DEFAULT 'sync',
  recorded_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_provider_prices ENABLE ROW LEVEL_SECURITY;

CREATE INDEX idx_pprices_provider_product ON public.marketplace_provider_prices(provider_product_id);
CREATE INDEX idx_pprices_recorded ON public.marketplace_provider_prices(recorded_at);

-- TABLA INVENTARIO DEL PROVEEDOR
CREATE TABLE IF NOT EXISTS public.marketplace_provider_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_product_id UUID REFERENCES public.marketplace_provider_products(id) ON DELETE CASCADE NOT NULL,
  
  stock             INTEGER DEFAULT 0,
  available         BOOLEAN DEFAULT true,
  
  warehouse_location TEXT DEFAULT '',
  restock_date      TIMESTAMPTZ,
  
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(provider_product_id)
);

ALTER TABLE public.marketplace_provider_inventory ENABLE ROW LEVEL SECURITY;

-- RLS: solo owner de tienda y admin pueden ver
CREATE POLICY "pproducts_select_owner" ON public.marketplace_provider_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "pproducts_select_admin" ON public.marketplace_provider_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "pproducts_insert_owner" ON public.marketplace_provider_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "pprices_select_owner" ON public.marketplace_provider_prices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_provider_products pp
      JOIN public.marketplace_products p ON pp.product_id = p.id
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE pp.id = provider_product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "pprices_select_admin" ON public.marketplace_provider_prices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "pprices_insert_admin" ON public.marketplace_provider_prices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "pinventory_select_owner" ON public.marketplace_provider_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_provider_products pp
      JOIN public.marketplace_products p ON pp.product_id = p.id
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE pp.id = provider_product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "pinventory_select_admin" ON public.marketplace_provider_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "pinventory_update_admin" ON public.marketplace_provider_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
