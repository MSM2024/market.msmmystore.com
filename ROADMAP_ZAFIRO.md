# ROADMAP_ZAFIRO.md — Diagnóstico, inventario y orden de implementación

> CAPÍTULO 1 del "Método Autor + IA" · 2026-08-01 · Basado en evidencia del repositorio (HEAD `c6404fc`, rama `finish-zafiro-eliana`). Los porcentajes expresan avance real por módulo según la clasificación de fuentes de datos (REAL / PARCIAL / SIMULADO / ESTÁTICO / ROTO / DUPLICADO / AUSENTE), no estimaciones de esfuerzo.

## 0. Resumen ejecutivo

- **Compila y verifica**: tsc 0 errores · eslint 0 errores en código nuevo · vitest 88/88 · build OK.
- **Lo real y sólido**: autenticación server-side, perfiles, ELIANA con Gemini, Knowledge Core (RAG), Biblioteca (owner-only), historias, Marketplace sobre Supabase, Stripe con idempotencia durable, RLS endurecida (00035/00048/00049/00051), universo visual ZAFIRO (emblema/PWA/favicons), C7 Autor IA, C8 Álbum de la Vida, C10 Canales ELIANA, 59 migraciones.
- **Lo pendiente de verdad**: migrar a datos reales lo que hoy vive en localStorage (PTS/referidos/mensajes/sponsors/carrito/memoria ELIANA), conectar pagos de marketplace, activar proveedores reales, prueba e2e, aplicar migraciones en la nube y desplegar.
- **Bloqueo externo principal**: claves reales de Supabase/Stripe y CLI de Supabase no disponibles aún para la fase de validación en producción.

## 1. Matriz de módulos (responsable, estado, archivos, tablas, permisos, pruebas, pendiente)

> Responsable tecnológico: **Don Miguel** = autor/director (visión y validación) · **IA (opencode)** = desarrollo ejecutivo. Solo se reporta estado con evidencia.

### 1.1 Núcleo / Identidad

| Módulo | Estado real | % | Archivos | Tablas | Permisos | Pruebas | Pendiente | Criterio de finalización |
|---|---|---|---|---|---|---|---|---|
| Auth server (Supabase) | REAL | 95 | `api/auth/*`, `src/proxy.ts`, `src/lib/api-auth.ts` | `auth.users`, `profiles` | RLS por `user_id` | vitest (auth) | Validación e2e con claves; MFA (TOTP) y gestión de sesiones implementados en UI | Login/registro/recovery/reset funcionan e2e con validación de Don Miguel |
| Roles/perfiles | REAL | 85 | `src/lib/auth.ts`, `api/auth/me`, `profile-page/*`, `00037` | `profiles`, `user_roles`, `council_user_roles` | `is_owner/admin` | vitest (roles) | Roles leídos del servidor (ok); validación e2e por rol | Matriz de roles aplicada y probada por rol |
| Organizaciones/membresías | PARCIAL | 65 | `api/organizations*`, `organizacion/*`, `00036`, `00054` | `organizations`, `memberships` | RLS + service role | — | Flujo de membresías (Stripe) y entitlements | Suscripción ↔ perfil ↔ acceso coherentes |
| Auditoría | PARCIAL | 80 | `00001`, `00033`, `lib/admin/data.ts`, `admin/auditoria`, `lib/audit.ts` (helper compartido) | `audit_logs`, `eliana_audit_logs`, `marketplace_audit_logs` | owner/admin | — | Registro proactivo en rutas sensibles (ya en album/* y eliana/channels); e2e con claves | Acciones sensibles registradas con quién/cuándo/resultado |

### 1.2 ELIANA (IA)

| Módulo | Estado real | % | Archivos | Tablas | Permisos | Pruebas | Pendiente | Criterio |
|---|---|---|---|---|---|---|---|---|
| Chat Gemini | REAL | 90 | `api/chat`, `lib/eliana/engine.ts`, `lib/eliana/provider.ts`, `eliana/chat` | `eliana_conversations`, `eliana_messages` | RLS por `user_id` (00049) | vitest (provider 13) + e2e real (503/429/validación/inyección/dedupe) | **Cuota/billing de Google (429) y clave en Vercel**; calidad de respuestas; voz en tiempo real | Conversación cercana/segura e2e (bloqueada por cuota externa) |
| Memoria/tareas | PARCIAL | 50 | `lib/eliana/core/*`, `eliana/memoria`, `eliana/tareas` | `eliana_memory`, `eliana_tasks`, `eliana_tickets` | RLS | — | **Migrar de localStorage a Supabase**; aprobación/corrección/olvido | Memoria autorizada, exportable, borrable |
| Knowledge integración | PARCIAL | 60 | `lib/knowledge/*`, `api/knowledge/*` | `knowledge_*` (15 tablas) | `is_knowledge_admin` | — | Unificar con motor `eliana/core`; fuentes/referencias | ELIANA cita documento/página/fragmento |
| Canales (C10) | REAL (gestión) | 70 | `eliana/configuracion/canales`, `api/eliana/channels`, `lib/eliana/core/adapters.ts`, `00059` | `eliana_channels` | INSERT/DELETE owner (00059), UPDATE owner (00034) | vitest (channels 11/11) | Voz real, credenciales de canales externos (bloqueadas por diseño), webhooks | Capítulo 10 cumple sus pruebas (gestión + adaptadores seguros simulados) |

### 1.3 Marketplace

| Módulo | Estado real | % | Archivos | Tablas | Permisos | Pruebas | Pendiente | Criterio |
|---|---|---|---|---|---|---|---|---|
| Catálogo/productos/tiendas | REAL | 80 | `marketplace/*`, `lib/marketplace/client.ts` | `marketplace_products/stores/categories/...` | RLS autenticado | — | Datos semilla; aprobación de publicaciones | Publicar/buscar/filtrar e2e |
| Carrito/favoritos | PARCIAL | 60 | `lib/marketplace/client.ts`, `contexts/CartContext.tsx` | `marketplace_carts/_items`, `marketplace_favorites` | RLS | — | **Migrar carrito de localStorage a Supabase** | Carrito persistente por usuario |
| Pedidos/estados | REAL | 70 | `marketplace/pedidos`, `dashboard/pedidos` | `marketplace_orders`, `_order_items`, `_status_history` | vendedor/owner | — | Trazabilidad completa; cancelación/insuficiencia | Pedido creado→seguimiento→estados con auditoría |
| Pagos marketplace | ROTO/SIMULADO | 10 | `lib/marketplace/providers/manual.ts` | `marketplace_payments`, `_refunds` | — | — | Conectar pasarela autorizada; comisión 10% referidos | Pago real + liquidación verificable |
| Proveedores externos | NO IMPLEMENTADO | 5 | `lib/marketplace/providers/placeholder.ts` | `marketplace_providers`, `_provider_*` | — | — | Autorización + API keys (decisión de Don Miguel) | Proveedor activo con datos reales |
| Provider msm-inventory | ROTO | 10 | `lib/marketplace/providers/msm-inventory.ts` | — | — | — | Devuelve vacío pese a `isEnabled=true` | Devuelve datos o se desactiva |

### 1.4 Economía y operaciones

| Módulo | Estado real | % | Archivos | Tablas | Permisos | Pruebas | Pendiente | Criterio |
|---|---|---|---|---|---|---|---|---|
| Ledger/caja | PARCIAL | 30 | `lib/EconomiaService.ts` | `economia_operaciones`, `economia_caja`, `economia_inventario` | RLS (00051) | — | **No es double-entry**: faltan débitos/créditos, asientos compensatorios, inmutabilidad, SHA-256 | Saldo reconstruible desde ledger |
| Comisiones/liquidaciones | AUSENTE | 5 | `lib/marketplace/pricing-engine.ts` | `marketplace_commissions` | — | — | Motor de comisiones (10% referidos según regla) + liquidación | Comisión solo tras pago confirmado |
| Panel económico | PARCIAL | 20 | `dashboard/ganancias`, `ecosystem/payments` | — | owner/admin | — | **`ecosystem/payments` es marketing** (cartera prometida no existe); datos reales | Cada cifra con origen verificable |

### 1.5 Biblioteca Viva / Conocimiento

| Módulo | Estado real | % | Archivos | Tablas | Permisos | Pruebas | Pendiente | Criterio |
|---|---|---|---|---|---|---|---|---|
| Knowledge Core (RAG) | REAL | 75 | `api/knowledge/*`, `lib/knowledge/*` | `knowledge_*` | `is_knowledge_admin` | — | Ingest de archivos real; pgvector; híbrido DB | Búsqueda con referencias y permisos |
| Biblioteca Viva | PARCIAL | 55 | `api/biblioteca/*`, `biblioteca/*`, `lib/biblioteca/*` | `library_*` | `requireOwner()` (retirada del público) | — | Ingesta PDF/DOCX/TXT/OCR; panel aprobación | Importar→revisar→aprobar→consultar→citar |
| Datos embebidos | ESTÁTICO | — | `lib/knowledge-data.ts` (81 docs autogenerados) | — | — | — | Decidir: semilla demo vs fuente real | Documentado como demo, separado de producción |

### 1.6 Contenido y comunidades

| Módulo | Estado real | % | Archivos | Tablas | Permisos | Pruebas | Pendiente | Criterio |
|---|---|---|---|---|---|---|---|---|
| Consejo Invisible | PARCIAL | 40 | `consejo-invisible`, `lib/consejo-invisible/*` | `invisible_council_*` (23), `council_user_roles` | RLS (00031) | — | **APIs ausentes** (DB sin puente a UI) | Acceso completo con permisos y versiones |
| Historias / Mis historias | REAL | 80 | `historias/*`, `mis-historias/*`, `api/stories` | `mis_historias` | RLS | — | — | CRUD e2e con datos reales |
| Gemología | ESTÁTICO | 40 | `gemologia`, `lib/gemology-data.ts` | — | — | — | Datos reales o marcar demo | Contenido con fuente |
| Mensajes | SIMULADO | 20 | `messages` | — | — | — | **localStorage** → conversaciones reales | Mensajería persistente con permisos |
| Sponsors/campañas | SIMULADO | 15 | `sponsors-page`, `lib/zafiro-data.ts` | — | — | — | **localStorage + alert "simulada"** → real | Campañas reales con auditoría |
| PTS/recompensas/referidos | SIMULADO | 20 | `rewards`, `referidos`, `lib/rewards.ts`, `lib/referidos.ts` | `rewards_log`, `referrals` | RLS | — | **localStorage** → Supabase | Puntos/racha/refs persistentes |
| Universo/ecosistema/perfil público | SIMULADO | 30 | `universo`, `ecosystem`, `perfil/[username]` | — | — | — | Datos ficticios (`zafiro.com`, etc.) → reales | Conexiones reales con isActive |
| Voz Viva | REAL | 80 | `voz-viva`, `api/voz-viva` | `stories` | owner | — | — | CRUD e2e |

### 1.7 Páginas institucionales

| Módulo | Estado real | % | Archivos | Notas |
|---|---|---|---|---|
| `/about, /what-we-do, /how-it-works, /vision, /mission, /values, /terms, /privacy, /rules, /help, /contact` | REAL (contenido) | 90 | `src/app/*` | Contacto persiste en Supabase (sin SMTP) |
| `/memberships` | INTERFAZ | 40 | `memberships` | Requiere price IDs reales + webhook secret |

### 1.8 Infraestructura

| Módulo | Estado real | % | Archivos | Pendiente |
|---|---|---|---|---|
| Migraciones | REAL | 59/59 | `supabase/migrations/00001-00059` | Aplicar 00045-00059 en la nube (`supabase db push`) |
| RLS | REAL | 85 | 00035, 00048, 00049, 00051 | Auditoría por rol en e2e |
| Stripe idempotencia | REAL | 90 | `lib/stripe/idempotency.ts`, `00052` | Webhook secret real |
| PWA | PARCIAL | 40 | `public/manifest.json` | Iconos y SW |

## 2. Dependencias entre capítulos (del "ORDEN MAESTRA")

```
C1 Diagnóstico/Mapa ──► C2 Núcleo (identidad, roles, RLS, auditoría, UI estados)
C2 ──► C3 Marketplace ──► C4 Economía y operaciones
C2 ──► C5 ELIANA ──► C6 Biblioteca Viva ──► C7 Autor de libros con IA
C2 ──► C8 Álbum de la Vida y legado
C4 ──► C9 ZAFIRO Rutas (requiere decisión de ubicación autorizada — anotada, NO iniciar)
C5 ──► C10 Canales y acciones
Todo ──► C11 Seguridad/calidad/privacidad ──► C12 Terminación/despliegue/entrega
```

**Regla permanente**: no iniciar una integración dependiente mientras su base esté rota. Bloqueo: C9 (Rutas/mapas) requiere autorización de Don Miguel para mapas y GPS — **no implementar todavía** (deseo anotado).

## 3. Orden recomendado de implementación

1. **C2 Núcleo** (implementado: roles desde el servidor, panel de auditoría, estados vacíos/error/offline, accesibilidad, MFA TOTP, gestión de sesiones, organizaciones/membresías; falta validación e2e con claves y flujo de membresías pagado).
2. **C3 Marketplace** (carrito→Supabase, proveedor msm-inventory corregido o desactivado, pedidos con trazabilidad).
3. **C4 Economía** (convertir ledger a doble partida, motor de comisiones, panel económico real; marcar/retirar `ecosystem/payments`).
4. **C5 ELIANA** (unificar motores, memoria→Supabase, voz, transferencia humana).
5. **C6 Biblioteca Viva** (ingesta de archivos, panel aprobación, permisos PÚBLICO/INTERNO/PRIVADO/CONFIDENCIAL).
6. **C7 Autor de libros** (estudio editorial + Biblia de la Obra + capítulos + exportación).
7. **C8 Álbum de la Vida** (biografías, árbol, línea de tiempo, privacidad familiar).
8. **C10 Canales** (adaptadores web/WhatsApp/Telegram/voz/correo/tareas).
9. **C11 Seguridad/calidad/privacidad** (transversal; amenazas, Zod, rate limiting, sanitización).
10. **C12 Terminación/despliegue/entrega** (build final, README, INFORME_FINAL_ZAFIRO.md, entrega controlada sin subir contenido privado).

## 4. Riesgos y decisiones pendientes

| Riesgo | Impacto | Mitigación / decisión requerida |
|---|---|---|
| Funciones en localStorage (PTS, referidos, mensajes, sponsors, carrito, memoria ELIANA) | Pérdida de datos, permisos inexistentes | Migrar a Supabase en C2/C3/C5 |
| Datos ficticios embebidos en producción | Confusión usuario / incumplimiento "no inventar" | Marcar demo o reemplazar con fuentes reales |
| Provider msm-inventory activo vacío | Marketplace vacío | Corregir o desactivar (default off) |
| Pagos marketplace no conectados | Pedidos sin pago real | Esperar pasarela autorizada; mantener "manual" claramente como prueba |
| `ecosystem/payments` promete cartera inexistente | Engaño a usuarios | Retirar o convertir en página informativa real |
| Migraciones 00045-00053 sin aplicar en nube | Producción no refleja RLS/knowledge/stripe | Requiere claves + CLI Supabase |
| Roles en localStorage para la UI | Permisos percibidos ≠ reales | Leer roles del servidor (proxy/api-auth) |
| Two engines de conocimiento desconectados | Respuestas inconsistentes | Unificar en C5 |
| Imágenes `remotePatterns` abierto | Riesgo de abuso | Restringir hostnames |
| CLI Supabase no instalada / claves PENDIENTES | Bloqueo de validación e2e y deploy | Pasar 5 claves (ver bloqueos) |

## 5. Bloqueos externos (requieren a Don Miguel)

1. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` reales → Fase de validación e2e + `supabase db push` + deploy.
2. Instalación de CLI de Supabase (o autorización de comandos).
3. Decisión: pasarela de pago autorizada para Marketplace y proveedores externos (Amazon/Walmart/etc.) con API keys.
4. Decisión: sistema de mapas/rutas con ubicación autorizada (C9) — anotado, NO iniciar.

## 6. Estado global (por capítulo del ORDEN MAESTRA)

| Capítulo | Estado | % verificado |
|---|---|---|
| C1 Diagnóstico y Mapa | EN CURSO | 100 (este documento) |
| C2 Núcleo | Implementado (código); validación e2e pendiente | ~80 |
| C3 Marketplace | Parcial con huecos reales | ~55 |
| C4 Economía | Base DB, falta motor contable | ~25 |
| C5 ELIANA | Memoria persistida Supabase (doble escritura), dedupe y contexto; tests 9/9 | ~70 |
| C6 Biblioteca Viva | Aprobaciones (GET/POST/PUT), panel admin, privacidad 4 niveles (00055), ingesta txt/md + bucket (00056), tests 10/10 | ~70 |
| C7 Autor de libros | Autor IA: motor Gemini + RAG (00057), API `/api/consejo/autor` (crear, outline, capítulos, secciones, publicar a Biblioteca Viva), UI `/admin/autor-ia`; tests 14/14 | ~45 |
| C8 Álbum de la Vida | Álbum completo: migración 00058 (familias/miembros/árbol/eventos/medios con RLS), `lib/album/*`, 6 rutas API `/api/album/*`, componentes UI + `/album` con tabs, integración `/ecosystem/album`; tests 17/17 | ~90 |
| C9 Rutas | NO INICIAR (sin autorización) | 0 |
| C10 Canales | Canales ELIANA: migración 00059 (políticas INSERT/DELETE + seed 7 canales), API GET/PATCH owner con rate limit y Zod, gestión UI con confirmación explícita, idioma/tema y privacidad funcionales, adaptadores seguros simulados (nunca envían a terceros); tests 11/11 | ~70 |
| C11 Seguridad | Rate limiting por IP (rutas sensibles) + validación Zod + helper de auditoría compartido `lib/audit.ts` aplicado a album/* y eliana/channels; tests 5/5 | ~65 |
| C12 Terminación | Documentación y deploy pendiente | ~20 |

**Avance global ponderado: ~55%** (compila, base real fuerte y C7/C8/C10 con implementación completa y pruebas; la mayoría de las funciones "visibles" siguen en localStorage o datos estáticos hasta C2-C5).
