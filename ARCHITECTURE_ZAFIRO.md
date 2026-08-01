# ARCHITECTURE_ZAFIRO.md — Arquitectura técnica de ZAFIRO

> Diagnóstico del CAPÍTULO 1 (Parte B) · 2026-07-31 · Basado en evidencia del repositorio (rama `finish-zafiro-eliana`, HEAD `695f241`). No inventa porcentajes; toda cifra proviene de la exploración real. Actualizado con avances del C2 (roles desde servidor, auditoría, MFA, sesiones, organizaciones).

## 1. Vista general

ZAFIRO es una aplicación web Next.js (App Router) de una sola base de código que integra: autenticación y perfiles, el asistente ELIANA (IA), Marketplace, economía/ledger, Biblioteca Viva, Consejo Invisible, historias, membresías/pagos (Stripe), y páginas institucionales. Se despliega en Vercel y usa Supabase como backend (Postgres + Auth + Storage).

- **Stack real**: Next.js `16.2.10` (Turbopack), React `19.2.4`, TypeScript `5`, Tailwind CSS `4`, `@supabase/ssr` + `@supabase/supabase-js`, `@google/genai` (Gemini), `stripe` + `@stripe/stripe-js`, `lucide-react`, `motion`, `react-markdown`, `zod`, `vitest`, `@playwright/test`.
- **Rutas**: 129 páginas estáticas generadas en build + ~65 Route Handlers (`ƒ`) + Proxy (middleware `src/proxy.ts`).
- **Base de datos**: 54 migraciones SQL, ~85 tablas, ~40 enums, RLS activa.
- **Variables de entorno**: documentadas en `.env.example` (Supabase, Stripe, Gemini, `NEXT_PUBLIC_APP_URL`, `ZAFIRO_ADMIN_EMAIL=msmmystore@gmail.com`).

## 2. Frontend

- **Páginas**: 100% `'use client'` (excepto layouts/routes de server). Single-page principal `/` con 6 vistas (Inicio, Explorar, Gemología, Círculos, Sponsors, Perfil) más páginas standalone.
- **Estilo**: mobile-first, tema oscuro `#050816`, acento `#00D9FF`, fuente Geist, `BottomNav` en `/`, Footer en páginas standalone, iconos `lucide-react`, animaciones `motion`.
- **Estado del cliente**: se mezclan tres fuentes: (a) **Supabase** vía API/servidor para datos transaccionales, (b) **localStorage** para muchas funciones (mensajes, PTS, referidos, universo, comentarios, sponsors, campañas, carrito), (c) **datos estáticos hardcodeados** en `src/lib/*-data.ts` y `src/lib/zafiro-data.ts`.
- **Componentes compartidos**: `src/components/ui/*` (GlassCard, Skeleton, StatCard, NetworkBackground, GradientText), `BottomNav`, `Footer`, componentes ELIANA (`ElianaAdvancedChat`, `ElianaStandaloneChat`, `ElianaMarketplaceChat`, `ElianaAdminDashboard`, launchers), gemología, sponsors, consejo invisible.
- **Seguridad HTTP**: headers en `next.config.ts` (`X-Frame-Options: DENY`, CSP, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Referrer-Policy`, `X-Content-Type-Options`).
- **Imágenes**: `next/image` con `remotePatterns` restringido a `msmmystore.com`, `*.supabase.co`, `*.gravatar.com` (C2); varias páginas usan `<img>` directo (warnings de lint).

## 3. Backend (API)

Route Handlers en `src/app/api/**/route.ts` (~66), agrupadas por dominio:

| Dominio | Endpoints | Estado |
|---|---|---|
| Auth | `auth/register, forgot-password, recovery-code, reset-password, reset-with-code, resend-verification` | Real (Supabase Auth server-side) |
| Perfil/config | `user-profile, user-settings` | Real (Supabase) |
| ELIANA | `chat`, `eliana/messages, conversations, actions, audit, intakes, context-handoff, health, story-action, marketplace, eliana/messages` | Real (Gemini + Supabase) + capa cliente localStorage |
| Knowledge | `knowledge/search, ask, ingest, documents, approvals, audit, feedback, gaps, settings, stats, seed` | Real RAG sobre docs estáticos + Supabase |
| Biblioteca | `biblioteca/books, books/[id], chapters, imports, people, places, sources, approvals, ingest` | Real (Supabase) + `requireOwner()` (retirada del público); aprobaciones GET/POST/PUT y ingesta manual txt/md |
| Stripe | `stripe/checkout, portal, webhook, billing` | Real; webhook con idempotencia durable (`stripe_events`) |
| Marketplace | vía `src/lib/marketplace/client.ts` (Supabase) | Real |
| Historias | `stories, stories/[slug]` | Real (Supabase) |
| Varios | `contact` (persiste en Supabase, sin SMTP), `voz-viva` (stories), `admin/seed-owner` | Real |

- **Middleware**: `src/proxy.ts` — sesión SSR + protección de rutas por rol.
- **Autenticación de API**: `src/lib/api-auth.ts` — validación server-side del usuario (owner/admin/roles).
- **Seguridad (C11)**: `src/lib/rate-limit.ts` — rate limiting por IP (ventana deslizante en memoria) aplicado a ~15 rutas sensibles (auth, contacto, chat ELIANA, knowledge, organizaciones, historias, Stripe, ingesta); validación Zod en las rutas de escritura más expuestas (contact, user-settings, user-profile, feedback, ask, messages, organizations, stories, checkout, approvals, memory, ingest).

## 4. Base de datos (Supabase Postgres)

- **Esquema**: `public`, 57 migraciones secuenciales (`supabase/migrations/00001…00057`), tablas principales:
  - **Identidad/Auth**: `profiles`, `user_roles`, `organizations`, `memberships`, `app_sessions`, `login_events`, `sso_tickets`, `user_settings`, `audit_logs`.
  - **ELIANA**: `eliana_conversations`, `eliana_messages`, `eliana_memory`, `eliana_tasks`, `eliana_tickets`, `eliana_intakes`, `eliana_handoffs`, `eliana_actions`, `eliana_audit_logs`, `eliana_settings`, `eliana_feedback`, `eliana_knowledge`, `eliana_channels`, `eliana_contacts`, `eliana_identities`.
  - **Knowledge Core**: `knowledge_sources`, `knowledge_documents`, `knowledge_chunks`, `knowledge_tags`, `knowledge_document_tags`, `knowledge_versions`, `knowledge_permissions`, `knowledge_queries`, `knowledge_answers`, `knowledge_feedback`, `knowledge_ingestion_jobs`, `knowledge_approvals`, `knowledge_gaps`, `knowledge_settings`, `knowledge_audit_logs`.
  - **Marketplace**: `marketplace_categories`, `_providers`, `_stores`, `_store_members`, `_products`, `_product_variants`, `_product_images`, `_provider_products/_prices/_inventory`, `_carts`, `_cart_items`, `_orders`, `_order_items`, `_order_status_history`, `_payments`, `_refunds`, `_shipments`, `_tracking_events`, `_reviews`, `_favorites`, `_disputes`, `_audit_logs`, `_price_rules/_price_history`, `_coupons`, `_commissions`, `marketplace_config`.
  - **Consejo Invisible**: `invisible_council_*` (23 tablas: guides, sources, audio_files, transcripts, transcript_segments, teachings, sessions, session_guides, session_teachings, books, book_chapters, book_sections, goals, goal_updates, journal_entries, prayers, tags, content_tags, files, versions, permissions, ai_interactions) + `council_user_roles`.
  - **Economía**: `economia_operaciones`, `economia_caja`, `economia_inventario`, `frequency_origin_nodes`, `frequency_channels`, `frequency_events`, `guardian_actions`.
  - **Contenido**: `mis_historias` (stories), `referrals`, `rewards_log`, `contact_messages`, `stripe_events`, `library_*` (Biblioteca Viva).
- **RLS**: política activa endurecida en `00035`, `00048`, `00049`, `00051` (owner/admin sobre acciones sensibles; insert autenticado; datos por `user_id`). `knowledge` con `is_knowledge_admin()`.
- **Recovery**: RPCs `generate_recovery_code` / `validate_recovery_code` (`00043`) — no hay SMTP propio; recuperación vía código en Supabase Auth.
- **Gestión de sesiones**: RPCs `list_my_sessions` / `revoke_my_session` / `revoke_other_sessions` (`00054`, `SECURITY DEFINER` sobre `auth.sessions`) expuestos vía `api/auth/sessions`; la sesión actual se identifica por el claim `session_id` del access token.
- **Autor IA (C7)**: `00057` añade columnas aditivas a `invisible_council_books`/`_book_chapters` (`outline`, `voice`, `style_guide`, `published_book_id`, `generation_metadata`) para el flujo de escritura con IA (sin tocar RLS). El motor usa Gemini + RAG y publica el resultado en la Biblioteca Viva (`library_*`).
- **MFA (TOTP)**: enroll/challenge/verify/desenroll vía GoTrue (`MfaSection`) + UI de sesiones en `/settings`; pendiente validación e2e con claves reales.

## 5. Almacenamiento

- **Bucket `biblioteca_ingesta`** (`00056`, privado, máx 5 MB, solo owner/admin): copias originales de la ingesta manual de txt/markdown. La ingesta en BD no depende del bucket (best-effort). Aplicación de la migración pendiente en la nube.
- Supabase Storage previsto para archivos de Biblioteca Viva (checksum, versiones) — migraciones definen metadatos (`library_*`, `knowledge_documents` con `storage_path`). No hay uploads de archivos verificados end-to-end en esta auditoría.
- `knowledge-pack/` contiene el contenido institucional (markdown) que el script `scripts/generate-knowledge-data.mjs` convierte en `src/lib/knowledge-data.ts` embebido (81 docs en build).

## 6. Autenticación, roles y permisos

- **Dual en la práctica**: auth real (Supabase Auth + sesión SSR + `api-auth`) para APIs y rutas protegidas. **C2**: `fetchServerMe`/`api/auth/me` exponen roles y perfil desde el servidor y el cliente los consume para permisos de UI (dashboard, biblioteca, historias, auditoría, organización); queda uso de localStorage para datos de funcionalidades, no para roles.
- **Matriz de roles**: `cliente, seller, vip, operator, admin, economy, superadmin/owner` (`00003`, `00016`/`council_user_roles`, `00037` taxonomía unificada). `is_owner()`/`is_admin()`/`is_knowledge_admin()` en políticas.
- **Correo único**: `00053_correo_unico.sql` consolida OWNER + LIFETIME_UNLIMITED en `msmmystore@gmail.com` (idempotente, con auditoría).

## 7. Inteligencia artificial (ELIANA)

- **Motor**: `@google/genai` (Gemini) en `src/app/api/chat/route.ts` y `api/eliana/*`; `GEMINI_API_KEY` / `GOOGLE_API_KEY` desde env; rate limit 30/min.
- **Conocimiento**: capa `src/lib/knowledge/*` (RAG por keywords sobre docs estáticos + búsqueda híbrida contra `knowledge_*` cuando hay DB) + capa cliente `src/lib/eliana/*` (memory, analysis, knowledge, recommendations, core/*). **Duplicación de motores** entre `lib/eliana/core/*` y `lib/knowledge/*` + `api/eliana/*`.
- **Memoria (C5)**: `src/lib/eliana/memory.ts` con persistencia dual — caché localStorage sincrónica + Supabase (`eliana_memory`) en segundo plano vía `api/eliana/memory` (append/replace, límite 500 filas/vuelta, dedupe de hechos con confianza +0.1 hasta 1.0).
- **Guardrails**: sanitización de entrada/salida (`checkInputSafety`/`checkOutputSafety`) y protección contra prompt injection en rutas de conocimiento; referencias de fuentes hacia documento/página/sección.
- **Autor IA (C7)**: `src/lib/autor-ia/*` — motor `engine.ts` (`generateText` con `@google/genai`, modelo `gemini-2.0-flash` por defecto, tiempo de espera 60 s), `prompts.ts` (sistema, outline, capítulo, sección), `repository.ts` (CRUD sobre `invisible_council_books`/`_chapters`/`_sections` + auditoría en `invisible_council_ai_interactions` + publicación a Biblioteca Viva). API en `api/consejo/autor*` (owner-only, rate-limited) y UI en `/admin/autor-ia`.
- **Voz**: Web Speech API (configuración `/eliana/configuracion/voz`); **no verificado** en esta auditoría el flujo de voz en tiempo real.

## 8. Canales externos e integraciones

| Canal | Estado real | Notas |
|---|---|---|
| Stripe (membresías) | Real (`checkout`, `portal`, `webhook`, `billing`) | Idempotencia durable `stripe_events` (00052); requiere price IDs reales y webhook secret |
| WhatsApp | Enlaces manuales (`wa.me`) | Sin API oficial/configuración de bot |
| Google Drive (Biblioteca) | `src/lib/biblioteca/google-drive-sync.ts` | Librería presente; sin claves/config verificado |
| Vercel | Despliegue | Proyecto `zafiro`; producción servida desde `origin/main` |
| Supabase | Auth + DB + Storage | CLI no instalada; migraciones 00045-00053 no aplicadas en producción |
| Gemini | IA | Clave presente; modo producción/fallback mixto |
| SMTP/Email | No hay | Contacto persiste en Supabase; recuperación por código |

## 9. Despliegue

- `vercel.json` + `.vercel/` (proyecto `zafiro`). Dominio `https://zafiro.msmmystore.com`.
- Build: `prebuild` regenera `knowledge-data.ts` → `next build` (129 páginas OK).
- Producción (`origin/main` = `83eb0b9`) está **desactualizada** respecto a `finish-zafiro-eliana` (3 commits de retraso: `50cc964`, `651b96c`, `695f241`).
- Respaldos: rama `backup/pre-operacion-2026-07-31`.

## 10. Línea base de verificación (Parte C — 2026-07-31)

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npm run lint` | 0 errores · 323 warnings (imports sin usar, exhaustive-deps, `<img>`) |
| `npm test` (vitest) | 9/9 en 1 archivo (`src/__tests__/auth.test.ts`) |
| `npm run build` | OK · 129 páginas · 65 rutas `ƒ` · Proxy activo |
| Playwright | Config presente (`playwright.config.ts`, `e2e/auth.spec.ts`); no ejecutado en esta línea base |

## 11. Riesgos de arquitectura identificados

1. **Dualidad localStorage/Supabase**: varias funciones "funcionales" dependen de datos locales (PTS, referidos, mensajes, sponsors, carrito, memoria ELIANA cliente) que se pierden al cambiar de navegador y no están protegidas por permisos.
2. **Dos motores de conocimiento** que no se comunican (`lib/eliana/core/*` vs `lib/knowledge/*` + `api/eliana/*`).
3. **Datos ficticios embebidos** en producción (`zafiro-data.ts`, `ecosistema.ts`, `gemology-data.ts`, `ecosystem/payments` promete cartera no implementada, `sponsors-page` marca campañas como "simulada").
4. **Provider `msm-inventory` activo sin datos** → marketplace puede verse vacío; placeholders de Amazon/Walmart/etc deshabilitados por diseño (sin autorización/keys).
5. **Roles en localStorage para UI** (el servidor valida aparte) → riesgo de inconsistencia de permisos percibidos. **C2**: mitigado — roles leídos del servidor (`api/auth/me`) para la UI; queda validación e2e con claves reales.
6. **`remotePatterns` de imágenes abierto** a cualquier hostname. **C2**: restringido a `msmmystore.com`, `*.supabase.co`, `*.gravatar.com`.
7. **Pagos del marketplace no conectados** (provider manual genera `MANUAL-<timestamp>`, sin transacción real).
8. **Sin pruebas de integración/e2e completas** (solo 9 unitarias de auth + spec de playwright estático).
9. **CLI Supabase no instalada**; migraciones 00045-00053 aún no aplicadas en la nube.
10. **`ecosystem/payments` es marketing** (cartera digital no existe) — debe marcarse o retirarse.
