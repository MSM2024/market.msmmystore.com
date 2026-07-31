# ZAFIRO + ELIANA — RESUMEN INICIAL

**Fecha:** 2026-07-29
**Propietario:** Miguel Soria Martínez
**Empresa:** MSM MY STORE LLC
**Rama actual:** finish-zafiro-eliana
**Último commit:** b305296

---

## Estado General

| Sistema | Estado | Build | Lint (no-mkt) | Deploy | Dominio |
|---------|--------|-------|---------------|--------|---------|
| ZAFIRO | EN DESARROLLO | ✅ 0 errores | ✅ 0 errores | ✅ Vercel | zafiro.msmmystore.com |
| ELIANA (en ZAFIRO) | FUNCIONAL | incluido | incluido | incluido | eliana.msmmystore.com |
| ELIANA (independiente) | INCOMPLETO | ❌ No verificado | ❌ No verificado | ❌ No deployado | — |
| Marketplace | CONGELADO | — | 46 errores | separado | market.msmmystore.com |

---

## Módulos de ZAFIRO

| # | Módulo | Estado | Evidencia | Trabajo pendiente |
|---|--------|--------|-----------|-------------------|
| 1 | Autenticación | PARCIAL | Login/register/recover/update-password funcionales. Profiles table + triggers. localStorage + Supabase dual. | Migrar a Supabase-only. Eliminar fallback localStorage. Implementar MFA. Sesiones y dispositivos. |
| 2 | OWNER_SUPERADMIN | PARCIAL | Council roles table existe. Función handle_council_first_user() existe. Perfil hardcodeado aún en dashboard. | Resolver cuenta real de Don Miguel. Asignar OWNER_SUPERADMIN + LIFETIME_UNLIMITED. Sin hardcodeos. |
| 3 | Membresías | SOLO INTERFAZ | `/memberships` página con datos estáticos. Stripe APIs creadas (checkout, portal, webhook, billing). Tabla `memberships` existe en 00036. | Stripe price IDs reales. Webhook secret. LIFETIME_UNLIMITED persistida. EntitlementService server-side. Planes completos. |
| 4 | Dashboard | FUNCIONAL | Muestra conversaciones recientes, perfil, enlaces rápidos. Sin datos de tienda. | Conectar a datos reales de membresía y actividad. |
| 5 | Configuración | PARCIAL | Página con 8 secciones. APIs `/api/user-settings` y `/api/user-profile` creadas. Migración 00038. | Migrar página de localStorage a Supabase completamente. Persistencia real. |
| 6 | Perfil | PARCIAL | `/lib/profile.ts` localStorage. API `/api/user-profile` creada. Tabla `profiles` existe con RLS. | Migrar a Supabase-only. |
| 7 | ELIANA Chat | FUNCIONAL | Gemini+RAG. Persistencia a Supabase. Conversaciones/memoria/tareas APIs funcionales. | Mejorar calidad respuestas. Rate limiting server-side. |
| 8 | ELIANA Conversaciones | FUNCIONAL | API `/api/eliana/conversations`. Página con datos reales. Búsqueda, eliminación. | — |
| 9 | ELIANA Memoria | FUNCIONAL | API `/api/eliana/intakes`. Página con datos reales agrupados por tipo. CRUD completo. | — |
| 10 | ELIANA Tareas | FUNCIONAL | API `/api/eliana/actions`. Página con filtros, confirmar/completar. | — |
| 11 | ELIANA Voz | FUNCIONAL | Web Speech API (SpeechRecognition + SpeechSynthesis). Chat con micrófono y TTS. Config página. | — |
| 12 | Knowledge Core | FUNCIONAL | 15 tablas, 9 APIs, repository/search/ingestion/guardrails/RAG. Admin panel. | — |
| 13 | Consejo Invisible | FUNCIONAL | 21 tablas, sistema completo (guias, fuentes, sesiones, diario, oraciones, metas, libros, tags, archivos, permisos, RLS). APIs no implementadas en app. | Crear APIs para consultar datos del Consejo. |
| 14 | Economía (Ledger) | PARCIAL | 7 tablas: operaciones, caja, inventario, nodos, canales, guardian_actions, events. NO es double-entry. Sin SHA-256. Sin débitos/créditos. | Convertir a double-entry ledger con SHA-256. Débitos/créditos balanceados. Reversals. Cierre diario. |
| 15 | Documentos y Firmas | NO ENCONTRADO | No existe tabla, API, componente o ruta. | Crear sistema completo: documentos, versiones, firmas, SHA-256, QR, certificados. |
| 16 | Inventa | NO ENCONTRADO | No existe módulo. | Crear sistema completo: ideas, expedientes, proyectos, equipos, roadmaps. |
| 17 | Cultura | NO ENCONTRADO | No existe módulo. | Crear sistema completo: países, guías, costumbres, simulaciones, cursos. |
| 18 | Solver Link | NO ENCONTRADO | No existe módulo. | Crear sistema completo: problemas, soluciones, expertos, reputación. |
| 19 | Stripe | BLOQUEADO | APIs creadas. Price IDs placeholder. Webhook secret vacío. Solo Test Mode posible. | Obtener price IDs reales. Configurar webhook. Idempotencia. |
| 20 | Auditoría | PARCIAL | Tablas `audit_logs` y `eliana_audit_logs` existen con RLS. No hay APIs para consultar. | Crear APIs de auditoría. Panel de auditoría. |
| 21 | PWA | PARCIAL | manifest.json existe. Service worker existe. Icons/ vacío. | Crear iconos PWA. |
| 22 | Stripe Webhook | BLOQUEADO | Ruta creada en `/api/stripe/webhook`. Secret vacío. | Configurar webhook secret en Vercel + .env.local. |
| 23 | Variables de entorno | PARCIAL | .env.local existe con valores reales (excepto service_role PENDIENTE, stripe placeholders). | service_role key. Stripe price IDs. Webhook secret. Rotar Gemini key expuesta. |

---

## ELIANA (App Independiente)

| # | Módulo | Estado | Evidencia | Trabajo pendiente |
|---|--------|--------|-----------|-------------------|
| 1 | Repositorio | EXISTE | Creado en GitHub MSM2024/msm-eliana-app. 1 commit "test". Rama master. | Commit real con código completo. Push a GitHub. |
| 2 | Proyecto Vercel | EXISTE | Proyecto `msm-eliana-app` en Vercel. | Renombrar a `msm-eliana`. Configurar dominio. |
| 3 | Dominio | INCORRECTO | eliana.msmmystore.com apunta a ZAFIRO (msmmystore/zafiro), no a ELIANA independiente. | Mover dominio al proyecto ELIANA. |
| 4 | Rutas | PARCIAL | 10 rutas creadas. Faltan: /chat/[id], /aprobaciones, /archivos, /soporte, /auth/forgot-password. | Crear rutas faltantes. |
| 5 | APIs | PARCIAL | 9 APIs creadas. Faltan: /api/analytics, /api/aprobaciones, /api/archivos, /api/soporte. | Crear APIs faltantes. |
| 6 | Supabase Migrations | VACÍO | Directorio supabase/migrations/ existe pero sin archivos. | Crear migraciones para las tablas de ELIANA. |
| 7 | .env.local | PLACEHOLDERS | GEMINI_API_KEY, SUPABASE keys son placeholders. Solo NEXT_PUBLIC_SUPABASE_URL tiene valor real. | Configurar variables reales. |
| 8 | Auth | FUNCIONAL | Supabase SSR con PKCE. Login, register, update-password, callback. Middleware de sesión. | El middleware (proxy.ts) puede no estar activo porque no se llama middleware.ts. |
| 9 | Chat | FUNCIONAL | Gemini API. Igual que en ZAFIRO. | — |
| 10 | Memoria/Tareas | PARCIAL | APIs creadas. Páginas creadas. Pero dependen de tablas que no tienen migraciones. | Tablas pueden no existir en Supabase. |
| 11 | Context Handoff | IN-MEMORY | Usa Map en memoria con TTL 5 min. No persiste. No es production-ready. | Implementar con tabla `sso_tickets` (ya existe en ZAFIRO). |
| 12 | PWA | PARCIAL | manifest.json + sw.js existen. Icons/ vacío. | Crear iconos. |
| 13 | Pruebas | NO EXISTEN | Jest configurado. 0 archivos de prueba. | Crear pruebas. |
| 14 | Build | NO VERIFICADO | .next/ existe (build previo). Estado actual desconocido. | Ejecutar build. |
| 15 | Git | 1 COMMIT | Solo commit "test". Sin historial significativo. | Commit real con código. |

---

## Resumen de Tablas y Migraciones

| Métrica | Cantidad |
|---------|----------|
| Archivos de migración | 37 (00001-00036, 00038) |
| Migración faltante | 00037 |
| Tablas únicas | ~81 |
| Tipos enum | ~40 |
| Políticas RLS | ~326 (creadas), ~150-170 activas |
| APIs | ~30 |
| Rutas de página | ~97 |
| Errores lint | 46 (todos marketplace = congelado) |
| Errores build | 0 |

---

## Bloqueos Externos

| Bloqueo | Impacto | Solución |
|---------|---------|----------|
| service_role key PENDIENTE | No se pueden ejecutar seeds ni RLS completo desde app | Obtener de Supabase dashboard |
| Stripe Price IDs placeholder | Checkout no funcional | Crear productos en Stripe Dashboard |
| Stripe Webhook Secret vacío | Webhooks no verificados | Configurar endpoint en Stripe + secret en Vercel |
| Gemini API key expuesta en chat | Riesgo de seguridad | Rotar key. Mover a server-side only |
| localStorage como almacén principal | Datos no persistentes entre dispositivos | Migrar todo a Supabase |

---

## Riesgos

1. **Dual auth** — localStorage + Supabase puede causar inconsistencias de sesión
2. **Sin service_role** — No se puede verificar RLS desde servidor
3. **Sin pruebas** — Cualquier cambio puede introducir regresiones
4. **100% client components** — Sin server components para datos sensibles
5. **Context handoff in-memory** — No escala horizontalmente
6. **ELIANA independiente sin migraciones** — Base de datos no versionada
7. **Stripe placeholders** — Membresías pagadas no funcionales
8. **Inventa, Cultura, Solver Link, Documentos/Firmas, Ledger** — No existen
