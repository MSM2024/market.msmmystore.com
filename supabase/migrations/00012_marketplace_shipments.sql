-- ================================================================
-- 00012 — MARKETPLACE SHIPMENTS + TRACKING
-- Envíos, seguimiento y eventos de rastreo
-- ================================================================

CREATE TYPE shipment_status AS ENUM (
  'pending',
  'confirmed',
  'purchased_from_provider',
  'processing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled'
);

CREATE TYPE shipment_provider AS ENUM (
  'provider_direct',
  'msm_delivery',
  'seller_delivery',
  'usps',
  'fedex',
  'ups',
  'dhl',
  'correos_cuba',
  'cuba_logistics',
  'digital',
  'other'
);

-- TABLA ENVÍOS
CREATE TABLE IF NOT EXISTS public.marketplace_shipments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Transportista
  provider              shipment_provider NOT NULL DEFAULT 'seller_delivery',
  
  -- Tracking
  tracking_number       TEXT DEFAULT '',
  tracking_url          TEXT DEFAULT '',
  
  -- Estado
  status                shipment_status NOT NULL DEFAULT 'pending',
  
  -- Origen y destino
  shipped_from_country  TEXT DEFAULT '',
  shipped_from_city     TEXT DEFAULT '',
  destination_country   TEXT DEFAULT 'US',
  destination_city      TEXT DEFAULT '',
  destination_address   TEXT DEFAULT '',
  
  -- Cuba
  cuba_receiver_name    TEXT DEFAULT '',
  cuba_receiver_phone   TEXT DEFAULT '',
  cuba_delivery_photo   TEXT DEFAULT '',
  
  -- Tiempos
  estimated_delivery    TIMESTAMPTZ,
  actual_delivery       TIMESTAMPTZ,
  shipped_at            TIMESTAMPTZ,
  
  -- Peso y dimensiones
  weight_grams          INTEGER DEFAULT 0,
  
  -- Costo
  shipping_cost         NUMERIC(10,2) DEFAULT 0,
  
  -- Notas
  notes                 TEXT DEFAULT '',
  
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_shipments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shipments_order ON public.marketplace_shipments(order_id);
CREATE INDEX idx_shipments_status ON public.marketplace_shipments(status);
CREATE INDEX idx_shipments_tracking ON public.marketplace_shipments(tracking_number);

-- TABLA EVENTOS DE SEGUIMIENTO
CREATE TABLE IF NOT EXISTS public.marketplace_tracking_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID REFERENCES public.marketplace_shipments(id) ON DELETE CASCADE NOT NULL,
  
  status          TEXT NOT NULL,
  location        TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  
  event_time      TIMESTAMPTZ DEFAULT now(),
  source          TEXT DEFAULT 'manual',
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tracking_events_shipment ON public.marketplace_tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_time ON public.marketplace_tracking_events(event_time);

-- RLS SHIPMENTS
-- Comprador puede ver envíos de sus pedidos
CREATE POLICY "shipments_select_buyer" ON public.marketplace_shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Vendedor puede ver envíos de su tienda
CREATE POLICY "shipments_select_seller" ON public.marketplace_shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

-- Admin puede ver todos
CREATE POLICY "shipments_select_admin" ON public.marketplace_shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Vendedor puede crear/actualizar envíos de su tienda
CREATE POLICY "shipments_insert_seller" ON public.marketplace_shipments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "shipments_update_seller" ON public.marketplace_shipments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "shipments_update_admin" ON public.marketplace_shipments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS TRACKING EVENTS
CREATE POLICY "tracking_select_buyer" ON public.marketplace_tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_shipments sh
      JOIN public.marketplace_orders o ON sh.order_id = o.id
      WHERE sh.id = shipment_id AND o.buyer_id = auth.uid()
    )
  );

CREATE POLICY "tracking_select_seller" ON public.marketplace_tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_shipments sh
      JOIN public.marketplace_orders o ON sh.order_id = o.id
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE sh.id = shipment_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "tracking_insert_seller" ON public.marketplace_tracking_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_shipments sh
      JOIN public.marketplace_orders o ON sh.order_id = o.id
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE sh.id = shipment_id AND s.owner_id = auth.uid()
    )
  );
