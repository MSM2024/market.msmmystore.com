-- ================================================================
-- 00014 — MARKETPLACE SOCIAL
-- Reviews, favoritos, disputas, auditoría
-- ================================================================

CREATE TYPE dispute_status AS ENUM (
  'open',
  'under_review',
  'awaiting_response',
  'resolved',
  'escalated',
  'closed'
);

CREATE TYPE dispute_reason AS ENUM (
  'product_not_received',
  'product_not_as_described',
  'damaged_product',
  'wrong_item',
  'quality_issue',
  'seller_no_response',
  'payment_issue',
  'other'
);

-- TABLA REVIEWS
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  order_id        UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id        UUID REFERENCES public.marketplace_stores(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenido
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           TEXT DEFAULT '',
  comment         TEXT DEFAULT '',
  
  -- Fotos del review
  images          TEXT[] DEFAULT '{}',
  
  -- Respuesta del vendedor
  seller_reply    TEXT DEFAULT '',
  seller_reply_at TIMESTAMPTZ,
  
  -- Utilidad
  helpful_count   INTEGER DEFAULT 0,
  
  -- Estado
  is_verified     BOOLEAN DEFAULT false,
  is_visible      BOOLEAN DEFAULT true,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reviews_product ON public.marketplace_reviews(product_id);
CREATE INDEX idx_reviews_store ON public.marketplace_reviews(store_id);
CREATE INDEX idx_reviews_user ON public.marketplace_reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.marketplace_reviews(rating);

-- TABLA FAVORITOS
CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_favorites_user ON public.marketplace_favorites(user_id);
CREATE INDEX idx_favorites_product ON public.marketplace_favorites(product_id);

-- TABLA DISPUTAS
CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  opened_by         UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Razón
  reason            dispute_reason NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  
  -- Estado
  status            dispute_status NOT NULL DEFAULT 'open',
  
  -- Evidencia
  evidence_urls     TEXT[] DEFAULT '{}',
  
  -- Resolución
  resolution        TEXT DEFAULT '',
  resolved_by       UUID REFERENCES auth.users(id),
  resolved_at       TIMESTAMPTZ,
  refund_amount     NUMERIC(10,2) DEFAULT 0,
  
  -- Tiempo de respuesta del vendedor
  seller_response_deadline TIMESTAMPTZ,
  seller_responded  BOOLEAN DEFAULT false,
  
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_disputes_order ON public.marketplace_disputes(order_id);
CREATE INDEX idx_disputes_status ON public.marketplace_disputes(status);
CREATE INDEX idx_disputes_opened_by ON public.marketplace_disputes(opened_by);

-- TABLA AUDITORÍA MARKETPLACE
CREATE TABLE IF NOT EXISTS public.marketplace_audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  
  -- Datos
  old_values      JSONB DEFAULT '{}',
  new_values      JSONB DEFAULT '{}',
  
  -- Contexto
  ip_address      TEXT DEFAULT '',
  user_agent      TEXT DEFAULT '',
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_user ON public.marketplace_audit_logs(user_id);
CREATE INDEX idx_audit_entity ON public.marketplace_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON public.marketplace_audit_logs(action);
CREATE INDEX idx_audit_date ON public.marketplace_audit_logs(created_at);

-- RLS REVIEWS
-- Público puede leer reviews visibles
CREATE POLICY "reviews_select_public" ON public.marketplace_reviews
  FOR SELECT USING (is_visible = true);

-- Usuario puede ver sus propias reviews
CREATE POLICY "reviews_select_own" ON public.marketplace_reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Vendedor puede ver reviews de su tienda
CREATE POLICY "reviews_select_seller" ON public.marketplace_reviews
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- Usuario puede crear reviews (si compró el producto)
CREATE POLICY "reviews_insert_buyer" ON public.marketplace_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (order_id IS NULL OR EXISTS (
      SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid() AND status = 'completed'
    ))
  );

-- Usuario puede actualizar su review
CREATE POLICY "reviews_update_own" ON public.marketplace_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Vendedor puede responder a reviews
CREATE POLICY "reviews_reply_seller" ON public.marketplace_reviews
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.marketplace_stores WHERE owner_id = auth.uid())
  );

-- RLS FAVORITOS
CREATE POLICY "favorites_select_own" ON public.marketplace_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own" ON public.marketplace_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own" ON public.marketplace_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- RLS DISPUTAS
-- Comprador puede ver sus disputas
CREATE POLICY "disputes_select_buyer" ON public.marketplace_disputes
  FOR SELECT USING (auth.uid() = opened_by);

-- Vendedor puede ver disputas de su tienda
CREATE POLICY "disputes_select_seller" ON public.marketplace_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

-- Admin puede ver todas
CREATE POLICY "disputes_select_admin" ON public.marketplace_disputes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Comprador puede abrir disputas
CREATE POLICY "disputes_insert_buyer" ON public.marketplace_disputes
  FOR INSERT WITH CHECK (auth.uid() = opened_by);

-- Admin puede actualizar disputas
CREATE POLICY "disputes_update_admin" ON public.marketplace_disputes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS AUDITORÍA: solo admin
CREATE POLICY "audit_select_admin" ON public.marketplace_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "audit_insert_system" ON public.marketplace_audit_logs
  FOR INSERT WITH CHECK (true);
