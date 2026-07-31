# FUNCIONES CONSTRUIDAS — ZAFIRO + ELIANA

## ✅ FUNCIONALES Y VERIFICADAS

| Función | App | Componentes | Persistencia |
|---------|-----|-------------|--------------|
| Auth: Login | ZAFIRO | `/auth/login` + `auth.ts` | Supabase + localStorage |
| Auth: Register | ZAFIRO | `/auth/register` + `auth.ts` | Supabase + localStorage |
| Auth: Recover password | ZAFIRO | `/auth/recover` | Supabase |
| Auth: Update password | ZAFIRO | `/auth/update-password` | Supabase |
| Auth: Verify email | ZAFIRO | `/auth/verify` | Supabase |
| Dashboard | ZAFIRO | `/dashboard` | Supabase (conversaciones + perfil) |
| ELIANA Chat | ZAFIRO | `/eliana/chat` + `api/chat` (Gemini) | Supabase + localStorage |
| ELIANA Conversaciones | ZAFIRO | `/eliana/conversaciones` + `api/eliana/conversations` | Supabase |
| ELIANA Memoria | ZAFIRO | `/eliana/memoria` + `api/eliana/intakes` | Supabase |
| ELIANA Tareas | ZAFIRO | `/eliana/tareas` + `api/eliana/actions` | Supabase |
| ELIANA Voz | ZAFIRO | Chat mic + TTS + `/eliana/configuracion/voz` | Web Speech API |
| ELIANA Configuración | ZAFIRO | `/eliana/configuracion` + privacidad | localStorage |
| Knowledge Core | ZAFIRO | 10 APIs + admin panel `/admin/knowledge` | Supabase (15 tablas) |
| User Settings | ZAFIRO | `/api/user-settings` + migración 00038 | Supabase |
| User Profile API | ZAFIRO | `/api/user-profile` | Supabase |
| Proxy Domain Routing | ZAFIRO | `proxy.ts` (zafiro/eliana/market domains) | — |
| Context Handoff | ZAFIRO | `/api/eliana/context-handoff` | In-memory |
| Consejo Invisible DB | ZAFIRO | 21 tablas + RLS completo | Supabase |
| Economy (basic) | ZAFIRO | 7 tablas + `EconomiaService.ts` | Supabase |
| Auth: Login | ELIANA indep. | `/auth/login` + Supabase SSR | Supabase |
| Auth: Register | ELIANA indep. | `/auth/register` | Supabase |
| Auth: Callback | ELIANA indep. | `/auth/callback` | Supabase |
| ELIANA Chat | ELIANA indep. | `/chat` + `api/chat` | In-memory |
| ELIANA Tareas | ELIANA indep. | `/tareas` + `api/tasks` | In-memory |
| ELIANA Memoria | ELIANA indep. | `/memoria` + `api/memory` | In-memory |
| ELIANA Voz | ELIANA indep. | `/configuracion/voz` | Web Speech API |
| Health check | ELIANA indep. | `/api/health` | — |

## 🟡 PARCIALES

| Función | App | Componentes | Lo que falta |
|---------|-----|-------------|-------------|
| Auth Supabase-only | ZAFIRO | `auth.ts` dual | Eliminar localStorage fallback. MFA. Sesiones. Dispositivos. |
| OWNER_SUPERADMIN | ZAFIRO | Council roles existen | Resolver cuenta real. Asignar membresía. Sin hardcodeos. |
| Memberships | ZAFIRO | `/memberships` + Stripe APIs | Price IDs. Webhook secret. EntitlementService. |
| Settings page | ZAFIRO | `/settings` | Migrar localStorage → Supabase |
| Profile page | ZAFIRO | `/profile-page` + `/perfil/[username]` | Migrar localStorage → Supabase |
| Stripe | ZAFIRO | 4 APIs | Price IDs reales. Webhook secret. |
| Audit logs | ZAFIRO | Tablas existen | APIs y panel de consulta |
| PWA | Ambos | manifest.json + sw.js | Iconos |
| ELIANA independiente | ELIANA | App base creada | Migraciones. Env reales. Dominio correcto. Build. |

## 🔴 NO CONSTRUIDAS

| Función | Descripción |
|---------|-------------|
| Inventa | Sistema de ideas, expedientes, proyectos, equipos, roadmaps |
| Cultura | Sistema de países, guías, costumbres, simulaciones, cursos |
| Solver Link | Sistema de problemas, soluciones, expertos, reputación |
| Documentos y Firmas | Documentos, versiones, firmas, SHA-256, QR, certificados |
| Double-Entry Ledger | Débitos/créditos balanceados, SHA-256, reversals, cierre diario |
| MFA | Autenticación multifactor |
| Rate Limiting server-side | Protección contra abuso de API |
| Pruebas automatizadas | Cero tests en todo el proyecto |
| Server Components | 100% client components actualmente |
