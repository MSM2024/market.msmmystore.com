-- ================================================================
-- MIGRATION 00037: FIX ROLE TAXONOMY (unificación)
-- ================================================================
-- Resuelve el conflicto entre tres taxonomías de rol:
--   00003 enum user_role        : customer, seller, vip, referrer, supplier, support, finance, admin, superadmin
--   00036 CHECK + funciones     : owner, superadmin, finance, kyc, inventory, support, auditor, vendor, customer
--   00041 seeds                 : role='owner' y role='admin'  (admin NO es válido bajo el CHECK de 00036 → la migración 00041 FALLABA)
--
-- Taxonomía unificada (unión de las tres; todo lo que el sistema usa):
--   owner, superadmin, admin, finance, support, supplier, seller, vip, referrer,
--   customer, kyc, inventory, auditor, vendor
--
-- Además: 'owner' queda con los mismos permisos que admin/superadmin en
--   (a) todas las políticas que usan is_admin_or_superadmin() y user_is_admin()
--   (b) las políticas inline del marketplace (categorías, proveedores, tiendas,
--       productos, conectores, historial de precios, pedidos, pagos, envíos)
--   (c) nuevas políticas admin para order_items, status_history y tracking_events
-- ================================================================

-- 1. UNIFICAR CHECK DE PROFILES
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'owner', 'superadmin', 'admin', 'finance', 'support', 'supplier', 'seller', 'vip', 'referrer',
    'customer', 'kyc', 'inventory', 'auditor', 'vendor'
  ));

-- 2. FUNCIONES DE PERMISO: añadir 'admin' (perdida en la fusión de taxonomías)
-- Se conservan los roles staff de 00036 (finance/kyc/inventory/support/auditor) para no
-- reducir accesos ya otorgados; se restaura 'admin' de la taxonomía original del marketplace.
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'superadmin', 'admin', 'finance', 'kyc', 'inventory', 'support', 'auditor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
    AND role IN ('owner', 'superadmin', 'admin', 'finance', 'kyc', 'inventory', 'support', 'auditor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. USER_ROLES: migrar de enum (sin 'owner') a TEXT + CHECK unificado
ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN (
    'owner', 'superadmin', 'admin', 'finance', 'support', 'supplier', 'seller', 'vip', 'referrer',
    'customer', 'kyc', 'inventory', 'auditor', 'vendor'
  ));

-- 4. RE-CREAR POLÍTICAS INLINE DEL MARKETPLACE PARA INCLUIR 'owner'
-- (Tablas que NO tienen políticas equivalentes basadas en is_admin_or_superadmin())

-- marketplace_categories
DROP POLICY IF EXISTS "categories_insert_admin" ON public.marketplace_categories;
CREATE POLICY "categories_insert_admin" ON public.marketplace_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "categories_update_admin" ON public.marketplace_categories;
CREATE POLICY "categories_update_admin" ON public.marketplace_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON public.marketplace_categories;
CREATE POLICY "categories_delete_admin" ON public.marketplace_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_providers
DROP POLICY IF EXISTS "providers_insert_admin" ON public.marketplace_providers;
CREATE POLICY "providers_insert_admin" ON public.marketplace_providers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "providers_update_admin" ON public.marketplace_providers;
CREATE POLICY "providers_update_admin" ON public.marketplace_providers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "providers_delete_admin" ON public.marketplace_providers;
CREATE POLICY "providers_delete_admin" ON public.marketplace_providers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_stores
DROP POLICY IF EXISTS "stores_select_admin" ON public.marketplace_stores;
CREATE POLICY "stores_select_admin" ON public.marketplace_stores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "stores_insert_seller" ON public.marketplace_stores;
CREATE POLICY "stores_insert_seller" ON public.marketplace_stores
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'seller', 'admin', 'superadmin'))
  );

-- marketplace_products
DROP POLICY IF EXISTS "products_select_admin" ON public.marketplace_products;
CREATE POLICY "products_select_admin" ON public.marketplace_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "products_update_admin" ON public.marketplace_products;
CREATE POLICY "products_update_admin" ON public.marketplace_products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_provider_products
DROP POLICY IF EXISTS "pproducts_select_admin" ON public.marketplace_provider_products;
CREATE POLICY "pproducts_select_admin" ON public.marketplace_provider_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_provider_prices
DROP POLICY IF EXISTS "pprices_select_admin" ON public.marketplace_provider_prices;
CREATE POLICY "pprices_select_admin" ON public.marketplace_provider_prices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "pprices_insert_admin" ON public.marketplace_provider_prices;
CREATE POLICY "pprices_insert_admin" ON public.marketplace_provider_prices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_provider_inventory
DROP POLICY IF EXISTS "pinventory_select_admin" ON public.marketplace_provider_inventory;
CREATE POLICY "pinventory_select_admin" ON public.marketplace_provider_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "pinventory_update_admin" ON public.marketplace_provider_inventory;
CREATE POLICY "pinventory_update_admin" ON public.marketplace_provider_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_price_history
DROP POLICY IF EXISTS "price_history_select_admin" ON public.marketplace_price_history;
CREATE POLICY "price_history_select_admin" ON public.marketplace_price_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_orders (UPDATE admin: 00035 no cubre admin-update)
DROP POLICY IF EXISTS "orders_update_admin" ON public.marketplace_orders;
CREATE POLICY "orders_update_admin" ON public.marketplace_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_payments (UPDATE admin: 00035 no cubre admin-update)
DROP POLICY IF EXISTS "payments_update_admin" ON public.marketplace_payments;
CREATE POLICY "payments_update_admin" ON public.marketplace_payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin', 'finance'))
  );

-- marketplace_shipments (UPDATE admin: 00035 no cubre admin-update)
DROP POLICY IF EXISTS "shipments_update_admin" ON public.marketplace_shipments;
CREATE POLICY "shipments_update_admin" ON public.marketplace_shipments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 5. NUEVAS POLÍTICAS ADMIN (tablas sin acceso admin previo)
-- marketplace_order_items
DROP POLICY IF EXISTS "order_items_select_admin" ON public.marketplace_order_items;
CREATE POLICY "order_items_select_admin" ON public.marketplace_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_order_status_history
DROP POLICY IF EXISTS "status_history_select_admin" ON public.marketplace_order_status_history;
CREATE POLICY "status_history_select_admin" ON public.marketplace_order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- marketplace_tracking_events
DROP POLICY IF EXISTS "tracking_select_admin" ON public.marketplace_tracking_events;
CREATE POLICY "tracking_select_admin" ON public.marketplace_tracking_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin'))
  );

-- 6. GARANTIZAR ROLES DE DON MIGUEL (idempotente; cubre también el caso de que
--    00041 se haya aplicado antes con el UPDATE fallido)
UPDATE public.profiles
SET role = 'owner',
    plan = COALESCE(plan, 'lifetime_unlimited'),
    updated_at = NOW()
WHERE email IN ('cm8msm@gmail.com', 'cm8msm@msmmystore.com');

UPDATE public.profiles
SET role = 'admin',
    plan = COALESCE(plan, 'lifetime_unlimited'),
    updated_at = NOW()
WHERE email IN ('msmmystore@gmail.com', 'msmmystore@msmmystore.com');
