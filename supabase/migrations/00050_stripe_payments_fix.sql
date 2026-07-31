-- ================================================================
-- 00050 — STRIPE / PAGOS: columnas de suscripción en profiles y
-- tabla payments para membresías. El webhook de Stripe usaba las
-- tablas "orders"/"payments" que no existían (el de marketplace
-- es marketplace_orders); aquí se crea la tabla payments tal como
-- la consume el webhook (facturas de suscripción y reembolsos).
-- ================================================================

-- ================================================================
-- PROFILES: datos de suscripción
-- ================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_subscription_status') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_status TEXT DEFAULT 'inactive';
  END IF;
END $$;

-- ================================================================
-- PAYMENTS: pagos de suscripción (membresías) vía webhook
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES auth.users(id),
  stripe_invoice_id         TEXT UNIQUE,
  stripe_subscription_id    TEXT,
  stripe_payment_intent_id  TEXT,
  amount                    NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency                  TEXT NOT NULL DEFAULT 'USD',
  status                    TEXT NOT NULL DEFAULT 'pending',
  metadata                  JSONB DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON public.payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );

CREATE POLICY "payments_insert_admin" ON public.payments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
  );
