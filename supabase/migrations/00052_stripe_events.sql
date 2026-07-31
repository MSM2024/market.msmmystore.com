-- ================================================================
-- 00052 — STRIPE: deduplicación durable de webhooks
-- La dedup de eventos vivía en memoria (Map en el proceso), por lo
-- que un reinicio o varias instancias reprocesaban reentregas de
-- Stripe. Se persiste cada evento procesado para garantizar
-- idempotencia entre reinicios.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_events_admin_all" ON public.stripe_events;
CREATE POLICY "stripe_events_admin_all" ON public.stripe_events
  FOR ALL USING (public.is_knowledge_admin())
  WITH CHECK (public.is_knowledge_admin());
