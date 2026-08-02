# CIERRE C10 — CANALES Y ACCIONES ELIANA (2026-08-01)

Rama: `finish-zafiro-eliana` · Modo: local, sin push ni deploy · Commit: `fa41b96`.

## Resumen

Se implementó la **gestión de canales de ELIANA** sobre `eliana_channels` (que ya existía desde 00032 con
`SELECT all` / `UPDATE owner` en 00034). Se añadieron políticas INSERT/DELETE para owner, un seed idempotente
de 7 canales y una API de administración (GET autenticado, PATCH owner-only). La página de configuración quedó
funcional (canales, idioma y tema con localStorage) y la de privacidad pasó de estática a toggles reales con
persistencia local. Los adaptadores de canal son **simulados y seguros**: nunca envían a terceros.

## Entregables

| Componente | Archivos |
|---|---|
| Migración aditiva 00059 | `supabase/migrations/00059_eliana_channels.sql` (políticas INSERT/DELETE `OWNER_SUPERADMIN`, trigger `trg_eliana_channels_updated_at`, seed de web/whatsapp/marketplace/zafiro/eliana_domain/telegram/email; externos `enabled=false` con `config.requires_credentials`) |
| API | `src/app/api/eliana/channels/route.ts` (GET autenticado, PATCH `requireOwner()` + rate limit `eliana-channels` + `channelPatchSchema` Zod) |
| UI | `src/app/eliana/configuracion/canales/page.tsx` (toggles, badge "externo", confirmación explícita), `configuracion/page.tsx` (idioma/tema funcionales con localStorage), `privacidad/page.tsx` (toggles reales) |
| Tipos/adaptadores | `src/lib/eliana/core/types.ts` (canales `telegram`/`email`, CHANNEL_CONFIGS), `src/lib/eliana/core/adapters.ts` (`TelegramAdapter`, `EmailAdapter`, `dispatchSafeMessage`/`SafeDispatchInput`/`SafeDispatchResult`) |
| Tests | `src/__tests__/channels.test.ts` (11 tests) |

## Decisiones de seguridad/configuración segura

- **Confirmación explícita**: activar un canal externo pide confirmación en la UI y el servidor lo rechaza
  (400 `requires_credentials`) salvo que `config.credentials_configured === true` (nunca hoy). No se inventaron credenciales.
- **Nunca envía a terceros**: `dispatchSafeMessage` exige `confirmed === true`, canal habilitado y credenciales;
  en el estado actual todo envío real está bloqueado y solo simula.
- PATCH de canales es owner-only en el servidor (no depende solo de la UI), con rate limiting e IP capturada.
- Idiomas/tema/privacidad se guardan en localStorage (`eliana_language`, `eliana_theme`, `eliana_privacy_settings`),
  pendiente de migrar a Supabase `user_settings` en fases posteriores.

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npx eslint` sobre archivos C10 → 0 errores (0 warnings).
- `vitest run` → 75/75 (11 nuevos de Canales).
- `npm run build` → OK.

## Pendientes registrados (PENDIENTES_ZAFIRO.md)

1. Aplicar migración 00059 en Supabase y validar políticas INSERT/DELETE en la nube.
2. Decidir gestor de secretos para credenciales de canales externos (WhatsApp/Telegram/email) antes de activarlos.
3. Voz en tiempo real y webhooks reales (C5/C10 pendientes de credenciales).
