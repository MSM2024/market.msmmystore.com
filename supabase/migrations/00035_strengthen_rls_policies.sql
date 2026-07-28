-- ================================================================
-- MIGRATION 00035: STRENGTHEN RLS POLICIES
-- Drops overly permissive policies and adds proper user-scoped ones
-- ================================================================

-- ================================================================
-- HELPER: Check if user is admin or superadmin
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- HELPER: Check if user is OWNER_SUPERADMIN (council)
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_owner_superadmin()
RETURNS BOOLEAN AS $$
  SELECT public.user_has_council_role(auth.uid(), 'OWNER_SUPERADMIN');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- ECONOMIA TABLES - Restrict to admin/owner only
-- ================================================================

-- frequency_origin_nodes: Read-only for all, admin-only write
DROP POLICY IF EXISTS "Anyone can view origin nodes" ON public.frequency_origin_nodes;
DROP POLICY IF EXISTS "Authenticated can insert origin nodes" ON public.frequency_origin_nodes;
CREATE POLICY "Authenticated can view origin nodes"
  ON public.frequency_origin_nodes FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin can manage origin nodes"
  ON public.frequency_origin_nodes FOR ALL
  USING (public.is_admin_or_superadmin());

-- frequency_channels: Read-only for all, admin-only write
DROP POLICY IF EXISTS "Anyone can view channels" ON public.frequency_channels;
DROP POLICY IF EXISTS "Authenticated can insert channels" ON public.frequency_channels;
CREATE POLICY "Authenticated can view channels"
  ON public.frequency_channels FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin can manage channels"
  ON public.frequency_channels FOR ALL
  USING (public.is_admin_or_superadmin());

-- guardian_actions: Admin-only
DROP POLICY IF EXISTS "Authenticated can insert guardian actions" ON public.guardian_actions;
DROP POLICY IF EXISTS "Authenticated can view guardian actions" ON public.guardian_actions;
CREATE POLICY "Admin can view guardian actions"
  ON public.guardian_actions FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert guardian actions"
  ON public.guardian_actions FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- frequency_events: Admin-only
DROP POLICY IF EXISTS "Authenticated can insert frequency events" ON public.frequency_events;
DROP POLICY IF EXISTS "Authenticated can view frequency events" ON public.frequency_events;
CREATE POLICY "Admin can view frequency events"
  ON public.frequency_events FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert frequency events"
  ON public.frequency_events FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- economia_operaciones: Admin-only
DROP POLICY IF EXISTS "Authenticated can view economia operaciones" ON public.economia_operaciones;
DROP POLICY IF EXISTS "Authenticated can insert economia operaciones" ON public.economia_operaciones;
CREATE POLICY "Admin can view economia operaciones"
  ON public.economia_operaciones FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Admin can insert economia operaciones"
  ON public.economia_operaciones FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- economia_caja: Admin-only
DROP POLICY IF EXISTS "Authenticated can view economia caja" ON public.economia_caja;
DROP POLICY IF EXISTS "Authenticated can insert economia caja" ON public.economia_caja;
CREATE POLICY "Admin can view economia caja"
  ON public.economia_caja FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Admin can manage economia caja"
  ON public.economia_caja FOR ALL
  USING (public.is_admin_or_superadmin());

-- economia_inventario: Admin-only
DROP POLICY IF EXISTS "Authenticated can view economia inventario" ON public.economia_inventario;
DROP POLICY IF EXISTS "Authenticated can insert economia inventario" ON public.economia_inventario;
DROP POLICY IF EXISTS "Authenticated can update economia inventario" ON public.economia_inventario;
CREATE POLICY "Admin can view economia inventario"
  ON public.economia_inventario FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Admin can manage economia inventario"
  ON public.economia_inventario FOR ALL
  USING (public.is_admin_or_superadmin());

-- ================================================================
-- MARKETPLACE - Tighten permissive policies
-- ================================================================

-- marketplace_payments: Only buyer, seller (store owner), and admin can see
DROP POLICY IF EXISTS "Authenticated can view payments" ON public.marketplace_payments;
DROP POLICY IF EXISTS "Authenticated can insert payments" ON public.marketplace_payments;
CREATE POLICY "Buyer can view own payments"
  ON public.marketplace_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );
CREATE POLICY "Seller can view store payments"
  ON public.marketplace_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON s.id = o.store_id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );
CREATE POLICY "Admin can view all payments"
  ON public.marketplace_payments FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert payments"
  ON public.marketplace_payments FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- marketplace_audit_logs: Admin-only read, system-only write
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.marketplace_audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.marketplace_audit_logs;
CREATE POLICY "Admin can view marketplace audit logs"
  ON public.marketplace_audit_logs FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert marketplace audit logs"
  ON public.marketplace_audit_logs FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- marketplace_config: Admin-only all operations
DROP POLICY IF EXISTS "Authenticated can view config" ON public.marketplace_config;
DROP POLICY IF EXISTS "Authenticated can update config" ON public.marketplace_config;
CREATE POLICY "Admin can view marketplace config"
  ON public.marketplace_config FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Admin can manage marketplace config"
  ON public.marketplace_config FOR UPDATE
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Admin can insert marketplace config"
  ON public.marketplace_config FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- marketplace_price_rules: Admin-only
DROP POLICY IF EXISTS "Authenticated can view price rules" ON public.marketplace_price_rules;
CREATE POLICY "Admin can manage price rules"
  ON public.marketplace_price_rules FOR ALL
  USING (public.is_admin_or_superadmin());

-- marketplace_coupons: Admin-only create, anyone can read active
DROP POLICY IF EXISTS "Authenticated can view coupons" ON public.marketplace_coupons;
CREATE POLICY "Anyone can view active coupons"
  ON public.marketplace_coupons FOR SELECT
  USING (is_active = true);
CREATE POLICY "Admin can manage coupons"
  ON public.marketplace_coupons FOR ALL
  USING (public.is_admin_or_superadmin());

-- marketplace_commissions: Admin-only
DROP POLICY IF EXISTS "Authenticated can view commissions" ON public.marketplace_commissions;
CREATE POLICY "Admin can view commissions"
  ON public.marketplace_commissions FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert commissions"
  ON public.marketplace_commissions FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin());

-- ================================================================
-- ELIANA - Restrict to owner and admin
-- ================================================================

-- eliana_knowledge: Admin-only write, authenticated read
DROP POLICY IF EXISTS "Authenticated can view eliana knowledge" ON public.eliana_knowledge;
CREATE POLICY "Authenticated can view eliana knowledge"
  ON public.eliana_knowledge FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admin can manage eliana knowledge"
  ON public.eliana_knowledge FOR ALL
  USING (public.is_admin_or_superadmin());

-- eliana_settings: Owner-only
DROP POLICY IF EXISTS "Authenticated can view eliana settings" ON public.eliana_settings;
DROP POLICY IF EXISTS "Authenticated can update eliana settings" ON public.eliana_settings;
CREATE POLICY "Owner can view own eliana settings"
  ON public.eliana_settings FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Owner can update own eliana settings"
  ON public.eliana_settings FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Owner can insert own eliana settings"
  ON public.eliana_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- eliana_conversations: Owner-only (user sees only their conversations)
DROP POLICY IF EXISTS "Authenticated can view eliana conversations" ON public.eliana_conversations;
CREATE POLICY "Owner can view own eliana conversations"
  ON public.eliana_conversations FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Owner can create eliana conversations"
  ON public.eliana_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update own eliana conversations"
  ON public.eliana_conversations FOR UPDATE
  USING (user_id = auth.uid());

-- eliana_messages: Owner-only (through conversation ownership)
DROP POLICY IF EXISTS "Authenticated can view eliana messages" ON public.eliana_messages;
CREATE POLICY "Owner can view own eliana messages"
  ON public.eliana_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.eliana_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Owner can insert eliana messages"
  ON public.eliana_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.eliana_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- eliana_audit_logs: Admin-only
DROP POLICY IF EXISTS "Authenticated can view eliana audit" ON public.eliana_audit_logs;
CREATE POLICY "Admin can view eliana audit logs"
  ON public.eliana_audit_logs FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert eliana audit logs"
  ON public.eliana_audit_logs FOR INSERT
  WITH CHECK (true);

-- eliana_intakes: Owner-only
DROP POLICY IF EXISTS "Authenticated can view eliana intakes" ON public.eliana_intakes;
CREATE POLICY "Owner can view own eliana intakes"
  ON public.eliana_intakes FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "System can insert eliana intakes"
  ON public.eliana_intakes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- eliana_handoffs: Owner + assigned
DROP POLICY IF EXISTS "Authenticated can view eliana handoffs" ON public.eliana_handoffs;
CREATE POLICY "Owner can view own eliana handoffs"
  ON public.eliana_handoffs FOR SELECT
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR public.is_admin_or_superadmin()
  );

-- eliana_feedback: Owner-only
DROP POLICY IF EXISTS "Authenticated can view eliana feedback" ON public.eliana_feedback;
CREATE POLICY "Owner can view own eliana feedback"
  ON public.eliana_feedback FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Owner can insert own eliana feedback"
  ON public.eliana_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- eliana_actions: Owner-only
DROP POLICY IF EXISTS "Authenticated can view eliana actions" ON public.eliana_actions;
CREATE POLICY "Owner can view own eliana actions"
  ON public.eliana_actions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "System can insert eliana actions"
  ON public.eliana_actions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ================================================================
-- COUNCIL - Already have policies from 00031, but tighten AI interactions
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view council AI" ON public.invisible_council_ai_interactions;
CREATE POLICY "Owner can view own council AI"
  ON public.invisible_council_ai_interactions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Owner can insert own council AI"
  ON public.invisible_council_ai_interactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ================================================================
-- PROFILES - Allow authenticated to view public profiles
-- ================================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ================================================================
-- USER_ROLES - Only system can modify
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can insert user roles" ON public.user_roles;
CREATE POLICY "Anyone can view user roles"
  ON public.user_roles FOR SELECT
  USING (true);
CREATE POLICY "Admin can manage user roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin_or_superadmin());

-- ================================================================
-- AUDIT_LOGS - Admin-only
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- MARKETPLACE_DISPUTES - Buyer, Seller, and Admin
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view disputes" ON public.marketplace_disputes;
DROP POLICY IF EXISTS "Authenticated can insert disputes" ON public.marketplace_disputes;
CREATE POLICY "Buyer can view own disputes"
  ON public.marketplace_disputes FOR SELECT
  USING (opened_by = auth.uid());
CREATE POLICY "Seller can view store disputes"
  ON public.marketplace_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON s.id = o.store_id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );
CREATE POLICY "Admin can view all disputes"
  ON public.marketplace_disputes FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Buyer can open disputes"
  ON public.marketplace_disputes FOR INSERT
  WITH CHECK (opened_by = auth.uid());
CREATE POLICY "Admin can manage disputes"
  ON public.marketplace_disputes FOR UPDATE
  USING (public.is_admin_or_superadmin());

-- ================================================================
-- MARKETPLACE_REFUNDS - Buyer, Seller, Admin
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view refunds" ON public.marketplace_refunds;
DROP POLICY IF EXISTS "Authenticated can insert refunds" ON public.marketplace_refunds;
CREATE POLICY "Buyer can view own refunds"
  ON public.marketplace_refunds FOR SELECT
  USING (requested_by = auth.uid());
CREATE POLICY "Admin can view all refunds"
  ON public.marketplace_refunds FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Buyer can request refunds"
  ON public.marketplace_refunds FOR INSERT
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Admin can manage refunds"
  ON public.marketplace_refunds FOR UPDATE
  USING (public.is_admin_or_superadmin());

-- ================================================================
-- MARKETPLACE_ORDERS - Buyer sees own, Seller sees store orders
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.marketplace_orders;
CREATE POLICY "Buyer can view own orders"
  ON public.marketplace_orders FOR SELECT
  USING (buyer_id = auth.uid());
CREATE POLICY "Seller can view store orders"
  ON public.marketplace_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  );
CREATE POLICY "Admin can view all orders"
  ON public.marketplace_orders FOR SELECT
  USING (public.is_admin_or_superadmin());
CREATE POLICY "Buyer can create orders"
  ON public.marketplace_orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Seller can update store orders"
  ON public.marketplace_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  );

-- ================================================================
-- MARKETPLACE_SHIPMENTS - Buyer, Seller, Admin
-- ================================================================
DROP POLICY IF EXISTS "Authenticated can view shipments" ON public.marketplace_shipments;
CREATE POLICY "Buyer can view own shipments"
  ON public.marketplace_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );
CREATE POLICY "Seller can view store shipments"
  ON public.marketplace_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      JOIN public.marketplace_stores s ON s.id = o.store_id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );
CREATE POLICY "Admin can view all shipments"
  ON public.marketplace_shipments FOR SELECT
  USING (public.is_admin_or_superadmin());
