-- ================================================================
-- 00011 — MARKETPLACE PAYMENTS + REFUNDS
-- Pagos, reembolsos y estados de transacción
-- ================================================================

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
  'disputed'
);

CREATE TYPE payment_method AS ENUM (
  'stripe',
  'paypal',
  'bank_transfer',
  'crypto',
  'cash_on_delivery',
  'cuba_mobile_payment',
  'manual'
);

CREATE TYPE refund_status AS ENUM (
  'requested',
  'under_review',
  'approved',
  'rejected',
  'processed',
  'completed'
);

-- TABLA PAGOS
CREATE TABLE IF NOT EXISTS public.marketplace_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Montos
  amount                NUMERIC(10,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'USD',
  fee_amount            NUMERIC(10,2) DEFAULT 0,
  net_amount            NUMERIC(10,2) DEFAULT 0,
  
  -- Método
  payment_method        payment_method NOT NULL DEFAULT 'stripe',
  provider_ref          TEXT DEFAULT '',
  
  -- Estado
  status                payment_status NOT NULL DEFAULT 'pending',
  
  -- Datos del pago (no sensibles)
  card_last_four        TEXT DEFAULT '',
  card_brand            TEXT DEFAULT '',
  
  -- Comprobante (para pagos manuales/cuba)
  proof_url             TEXT DEFAULT '',
  proof_uploaded_by     UUID REFERENCES auth.users(id),
  
  -- Confirmación
  confirmed_by          UUID REFERENCES auth.users(id),
  confirmed_at          TIMESTAMPTZ,
  
  -- Metadata
  metadata              JSONB DEFAULT '{}',
  
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payments_order ON public.marketplace_payments(order_id);
CREATE INDEX idx_payments_status ON public.marketplace_payments(status);
CREATE INDEX idx_payments_method ON public.marketplace_payments(payment_method);

-- TABLA REEMBOLSOS
CREATE TABLE IF NOT EXISTS public.marketplace_refunds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        UUID REFERENCES public.marketplace_payments(id) ON DELETE CASCADE NOT NULL,
  order_id          UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Montos
  amount            NUMERIC(10,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  reason            TEXT NOT NULL DEFAULT '',
  
  -- Estado
  status            refund_status NOT NULL DEFAULT 'requested',
  
  -- Referencia del reembolso en el procesador
  provider_ref      TEXT DEFAULT '',
  
  -- Quién solicitó
  requested_by      UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Revisión
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT DEFAULT '',
  
  -- Procesamiento
  processed_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_refunds ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_refunds_payment ON public.marketplace_refunds(payment_id);
CREATE INDEX idx_refunds_order ON public.marketplace_refunds(order_id);
CREATE INDEX idx_refunds_status ON public.marketplace_refunds(status);

-- RLS PAGOS
-- Comprador puede ver sus pagos
CREATE POLICY "payments_select_buyer" ON public.marketplace_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Vendedor puede ver pagos de su tienda
CREATE POLICY "payments_select_seller" ON public.marketplace_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

-- Admin puede ver todos
CREATE POLICY "payments_select_admin" ON public.marketplace_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Sistema puede insertar pagos
CREATE POLICY "payments_insert_system" ON public.marketplace_payments
  FOR INSERT WITH CHECK (true);

-- Admin puede actualizar pagos
CREATE POLICY "payments_update_admin" ON public.marketplace_payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'finance'))
  );

-- RLS REEMBOLSOS
-- Comprador puede ver sus reembolsos
CREATE POLICY "refunds_select_buyer" ON public.marketplace_refunds
  FOR SELECT USING (auth.uid() = requested_by);

-- Vendedor puede ver reembolsos de su tienda
CREATE POLICY "refunds_select_seller" ON public.marketplace_refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON o.store_id = s.id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

-- Admin puede ver todos
CREATE POLICY "refunds_select_admin" ON public.marketplace_refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Comprador puede solicitar reembolso
CREATE POLICY "refunds_insert_buyer" ON public.marketplace_refunds
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Admin puede actualizar reembolsos
CREATE POLICY "refunds_update_admin" ON public.marketplace_refunds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'finance'))
  );
