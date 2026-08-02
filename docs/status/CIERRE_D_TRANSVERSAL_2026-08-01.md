# CIERRE D — AUDITORÍA, PRIVACIDAD/CONFIRMACIÓN Y CONECTIVIDAD (2026-08-01)

Rama: `finish-zafiro-eliana` · Modo: local, sin push ni deploy · Commit: `66f0a0f`.

## Resumen

Bloque transversal que cierra huecos de seguridad y calidad detectados en C7/C8/C10: un **helper de auditoría
compartido**, **confirmación explícita** para acciones sensibles (canales externos) y **verificación de
conectividad** (sin enlaces internos rotos).

## Entregables

| Componente | Detalle |
|---|---|
| Auditoría compartida | `src/lib/audit.ts` → `writeAuditLog({ action, resource_type, resource_id, previous_value, new_value, details, reason, request, app_name })` inserta en `audit_logs` con actor_email, user_agent e IP (`x-forwarded-for`/`x-real-ip`) |
| Conexión a mutaciones | `album/*` (familia/miembro/evento created/updated/deleted, con `previous_value` antes del cambio) y `eliana/channels` PATCH (before/after) |
| Confirmación explícita | UI de canales: activar un canal externo abre un panel "Confirmar activación"; el servidor rechaza activación externa sin `credentials_configured` (400 `requires_credentials`) |
| Conectividad | Script `check-links.js` (temp) barrió hrefs estáticos: todos los targets existen (rutas dinámicas `[id]/[slug]/[username]` y assets públicos verificados); sin enlaces rotos |

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npx eslint` sobre `lib/audit.ts` + rutas auditadas → 0 errores (0 warnings).
- `vitest run` → 75/75.
- `npm run build` → OK (tras limpiar `.next` por bloqueo OneDrive `EPERM`, conocido).

## Pendientes registrados (PENDIENTES_ZAFIRO.md)

1. Extender `writeAuditLog` al resto de mutaciones sensibles (knowledge, biblioteca, organizaciones, user-settings).
2. Validar en la nube que el insert con el cliente de sesión pase la política `audit_logs_insert_system` (WITH CHECK true).
