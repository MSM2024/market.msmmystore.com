-- ================================================================
-- 00010 — MARKETPLACE ORDERS
-- Pedidos, items, historial de estados
-- ================================================================

CREATE TYPE order_status AS ENUM (
  'cart',
  'quotation',
  'pending_confirmation',
  'pending_payment',
  'payment_under_review',
  'paid',
  'approved',
  'provider_purchase_pending',
  'purchased',
  'processing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
  'refund_requested',
  'refunded',
  'disputed'
);

CREATE TYPE delivery_mode AS ENUM (
  'provider_direct',
  'msm_delivery',
  'seller_delivery',
  'pickup',
  'cuba_authorized_logistics',
  'international_shipping',
  'digital_delivery'
);

-- TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  buyer_id              UUID REFERENCES auth.users(id) NOT NULL,
  store_id              UUID REFERENCES public.marketplace_stores(id) NOT NULL,
  
  -- Número de orden legible
  order_number          TEXT UNIQUE NOT NULL,
  
  -- Estado
  status                order_status NOT NULL DEFAULT 'pending_confirmation',
  
  -- Montos
  subtotal              NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost         NUMERIC(10,2) DEFAULT 0,
  tax_amount            NUMERIC(10,2) DEFAULT 0,
  service_fee           NUMERIC(10,2) DEFAULT 0,
  discount_amount       NUMERIC(10,2) DEFAULT 0,
  total_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'USD',
  
  -- Entrega
  delivery_mode         delivery_mode NOT NULL DEFAULT 'seller_delivery',
  delivery_info         JSONB DEFAULT '{}',
  
  -- Dirección de entrega (estructurada)
  shipping_name         TEXT DEFAULT '',
  shipping_phone        TEXT DEFAULT '',
  shipping_address      TEXT DEFAULT '',
  shipping_city         TEXT DEFAULT '',
  shipping_state        TEXT DEFAULT '',
  shipping_zip          TEXT DEFAULT '',
  shipping_country      TEXT DEFAULT 'US',
  
  -- Cuba: campos adicionales
  cuba_province         TEXT DEFAULT '',
  cuba_municipality     TEXT DEFAULT '',
  cuba_locality         TEXT DEFAULT '',
  cuba_reference_point  TEXT DEFAULT '',
  
  -- Notas
  buyer_notes           TEXT DEFAULT '',
  seller_notes          TEXT DEFAULT '',
  
  -- Tiempo
  confirmed_at          TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  shipped_at            TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_orders_store ON public.marketplace_orders(store_id);
CREATE INDEX idx_orders_status ON public.marketplace_orders(status);
CREATE INDEX idx_orders_number ON public.marketplace_orders(order_number);
CREATE INDEX idx_orders_created ON public.marketplace_orders(created_at);

-- TABLA ITEMS DEL PEDIDO
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES public.marketplace_products(id) ON DELETE SET NULL,
  variant_id      UUID REFERENCES public.marketplace_product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot del producto al momento de la compra
  product_name    TEXT NOT NULL,
  product_image   TEXT DEFAULT '',
  variant_name    TEXT DEFAULT '',
  
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC(10,2) NOT NULL,
  total_price     NUMERIC(10,2) NOT NULL,
  
  -- Estado del item (puede diferir del pedido)
  item_status     TEXT DEFAULT 'pending',
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_items_order ON public.marketplace_order_items(order_id);

-- TABLA HISTORIAL DE ESTADOS
CREATE TABLE IF NOT EXISTS public.marketplace_order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  
  old_status      TEXT,
  new_status      TEXT NOT NULL,
  changed_by      UUID REFERENCES auth.users(id),
  reason          TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_order_status_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_status_history_order ON public.marketplace_order_status_history(order_id);

-- RLS PEDIDOS
-- Comprador puede ver sus pedidos
CREATE POLICY "orders_select_buyer" ON public.marketplace_orders
  FOR SELECT USING (auth.uid() = buyer_id);

-- Vendedor puede ver pedidos de su tienda
CREATE POLICY "orders_select_seller" ON public.marketplace_orders
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Admin puede ver todos
CREATE POLICY "orders_select_admin" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Comprador puede crear pedidos
CREATE POLICY "orders_insert_buyer" ON public.marketplace_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Vendedor puede actualizar estado de pedidos de su tienda
CREATE POLICY "orders_update_seller" ON public.marketplace_orders
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Admin puede actualizar cualquier pedido
CREATE POLICY "orders_update_admin" ON public.marketplace_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS ORDER ITEMS
CREATE POLICY "order_items_select_buyer" ON public.marketplace_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

CREATE POLICY "order_items_select_seller" ON public.marketplace_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_buyer" ON public.marketplace_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- RLS STATUS HISTORY
CREATE POLICY "status_history_select_buyer" ON public.marketplace_order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

CREATE POLICY "status_history_select_seller" ON public.marketplace_order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "status_history_insert_seller" ON public.marketplace_order_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );
