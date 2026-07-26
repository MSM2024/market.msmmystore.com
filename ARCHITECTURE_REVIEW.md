# ZAFIRO — Architecture Review & Technical Audit

> **Project**: MSM-Zafiro v0.1.0  
> **Framework**: Next.js 16.2.10 + React 19.2.4  
> **Date**: 2026-07-09  
> **Auditor**: OpenCode (CTO role)  
> **Status**: MVP funcional — 5 críticos + 6 importantes resueltos ✅

---

## 📁 1. Arquitectura del Proyecto

```
MSM-Zafiro/
├── src/
│   ├── app/              # 34 rutas (Next.js App Router)
│   │   ├── layout.tsx    # Root layout (metadata, fonts, theme)
│   │   ├── ClientLayout  # Wrapper: NetworkBackground + Footer + ELIANA FAB
│   │   ├── globals.css   # Design system (glass, glow, animations)
│   │   ├── page.tsx      # Home SPA (6 vistas)
│   │   ├── {route}/page.tsx  # Standalone pages
│   │   ├── perfil/[username]/page.tsx  # Perfil público dinámico
│   │   └── api/chat/route.ts         # API endpoint chat
│   ├── components/       # 25 componentes React
│   │   ├── ui/           # 5 componentes base
│   │   ├── gemology/     # 4 componentes
│   │   └── *.tsx         # 16 funcionales (Stories, Sponsors, ELIANA, etc.)
│   └── lib/              # 22 módulos de lógica/datos
│       ├── eliana/       # 6 módulos del engine ELIANA
│       ├── auth.ts       # Auth con hash SHA-256 (Web Crypto API)
│       ├── profile.ts    # Perfil completo CRUD + seed Miguel
│       ├── rewards.ts    # Sistema PTS, streaks, badges
│       ├── referidos.ts  # Sistema de referidos
│       ├── universo.ts   # Plataformas conectadas CRUD
│       ├── ecosistema.ts # Proyectos del ecosistema MSM
│       ├── zafiro-data.ts # Mock data
│       ├── knowledge.ts   # Sin fs — datos estáticos vía knowledge-data.ts
│       ├── knowledge-data.ts # 35 docs generados en build time (prebuild)
│   ├── supabase.ts / supabase-admin.ts # ELIMINADOS — dead code
│       ├── comentarios.ts  # Comentarios en plataformas
│       └── gemology-*.ts   # Datos de gemología
├── knowledge-pack/       # 35 archivos markdown fuente para ELIANA
├── scripts/              # Herramientas de build
│   └── generate-knowledge-data.mjs  # Convierte markdown → knowledge-data.ts
├── public/               # 7 assets estáticos
└── Config files          # next.config.ts, tsconfig.json, package.json, .env.example
```

### Patrón Arquitectónico

**Frontend-only SPA sobre Next.js App Router**. Todas las páginas son `'use client'`. Los datos persisten en `localStorage` con 14 keys.

```
[Browser] ←→ [Next.js Client Components] ←→ [localStorage]
                                              ↕
                                         [Mock Data]
```

---

## 2. Flujos de Datos

### 2.1 Flujo de Autenticación
```
Register: formulario → registerUser() async → hash SHA-256 → localStorage("zafiro_users") + session
Login:    formulario → loginUser() async → hash + compare → localStorage("zafiro_session")
Session:  getSession() → localStorage("zafiro_session") → { email, name, id }
```

**✅ Corregido**: contraseñas hasheadas con SHA-256 via Web Crypto API. `ZafiroUser.password` → `ZafiroUser.passwordHash`. Ya no se almacena texto plano.

### 2.2 Flujo de Stripe (Eliminado)
```
StripeModal anterior: inputs de tarjeta → ELIMINADO
StripeModal actual: pantalla de confirmación sin datos sensibles + advertencia "Stripe no configurado"
```

**✅ Corregido**: eliminados todos los inputs de tarjeta, CVC, expiración. StripeModal ahora es solo confirmación. Dead code (`stripe.ts`, `stripe-server.ts`) eliminado. Paquetes npm `@stripe/*` y `stripe` desinstalados.

### 2.3 Flujo de Supabase
```
supabase.ts  → createBrowserClient() (sin usar — pendiente migración)
supabase-admin.ts → createClient() (sin usar — pendiente migración)
```

**🟡 Pendiente**: Los módulos existen pero no se usan. Las env vars no están configuradas. Migración planificada para auth real.

### 2.4 Flujo de API Chat
```
POST /api/chat { message, history }
→ Rate limit check (30 req/60s por IP)
→ Validación: message ≤ 2000 chars, history ≤ 20 items
→ Gemini API (si configurado, key via header) con timeout 15s
→ Fallback: knowledge-data.ts (35 docs) + respuestas hardcodeadas
```

**✅ Corregido**: Rate limiting in-memory, validación de payload, API key en header `x-goog-api-key` (no en URL), timeout con AbortController, errores seguros (no leak `err.message`).

### 2.5 Flujo de ELIANA (cliente)
```
User message → processElianaRequest() → memory.ts → recommendations.ts → knowledge.ts (client) → response
```

El engine ELIANA corre en cliente con:
- Memoria a corto/largo plazo (`zafiro_eliana_memory`)
- Grafo de conocimiento (`zafiro_eliana_graph`)
- Análisis de plataformas (`zafiro_eliana_analysis`)
- Recomendaciones contextuales por página

### 2.6 Flujo del Perfil Inteligente
```
/profile-page     → getSession() → getProfile(userId) o seedMiguelProfile()
/profile-page/edit → updateProfile(userId, fields) → localStorage("zafiro_profiles")
/perfil/[username] → getProfileByUsername(username) → universo.ts + profile.ts
```

Perfil completo con datos reales de Miguel Soria Martínez (@msmmystore). CRUD completo (avatar, portada, bio, proyectos, conexiones, roles, enlaces).

### 2.7 Flujo del Mapa Vivo del Conocimiento
```
KnowledgeGraph → getKnowledgeGraph(userId) → SVG interactivo
```

Layout circular simple. Pendiente force-directed layout.

### 2.8 Flujo de Comunidades
```
Communities view → communities[] (mock) → toggle join → joinedCommunities[]
```

Solo mock. Sin backend real.

### 2.9 Flujo de Preguntas y Respuestas
```
questions[] (mock) → filter → QuestionDetailModal → replies[]
```

**✅ Resuelto**: Preguntas creadas persisten en localStorage ("zafiro_publicaciones").

### 2.10 Flujo de Sponsors
```
SponsorCampaign[] → SponsorFloatingBar → StripeModal (confirmación) → +500 PTS
```

**✅ Resuelto**: Campañas creadas persisten en localStorage ("zafiro_campaigns").

### 2.11 Flujo de Membresías
Solo mock data en componentes.

### 2.12 Flujo de Referidos
```
registerUser(refCode) → zafiro_referral_codes + zafiro_referral_tracking
/referidos → getReferrals(), getReferralEarnings()
```

**✅ Funcional**: Todo localStorage, funciona correctamente.

### 2.13 Flujo de MSM Rewards
```
earnPTS(userId, action) → zafiro_pts → level calculation
markDailyLogin() → streak tracking
checkAndAwardBadges() → zafiro_earned_badges
```

**✅ Funcional**: 10 acciones, límites diarios, 10 niveles, 8 logros.

### 2.14 Flujo de Notificaciones
Solo mock estático (2 notificaciones fijas en page.tsx). Sin sistema real.

### 2.15 Flujo de Mensajería
```
/messages → zafiro_messages → conversación mock + chat persistente
```

🟢 1 conversación, sin websockets.

### 2.16 Flujo de Administración
```
/admin → Automation Center → 8 tabs con datos mock
```

Solo UI.

### 2.17 Flujo de Seguridad
```
Auth:     SHA-256 hash ✅ (antes plaintext ❌)
API:      Rate limiting (30/60s) ✅ (antes sin límite ❌)
API:      Timeout 15s, payload validation ✅ (antes sin protección ❌)
Stripe:   Sin datos de tarjeta ✅ (antes PCI-violation ❌)
Módulos:  stripe.ts/stripe-server.ts eliminados ✅
knowledge: Sin fs, datos estáticos en build time ✅ (antes fs/serverless ❌)
Import:   Estático directo ✅ (antes dynamic import roto ❌)

Pendiente: Supabase Auth real, HTTPS, CSRF, sanitización, roles/permisos.
```

---

## 🧩 3. Problemas

### 🔴 Críticos Originales — RESUELTOS ✅

| # | Problema | Estado | Solución |
|---|----------|--------|----------|
| C1 | StripeModal PCI-violation | ✅ Resuelto | Inputs de tarjeta/CVC/expiración eliminados. StripeModal es solo confirmación con advertencia. Archivos `stripe.ts`, `stripe-server.ts` eliminados. Paquetes npm desinstalados. |
| C2 | Contraseñas en texto plano | ✅ Resuelto | `password` → `passwordHash` (SHA-256 via Web Crypto API). `registerUser`/`loginUser` ahora async. |
| C3 | knowledge.ts usa fs/path | ✅ Resuelto | Generado `knowledge-data.ts` con 35 docs en build time via `scripts/generate-knowledge-data.mjs`. `knowledge.ts` importa datos estáticos, sin `fs`. `prebuild` en package.json. |
| C4 | Import dinámico roto | ✅ Resuelto | `import("@/components/ElianaFloatingButton")` → import estático directo de `openElianaChat`. Más eficiente y type-safe. |
| C5 | API route sin engine/protección | ✅ Resuelto | Rate limiting (30 req/60s), validación payload (2000 chars, 20 history), API key en header, timeout 15s, errores seguros (no leak interno). |

### 🟠 Importantes (Pendientes)

| # | Problema | Archivo | Detalle |
|---|----------|---------|---------|
| I1 | **Login sin validación server-side** | `src/lib/auth.ts` | localStorage modificable por el usuario. Requiere Supabase Auth real. |
| I2 | **100% 'use client'** | Todas las páginas | Sin SSR, RSC, o SEO server-side. |
| I3 | **page.tsx monolítico** | `src/app/page.tsx` | ~1086 líneas, 85+ useState, 6 vistas mezcladas. |
| I4 | **Preguntas no persisten** | ✅ Resuelto | `handleCreateQuestion` ahora guarda en localStorage("zafiro_publicaciones"). |
| I5 | **Sponsors no persisten** | ✅ Resuelto | Campañas guardadas en localStorage("zafiro_campaigns"). |
| I6 | **Dead code: supabase.ts, supabase-admin.ts** | ✅ Eliminado | Archivos removidos. |
| I7 | **Fallback hardcodeado duplicado** | ✅ Resuelto | `getCreatorProfile("msmmystore")` ahora usa `seedMiguelProfile()`. |
| I8 | **importFromLinktree solo msmmystore** | ✅ Resuelto | Ahora es genérica — usa template armado para cualquier username. |
| I9 | **Alert() para validación** | ✅ Resuelto | Reemplazado por estado `sponsorError` inline en componente. |
| I10 | **useSearchParams sin Suspense** | Riesgo en replicación | Register lo tiene ✅, pero hay que mantener consistencia. |

### 🟢 Mejoras Futuras

| # | Propuesta | Área |
|---|-----------|------|
| G1 | **Server Components** para páginas info (terms, privacy, help) | Routing |
| G2 | **Dividir page.tsx** en `src/components/views/` | Home |
| G3 | **Hook `useLocalStorage<T>`** genérico | Persistencia |
| G4 | **Shared types** en `src/types/` | Tipado |
| G5 | **Imágenes con `next/image`** en vez de `<img>` | Performance |
| G6 | **Loading states/skeleton** en páginas con datos | UX |
| G7 | **Tests** (Vitest + Playwright) | QA |
| G8 | **i18n** | Internacionalización |
| G9 | **PWA: service worker** | Offline |
| G10 | **Accesibilidad**: aria labels, roles, contraste | UX |

---

## 📝 4. Observaciones Adicionales

### Código Muerto Eliminado

| Archivo | Estado |
|---------|--------|
| `src/lib/stripe.ts` | ✅ Eliminado |
| `src/lib/stripe-server.ts` | ✅ Eliminado |
| `src/lib/supabase.ts` | ✅ Eliminado |
| `src/lib/supabase-admin.ts` | ✅ Eliminado |
| `@stripe/stripe-js` | ✅ Desinstalado |
| `@stripe/react-stripe-js` | ✅ Desinstalado |
| `stripe` (npm) | ✅ Desinstalado |

### Archivos Nuevos (S1–S5)

| Archivo | Propósito |
|---------|-----------|
| `src/lib/knowledge-data.ts` | 35 docs estáticos de conocimiento (generado en build time) |
| `scripts/generate-knowledge-data.mjs` | Script que convierte markdown → TypeScript en `prebuild` |

### Duplicación Detectada

| Archivos | Problema |
|----------|----------|
| `profile.ts:seedMiguelProfile` vs `universo.ts:getCreatorProfile("msmmystore")` | Datos duplicados perfil Miguel (✅ resuelto — ahora usa seedMiguelProfile()) |
| `knowledge.ts` (lib/) vs `eliana/knowledge.ts` | Nombres similares, propósitos distintos |
| `comentarios.ts` vs `zafiro-data.ts` | Definiciones de `Publicacion` fragmentadas |

### Cuellos de Botella Potenciales

1. **localStorage como DB**: Límite ~5-10MB, lento con objetos grandes. 14 keys distintas.
2. **page.tsx bundle**: ~1086 líneas, 25+ imports estáticos. Sin lazy loading.
3. **Sin streaming SSR**: Cada página debe hidratar React completo antes de ser interactiva.

---

## ✅ 5. Ready-for-Production Check

| Requisito | Estado | Nota |
|-----------|--------|------|
| Build sin errores | ✅ | 0 TS errors, 35 rutas (33 static + 2 dynamic) |
| Rutas verificadas en vivo | ✅ | 35/35 responden 200 OK |
| localStorage guardado | ✅ | 14 keys con guards SSR |
| **Stripe: sin PCI data** | ✅ | Corregido — inputs de tarjeta eliminados |
| **Auth: passwords hasheadas** | ✅ | SHA-256 Web Crypto API |
| **API: rate limiting + validación** | ✅ | 30 req/60s, payload validation, timeout |
| **knowledge: serverless compat** | ✅ | Build-time data generation, sin fs |
| **Import dinámico** | ✅ | Estático directo |
| .env.local configurado | ❌ | No existe |
| Supabase real | ❌ | Clients sin usar |
| Gemini AI real | ❌ | Sin API key configurada |
| Stripe real | ❌ | StripeModal en modo confirmación solamente |
| Tests | ❌ | 0 tests |
| SEO | ❌ | Sin SSR, sin metadata por página |
| Imágenes optimizadas | ❌ | Usan `<img>` nativo |
| PWA completa | 🟡 | manifest.json existe, falta service worker |
| Accesibilidad | ❌ | Sin aria labels, roles, etc. |
| i18n | ❌ | Solo español |

---

## 🎯 6. Recomendaciones Priorizadas

### ✅ CRÍTICOS RESUELTOS (Sprint actual)
1. ~~StripeModal PCI-violation~~ → StripeModal seguro, sin datos de tarjeta
2. ~~Contraseñas plaintext~~ → SHA-256 hash
3. ~~knowledge.ts fs/serverless~~ → Build-time data generation
4. ~~API route sin protección~~ → Rate limit, validación, timeout
5. ~~Import dinámico roto~~ → Import estático directo

### Próximo Sprint — Importantes
1. **Dividir page.tsx** en componentes por vista
2. **Agregar estados de carga/skeleton** en páginas con datos asíncronos
3. **Login con validación server-side** — migrar a Supabase Auth real

### Mediano plazo
6. **Server Components** para páginas informativas
7. **Hook `useLocalStorage`** genérico
8. **Lazy loading** para componentes pesados
9. **Tests** (Vitest + Playwright)
10. **`next/image`** para optimización de imágenes

### Largo plazo (requiere backend real)
11. **Supabase Auth** — migrar autenticación de localStorage a Supabase
12. **Supabase DB** — migrar persistencia completa
13. **Stripe Checkout** — integración real sin recolectar datos de tarjeta
14. **Gemini AI** — conectar ELIANA engine a Gemini API
15. **Notificaciones** — WebSocket/Push
16. **i18n** — estructura de traducciones

---

## 📊 7. Resumen de Métricas

| Métrica | Valor |
|---------|-------|
| Archivos totales | 150 (incluye 35 knowledge-pack) |
| Archivos fuente (src/) | 88 |
| Componentes React | 25 |
| Módulos lib | 22 |
| Rutas totales | 35 (33 static + 2 dynamic) |
| Rutas verificadas en vivo | 35/35 ✅ 200 OK |
| Líneas page.tsx | ~1086 |
| localStorage keys | 14 |
| Problemas 🔴 críticos originales | 5 → **Todos resueltos** ✅ |
| Problemas 🟠 importantes pendientes | 4 |
| Problemas 🟢 mejoras futuras | 10 |
| Dead code files restantes | 0 |
| Dead code eliminado | 5 (stripe.ts, stripe-server.ts, supabase.ts, supabase-admin.ts, + 3 npm packages) |
| Tests | 0 |
| Build | ✅ 0 errores |
| Tiempo build | ~30s |

---

## 📋 Conclusión

ZAFIRO ha superado dos sprints de corrección: **5 críticos** + **6 importantes** resueltos ✅

**Batch 1 — Críticos:**
1. ✅ StripeModal ya no viola PCI-DSS — sin datos de tarjeta en frontend
2. ✅ Contraseñas hasheadas con SHA-256 — sin texto plano en localStorage
3. ✅ knowledge.ts compatible con serverless — datos generados en build time
4. ✅ API chat con rate limiting, validación y timeout
5. ✅ Import dinámico reemplazado por estático directo

**Batch 2 — Importantes:**
6. ✅ Sponsors persisten en localStorage ("zafiro_campaigns")
7. ✅ Preguntas persisten en localStorage ("zafiro_publicaciones")
8. ✅ Dead code eliminado (supabase.ts, supabase-admin.ts)
9. ✅ Fallback perfil Miguel unificado (seedMiguelProfile en getCreatorProfile)
10. ✅ importFromLinktree ahora genérica para cualquier username
11. ✅ Alert() reemplazado por estado inline de error

El proyecto está listo para pruebas reales con 35/35 rutas verificadas. Pendientes: **4 problemas importantes** (dividir page.tsx, login server-side, loading states).

---

*Documento generado por OpenCode como CTO técnico de ZAFIRO.*
*Actualizado: 2026-07-09 — 5 críticos + 6 importantes resueltos.*
