-- ================================================================
-- 00013 — MARKETPLACE BUSINESS RULES
-- Reglas de precio, historial, cupones, comisiones
-- ================================================================

CREATE TYPE price_rule_type AS ENUM (
  'percentage',
  'fixed',
  'manual',
  'tiered'
);

CREATE TYPE price_rule_target AS ENUM (
  'product',
  'category',
  'store',
  'provider',
  'global'
);

CREATE TYPE coupon_type AS ENUM (
  'percentage',
  'fixed_amount',
  'free_shipping',
  'buy_x_get_y'
);

CREATE TYPE commission_type AS ENUM (
  'marketplace_fee',
  'seller_commission',
  'affiliate_commission',
  'provider_cost',
  'payment_processing'
);

-- TABLA REGLAS DE PRECIO
CREATE TABLE IF NOT EXISTS public.marketplace_price_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name              TEXT NOT NULL,
  description       TEXT DEFAULT '',
  
  -- Tipo de regla
  rule_type         price_rule_type NOT NULL,
  target            price_rule_target NOT NULL DEFAULT 'product',
  
  -- Valores
  percentage        NUMERIC(5,2) DEFAULT 0,
  fixed_amount      NUMERIC(10,2) DEFAULT 0,
  
  -- Aplicación condicional
  target_id         UUID,
  min_quantity      INTEGER DEFAULT 1,
  min_amount        NUMERIC(10,2) DEFAULT 0,
  
  -- Vigencia
  valid_from        TIMESTAMPTZ DEFAULT now(),
  valid_until       TIMESTAMPTZ,
  
  -- Estado
  is_active         BOOLEAN DEFAULT true,
  priority          INTEGER DEFAULT 0,
  
  -- Límites de uso
  max_uses          INTEGER DEFAULT 0,
  current_uses      INTEGER DEFAULT 0,
  
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_price_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_price_rules_target ON public.marketplace_price_rules(target, target_id);
CREATE INDEX idx_price_rules_active ON public.marketplace_price_rules(is_active);

-- TABLA HISTORIAL DE PRECIOS
CREATE TABLE IF NOT EXISTS public.marketplace_price_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  
  previous_price    NUMERIC(10,2) NOT NULL,
  new_price         NUMERIC(10,2) NOT NULL,
  currency          TEXT DEFAULT 'USD',
  
  changed_by        UUID REFERENCES auth.users(id),
  reason            TEXT DEFAULT '',
  
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_price_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_price_history_product ON public.marketplace_price_history(product_id);
CREATE INDEX idx_price_history_date ON public.marketplace_price_history(created_at);

-- TABLA CUPONES
CREATE TABLE IF NOT EXISTS public.marketplace_coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code              TEXT UNIQUE NOT NULL,
  description       TEXT DEFAULT '',
  
  -- Tipo y valor
  coupon_type       coupon_type NOT NULL,
  value             NUMERIC(10,2) NOT NULL,
  
  -- Aplicación
  min_order_amount  NUMERIC(10,2) DEFAULT 0,
  max_discount      NUMERIC(10,2) DEFAULT 0,
  
  -- Restricciones
  store_id          UUID REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  applicable_products UUID[] DEFAULT '{}',
  applicable_categories UUID[] DEFAULT '{}',
  
  -- Límites
  max_uses_total    INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses      INTEGER DEFAULT 0,
  
  -- Vigencia
  valid_from        TIMESTAMPTZ DEFAULT now(),
  valid_until       TIMESTAMPTZ,
  
  -- Estado
  is_active         BOOLEAN DEFAULT true,
  
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_coupons ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_coupons_code ON public.marketplace_coupons(code);
CREATE INDEX idx_coupons_store ON public.marketplace_coupons(store_id);
CREATE INDEX idx_coupons_active ON public.marketplace_coupons(is_active);

-- TABLA COMISIONES
CREATE TABLE IF NOT EXISTS public.marketplace_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  payment_id        UUID REFERENCES public.marketplace_payments(id) ON DELETE SET NULL,
  
  -- Tipo y monto
  commission_type   commission_type NOT NULL,
  amount            NUMERIC(10,2) NOT NULL,
  percentage        NUMERIC(5,2) DEFAULT 0,
  
  -- Referencia
  recipient_id      UUID REFERENCES auth.users(id),
  store_id          UUID REFERENCES public.marketplace_stores(id),
  
  -- Estado
  is_paid           BOOLEAN DEFAULT false,
  paid_at           TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_commissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_commissions_order ON public.marketplace_commissions(order_id);
CREATE INDEX idx_commissions_store ON public.marketplace_commissions(store_id);
CREATE INDEX idx_commissions_type ON public.marketplace_commissions(commission_type);

-- RLS REGLAS DE PRECIO: solo admin
CREATE POLICY "price_rules_select_admin" ON public.marketplace_price_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "price_rules_insert_admin" ON public.marketplace_price_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "price_rules_update_admin" ON public.marketplace_price_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS HISTORIAL DE PRECIOS
CREATE POLICY "price_history_select_seller" ON public.marketplace_price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "price_history_select_admin" ON public.marketplace_price_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "price_history_insert_seller" ON public.marketplace_price_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_products p
      JOIN public.marketplace_stores s ON p.store_id = s.id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

-- RLS CUPONES
CREATE POLICY "coupons_select_seller" ON public.marketplace_coupons
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "coupons_select_admin" ON public.marketplace_coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "coupons_insert_seller" ON public.marketplace_coupons
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "coupons_update_seller" ON public.marketplace_coupons
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- RLS COMISIONES
CREATE POLICY "commissions_select_seller" ON public.marketplace_commissions
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "commissions_select_admin" ON public.marketplace_commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'finance'))
  );
