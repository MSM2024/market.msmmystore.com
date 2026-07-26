# ZAFIRO — Master Summary Report (Julio 2026)

> **Base oficial para redefinir ZAFIRO como una sola molécula principal dentro del ecosistema MSM**
> *Identidad única · Una sola cuenta · Todas las redes, negocios, proyectos e inteligencias conectadas*
> *Bajo la Palabra de Dios como centro de visión, propósito y dirección*

---

## Índice

1. [Visión General y Propósito](#1-visión-general-y-propósito)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Rutas y Mapa del Sistema](#4-rutas-y-mapa-del-sistema)
5. [Sistema de Almacenamiento (localStorage)](#5-sistema-de-almacenamiento-localstorage)
6. [Módulos por Estado](#6-módulos-por-estado)
7. [Análisis de Seguridad](#7-análisis-de-seguridad)
8. [Problemas y Riesgos Técnicos](#8-problemas-y-riesgos-técnicos)
9. [Código Duplicado y Funciones Sin Uso](#9-código-duplicado-y-funciones-sin-uso)
10. [Estado de Integraciones Externas](#10-estado-de-integraciones-externas)
11. [Inventario Total de Funcionalidades](#11-inventario-total-de-funcionalidades)
12. [Mapa del Sistema: Flujo del Usuario](#12-mapa-del-sistema-flujo-del-usuario)
13. [Próximos Pasos Priorizados](#13-próximos-pasos-priorizados)

---

## 1. Visión General y Propósito

### ¿Qué es ZAFIRO?

ZAFIRO es una **Red Social del Conocimiento** impulsada por Inteligencia Artificial. Funciona como una **molécula maestra** del ecosistema MSM, diseñada para conectar:

- **Personas** → Perfiles digitales con identidad única
- **Redes Sociales** → YouTube, Instagram, TikTok, X, LinkedIn, etc.
- **Negocios** → MSM Marketplace, tiendas, afiliados
- **Proyectos** → Álbum de la Vida, Mente Maestra, ZAFIRO mismo
- **Inteligencia Artificial** → ELIANA como asistente central
- **Contenido** → Publicaciones, preguntas, respuestas, conocimiento
- **Economía** → PTS (Knowledge Points), sponsors, membresías

### Problema que Resuelve

Fragmentación digital: una persona tiene cuentas en 15+ plataformas sin un centro unificado. ZAFIRO centraliza la identidad digital, el conocimiento y las conexiones en un solo lugar con IA integrada.

### Usuarios

| Tipo | Descripción | Estado |
|---|---|---|
| Creadores de contenido | Perfil público con ecosistema conectado | ✅ Implementado (parcial) |
| Emprendedores | Dueños de negocios con plataformas | ✅ Implementado (parcial) |
| Consumidores | Lectores, seguidores, participantes | ✅ Implementado (parcial) |
| Anunciantes/Sponsors | Campañas publicitarias contextuales | ✅ Implementado (mock) |
| Administradores | Panel ELIANA de automatización | ⚠️ Parcial (mock data) |

### ¿Cómo entra una persona?

1. **Landing** → `/` (SPA con 7 tabs)
2. **Registro** → `/auth/register` (con código de referido opcional `?ref=`)
3. **Verificación** → `/auth/verify` (pantalla simulada, no funcional)
4. **Login** → `/auth/login`
5. **Perfil** → Se crea automáticamente al registrarse (`createProfile`)
6. **Molécula Maestra** → Conexión de redes en `/universo`
7. **Perfil Público** → `/perfil/[username]`

---

## 2. Stack Tecnológico

### Core

| Componente | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Lenguaje | TypeScript | ^5 |
| UI Runtime | React | 19.2.4 |
| CSS | Tailwind CSS | ^4 |
| PostCSS | @tailwindcss/postcss | ^4 |
| Animaciones | motion | ^12.42.2 |
| Iconos | lucide-react | ^1.23.0 |
| Fuente | Geist (Vercel) | — |
| Linter | ESLint (eslint-config-next) | ^9 |

### Integraciones Declaradas

| Servicio | Uso | Estado Real |
|---|---|---|
| **Supabase** | Base de datos, auth real | ✅ Variables en `.env.example` pero **NO USADO EN NINGÚN ARCHIVO** |
| **Stripe** | Pagos de membresías/sponsors | ⚠️ Variables en `.env`, pero `StripeModal` es **MOCK** (sin @stripe/stripe-js) |
| **Gemini AI** | API de chat (gemini-1.5-flash) | ✅ Implementado en `/api/chat/route.ts` con fallback local |
| **Telegram** | Comunidad/Mente Maestra | ❌ Solo enlaces externos hardcodeados (t.me/msmmystor) |

### Variables de Entorno (`.env.local`)

| Variable | ¿Se usa realmente? | Dónde |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ **NO** | Solo en `.env.example` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ **NO** | Solo en `.env.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **NO** | Solo en `.env.example` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ **NO** | Solo en `.env.example` |
| `STRIPE_SECRET_KEY` | ❌ **NO** | Solo en `.env.example` |
| `STRIPE_WEBHOOK_SECRET` | ❌ **NO** | Solo en `.env.example` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | ❌ **NO** | Solo en `.env.example` |
| `NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS` | ❌ **NO** | Solo en `.env.example` |
| `GEMINI_API_KEY` | ✅ **SÍ** | `src/app/api/chat/route.ts` |
| `NEXT_PUBLIC_APP_URL` | ❌ **NO** | Solo en `.env.example` |

**Conclusión:** Solo `GEMINI_API_KEY` tiene uso real. Supabase y Stripe están declarados pero **100% sin implementar**. Toda la persistencia actual es localStorage.

---

## 3. Estructura del Proyecto

```
MSM-Zafiro/
├── .env.example                  # 10 variables declaradas, solo 1 usada
├── next.config.ts                # Security headers (CSP, XSS, etc.)
├── tsconfig.json                 # Path alias @/ → ./src/
├── package.json                  # 7 scripts, 9 dependencias, 7 devDeps
├── eslint.config.mjs             # ESLint flat config
├── postcss.config.mjs            # Tailwind v4 PostCSS
├── start-dev.bat                 # Script de inicio
│
├── knowledge-pack/               # 35 documentos de conocimiento para ELIANA
│   └── zafiro-eliana-kp-v1-es-us-2026-07-08/
│       ├── 01-core/              # Identidad, visión, valores, persona ELIANA
│       ├── 02-ecosystem/         # Sponsors, PTS, Cuba Plus, comunidades, membresías
│       ├── 03-policies/          # Términos, privacidad, reglas, moderación
│       ├── 04-help-faq/          # FAQ, guía usuario, soporte, solución problemas
│       ├── 05-technical/         # Arquitectura, rutas, API, seguridad, datos
│       ├── 06-prompting/         # Ingeniería de prompts para ELIANA
│       ├── 07-moderation/        # Política de moderación automatizada
│       ├── 08-samples/           # Ejemplos de interacciones
│       └── MANIFEST.jsonl        # 35 entradas con hash SHA-256
│
├── scripts/
│   └── generate-knowledge-data.mjs  # Genera src/lib/knowledge-data.ts
│
├── public/
│   ├── eliana-diamond.svg        # Logo ELIANA
│   ├── manifest.json             # PWA manifest
│   └── (Next.js default assets)
│
└── src/
    ├── app/                      # 33 rutas (Next.js App Router)
    ├── components/               # 19 componentes + 5 ui primitives + subcarpeta gemology/
    └── lib/                      # 14 archivos de lógica (8 principales + 6 eliana/)
```

---

## 4. Rutas y Mapa del Sistema

### Módulo Principal (SPA)

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/` | `page.tsx` (1107 lines) | ✅ Completo | SPA con 7 tabs (Inicio, Explorar, Círculos, Gemología, Sponsors, Universo→link, Perfil) |

### Módulo de Autenticación

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/auth/login` | `auth/login/page.tsx` | ✅ Completo | Login email+password, localStorage |
| `/auth/register` | `auth/register/page.tsx` | ✅ Completo | Registro con referido opcional |
| `/auth/recover` | `auth/recover/page.tsx` | ⚠️ Simulado | No envía email real |
| `/auth/verify` | `auth/verify/page.tsx` | ❌ No funcional | 6 inputs de código, submit vacío |

### Módulo de Perfil

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/profile-page` | `profile-page/page.tsx` | ✅ Completo | Perfil propio con 5 tabs, stats, sidebar |
| `/profile-page/edit` | `profile-page/edit/page.tsx` | ✅ Completo | Editor de perfil completo |
| `/profile-page/connections` | `profile-page/connections/page.tsx` | ✅ Completo | Gestión de conexiones y enlaces |
| `/profile-page/projects` | `profile-page/projects/page.tsx` | ✅ Completo | CRUD de proyectos |
| `/perfil/[username]` | `perfil/[username]/page.tsx` | ✅ Completo | Perfil público de creador |

### Módulo de Conexiones / Universo

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/universo` | `universo/page.tsx` | ✅ Completo | Panel "Mis Conexiones" + Ecosistema MSM |

### Módulo ELIANA / AI

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/eliana` | `eliana/page.tsx` | ✅ Completo | Página informativa sobre ELIANA |
| `/api/chat` | `api/chat/route.ts` | ✅ Funcional | Proxy a Gemini API + fallback local |
| (flotante) | `ElianaFloatingButton.tsx` | ✅ Funcional | Chat widget en todas las páginas |

### Módulo de Administración

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/admin` | `admin/page.tsx` | ⚠️ Parcial | Dashboard con 8 tabs (1 funcional + 7 stubs), datos hardcodeados |

### Módulo de Negocios / Sponsor

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/sponsors-page` | `sponsors-page/page.tsx` | ⚠️ Parcial | 4 tabs (2 stubs), campañas no leen de localStorage |
| `/memberships` | `memberships/page.tsx` | ❌ Sin función | Botones "Suscribirse" sin onClick |

### Módulo de Recompensas / PTS

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/rewards` | `rewards/page.tsx` | ✅ Completo | Display de PTS, racha, badges |
| `/referidos` | `referidos/page.tsx` | ✅ Completo | Código de referido, stats |

### Módulo de Mensajería

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/messages` | `messages/page.tsx` | ⚠️ Parcial | 4 conversaciones hardcodeadas, sin backend |
| `/contact` | `contact/page.tsx` | ⚠️ Parcial | Formulario guarda en localStorage (no envía) |

### Módulo de Dashboard

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | ⚠️ Mock | Métricas estáticas, sin datos reales |

### Módulo de Gemología

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/gemologia` | `gemologia/page.tsx` | ✅ Completo | Shell con 4 tabs (Lab, Handbook, AI, Lore) |
| — | `GemLab.tsx` | ✅ Completo | Simulador interactivo de zafiros |
| — | `Handbook.tsx` | ✅ Completo | Guía educativa de gemología |
| — | `AiAssistant.tsx` | ✅ Funcional | Chat con IA gemológica (usa /api/chat real) |
| — | `LoreExplorer.tsx` | ✅ Completo | Catálogo de zafiros famosos |

### Módulo de Ajustes

| Ruta | Archivo | Estado | Descripción |
|---|---|---|---|
| `/settings` | `settings/page.tsx` | ⚠️ Parcial | 8 secciones: perfil funcional, el resto visual-only |

### Páginas Legales / Informativas (hardcodeadas)

| Ruta | Archivo | Estado |
|---|---|---|
| `/about` | `about/page.tsx` | ✅ Completo |
| `/what-we-do` | `what-we-do/page.tsx` | ✅ Completo |
| `/how-it-works` | `how-it-works/page.tsx` | ✅ Completo |
| `/ecosystem` | `ecosystem/page.tsx` | ✅ Completo |
| `/vision` | `vision/page.tsx` | ✅ Completo |
| `/mission` | `mission/page.tsx` | ✅ Completo |
| `/values` | `values/page.tsx` | ✅ Completo |
| `/help` | `help/page.tsx` | ✅ Completo |
| `/terms` | `terms/page.tsx` | ✅ Completo |
| `/privacy` | `privacy/page.tsx` | ✅ Completo |
| `/rules` | `rules/page.tsx` | ✅ Completo |
| `/not-found` | `not-found.tsx` | ✅ Completo |

### Layout / Shell

| Archivo | Estado | Descripción |
|---|---|---|
| `layout.tsx` | ✅ Completo | Root layout con metadata SEO + Geist fonts |
| `ClientLayout.tsx` | ✅ Completo | Footer condicional + NetworkBackground + ELIANA floating |
| `globals.css` | ✅ Completo | 152 líneas: Tailwind v4 + animaciones + glass/glow utilities |

---

## 5. Sistema de Almacenamiento (localStorage)

Toda la persistencia actual es **localStorage en el navegador**. No hay base de datos real.

### Todas las claves de localStorage

| Clave | Módulo | Lectura | Escritura | Tipo de Dato | Estado |
|---|---|---|---|---|---|
| `zafiro_session` | auth | ✅ | ✅ | `{email, name, id}` | ✅ Activo |
| `zafiro_users` | auth | ✅ | ✅ | `ZafiroUser[]` | ✅ Activo |
| `zafiro_profiles` | profile | ✅ | ✅ | `Record<UserId, UserProfile>` | ✅ Activo |
| `zafiro_universo` | universo | ✅ | ✅ | `ConnectedPlatform[]` | ✅ Activo |
| `zafiro_following` | universo/profile | ✅ | ✅ | `string[]` | ✅ Activo |
| `zafiro_pts` | rewards | ✅ | ✅ | `Record<UserId, PTSAccount>` | ✅ Activo |
| `zafiro_streak` | rewards | ✅ | ✅ | `Record<UserId, {streak, lastDate}>` | ✅ Activo |
| `zafiro_earned_badges` | rewards | ✅ | ✅ | `Record<UserId, string[]>` | ✅ Activo |
| `zafiro_daily_actions` | rewards | ✅ | ✅ | `Record<UserId, DailyAction[]>` | ✅ Activo |
| `zafiro_referral_codes` | referidos | ✅ | ✅ | `ReferralCode[]` | ✅ Activo |
| `zafiro_referral_tracking` | referidos | ✅ | ✅ | `ReferralRecord[]` | ✅ Activo |
| `zafiro_sponsors` | zafiro-data | ✅ | ✅ | `SponsorCampaign[]` | ✅ Activo |
| `zafiro_questions` | zafiro-data | ✅ | ✅ | `Question[]` | ✅ Activo |
| `zafiro_comentarios` | comentarios | ✅ | ✅ | `Comentario[]` | ✅ Activo |
| `zafiro_publicaciones` | comentarios | ✅ | ✅ | `Publicacion[]` | ✅ Activo |
| `zafiro_contact_messages` | contact | ✅ | ✅ | `ContactMessage[]` | ✅ Activo |
| `zafiro_campaigns` | sponsors-page | ❌ No se lee | ✅ Se escribe | `SponsorCampaign[]` | ⚠️ Inconsistente |
| `zafiro_messages` | messages | ✅ | ✅ | `Message[]` | ✅ Activo |
| `zafiro_dark` | page.tsx | ✅ | ✅ | `string` ("true"/"false") | ✅ Activo |
| `zafiro_profile` | settings | ✅ | ✅ | `Profile` | ⚠️ Duplicado (no sincronizado con profile.ts) |
| `zafiro_eliana_analysis` | eliana/analysis | ✅ | ❌ **Nunca se escribe** | `PlatformAnalysis[]` | ❌ Roto |
| `zafiro_eliana_memory` | eliana/memory | ✅ | ✅ | `ElianaMemory` | ✅ Activo |
| `zafiro_eliana_graph` | eliana/knowledge | ✅ | ✅ | `KnowledgeGraph` | ✅ Activo |
| `zafiro_recommendations_cache` | eliana/recommendations | ✅ | ✅ | `Recommendation[]` | ✅ Activo |
| `zafiro_dark` | settings | ✅ | ❌ No escribe | — | ⚠️ Solo lectura |

### Problemas del sistema de almacenamiento

1. **Límite de 5-10MB** — `zafiro_profiles` contiene imágenes base64 (avatar, coverImage) → riesgo de desbordamiento
2. **Sin TTL/expiración** — `zafiro_daily_actions`, `zafiro_comentarios`, `zafiro_recommendations_cache` crecen sin límite
3. **Sin migraciones** — Cambiar la estructura de datos rompe todos los datos existentes
4. **Sin cifrado** — Contraseñas hasheadas pero datos personales en texto plano
5. **No portátil** — Los datos no cruzan dispositivos/navegadores
6. **`zafiro_eliana_analysis` NUNCA se escribe** — bug en `analysis.ts`
7. **`zafiro_profile` es duplicado** — settings usa su propio key que no sincroniza con `zafiro_profiles`
8. **`zafiro_campaigns` se escribe pero no se lee** — sponsors-page crea campañas que nunca se muestran

---

## 6. Módulos por Estado

### ✅ Completos y funcionales

| Módulo | Archivos | Descripción |
|---|---|---|
| Autenticación (core) | `auth.ts` | Registro, login, logout, sesión en localStorage |
| Perfiles (CRUD) | `profile.ts` | Crear/leer/actualizar perfiles, proyectos, enlaces |
| Universo/Conexiones | `universo.ts`, `universo/page.tsx` | CRUD de plataformas, reordenar, toggle visibilidad |
| Proyectos | `profile-page/projects/page.tsx` | CRUD completo de proyectos |
| Conexiones personales | `profile-page/connections/page.tsx` | CRUD de enlaces + plataformas |
| Editor de perfil | `profile-page/edit/page.tsx` | Edición completa con avatar/cover |
| Recompensas (PTS) | `rewards.ts` | Ganancias, gastos, niveles, badges |
| Referidos | `referidos.ts`, `referidos/page.tsx` | Códigos, tracking, stats |
| Gemología (Lab) | `GemLab.tsx` | Simulador de zafiros con cálculo de valuación |
| Gemología (Handbook) | `Handbook.tsx` | Guía educativa con espectroscopio |
| Gemología (Lore) | `LoreExplorer.tsx` | Catálogo de zafiros famosos |
| AI Assistant | `AiAssistant.tsx` | Chat gemológico con API real |
| Preguntas y Respuestas | `zafiro-data.ts`, `page.tsx` | Crear, listar, filtrar preguntas |
| Stories | `StoriesBar.tsx`, `StoryViewer.tsx` | Stories tipo Instagram |
| Partículas / Background | `ParticlesBackground.tsx` | Canvas animated background |
| Knowledge Graph | `KnowledgeGraph.tsx` | Grafo radial interactivo |
| Trends | `TrendsSection.tsx` | Tendencias con sparklines SVG |
| Expert Leaderboard | `ExpertLeaderboard.tsx` | Ranking de expertos |
| Bottom Nav | `BottomNav.tsx` | Navegación inferior mobile |
| Footer | `Footer.tsx` | Footer completo con todos los links |
| ElianaDiamond | `ElianaDiamond.tsx` | SVG del diamante ELIANA (5 variantes) |
| UI primitives | `ui/` (5 files) | GlassCard, GradientText, NetworkBackground, Skeleton, StatCard |
| 14 páginas informativas | about, what-we-do, help, terms, etc. | Contenido hardcodeado completo |

### ⚠️ Parciales / Incompletos

| Módulo | Archivos | Problema |
|---|---|---|
| Admin Dashboard | `admin/page.tsx` | 1 tab funcional con datos hardcodeados, 7 tabs son stubs vacíos |
| Mensajería | `messages/page.tsx` | 4 conversaciones hardcodeadas, sin backend, header fijo |
| Contacto | `contact/page.tsx` | Guarda en localStorage pero no envía email/API |
| Settings | `settings/page.tsx` | Perfil funcional, el resto (notificaciones, privacidad, apariencia) son visual-only |
| Sponsors-page | `sponsors-page/page.tsx` | Stats hardcodeadas, campañas no se leen de localStorage, 2 tabs vacíos |
| Recovery | `auth/recover/page.tsx` | No envía email real, solo simula |
| Perfil Público | `perfil/[username]/page.tsx` | Funcional pero datos mayormente hardcodeados |
| SPA page.tsx | `page.tsx` | Varios bugs (selectedNode no usado, authLogout no usado, etc.) |
| ELIANA Analysis | `eliana/analysis.ts` | `analyzePlatform()` nunca persiste resultados |
| ELIANA Recommendations | `eliana/recommendations.ts` | `session` variable sin usar, cache sin evicción |
| Knowledge Graph lib | `eliana/knowledge.ts` | Grafo nunca se poda, O(n²) dedup |
| Stripe Modal | `StripeModal.tsx` | Mock completo (sin @stripe/stripe-js, sin llamada a API) |
| Sponsor Analytics | `SponsorAnalyticsChart.tsx` | Métricas hardcodeadas |
| Daily Brief | `DailyBrief.tsx` | Contenido hardcodeado, no dinámico |
| Notifications | `NotificationsDropdown.tsx` | Sin click-outside handler |
| Ecosistema (lib) | `ecosistema.ts` | Solo datos estáticos, sin CRUD ni persistencia |

### ❌ No funcionales / Simulados / Rotos

| Módulo | Archivos | Problema |
|---|---|---|
| Verify | `auth/verify/page.tsx` | `onSubmit={e => e.preventDefault()}` — submit vacío |
| Memberships | `memberships/page.tsx` | Botones sin onClick |
| Supabase (real) | — | Variables declaradas pero **cero código** usa Supabase |
| Stripe (real) | — | Variables declaradas, pero `@stripe/stripe-js` ni siquiera instalado |
| Referral bonus | `referidos.ts` | `bonusAwarded: 100` se guarda pero **nunca se acredita como PTS** |
| ImportFromLinktree | `universo.ts` | Simulado: genera 4 plataformas hardcodeadas, sin API real |
| Platform Analysis | `eliana/analysis.ts` | Metadata estática, sin scraping real |
| `zafiro_eliana_analysis` | `eliana/analysis.ts` | **Nunca se escribe en localStorage** → análisis siempre vacío |
| `zafiro_campaigns` | `sponsors-page/page.tsx` | Se escribe pero nunca se lee |
| `zafiro_profile` | `settings/page.tsx` | Duplicado que no sincroniza con profile.ts |
| Print PDF (GemLab) | `GemLab.tsx` | Llama a `alert()` — no genera PDF real |
| Email real | `auth/recover/page.tsx` | No hay servicio de email configurado |
| Pago real | `StripeModal.tsx` | No hay procesador de pagos |
| Chat messages persist | `page.tsx` | Mensajes de ELIANA no persisten entre sesiones |

### 🟡 Funcional pero con bugs

| Módulo | Bug |
|---|---|
| `page.tsx` | `filteredQuestions` useMemo falta `qs` en dependencias |
| `page.tsx` | Link "Explorar Gemología completa →" apunta a `/sponsors-page` en vez de `/gemologia` |
| `page.tsx` | Puntos (streak, points) no persisten entre sesiones |
| `page.tsx` | Sponsor click tracking no persiste (no llama `saveSponsors()`) |
| `page.tsx` | Comentarios en pregunta detalle no persisten a `qs` |
| `profile-page/page.tsx` | `dangerouslySetInnerHTML` en chat ELIANA |
| `profile-page/projects/page.tsx` | Color picker: Tailwind class usada como backgroundColor inline |
| `perfil/[username]/page.tsx` | `dangerouslySetInnerHTML` en chat ELIANA |
| `perfil/[username]/page.tsx` | "Editar Perfil" link apunta a `/settings` en vez de `/profile-page/edit` |
| `SponsorFloatingBar.tsx` | `&aacute;` renderizado como texto literal |
| `SponsorDetailModal.tsx` | `&aacute;` renderizado como texto literal |
| `StripeModal.tsx` | `z-55` clase Tailwind inválida |
| `universo/page.tsx` | Lógica de seed duplicada (2 bloques idénticos para reemplazar seeds) |
| `memberships/page.tsx` | Precio anual: `$7.99/año` debería ser precio mensual facturado anualmente |
| `rewards.ts` | `spendPTS` parámetro `concept` nunca se usa |
| `rewards.ts` | Badge logic overlapping conditions |
| `referidos.ts` | Bono de referido de 100 PTS nunca se acredita |

---

## 7. Análisis de Seguridad

### Vulnerabilidades Críticas

| # | Vulnerabilidad | Archivo | Riesgo |
|---|---|---|---|
| 1 | **XSS via dangerouslySetInnerHTML** | `profile-page/page.tsx:170`, `perfil/[username]/page.tsx:124` | Alto — entrada del usuario en chat ELIANA se renderiza como HTML |
| 2 | **Autenticación 100% cliente** | `auth.ts` | Alto — cualquier usuario con consola puede crear/modificar cualquier dato |
| 3 | **Sin autorización server-side** | Todos los archivos | Alto — no hay middleware, RLS, ni API routes protegidas |
| 4 | **Admin guard client-side** | `admin/page.tsx:14` | Alto — solo verifica `getSession().email` en cliente, evitable |
| 5 | **Prompt injection en Gemini** | `api/chat/route.ts` | Medio — mensajes de usuario van directo a Gemini |
| 6 | **User enumeration** | `auth/recover/page.tsx` | Medio — "No existe una cuenta con ese correo" |
| 7 | **Imágenes base64 en localStorage** | `profile-page/edit/page.tsx` | Medio — agotamiento de almacenamiento (5MB límite) |
| 8 | **Sin rate limiting en login** | `auth/login/page.tsx` | Medio — ataque de fuerza bruta posible |
| 9 | **Sin CSRF** | Todos los formularios | Medio — no hay tokens anti-CSRF |
| 10 | **Códigos de referido predecibles** | `referidos.ts` | Bajo — `Math.random()` para generación |
| 11 | **Contraseñas hasheadas con salt fijo** | `auth.ts` | Bajo — salt `"zafiro_salt_v1"` hardcodeado |
| 12 | **Secrets en client bundle** | `admin/page.tsx` | Bajo — email `msmmystore@gmail.com` hardcodeado |

### Headers de Seguridad (next.config.ts)

| Header | Valor | Estado |
|---|---|---|
| `X-Frame-Options` | `DENY` | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | ✅ |

---

## 8. Problemas y Riesgos Técnicos

### Arquitectónicos

1. **Sin backend real** — Toda la lógica es client-side. No hay base de datos, autenticación server-side, ni API propia (excepto `/api/chat`). Supabase está declarado pero no implementado.

2. **Sin aislamiento de usuarios** — Cualquier usuario puede leer/escribir datos de cualquier otro usuario con solo conocer su `userId`.

3. **Dos sistemas de perfil** — `profile.ts` (usado por perfil propio, editor, proyectos, conexiones) vs `settings/page.tsx` (usa `zafiro_profile`). No sincronizados.

4. **Sin estado global** — No hay React Context, Zustand, ni Redux. Los datos se cargan desde localStorage en cada componente de forma independiente.

5. **Next.js App Router sin Server Components** — Todas las páginas son `'use client'`. No se aprovecha React Server Components para datos estáticos (páginas informativas).

### Rendimiento

1. **Imágenes base64 en localStorage** — Avatar/cover subidos como dataURL se almacenan en localStorage, consumiendo cuota de 5-10MB rápidamente.

2. **Sin lazy loading de datos** — El SPA `page.tsx` carga todos los datos (stories, questions, trends, communities, sponsors, etc.) en el montaje inicial.

3. **Knowledge Graph O(n²)** — `eliana/knowledge.ts` tiene deduplicación cuadrática.

4. **Sin memoization** — `setTimeout` para 600ms en contact form, 1500ms en StripeModal — tiempos arbitrarios.

5. **Mutable module-level state** — `knowledge.ts` tiene variable `kb` mutable a nivel de módulo.

### Mantenibilidad

1. **1107 líneas en page.tsx** — El SPA principal es demasiado grande, mezcla 7 vistas, lógica de negocio, y rendering.

2. **Código duplicado** — `formatNumber` en 2 archivos, `PLATFORM_ICONS` en 2 archivos, lógica de seed miguel en múltiples archivos.

3. **30+ imports sin usar** — Principalmente iconos de lucide-react en archivos informativos (about, help, terms, privacy, etc.).

4. **Sin tests** — No hay pruebas unitarias, de integración, ni e2e.

5. **README genérico** — Es el template de `create-next-app`, no describe el proyecto real.

---

## 9. Código Duplicado y Funciones Sin Uso

### Código Duplicado

| Código | Archivos | Líneas |
|---|---|---|
| `formatNumber(n)` | `profile-page/page.tsx`, `perfil/[username]/page.tsx` | ~5 c/u |
| `PLATFORM_ICONS` map | `perfil/[username]/page.tsx`, `profile-page/connections/page.tsx` | ~10 c/u |
| Seed Miguel load + fallback | `profile-page/*.tsx` (4 archivos) | ~8-12 c/u |
| `typeof window === "undefined"` guard | ~15 archivos diferentes | 1 c/u |

### Variables/funciones definidas pero no usadas

| Símbolo | Archivo | Línea |
|---|---|---|
| `selectedNode` / `setSelectedNode` | `page.tsx` | 76 |
| `isElianaExpanded` / `setIsElianaExpanded` | `page.tsx` | 86 |
| `authLogout` | `page.tsx` | 37 |
| `defaultSponsors` | `page.tsx` | 44 |
| `router` | `profile-page/page.tsx` | 25 |
| `router` | `profile-page/edit/page.tsx` | 12 |
| `session` | `eliana/recommendations.ts` | 11 |
| `graph` | `eliana/recommendations.ts` | 14 |
| `getElianaMemory` | `eliana/engine.ts` | 2 |
| `getProfile`, `getProfilesUsernames`, `UserProfile` | `universo.ts` | 3 |
| `concept` (parameter) | `rewards.ts` | 123 |
| `Atom` | `KnowledgeGraph.tsx` | 4 |
| `setIsInitialized` | `messages/page.tsx` | 27 |
| `setPts`, `setStreak`, `setReferrals`, `setPlatforms`, `setPosts`, `setLevel` | `dashboard/page.tsx` | 17-22 |
| `setCode`, `setReferralCount`, `setEarnings`, `setReferrals` | `referidos/page.tsx` | 14-17 |
| `setAccount`, `setStreak`, `setEarnedBadges` | `rewards/page.tsx` | 22-31 |
| `setUserSession` | `page.tsx` | 50 |
| `setProfile` | `perfil/[username]/page.tsx` | 35 |
| `setPublicaciones` | `perfil/[username]/page.tsx` | 41 |
| `setCurrentStreak`, `setPtsAccount`, `setPlatforms`, `showAvatarUpload` | `profile-page/page.tsx` | 65-73 |
| `saved` | `profile-page/projects/page.tsx` | 43 |
| `Check`, `BookOpen`, `ShoppingCart`, `Music`, `FileText`, `Settings`, `CreditCard`, `Bell`, `MoreHorizontal`, `Edit3`, `Camera`, `Briefcase`, `Music2`, `Podcast`, `Store`, `MessageCircle` | `perfil/[username]/page.tsx` | 9-12 |
| ~50 lucide icons | about, help, terms, privacy, rules, vision, mission, values, eliana, ecosystem, what-we-do, sponsors-page | Varios |

---

## 10. Estado de Integraciones Externas

### Gemini AI (`/api/chat`)
- **Estado**: ✅ Funcional
- **Modelo**: `gemini-1.5-flash`
- **Rate limiting**: 30 req/min por IP (in-memory Map)
- **Timeout**: 15s
- **Fallback**: 11 respuestas hardcodeadas por keyword
- **Knowledge base**: RAG con 35 documentos via `buildKnowledgeContext()`
- **Nota**: No requiere autenticación para llamar al endpoint

### Supabase
- **Estado**: ❌ No implementado
- **Configurado en**: `.env.example`
- **Librería instalada**: `@supabase/ssr`, `@supabase/supabase-js`
- **Código real**: **CERO** — no hay `createClient()`, no hay queries, no hay RLS, no hay middleware de auth
- **Riesgo**: Las variables de entorno en `.env.example` sugieren que se planea migrar, pero nada se ha implementado

### Stripe
- **Estado**: ❌ No implementado
- **Configurado en**: `.env.example`
- **Librería instalada**: **NINGUNA** — ni `@stripe/stripe-js` ni `@stripe/react-stripe-js`
- **Código real**: Solo `StripeModal.tsx` que es un mock con `setTimeout`
- **Nota**: El modal muestra advertencia explícita: *"Stripe no configurado"*

### Telegram
- **Estado**: ❌ Solo enlaces externos
- URLs hardcodeadas a `t.me/msmmystor` en perfil seed

### Linktree
- **Estado**: ❌ Simulado
- `importFromLinktree()` en `universo.ts` no hace llamada API real, solo genera 4 plataformas hardcodeadas

### Email
- **Estado**: ❌ No implementado
- No hay servicio SMTP, SendGrid, Resend, ni ningún proveedor de email

---

## 11. Inventario Total de Funcionalidades

### Funcionalidades Implementadas (Completas)
- [x] Registro de usuario con email + password
- [x] Login/logout con sesión en localStorage
- [x] Perfil de usuario con avatar, cover, bio, roles, enlaces
- [x] CRUD de proyectos personales
- [x] CRUD de plataformas conectadas (17 tipos)
- [x] CRUD de redes sociales / enlaces personales
- [x] Reordenamiento de plataformas (arrastrar arriba/abajo)
- [x] Toggle visibilidad de plataformas
- [x] Perfil público con username dinámico (`/perfil/[username]`)
- [x] Perfil propio con 5 tabs (resumen, actividad, proyectos, conexiones, rewards)
- [x] SPA principal con 7 vistas (Inicio, Explorar, Círculos, Gemología, Sponsors, Universo, Perfil)
- [x] Sistema de preguntas y respuestas
- [x] Stories (tipo Instagram)
- [x] Daily Brief (mock)
- [x] Knowledge Graph interactivo SVG
- [x] Tendencias con gráficos sparkline
- [x] Leaderboard de expertos
- [x] Gemología: simulador interactivo de zafiros
- [x] Gemología: handbook educativo con espectroscopio
- [x] Gemología: lore de zafiros famosos
- [x] Gemología: chat con IA gemológica
- [x] ELIANA: chat flotante en todas las páginas
- [x] ELIANA: motor de análisis de plataformas
- [x] ELIANA: memoria de conversaciones (corto/largo plazo)
- [x] ELIANA: grafo de conocimiento
- [x] ELIANA: recomendaciones personalizadas
- [x] Sistema PTS: ganar, gastar, niveles, badges
- [x] Sistema de racha (streak)
- [x] Sistema de referidos con código único
- [x] Patrocinadores (sponsors) contextuales
- [x] Barra flotante de patrocinadores con AI matching
- [x] Modal de detalle de patrocinador
- [x] Gráfico de analíticas de sponsors
- [x] Formulario de creación de campañas sponsor
- [x] Sistema de membresías (Free, Pro, Cuba Plus) — UI
- [x] Página de administración (panel ELIANA)
- [x] Página de mensajería (UI)
- [x] Página de contacto (guarda en localStorage)
- [x] Página de configuración (perfil + apariencia)
- [x] Notificaciones (dropdown mock)
- [x] Modo oscuro/claro
- [x] Footer con todos los links
- [x] Bottom nav para mobile
- [x] Partículas animadas de fondo
- [x] Background de red (NetworkBackground)
- [x] Cards glassmorphism (GlassCard)
- [x] Texto gradiente (GradientText)
- [x] Skeleton loaders
- [x] PWA manifest
- [x] 14 páginas informativas (about, terms, privacy, etc.)
- [x] 35 documentos de conocimiento para ELIANA
- [x] API route de chat con Gemini + RAG + fallback
- [x] CSP y headers de seguridad

### Funcionalidades Incompletas/Simuladas
- [~] Admin dashboard: solo tab Automation tiene datos (mock), 7 tabs vacíos
- [~] Mensajería: 4 conversaciones hardcodeadas, sin backend
- [~] Contacto: no envía email real
- [~] Settings: notificaciones, privacidad, apariencia son visual-only
- [~] Sponsors-page: campañas creadas no se muestran, stats hardcodeadas
- [~] Daily Brief: contenido hardcodeado
- [~] Verificación de email: UI no funcional
- [~] Recuperación de contraseña: no envía email
- [~] Linktree import: simulado sin API
- [~] Platform analysis: metadata estática, sin scraping
- [~] Stripe payments: mock completo
- [~] Print PDF: solo alert()

### Funcionalidades No Iniciadas
- [ ] Base de datos real (Supabase)
- [ ] Autenticación server-side
- [ ] Middleware de protección de rutas
- [ ] Pagos reales (Stripe)
- [ ] Envío de emails reales
- [ ] Notificaciones push
- [ ] WebSockets / tiempo real
- [ ] API REST propia
- [ ] Búsqueda global
- [ ] Verificación de email real
- [ ] Exportar datos
- [ ] Eliminar cuenta
- [ ] Moderación automatizada real
- [ ] Sistema de reportes
- [ ] Roles y permisos
- [ ] Integración con Marketplace MSM
- [ ] Integración con Álbum de la Vida
- [ ] Integración con Mente Maestra
- [ ] Integración con Telegram real (bot)
- [ ] Mobile app nativa
- [ ] Multi-idioma
- [ ] SEO dinámico por página

---

## 12. Mapa del Sistema: Flujo del Usuario

```
USUARIO NUEVO
│
├─ 1. LLEGA A → / (SPA)
│     └─ Ve Inicio (stories, hero, preguntas, tendencias)
│
├─ 2. REGISTRO → /auth/register [?ref=codigo]
│     ├─ Crea cuenta (name, email, password)
│     ├─ Se crea perfil automático (createProfile)
│     ├─ Se genera código de referido
│     └─ Se inicia sesión automáticamente
│
├─ 3. EXPLORA → SPA (Inicio, Explorar, Círculos)
│     ├─ Ve preguntas, tendencias, comunidades
│     ├─ Crea preguntas (+100 PTS)
│     └─ Comenta y participa
│
├─ 4. CONECTA → /universo
│     ├─ Agrega plataformas (YouTube, Instagram, TikTok, etc.)
│     ├─ Importa desde Linktree (simulado)
│     ├─ Reordena, toggle visibilidad, elimina
│     ├─ Ve el ecosistema MSM (12 proyectos)
│     └─ Comenta en plataformas
│
├─ 5. PERFILIZA → /profile-page
│     ├─ Edita perfil (/profile-page/edit)
│     ├─ Agrega proyectos (/profile-page/projects)
│     ├─ Conecta redes (/profile-page/connections)
│     ├─ Sube avatar/cover (base64)
│     └─ Ve stats, rewards, sponsors
│
├─ 6. GANA → /rewards, /referidos
│     ├─ Gana PTS por acciones diarias
│     ├─ Mantiene racha (streak)
│     ├─ Obtiene badges
│     └─ Invita con código de referido
│
├─ 7. PUBLICA → /sponsors-page
│     ├─ Crea campaña de sponsor
│     ├─ Paga (mock Stripe)
│     └─ Ve analíticas (mock)
│
├─ 8. CHATEA → ELIANA (flotante)
│     ├─ Pregunta sobre ZAFIRO
│     ├─ Recibe respuestas de Gemini + Knowledge Base
│     └─ Recomendaciones personalizadas
│
├─ 9. ADMINISTRA → /admin
│     ├─ Ve métricas de automatización
│     ├─ Alertas de fraude
│     └─ Rendimiento del sistema
│
└─ 10. COMPARTE → /perfil/[username]
      ├─ Perfil público visible
      ├─ Muestra solo plataformas activas
      └─ Otros usuarios pueden seguir
```

---

## 13. Próximos Pasos Priorizados

### Fase 0: Emergencias (bugs que rompen funcionalidad)
1. **Fix `zafiro_eliana_analysis`** — `analyzePlatform()` debe persistir en localStorage
2. **Fix referral bonus** — `applyReferralCode()` debe llamar a `earnPTS()` para acreditar los 100 PTS
3. **Fix `zafiro_campaigns`** — sponsors-page debe leer campañas desde localStorage
4. **Fix `zafiro_profile`** — settings debe usar `profile.ts` en vez de su propio key duplicado
5. **Fix `&aacute;` entities** — En `SponsorFloatingBar.tsx` y `SponsorDetailModal.tsx`

### Fase 1: Seguridad y Arquitectura
1. **Implementar Supabase real** — migrar de localStorage a base de datos
2. **Auth server-side** — middleware de protección de rutas con Supabase Auth
3. **Eliminar XSS** — Reemplazar `dangerouslySetInnerHTML` en chats ELIANA
4. **Proteger admin** — endpoint server-side, no solo client-side guard
5. **Rate limiting real** — en login, register, recovery endpoints
6. **Imágenes a CDN/cloud storage** — no base64 en localStorage

### Fase 2: Core Business
1. **Stripe real** — Implementar `@stripe/stripe-js` y webhooks
2. **Email service** — SendGrid/Resend para recovery y verify
3. **Verify funcional** — Implementar verificación de email real
4. **Mensajería real** — Backend de mensajería con Supabase Realtime
5. **Memberships funcionales** — Botones de suscripción con Stripe

### Fase 3: Refactor y Calidad
1. **Refactor page.tsx** — Dividir SPA de 1107 líneas en componentes más pequeños
2. **Consolidar módulo de perfil** — Unificar `profile.ts` y eliminar duplicados
3. **Clean up imports** — Eliminar ~50 imports sin usar
4. **Eliminar código duplicado** — `formatNumber`, `PLATFORM_ICONS`, lógica de seed
5. **Agregar tests** — Tests unitarios para libs, tests de componentes
6. **Documentación real** — Reemplazar README genérico

### Fase 4: Features Nuevas
1. **Integración Marketplace MSM** — Productos, compras, catálogo
2. **Integración Álbum de la Vida** — Recuerdos, historias, legado
3. **Integración Mente Maestra** — Crecimiento, disciplina, comunidad
4. **Bot de Telegram real** — Notificaciones, interacciones
5. **Multi-idioma** — i18n (español/inglés)
6. **Moderación real** — Reportes, bloqueos, automatización
7. **Búsqueda global** — Búsqueda full-text en perfiles, preguntas, contenido

---

*Este informe fue generado el 12 de julio de 2026 mediante análisis exhaustivo de todo el código fuente del proyecto MSM-ZAFIRO, incluyendo 33 rutas, 19 componentes, 14 archivos de librería, 6 módulos ELIANA, configuraciones, scripts y assets.*

*Total: ~150 archivos analizados, ~25,000+ líneas de código revisadas.*
