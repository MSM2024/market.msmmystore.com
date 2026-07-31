-- ================================================================
-- 00049 — ELIANA: Propiedad por user_id y políticas faltantes
-- Repara el flujo web de chat: antes las conversaciones se insertaban
-- con una columna "user_id" inexistente y las políticas de SELECT/UPDATE
-- dependían de eliana_contacts.external_id, por lo que un usuario
-- autenticado NUNCA podía releer su historial, actualizar ni confirmar
-- acciones/intakes. Se añade user_id a las tablas y se amplían las
-- políticas para cubrir la propiedad directa (auth.uid()).
-- ================================================================

-- ================================================================
-- COLUMNAS user_id (compatibles con el código que ya las usaba)
-- ================================================================
ALTER TABLE public.eliana_conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.eliana_messages     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.eliana_intakes      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.eliana_actions      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_eliana_conversations_user ON public.eliana_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_eliana_messages_user     ON public.eliana_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_eliana_intakes_user      ON public.eliana_intakes(user_id);
CREATE INDEX IF NOT EXISTS idx_eliana_actions_user      ON public.eliana_actions(user_id);

-- ================================================================
-- CONTACTS: el usuario lee su propio contacto (self) + owner
-- ================================================================
DROP POLICY IF EXISTS "eliana_contacts_select_own" ON public.eliana_contacts;
CREATE POLICY "eliana_contacts_select_self_or_owner" ON public.eliana_contacts
  FOR SELECT USING (
    external_id = auth.uid()::text OR EXISTS (
      SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
    )
  );

-- ================================================================
-- CONVERSATIONS: select por user_id, contacto o rol
-- ================================================================
DROP POLICY IF EXISTS "eliana_conversations_select_own" ON public.eliana_conversations;
CREATE POLICY "eliana_conversations_select_own" ON public.eliana_conversations
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL
    )
  );

CREATE POLICY "eliana_conversations_update_own" ON public.eliana_conversations
  FOR UPDATE USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text
    )
  );

CREATE POLICY "eliana_conversations_delete_own" ON public.eliana_conversations
  FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text
    )
  );

-- ================================================================
-- MESSAGES: select por user_id o vía conversación
-- ================================================================
DROP POLICY IF EXISTS "eliana_messages_select_conversation" ON public.eliana_messages;
CREATE POLICY "eliana_messages_select_conversation" ON public.eliana_messages
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
      )
    )
  );

-- ================================================================
-- INTAKES: select/update por user_id o vía conversación
-- ================================================================
DROP POLICY IF EXISTS "eliana_intakes_select_own" ON public.eliana_intakes;
CREATE POLICY "eliana_intakes_select_own" ON public.eliana_intakes
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
      )
    )
  );

CREATE POLICY "eliana_intakes_update_own" ON public.eliana_intakes
  FOR UPDATE USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
      )
    )
  );

-- ================================================================
-- ACTIONS: select/update por user_id o vía conversación
-- ================================================================
DROP POLICY IF EXISTS "eliana_actions_select_own" ON public.eliana_actions;
CREATE POLICY "eliana_actions_select_own" ON public.eliana_actions
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL)
      )
    )
  );

CREATE POLICY "eliana_actions_update_own" ON public.eliana_actions
  FOR UPDATE USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.eliana_conversations WHERE id = conversation_id AND (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.eliana_contacts WHERE id = contact_id AND external_id = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.council_user_roles WHERE user_id = auth.uid() AND role IN ('OWNER_SUPERADMIN', 'COUNCIL_EDITOR') AND revoked_at IS NULL)
      )
    )
  );

-- ================================================================
-- TICKETS (context-handoff): el id es un UUID aleatorio que expira
-- en 5 min y actúa como secreto portador → lectura/consumo por
-- cualquier usuario autenticado (y anónimo para tickets de visitantes).
-- ================================================================
DROP POLICY IF EXISTS "eliana_tickets_no_select" ON public.eliana_tickets;
CREATE POLICY "eliana_tickets_select_bearer" ON public.eliana_tickets
  FOR SELECT USING (true);

CREATE POLICY "eliana_tickets_update_bearer" ON public.eliana_tickets
  FOR UPDATE USING (true);

-- ================================================================
-- HANDOFFS: columna metadata (el bridge marketplace la usa para
-- conservar customerMessage/customerId/sessionId/historial)
-- ================================================================
ALTER TABLE public.eliana_handoffs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;


