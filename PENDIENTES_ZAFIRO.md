# PENDIENTES_ZAFIRO.md — Decisiones y tareas abiertas

**Última actualización:** 2026-08-01 (cierre C8 Álbum, C10 Canales y bloque D — universo visual, auditoría y conectividad)

Este archivo registra decisiones que requieren a Don Miguel o dependencias externas (Fase 0). Regla aplicada esta noche: si falta una decisión → configuración segura por defecto + registrar aquí.

## Bloqueos de la nube (Fase 0)

- [ ] **Aplicar migraciones 00054 a 00059 en Supabase** (no hay CLI Supabase en este entorno; no se aplicaron). Son aditivas y reversibles salvo 00054 (RPCs de sesiones). **00057** es necesaria para el Autor IA (C7) y **00058/00059** para el Álbum (C8) y los Canales (C10): sin ellas el flujo falla en la nube.
- [ ] **Validación e2e RLS** con cuenta owner real: aprobaciones, ingesta, bucket `biblioteca_ingesta`, Autor IA, Álbum (00058), políticas INSERT/DELETE de `eliana_channels` (00059) y `requireOwner()` para PATCH de canales.
- [ ] **Autor IA en producción**: validar que la cuenta owner esté en `council_user_roles` (`OWNER_SUPERADMIN`/`COUNCIL_EDITOR`) para inserts council bajo RLS, o migrar el acceso a `profiles.role`; confirmar `GOOGLE_API_KEY` válida y presupuesto del modelo `gemini-2.0-flash`.
- [ ] **Credenciales de canales externos (C10)**: WhatsApp (Cloud API), Telegram (bot token) y email (SMTP) quedaron `enabled=false` por diseño; el PATCH rechaza activarlos sin `config.credentials_configured === true`. Decidir el gestor de secretos antes de configurarlas.
- [ ] **Stripe real** (checkout/billing/portal/webhook): no activable sin claves de producción y sin acceso.

## Decisiones abiertas

- [x] **Imagen oficial como universo visual**: resuelto en el bloque A — emblema oficial ZAFIRO creado (`public/zafiro-mark.svg`), favicons SVG/PNG, PWA icons maskable, `BrandEmblem` accesible integrado en Home/Login/Footer, manifest/layout actualizados. (No se usó un asset externo; se diseñó el emblema de la marca.)
- [ ] **Rate limiting multi-instancia**: el limitador actual (`src/lib/rate-limit.ts`) es en memoria de proceso. Para deploy multi-instancia migrar a Redis/Upstash. Se mantuvo la versión en memoria por ser segura para instancia única.
- [ ] **Privacidad de ingesta**: solo se permite `publico`/`interno` en la ingesta manual. ¿Debe Don Miguel habilitar `privado`/`confidencial` para obras sensibles propias? Por ahora: NO (evita fugas por el pipeline).
- [ ] **`privacy_category` backfill**: los libros existentes reciben categoría derivada de `privacy_level` (migración 00055). Confirmar el mapeo legado_futuro→confidencial.

## Tareas técnicas pendientes

- [ ] Añadir validación Zod a rutas de escritura restantes (biblioteca/chapters, people, places, sources, knowledge/ingest, eliana/intakes, eliana/actions, eliana/conversations, stories/[slug], user-settings ya cubierto). Varias ya tienen validación manual.
- [ ] Extender el helper de auditoría (`lib/audit.ts`) al resto de mutaciones sensibles (knowledge, biblioteca, organizaciones, user-settings); hoy está conectado a `album/*` y `eliana/channels`. La IP real ya se captura vía `x-forwarded-for`/`x-real-ip` en `writeAuditLog`.
- [ ] `src/lib/biblioteca/types.ts`: `LibraryApproval` no tipa `book`/`reviewer` → el panel usa `book_id`/`requested_at` internos (aproximación documentada). Tipar con relaciones si se añaden a la migración.
- [ ] Almacenar la IP real para auditoría de `library_access_logs` (los logs no capturan IP).
- [ ] Limpiar warnings de eslint preexistentes (imports no usados en `biblioteca/[id]/page.tsx`, catch `error` sin usar en knowledge/ask y knowledge/feedback).

## Configuración segura aplicada (sin credenciales inventadas)

- `.env.local`: placeholders Supabase/Google marcados `[SENSITIVE]`/`your-*`; `ZAFIRO_ADMIN_PASSWORD=CAMBIA-ESTE-PASSWORD`.
- No se cargaron libros privados reales al pipeline de ingesta.
- Canales externos de ELIANA deshabilitados por defecto y bloqueados sin credenciales (confirmación explícita en la UI).
- Sin push ni deploy; todos los commits son locales en `finish-zafiro-eliana`.
