# PENDIENTES PARA SIGUIENTE FASE

**Proyecto:** MSM-Zafiro
**Rama:** finish-zafiro-eliana
**Último commit de cierre:** `e3554bf` (P1+P2) y commit de cierre de bloque (ver git log)
**Fecha:** cierre de la etapa

Criterio de inclusión: todo lo que NO puede resolverse desde el repositorio (depende de credenciales, servicios externos, decisión de negocio o infraestructura) se documenta aquí. Todo lo que dependía de código se corrigió en esta etapa.

---

## GRUPO A — Credenciales e infraestructura (bloquea el modo producción)

### A1. Configurar Supabase real y aplicar las 60 migraciones
- **Motivo:** sin Supabase configurado, la app degrada a modo demo (localStorage, fallbacks) y las rutas API devuelven 503/vacío. Las ~90 tablas y las 570 políticas RLS de `supabase/migrations/` (00001–00060) no se han aplicado a ninguna base real.
- **Dependencia:** proyecto Supabase (URL, anon key, service role key). En `.env.local` hoy están como `[SENSITIVE]` y `PENDIENTE`.
- **Tiempo estimado:** 2–4 h.
- **Riesgo:** ALTO — sin DB no hay datos reales, RLS activo, ni validación de auth/perfiles.
- **Acción necesaria:** crear proyecto Supabase → `supabase link` → `supabase db push` (o pegar los SQL en el SQL Editor) → llenar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → re-test de la suite.

### A2. Instalar CLI de Supabase y psql
- **Motivo:** no se pueden aplicar/verificar migraciones desde este equipo (CLI ausente).
- **Dependencia:** permisos de instalación (`npm i -g supabase`, psql).
- **Tiempo estimado:** 1 h.
- **Riesgo:** ALTO (schema pendiente de aplicar).
- **Acción necesaria:** instalar y ejecutar migraciones (ver A1).

### A3. Configurar Stripe (webhook secret + price IDs reales)
- **Motivo:** `STRIPE_WEBHOOK_SECRET` está vacío y `NEXT_PUBLIC_STRIPE_PRICE_PRO`/`CUBA_PLUS` son placeholders (`price_TU-*`) → checkout y webhook fallan en producción.
- **Dependencia:** productos/precios creados en Stripe Dashboard + endpoint de webhook con secret.
- **Tiempo estimado:** 1–2 h.
- **Riesgo:** MEDIO — pagos reales no operan.
- **Acción necesaria:** crear precios PRO/CUBA_PLUS (mensual/anual) en Stripe, copiar IDs a envs, crear webhook y configurar `STRIPE_WEBHOOK_SECRET`.

### A4. Definir `ELIANA_API_KEY`
- **Motivo:** no está definida → los endpoints `POST/GET /api/eliana/audit` y `POST /api/eliana/marketplace` quedan SIN autenticación (el check bearer se omite si la env falta).
- **Dependencia:** clave generada por el equipo.
- **Tiempo estimado:** 15 min.
- **Riesgo:** ALTO (seguridad: endpoints internos expuestos).
- **Acción necesaria:** generar clave fuerte, setear en `.env.local` + Vercel y verificar que el check se active.

### A5. Credenciales de setup del owner/admin
- **Motivo:** `ZAFIRO_ADMIN_PASSWORD` y `ZAFIRO_SETUP_TOKEN` son placeholders → `/api/admin/seed-owner` no puede ejecutarse con credenciales reales.
- **Dependencia:** decisión del cliente sobre el admin inicial.
- **Tiempo estimado:** 15 min.
- **Riesgo:** MEDIO.
- **Acción necesaria:** setear envs y ejecutar el seed-owner una sola vez.

### A6. `NEXT_PUBLIC_APP_URL` y dominio
- **Motivo:** placeholder; varios fallbacks usan `https://zafiro.msmmystore.com` hardcodeado.
- **Dependencia:** decisión de dominio final.
- **Tiempo estimado:** 15 min.
- **Riesgo:** BAJO.
- **Acción necesaria:** setear `NEXT_PUBLIC_APP_URL` y revisar hardcodes de dominio.

### A7. Desplegar y validar URL
- **Motivo:** el proyecto Vercel `zafiro` existe (región iad1) pero no se ejecutó un deploy verificado de este cierre; no hay URL pública validada.
- **Dependencia:** credenciales Vercel + envs del proyecto.
- **Tiempo estimado:** 1 h.
- **Riesgo:** MEDIO.
- **Acción necesaria:** `vercel env pull` → `vercel deploy --prod` → verificar la URL y el funcionamiento del service worker.

---

## GRUPO B — Decisión de negocio o funcionalidad nueva

### B1. Proveedores externos de marketplace (Amazon, Walmart, Sam's Club, Home Depot, SHEIN)
- **Motivo:** nunca estuvieron implementados. El directorio `src/lib/marketplace/providers/` (5 cascarones `PlaceholderProvider`) era código huérfano y fue ELIMINADO en esta etapa. El pricing usa comisiones/flags de Supabase; el catálogo se gestiona por `src/lib/marketplace/client.ts` (Supabase + fallback).
- **Dependencia:** contratos y API keys de cada proveedor externo.
- **Tiempo estimado:** 1–2 semanas por proveedor.
- **Riesgo:** ALTO (complejidad de integración, cumplimiento).
- **Acción necesaria:** definir proveedor piloto y construir conector real sobre `marketplace_provider_*` (schema ya existe).

### B2. Canales externos de ELIANA (WhatsApp / Telegram / Email)
- **Motivo:** los adaptadores (`src/lib/eliana/core/adapters.ts`) solo registran `Would send...` / `Simulated`. Los canales están deshabilitados (`enabled:false`, `requires_credentials:true`) y `channels/route.ts` bloquea activación sin credenciales.
- **Dependencia:** WhatsApp Business Cloud API, bot token de Telegram, proveedor de email/SMTP.
- **Tiempo estimado:** 2–4 días.
- **Riesgo:** MEDIO.
- **Acción necesaria:** configurar credenciales por canal y habilitarlos en la UI de configuración.

### B3. Cuota de Gemini para ELIANA
- **Motivo:** `GEMINI_API_KEY` autentica, pero Google devuelve **429 cuota agotada** (diagnóstico documentado en `DIAGNOSTICO_ELIANA.md`). Las respuestas de IA no están disponibles hasta resolver la cuota.
- **Dependencia:** plan Gemini con cuota suficiente o facturación habilitada.
- **Tiempo estimado:** depende del plan.
- **Riesgo:** ALTO (función central).
- **Acción necesaria:** aumentar cuota/cambiar plan y re-validar `/api/chat` y `story-action`.

### B4. Módulo de Inventario
- **Motivo:** no existe página ni API de inventario; solo hay `stock`/`track_inventory` en productos y tablas `marketplace_provider_inventory`, `economia_inventario` sin uso.
- **Dependencia:** decisión de negocio sobre el modelo de inventario.
- **Tiempo estimado:** 2–3 días.
- **Riesgo:** MEDIO.
- **Acción necesaria:** definir requerimiento y construir UI + endpoints sobre el schema existente.

### B5. Tablas legacy de Economía/Frecuencia
- **Motivo:** el módulo económico simulado fue ELIMINADO (código), pero quedan tablas huérfanas en migraciones: `economia_operaciones`, `economia_caja`, `economia_inventario`, `frequency_origin_nodes`, `frequency_channels`, `frequency_events`, `guardian_actions`, `vista_auditoria_economia`.
- **Dependencia:** decisión de negocio (resucitar módulo vs limpiar).
- **Tiempo estimado:** 1 h.
- **Riesgo:** BAJO.
- **Acción necesaria:** migración de DROP si no se reutilizan.

### B6. Gamificación en localStorage (PTS, logros, referidos, mensajes, sponsors del hub)
- **Motivo:** `rewards.ts`, `referidos.ts`, `messages`, sponsors/questions del hub raíz persisten en `localStorage` y son trucables desde DevTools. No hay backend.
- **Dependencia:** decisión de negocio + tablas/endpoints.
- **Tiempo estimado:** 3–5 días.
- **Riesgo:** MEDIO.
- **Acción necesaria:** definir si estas funciones son parte del producto y migrarlas a Supabase.

### B7. Carrito de compras
- **Motivo:** carrito en `localStorage` (`zafiro_marketplace_cart`); las tablas `marketplace_carts`/`marketplace_cart_items` existen sin uso.
- **Dependencia:** Supabase configurada.
- **Tiempo estimado:** 1 día.
- **Riesgo:** BAJO.
- **Acción necesaria:** conectar carrito a `marketplace_cart_items` con RLS.

### B8. Mensajería interna
- **Motivo:** `/messages` es demo con conversaciones hardcodeadas + localStorage; no hay backend de mensajes.
- **Dependencia:** decisión de negocio + diseño.
- **Tiempo estimado:** 3–5 días.
- **Riesgo:** MEDIO.
- **Acción necesaria:** definir y construir si es parte del producto.

### B9. Integración Linktree
- **Motivo:** `importFromLinktree` fabricaba 4 perfiles sociales falsos; en esta etapa se corrigió para devolver lista vacía (ya no se crea data falsa). La importación real requiere API de Linktree (no oficial).
- **Dependencia:** API/credenciales o scraping autorizado.
- **Tiempo estimado:** 1 día.
- **Riesgo:** BAJO.
- **Acción necesaria:** integrar con la API real cuando exista acceso.

### B10. Notificación al admin desde el formulario de contacto
- **Motivo:** `/api/contact` guarda en `contact_messages` (Supabase) pero no envía email; no hay proveedor de email transaccional (sin Resend/nodemailer/SMTP).
- **Dependencia:** proveedor de email + credenciales.
- **Tiempo estimado:** 1 día.
- **Riesgo:** BAJO.
- **Acción necesaria:** conectar SMTP y notificar al admin.

---

## GRUPO C — Calidad (mecánico, sin bloqueo)

### C1. E2E de flujos con datos (pagos, checkout, chat, marketplace)
- **Motivo:** la suite E2E ahora cubre 28 smoke tests (10 auth/públicas + 18 páginas públicas añadidas en esta etapa), pero no hay tests de pago, checkout, chat o marketplace con datos.
- **Dependencia:** Supabase/Stripe configurados.
- **Tiempo estimado:** 2–3 días.
- **Riesgo:** MEDIO.
- **Acción necesaria:** escribir E2E de los flujos críticos una vez configurada la infraestructura.

### C2. 31 warnings de lint restantes (sin bloqueo)
- **Motivo:** en esta etapa se eliminaron los 229 warnings de `no-unused-vars` (quedan 0). Persisten **31 warnings de otras reglas**: 12 `react-hooks/exhaustive-deps` y 19 `@next/next/no-img-element` (`<img>` sin `next/image`).
- **Dependencia:** código.
- **Tiempo estimado:** 2–3 h.
- **Riesgo:** BAJO (los `exhaustive-deps` no se tocaron para no alterar el comportamiento de los hooks).
- **Acción necesaria:** migrar `<img>` a `next/image` (19) y revisar las deps de hooks una por una (12).

### C3. Rate limiting persistente en producción
- **Motivo:** el limitador `src/lib/rate-limit.ts` es en memoria (`Map`): ahora cubre **todas las rutas de escritura y lectura sensibles** (25 rutas añadidas en esta etapa + las que ya tenían), pero el contador vive por instancia y se reinicia en cada redeploy; no es compartido entre instancias.
- **Dependencia:** infraestructura (Upstash/Redis) o límites en el edge/Vercel.
- **Tiempo estimado:** 1 día.
- **Riesgo:** BAJO (en single-instance funciona bien).
- **Acción necesaria:** migrar a un store distribuido cuando haya múltiples instancias.

### C4. Verificación offline/PWA en producción
- **Motivo:** el service worker tiene un bug de precedencia corregido en esta etapa (`sw.js:25`), la PWA está configurada (manifest + 9 íconos + registro solo en producción); falta validarla en el dominio real.
- **Dependencia:** deploy.
- **Tiempo estimado:** 30 min.
- **Riesgo:** BAJO.
- **Acción necesaria:** tras deploy, validar installability, offline y actualización de caché.

---

## Resumen de la etapa de cierre

- **Funcional y verificado:** suite completa `pnpm install` + `lint` (0 errores/31 warnings) + `typecheck` (0) + `test` (88/88) + `build` (140 páginas) + `playwright` (28/28).
- **Corregido (errores reales):** bug de precedencia en `public/sw.js:25` (la comprobación de origen era código muerto); rama demo muerta en `StripeModal.tsx` por desalineación de cadena con el 503 de checkout (ahora usa `code: "STRIPE_NOT_CONFIGURED"` y el aviso ámbar solo se muestra en modo demo); documentación de autenticación obsoleta en el Knowledge Pack (decía "auth mock/localStorage" cuando ya es Supabase Auth).
- **Seguridad:** rate limiting añadido a las 25 rutas API que no tenían (auth, eliana, knowledge, stripe, voz-viva, admin/seed-owner); el limitador en memoria cubre ahora todas las rutas sensibles.
- **Calidad:** 229 warnings de `no-unused-vars` eliminados (0 restantes); suite E2E ampliada de 10 a 28 tests de páginas públicas.
- **Eliminado (etapa anterior):** cluster económico simulado (6 archivos), directorio de proveedores huérfano (5 archivos), dependencia `rehype-raw`.
- **Completado desde código:** PWA (service worker + registro), márgenes/flags del admin persistidos en `marketplace_config`.
