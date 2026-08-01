# PENDIENTES_ZAFIRO.md — Decisiones y tareas abiertas

**Última actualización:** 2026-07-31 (noche de trabajo C5/C6/C11)

Este archivo registra decisiones que requieren a Don Miguel o dependencias externas (Fase 0). Regla aplicada esta noche: si falta una decisión → configuración segura por defecto + registrar aquí.

## Bloqueos de la nube (Fase 0)

- [ ] **Aplicar migraciones 00054, 00055 y 00056 en Supabase** (no hay CLI Supabase en este entorno; no se aplicaron). 00055 y 00056 son aditivas y reversibles; 00054 (RPCs de sesiones) no validada en producción.
- [ ] **Validación e2e RLS** con cuenta owner real: aprobaciones, ingesta, bucket `biblioteca_ingesta`.
- [ ] **Stripe real** (checkout/billing/portal/webhook): no activable sin claves de producción y sin acceso.

## Decisiones abiertas

- [ ] **Imagen oficial como universo visual**: pendiente de confirmar si el asset existe y cuál es. No se tocó UI visual de marca esta noche.
- [ ] **Rate limiting multi-instancia**: el limitador actual (`src/lib/rate-limit.ts`) es en memoria de proceso. Para deploy multi-instancia migrar a Redis/Upstash. Se mantuvo la versión en memoria por ser segura para instancia única.
- [ ] **Privacidad de ingesta**: solo se permite `publico`/`interno` en la ingesta manual. ¿Debe Don Miguel habilitar `privado`/`confidencial` para obras sensibles propias? Por ahora: NO (evita fugas por el pipeline).
- [ ] **`privacy_category` backfill**: los libros existentes reciben categoría derivada de `privacy_level` (migración 00055). Confirmar el mapeo legado_futuro→confidencial.

## Tareas técnicas pendientes

- [ ] Añadir validación Zod a rutas de escritura restantes (biblioteca/chapters, people, places, sources, knowledge/ingest, eliana/intakes, eliana/actions, eliana/conversations, stories/[slug], user-settings ya cubierto). Varias ya tienen validación manual.
- [ ] `src/lib/biblioteca/types.ts`: `LibraryApproval` no tipa `book`/`reviewer` → el panel usa `book_id`/`requested_at` internos (aproximación documentada). Tipar con relaciones si se añaden a la migración.
- [ ] Almacenar la IP real para auditoría (ahora se usa `x-forwarded-for` en rate limiting; los logs de `library_access_logs` no capturan IP).
- [ ] Limpiar warnings de eslint preexistentes (imports no usados en `biblioteca/[id]/page.tsx`, catch `error` sin usar en knowledge/ask y knowledge/feedback).

## Configuración segura aplicada (sin credenciales inventadas)

- `.env.local`: placeholders Supabase/Google marcados `[SENSITIVE]`/`your-*`; `ZAFIRO_ADMIN_PASSWORD=CAMBIA-ESTE-PASSWORD`.
- No se cargaron libros privados reales al pipeline de ingesta.
- Sin push ni deploy; todos los commits son locales en `finish-zafiro-eliana`.
