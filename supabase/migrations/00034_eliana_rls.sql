-- ================================================================
-- 00034 — ELIANA CORE: Políticas RLS
-- Seguridad para todas las tablas de ELIANA
-- ================================================================

-- ================================================================
-- KNOWLEDGE
-- ================================================================
CREATE POLICY "eliana_knowledge_select_published" ON public.eliana_knowledge
  FOR SELECT USING (status = 'published' OR EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_knowledge_insert_editor" ON public.eliana_knowledge
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_knowledge_update_editor" ON public.eliana_knowledge
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_knowledge_delete_owner" ON public.eliana_knowledge
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

-- ================================================================
-- CHANNELS
-- ================================================================
CREATE POLICY "eliana_channels_select_all" ON public.eliana_channels
  FOR SELECT USING (true);

CREATE POLICY "eliana_channels_update_owner" ON public.eliana_channels
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

-- ================================================================
-- CONTACTS
-- ================================================================
CREATE POLICY "eliana_contacts_select_own" ON public.eliana_contacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_contacts_insert_auth" ON public.eliana_contacts
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- CONVERSATIONS
-- ================================================================
CREATE POLICY "eliana_conversations_select_own" ON public.eliana_conversations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text
  ) OR EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_conversations_insert_auth" ON public.eliana_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "eliana_conversations_update_agent" ON public.eliana_conversations
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ));

-- ================================================================
-- MESSAGES
-- ================================================================
CREATE POLICY "eliana_messages_select_conversation" ON public.eliana_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
      EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
      EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
    )
  ));

CREATE POLICY "eliana_messages_insert_auth" ON public.eliana_messages
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- INTAKES
-- ================================================================
CREATE POLICY "eliana_intakes_select_own" ON public.eliana_intakes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
      EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
      EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
    )
  ));

CREATE POLICY "eliana_intakes_insert_auth" ON public.eliana_intakes
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- HANDOFFS
-- ================================================================
CREATE POLICY "eliana_handoffs_select_agent" ON public.eliana_handoffs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR', 'COUNCIL_REVIEWER') AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_handoffs_insert_auth" ON public.eliana_handoffs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "eliana_handoffs_update_agent" ON public.eliana_handoffs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
  ));

-- ================================================================
-- ACTIONS
-- ================================================================
CREATE POLICY "eliana_actions_select_own" ON public.eliana_actions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
      EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
      EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
    )
  ));

CREATE POLICY "eliana_actions_insert_auth" ON public.eliana_actions
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- AUDIT LOGS
-- ================================================================
CREATE POLICY "eliana_audit_select_owner" ON public.eliana_audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_audit_insert_auth" ON public.eliana_audit_logs
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- SETTINGS
-- ================================================================
CREATE POLICY "eliana_settings_select_all" ON public.eliana_settings
  FOR SELECT USING (true);

CREATE POLICY "eliana_settings_update_owner" ON public.eliana_settings
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

-- ================================================================
-- FEEDBACK
-- ================================================================
CREATE POLICY "eliana_feedback_select_owner" ON public.eliana_feedback
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_feedback_insert_auth" ON public.eliana_feedback
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- IDENTITIES
-- ================================================================
CREATE POLICY "eliana_identities_select_own" ON public.eliana_identities
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

CREATE POLICY "eliana_identities_insert_auth" ON public.eliana_identities
  FOR INSERT WITH CHECK (true);
