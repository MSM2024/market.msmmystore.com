-- ============================================================
-- 00059: ELIANA CANALES (C10) — seed de eliana_channels y
-- políticas INSERT/DELETE para administración.
-- Aditiva e idempotente (ON CONFLICT DO UPDATE). No envía nada
-- a terceros: los canales externos quedan disabled por defecto.
-- ============================================================

-- 1. Políticas INSERT/DELETE (solo OWNER_SUPERADMIN), además del
--    SELECT-all y UPDATE-owner ya existentes (00034).
DROP POLICY IF EXISTS "eliana_channels_insert_owner" ON public.eliana_channels;
CREATE POLICY "eliana_channels_insert_owner"
  ON public.eliana_channels FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.council_user_roles
    WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

DROP POLICY IF EXISTS "eliana_channels_delete_owner" ON public.eliana_channels;
CREATE POLICY "eliana_channels_delete_owner"
  ON public.eliana_channels FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.council_user_roles
    WHERE user_id = auth.uid() AND role = 'OWNER_SUPERADMIN' AND revoked_at IS NULL
  ));

-- 2. Trigger de updated_at (idempotente)
DROP TRIGGER IF EXISTS trg_eliana_channels_updated_at ON public.eliana_channels;
CREATE TRIGGER trg_eliana_channels_updated_at
  BEFORE UPDATE ON public.eliana_channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Seed de canales alineado con CHANNEL_CONFIGS (types.ts).
--    Canales web/marketplace/zafiro/eliana_domain: habilitados.
--    Canales externos (whatsapp/telegram/email): deshabilitados;
--    no hay credenciales ni webhooks reales aún.
INSERT INTO public.eliana_channels
  (channel_name, enabled, welcome_message, system_prompt_addition, max_context_length, requires_auth, config)
VALUES
  ('web', TRUE,
   'Bendiciones. Soy ELIANA, asistente virtual de MSM. ¿En qué puedo ayudarte?',
   '', 4000, FALSE, '{}'::jsonb),
  ('whatsapp', FALSE,
   'Bendiciones. Soy ELIANA, asistente virtual de MSM. ¿En qué puedo ayudarte?',
   'El usuario te escribe por WhatsApp. Mantén respuestas cortas. Máximo una pregunta por turno.',
   2000, FALSE, '{"requires_credentials": true}'::jsonb),
  ('marketplace', TRUE,
   'Bendiciones. Puedo ayudarte con productos, tiendas y pedidos.',
   'Estás dentro del Marketplace. Enfócate en productos, tiendas, carrito y pedidos.',
   3000, FALSE, '{}'::jsonb),
  ('zafiro', TRUE,
   'Bendiciones. Soy ELIANA, tu guía dentro de ZAFIRO.',
   'Estás dentro de ZAFIRO. Enfócate en conocimiento, proyectos, membresías y orientación del ecosistema.',
   4000, FALSE, '{}'::jsonb),
  ('eliana_domain', TRUE,
   'Bendiciones. Soy ELIANA, la Guía Inteligente de MSM & ZAFIRO. ¿Cómo puedo orientarte hoy?',
   'Estás en el dominio principal de ELIANA. Puedes orientar sobre todo el ecosistema.',
   4000, FALSE, '{}'::jsonb),
  ('telegram', FALSE,
   'Bendiciones. Soy ELIANA, asistente virtual de MSM. ¿En qué puedo ayudarte?',
   'El usuario te escribe por Telegram. Mantén respuestas cortas.',
   2000, FALSE, '{"requires_credentials": true}'::jsonb),
  ('email', FALSE,
   'Bendiciones. Soy ELIANA. Te responderé por correo electrónico.',
   'El usuario se comunicó por correo. Responde de forma clara y estructurada.',
   4000, TRUE, '{"requires_credentials": true}'::jsonb)
ON CONFLICT (channel_name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  welcome_message = EXCLUDED.welcome_message,
  system_prompt_addition = EXCLUDED.system_prompt_addition,
  max_context_length = EXCLUDED.max_context_length,
  requires_auth = EXCLUDED.requires_auth,
  config = EXCLUDED.config,
  updated_at = now();

-- MIGRATION COMPLETE
