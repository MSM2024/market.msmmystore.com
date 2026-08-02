-- ================================================================
-- 00051 — ECONOMÍA/INVENTARIO: endurecimiento RLS
-- Las tablas de economia_* (operaciones, caja, inventario) y los
-- registros de eventos (guardian_actions, frequency_events) quedaron
-- con SELECT/INSERT/UPDATE abiertos a cualquiera (prototipo inicial).
-- Se restringe: INSERT solo para usuarios autenticados y
-- SELECT/UPDATE/DELETE solo para owner/admin (consejo).
-- ================================================================

-- ================================================================
-- GUARDIAN ACTIONS
-- ================================================================
DROP POLICY IF EXISTS "guardian_actions_insert" ON public.guardian_actions;
DROP POLICY IF EXISTS "guardian_actions_select" ON public.guardian_actions;

CREATE POLICY "guardian_actions_insert_auth" ON public.guardian_actions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "guardian_actions_select_admin" ON public.guardian_actions
  FOR SELECT USING (public.is_knowledge_admin());

-- ================================================================
-- FREQUENCY EVENTS
-- ================================================================
DROP POLICY IF EXISTS "frequency_events_insert" ON public.frequency_events;
DROP POLICY IF EXISTS "frequency_events_select" ON public.frequency_events;

CREATE POLICY "frequency_events_insert_auth" ON public.frequency_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "frequency_events_select_admin" ON public.frequency_events
  FOR SELECT USING (public.is_knowledge_admin());

-- ================================================================
-- ECONOMIA OPERACIONES
-- ================================================================
DROP POLICY IF EXISTS "economia_operaciones_insert" ON public.economia_operaciones;
DROP POLICY IF EXISTS "economia_operaciones_select_own" ON public.economia_operaciones;

CREATE POLICY "economia_operaciones_insert_auth" ON public.economia_operaciones
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "economia_operaciones_select_admin" ON public.economia_operaciones
  FOR SELECT USING (public.is_knowledge_admin());

CREATE POLICY "economia_operaciones_update_admin" ON public.economia_operaciones
  FOR UPDATE USING (public.is_knowledge_admin());

CREATE POLICY "economia_operaciones_delete_admin" ON public.economia_operaciones
  FOR DELETE USING (public.is_knowledge_admin());

-- ================================================================
-- ECONOMIA CAJA
-- ================================================================
DROP POLICY IF EXISTS "economia_caja_insert" ON public.economia_caja;
DROP POLICY IF EXISTS "economia_caja_select" ON public.economia_caja;

CREATE POLICY "economia_caja_insert_auth" ON public.economia_caja
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "economia_caja_select_admin" ON public.economia_caja
  FOR SELECT USING (public.is_knowledge_admin());

CREATE POLICY "economia_caja_update_admin" ON public.economia_caja
  FOR UPDATE USING (public.is_knowledge_admin());

CREATE POLICY "economia_caja_delete_admin" ON public.economia_caja
  FOR DELETE USING (public.is_knowledge_admin());

-- ================================================================
-- ECONOMIA INVENTARIO
-- ================================================================
DROP POLICY IF EXISTS "economia_inventario_insert" ON public.economia_inventario;
DROP POLICY IF EXISTS "economia_inventario_select" ON public.economia_inventario;
DROP POLICY IF EXISTS "economia_inventario_update" ON public.economia_inventario;

CREATE POLICY "economia_inventario_insert_auth" ON public.economia_inventario
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "economia_inventario_select_admin" ON public.economia_inventario
  FOR SELECT USING (public.is_knowledge_admin());

CREATE POLICY "economia_inventario_update_admin" ON public.economia_inventario
  FOR UPDATE USING (public.is_knowledge_admin());

CREATE POLICY "economia_inventario_delete_admin" ON public.economia_inventario
  FOR DELETE USING (public.is_knowledge_admin());
