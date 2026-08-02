-- ================================================================
-- MIGRATION 00048: OWNER EN POLÍTICAS ADMIN RESTANTES
-- ================================================================
-- 00037 unificó la taxonomía y añadió 'owner' a la mayoría de
-- políticas del marketplace, pero dejó varias con role IN ('admin',
-- 'superadmin') sin 'owner'. Resultado: Don Miguel (role='owner') no
-- podía leer/actualizar pedidos, pagos, tiendas, disputas, config,
-- price_rules, etc. vía RLS (el Automation Center mostraba 0).
--
-- Esta migración recrea TODAS las políticas restantes incluyendo
-- 'owner' (sin quitar ningún rol ya otorgado).
-- ================================================================

-- 1. USER_ROLES
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;
CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 2. MARKETPLACE_STORES
DROP POLICY IF EXISTS "stores_update_admin" ON public.marketplace_stores;
CREATE POLICY "stores_update_admin" ON public.marketplace_stores
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 3. MARKETPLACE_ORDERS
DROP POLICY IF EXISTS "orders_select_admin" ON public.marketplace_orders;
CREATE POLICY "orders_select_admin" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 4. MARKETPLACE_PAYMENTS
DROP POLICY IF EXISTS "payments_select_admin" ON public.marketplace_payments;
CREATE POLICY "payments_select_admin" ON public.marketplace_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 5. MARKETPLACE_REFUNDS
DROP POLICY IF EXISTS "refunds_select_admin" ON public.marketplace_refunds;
CREATE POLICY "refunds_select_admin" ON public.marketplace_refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "refunds_update_admin" ON public.marketplace_refunds;
CREATE POLICY "refunds_update_admin" ON public.marketplace_refunds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin', 'finance'))
  );

-- 6. MARKETPLACE_SHIPMENTS
DROP POLICY IF EXISTS "shipments_select_admin" ON public.marketplace_shipments;
CREATE POLICY "shipments_select_admin" ON public.marketplace_shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 7. MARKETPLACE_PRICE_RULES
DROP POLICY IF EXISTS "price_rules_select_admin" ON public.marketplace_price_rules;
CREATE POLICY "price_rules_select_admin" ON public.marketplace_price_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "price_rules_insert_admin" ON public.marketplace_price_rules;
CREATE POLICY "price_rules_insert_admin" ON public.marketplace_price_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "price_rules_update_admin" ON public.marketplace_price_rules;
CREATE POLICY "price_rules_update_admin" ON public.marketplace_price_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 8. MARKETPLACE_COUPONS
DROP POLICY IF EXISTS "coupons_select_admin" ON public.marketplace_coupons;
CREATE POLICY "coupons_select_admin" ON public.marketplace_coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 9. MARKETPLACE_COMMISSIONS
DROP POLICY IF EXISTS "commissions_select_admin" ON public.marketplace_commissions;
CREATE POLICY "commissions_select_admin" ON public.marketplace_commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin', 'finance'))
  );

-- 10. MARKETPLACE_DISPUTES
DROP POLICY IF EXISTS "disputes_select_admin" ON public.marketplace_disputes;
CREATE POLICY "disputes_select_admin" ON public.marketplace_disputes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "disputes_update_admin" ON public.marketplace_disputes;
CREATE POLICY "disputes_update_admin" ON public.marketplace_disputes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 11. MARKETPLACE_AUDIT_LOGS
DROP POLICY IF EXISTS "audit_select_admin" ON public.marketplace_audit_logs;
CREATE POLICY "audit_select_admin" ON public.marketplace_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 12. MARKETPLACE_CONFIG
DROP POLICY IF EXISTS "config_select_admin" ON public.marketplace_config;
CREATE POLICY "config_select_admin" ON public.marketplace_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "config_insert_admin" ON public.marketplace_config;
CREATE POLICY "config_insert_admin" ON public.marketplace_config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "config_update_admin" ON public.marketplace_config;
CREATE POLICY "config_update_admin" ON public.marketplace_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- MIGRATION COMPLETE
