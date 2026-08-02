# AUDITORÍA REAL DEL PROYECTO ZAFIRO — 2026-07-30

> Diagnóstico objetivo basado en el código existente. No es una lista optimista: cada afirmación fue verificada leyendo los archivos y migraciones del repositorio.
> Método: 5 auditorías paralelas (estructura, ELIANA/conocimiento, seguridad/administración, comercio/economía, arquitectura) + verificación puntual de hallazgos críticos (tablas knowledge, Mente Maestra, gates de `proxy.ts`, carrito activo).

---

## 1. VERDAD CENTRAL

**La plataforma tiene una capa de interfaz construida en ~85%, un esquema de base de datos rico (105 tablas, 46 enums, 393 políticas RLS en 43 migraciones) y UN motor de IA real (Gemini). Pero la capa funcional de extremo a extremo está por debajo del 40%: la mayoría de flujos de negocio (pedidos, pagos, membresías, inventario, economía, Knowledge Core) no completan un ciclo real.**

### Lo que se confirmó NO funciona de punta a punta (aunque la UI existe):
| Flujo | Evidencia |
|---|---|
| **Pagos Stripe** | `STRIPE_WEBHOOK_SECRET` vacío; precios `price_TU-PRICE-*` (placeholders, inválidos); webhook escribe en tablas `orders` y `payments` que **no existen** (solo `marketplace_orders` y `marketplace_payments`); activación de membresía escribe `plan='pro'/'cuba_plus'` que **viola el CHECK** de 00039 (`free, pro_monthly, pro_annual, cuba_plus_monthly, cuba_plus_annual, lifetime_unlimited`). |
| **Pedidos** | `createOrder()` no envía `buyer_id` ni `store_id` (ambos NOT NULL en 00010) → el INSERT falla; la página muestra éxito y vacía el carrito (pérdida silenciosa de datos). El camino "Pagar con Stripe" no envía `orderId` ni `userId` → cobra sin pedido. |
| **Inventario** | Esquema completo (`stock`, `low_stock_threshold`, variantes, `marketplace_provider_inventory`) pero **no hay lógica de decremento**: ningún código toca stock al crear un pedido. |
| **Knowledge Core** | Arquitectura excelente (`KnowledgeRepository` con 15+ tablas, híbrido keyword+vector, RAGPipeline, ingestion con chunking, guardrails) pero **NINGUNA migración crea tablas `knowledge_*`**. Todas las consultas fallan silenciosamente. No hay generador de embeddings (`generate_embeddings=false`). El conocimiento real que usa ELIANA es `KNOWLEDGE_DOCS` estático. |
| **Economía (PTS)** | `rewards.ts` y `referidos.ts` son 100% localStorage (`zafiro_pts`, `zafiro_streak`, badges). Las tablas `rewards_log`, `referrals` y `economia_*` (00001/00002) **no las usa ningún código de la app**. |
| **Márgenes / feature flags / admin ELIANA** | `margenes` y flags del admin son estado localStorage. `ElianaAdminDashboard` lee todo de localStorage. |
| **Membresías** | El toggle mensual/anual es cosmético; siempre envía `planId: "pro"|"cuba_plus"` sin `userId` → el webhook nunca activa nada. |
| **Notificaciones** | `NotificationsDropdown` usa un array hardcodeado de 2 elementos. No hay backend de notificaciones ni tablas. |
| **Feed de inicio** | Todo el contenido social (historias, preguntas, tendencias, patrocinadores, gráfico) es **data demo** (`zafiro-data.ts`) + localStorage. |
| **Auditoría** | `audit_logs`, `eliana_audit_logs`, `library_access_logs`, `login_events` existen en DB pero **nada las escribe ni las expone** (excepto seeds de 00041). |
| **Mente Maestra** | Solo referencias conceptuales (docs de conocimiento, cards falsas en perfil, respuestas de chat, nodo de grafo en `/eliana`). No hay módulo. |

---

## 2. ESTADO POR MÓDULO

Leyenda calidad: 1–10. **Listo prod** = puede operar hoy con claves reales configuradas.

| # | Módulo | ¿Existe? | % real | Estado | Archivos clave | Calidad | Prod |
|---|---|---|---|---|---|---|---|
| 1 | **ZAFIRO (núcleo)** | Sí | 55% | UI completa (feed, universo, gemología, perfil, mensajes) pero datos demo/localStorage; sin red social real en DB | `src/app/page.tsx`, `src/lib/zafiro-data.ts`, `src/app/universo`, `src/lib/universo.ts` | 6 | No |
| 2 | **ELIANA** | Sí | 75% | Gemini real + cadena de fallback + guardrails + memory/tasks/voz. Persistencia DB bloqueada por env; contexto de conocimiento estático; análisis/recomendaciones con plantillas | `src/lib/eliana/`, `src/app/api/chat/route.ts`, `src/components/eliana/` | 8 | Parcial |
| 3 | **Knowledge Core** | Diseño sí / datos no | 15% | Repo + RAG + ingestion bien diseñados pero sin tablas, sin embeddings, sin 4 rutas (`gaps`, `feedback`, `settings`, `audit`) | `src/lib/knowledge/`, `src/app/api/knowledge/`, `src/lib/knowledge-data.ts` | 6 (diseño) / 0 (funcional) | No |
| 4 | **Panel Administrativo** | Sí | 50% | Marketplace admin real (Supabase) si DB conecta; ELIANA admin y márgenes localStorage; sin gate server-side; system-status con lista de migraciones incompleta | `src/app/admin/`, `src/lib/admin/data.ts` | 6 | No |
| 5 | **Usuarios y autenticación** | Sí | 65% | Login Supabase real (código), recuperación por código, auto-confirmación. Rol fragmentado: enum 00003 vs CHECK 00036 (sin `admin`/`seller`), 00041 contradice el CHECK, `proxy.ts` excluye `owner`, gate seller usa `seller` que no existe | `src/lib/auth.ts`, `src/app/api/auth/*`, `src/proxy.ts`, migraciones 00003/00036/00041 | 6 | No |
| 6 | **Seguridad** | Parcial | 40% | RLS fuerte en marketplace/eliana/biblioteca; `knowledge_*` sin RLS (no existen); rutas abiertas (`api/knowledge/seed` sin auth, `api/biblioteca/*` sin auth); checkout acepta `userId` del cliente; rate limits en memoria (por instancia); CSP con `unsafe-inline/unsafe-eval`; clave Gemini filtrada en historial de chat | `src/proxy.ts`, `src/app/api/*`, `supabase/migrations/` | 4 | No |
| 7 | **Configuración** | Sí | 70% | `/settings` real con API + tabla `user_settings` (00038). `/eliana/configuracion/*` son UI pura sin persistencia; `/dashboard/configuracion` localStorage | `src/app/settings/page.tsx`, `src/app/api/user-settings/route.ts` | 7 | Parcial |
| 8 | **API e integraciones** | Parcial | 30% | ~46 rutas API bien estructuradas; integraciones reales: Gemini (sí), Stripe (estructura sí, e2e no), Supabase (código sí, env no), Google Drive (esqueleto `google-drive-sync.ts`, 0 refs), proveedores marketplace (stubs, `isEnabled=false`) | `src/app/api/**`, `src/lib/stripe/`, `src/lib/biblioteca/google-drive-sync.ts`, `src/lib/marketplace/providers/` | 6 | No |
| 9 | **Inventario** | Esquema sí / lógica no | 20% | Stock en DB + form de producto lo captura; sin decremento, sin alertas, sin movimiento de inventario | `00010`, `src/lib/marketplace/client.ts` | 4 | No |
| 10 | **Pedidos** | Parcial | 25% | Tipos + 19 estados + RLS + funciones client; creación rota (faltan FKs) y checkout Stripe huérfano | `src/app/marketplace/pedidos/page.tsx`, `00010`, `src/app/api/stripe/checkout/route.ts` | 4 | No |
| 11 | **Economía** | Simulada | 20% | PTS/referidos/streaks/badges localStorage; tablas DB muertas; ELIANA lee balance de localStorage | `src/lib/rewards.ts`, `src/lib/referidos.ts`, `00001`/`00002` | 3 | No |
| 12 | **Pagos** | Parcial | 35% | Estructura Stripe sólida (checkout, webhook con verificación de firma + idempotencia, billing, portal); rota e2e (secret, precios, tablas equivocadas, CHECK de plan) | `src/app/api/stripe/*`, `src/lib/stripe/`, `src/app/memberships` | 5 | No |
| 13 | **Membresías** | Parcial | 30% | UI + tabla `profiles.plan` (00039) + rutas billing; sin userId, sin anualidad, CHECK desalineado | `src/app/memberships/page.tsx`, `00039` | 4 | No |
| 14 | **Álbum de la Vida** | Sí | 80% | CRUD real sobre `stories` (00042): API con auth/ownership, galería pública, editor completo, RLS. Falta: escritura de versiones (`story_versions` solo lectura) y subida de medios | `src/app/api/stories/*`, `src/app/{album,mis-historias,historias}/` | 8 | Parcial |
| 15 | **Mente Maestra** | No | 5% | Solo referencias conceptuales | — | 1 | N/A |
| 16 | **La Voz Viva** | Sí | 60% | Web Speech API real (reconocimiento dictado), clasificación manual, guarda en `stories`. Falta: audio real, transcripción/IA, historial | `src/app/voz-viva/page.tsx`, `src/app/api/voz-viva/route.ts` | 7 | Parcial |
| 17 | **Marketplace** | Sí | 40% | Esquema completo (28 tablas); UI completa con fallbacks demo; flujo de compra roto (pedidos/pagos); proveedores son stubs | `src/app/marketplace/`, `src/lib/marketplace/`, `00004-00015` | 6 | No |
| 18 | **Auditoría** | Esquema sí / uso no | 20% | Tablas existen; nada las alimenta ni hay UI; `knowledge_audit_logs` sin migración | `00001`, `00033`, `00036`, `00044` | 3 | No |
| 19 | **Documentación** | Abundante pero desactualizada | 40% | 21+ docs; ~3-4 generaciones de commits atrasadas: "proxy inactivo" (falso, Next 16 lo renombra), conteo de rutas/migraciones desactualizado, `ARCHIVOS_Y_RUTAS_REALES` lista rutas eliminadas | `docs/`, `docs/status/`, `docs/opencode/` | 5 | — |
| 20 | **Arquitectura general** | Sólida | 65% | Next 16 + TS strict + Tailwind 4, 43 migraciones, cliente Supabase con degradación elegante, 100% client components. Fragilidad de build en OneDrive/Windows (EPERM/SST) y `prebuild` depende de `knowledge-pack/` | `next.config.ts`, `tsconfig.json`, `src/proxy.ts`, `package.json` | 7 | Parcial |

---

## 3. IDEAS DISEÑADAS — ESTADO REAL

| Idea | Estado real |
|---|---|
| **ELIANA asistente inteligente** | ✅ Funcional (Gemini real + fallback). Falta: conocimiento DB, persistencia server, voz de respuesta. 75% |
| **Knowledge Core con memoria organizada** | ⚠️ Diseño completo, cero datos. Necesita migración de tablas + embeddings. 15% |
| **La Voz Viva (audio → conocimiento → acciones)** | ⚠️ Dictado real, sin audio ni IA. 60% |
| **Álbum de la Vida** | ✅ El más completo. 80% |
| **Mente Maestra** | ❌ No existe. 5% |
| **Dashboard ejecutivo** | ⚠️ Dashboard vendedor real (API) pero /admin y home son demo. 45% |
| **Sistema de tareas** | ⚠️ ELIANA tasks (00040) + `/eliana/tareas`, sin automatización. 45% |
| **Sistema de documentos** | ⚠️ Solo esqueleto (no hay tabla ni UI de documentos del usuario). 10% |
| **Firma digital** | ❌ No existe (solo referencia en `sso_tickets`/`mfa_secret` sin flujo). 0% |
| **IA integrada** | ✅ Chat con IA real + fallback; análisis/recomendaciones con plantillas. 70% |
| **Sistema de aprendizaje** | ❌ No existe (cursos son contenido estático/`/escuela` es stub). 0% |
| **Base de conocimiento** | ⚠️ Estático (`knowledge-data.ts`, 267 KB generado). No RAG real. 25% |
| **Automatizaciones** | ⚠️ Solo esqueleto conceptual (triggers de 00043; sin UI ni motores). 5% |
| **API pública** | ❌ No existe (no hay tokens, docs de API ni endpoints públicos estables). 0% |
| **Panel de administración** | ⚠️ UI completa, datos mixtos (marketplace real, resto local). 50% |
| **Economía** | ⚠️ Simulada en localStorage. 20% |
| **Inventario** | ⚠️ Esquema, sin lógica. 20% |
| **CRM** | ❌ Solo `dashboard/clientes` (agrega compradores de pedidos). 5% |
| **Reportes** | ❌ Solo charts de patrocinadores sobre data demo. 10% |
| **Notificaciones** | ❌ Hardcoded. 5% |
| **Sistema de permisos** | ⚠️ RLS + roles existen pero taxonomía contradictoria entre migraciones y código. 30% |
| **Logs y auditoría** | ⚠️ Tablas sin alimentar. 20% |

---

## 4. PORCENTAJE REAL DE AVANCE

**ZAFIRO global: ≈ 40%** (implementado y verificable de extremo a extremo).

Desglose honesto:
- Capa de UI/interfaz: ~85%
- Esquema de base de datos: ~80% (solo biblioteca/stories/marketplace sólidos; falta knowledge_*, documentos, notificaciones)
- Lógica de negocio funcional: ~25%
- Pagos y comercio e2e: ~10%
- IA: ~70% (solo ELIANA chat)
- Seguridad end-to-end: ~30%
- Documentación al día: ~40%

---

## 5. COMPONENTES DUPLICADOS

1. **Carritos**: `src/contexts/CartContext.tsx` (ACTIVO) vs `src/lib/marketplace/useCart.ts` (muerto, 0 consumidores).
2. **Chats ELIANA (6 variantes)**: `ElianaAdvancedChat`, `ElianaMarketplaceChat`, `ElianaStandaloneChat` (muerto, 21 KB), página `/eliana/chat`, `ElianaFloatingButton` (legacy), `ElianaUniversalLauncher` (activo).
3. **Formato de precio**: `formatPrice` (constants.ts) vs `formatCurrency` (ElianaMarketplaceChat.tsx).
4. **Perfiles**: `/profile-page` (canonical) vs `/perfil/[username]` (público) — solapamiento.
5. **Álbum**: `/album` vs `/ecosystem/album`.
6. **Escuela**: `/escuela` (stub) vs `/ecosystem/escuela` (completo).
7. **Admin marketplace vs marketplace público**: espejos que comparten estructura sin componentes comunes.

## 6. CÓDIGO OBSOLETO / MUERTO

- `src/lib/unified-identity/` (4 archivos, 0 refs).
- `src/lib/EconomiaService.ts` + `FrequencyOriginService.ts` + configs (cluster aislado).
- `src/lib/knowledge-legacy/` (0 refs).
- `src/lib/marketplace/providers/` (5 archivos, 0 refs; 8 TODOs).
- `src/lib/marketplace/pricing-engine.ts`, `feature-flags.ts`, `eliana-integration.ts` (0 refs).
- `src/lib/biblioteca/google-drive-sync.ts` (0 refs).
- `src/lib/eliana/core/{adapters,intelligent-search}.ts`, `analysis.ts`, `memory.ts`, `marketplace-urls.ts` (0 refs externas).
- Deps muertas: `rehype-raw`, `@testing-library/react`.
- Rutas eliminadas pero documentadas: `/api/marketplace/checkout`, `/api/webhooks/stripe`.
- `src/app/api/auth/test-forgot` (ruta de prueba).

## 7. RIESGOS TÉCNICOS

1. **Env bloqueantes**: `SUPABASE_SERVICE_ROLE_KEY="PENDIENTE"`, `STRIPE_WEBHOOK_SECRET` vacío, `NEXT_PUBLIC_STRIPE_PRICE_*` placeholders, `ZAFIRO_SETUP_TOKEN` sin valor.
2. **Clave Gemini expuesta** en historial de chat (rotar antes de producción).
3. **Pedidos que "funcionan" pero no guardan** (INSERT falla y la UI muestra éxito) → pérdida de datos real en producción.
4. **Checkout acepta `userId`/`orderId` del cliente** sin verificar sesión → spoofing de metadatos.
5. **RLS inexistente para `knowledge_*`** (cuando se creen) y tablas council creadas sin RLS hasta 00031 (aplicar migraciones en orden es obligatorio).
6. **Taxonomía de roles rota**: `proxy.ts` excluye `owner` (Don Miguel no podría entrar a `/admin`), 00041 contradice el CHECK de 00036, gate seller usa `seller`.
7. **Auth en localStorage** forjable (XSS).
8. **Migración 00044 requiere pgvector** y 00041 hace UPDATE con UUID hardcodeado que puede no-existir.
9. **Build frágil en Windows/OneDrive** (EPERM, fallos SST de Turbopack) + `prebuild` depende de `knowledge-pack/` (73 archivos + zip).
10. **Rate limits en memoria** (mapas por instancia) → inútiles en serverless.

## 8. DEPENDENCIAS BLOQUEANTES

| Bloqueante | Acción | Responsable |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Don Miguel: Dashboard → Project Settings → API → copiar service_role | Manual |
| `.env.local` con URL y anon key reales | Don Miguel copia de Vercel/Supabase | Manual |
| `STRIPE_WEBHOOK_SECRET` | Crear webhook en dashboard Stripe (endpoint `/api/stripe/webhook`) | Manual |
| Precios reales de Stripe | Crear Price IDs para pro mensual/anual, cuba_plus mensual/anual | Manual |
| `ZAFIRO_SETUP_TOKEN` | Generar token para `api/admin/seed-owner` | Manual |

## 9. PRIORIDADES (orden sugerido)

1. **P0 — Desbloquear ambiente**: obtener claves reales (bloquea TODO lo demás). Sin esto no se valida nada en producción.
2. **P0 — Corregir roles**: unificar taxonomía (00036+00041+proxy+RLS+`hasRole`). Don Miguel debe poder entrar a `/admin`.
3. **P0 — Pedidos/pagos**: arreglar `createOrder` (FKs), checkout con session real, webhook apuntando a tablas correctas, desalinear CHECK de plan.
4. **P0 — Cerrar rutas sin auth**: `api/biblioteca/*`, `api/knowledge/seed`, `api/stripe/*`.
5. **P1 — Knowledge Core**: migración 00045 con 15+ tablas + RPC + embeddings; conectar RAG a ELIANA.
6. **P1 — Inventario**: decremento de stock transaccional en `createOrder`.
7. **P1 — Auditoría**: escribir `audit_logs` en acciones clave + UI admin.
8. **P1 — Limpieza**: eliminar/marcar dead code y duplicados (useCart, StandaloneChat, providers, unified-identity, etc.).
9. **P2 — Economía real**: mover PTS/referidos a DB transaccional.
10. **P2 — Notificaciones**: tabla + canal (email/UI).
11. **P3 — Mente Maestra, aprendizaje, firma digital, API pública, reportes, CRM**: módulos nuevos SOLO después de estabilizar lo anterior.
