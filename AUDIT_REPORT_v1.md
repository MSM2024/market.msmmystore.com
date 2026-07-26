# AUDITORÍA TÉCNICA — MSM ELIANA + ZAFIRO + FINANCIAL ECOSYSTEM

**Versión:** 1.0  
**Fecha:** 2026-07-10  
**Auditor:** OpenCode (arquitecto principal)  
**Documentos de referencia:**
1. MSM ELIANA + ZAFIRO Total Development v1.0 (especificación maestra)
2. MSM Financial Ecosystem Master Project v1 (ecosistema financiero)
3. Código fuente real en `/src/`

---

## ⚠️ ADVERTENCIA INICIAL

> **No se han encontrado secretos expuestos en el código.**  
> No se han encontrado despliegues activos a producción.  
> No se han encontrado migraciones irreversibles.  
> No se ejecutará ninguna acción financiera, de despliegue ni de modificación de secretos sin aprobación explícita.

---

## 1. ARQUITECTURA ACTUAL CONFIRMADA

### Stack real verificado

| Componente | Versión | Estado |
|---|---|---|
| Next.js | 16.2.10 | EXISTENTE |
| React | 19.2.4 | EXISTENTE |
| TypeScript | ~5.x | EXISTENTE |
| Tailwind CSS | 4.x | EXISTENTE |
| Supabase (client) | @supabase/ssr 0.12, @supabase/supabase-js 2.110 | PARCIAL — instalado pero sin usar |
| Stripe | ❌ Desinstalado en S1 | AUSENTE (intencional) |
| Gemini AI | No configurado (key en .env.example) | AUSENTE |
| lucide-react | 1.23 | EXISTENTE |
| motion (framer-motion) | 12.42 | EXISTENTE |
| zod | Presente en node_modules | NO VERIFICADO — no aparece en imports directos |
| PostgreSQL | ❌ | AUSENTE |
| Redis | ❌ | AUSENTE |
| Prisma | ❌ | AUSENTE |
| Docker | ❌ | AUSENTE |
| GitHub Actions | ❌ | AUSENTE |
| NestJS | ❌ | AUSENTE |

### Estructura de archivos actual

```
MSM-Zafiro/
├── src/
│   ├── app/                    # 34 páginas + 1 API route (App Router)
│   │   ├── layout.tsx          # Root layout (100% client)
│   │   ├── ClientLayout.tsx    # Wrapper con Background, Footer, ELIANA FAB
│   │   ├── page.tsx            # ~1086 líneas, 6 vistas, 85+ useState
│   │   ├── {route}/page.tsx    # 33 páginas restantes
│   │   └── api/chat/route.ts   # Única API route
│   ├── components/             # 16 componentes funcionales + 5 ui/
│   ├── lib/                    # 12 módulos de lógica
│   │   ├── auth.ts             # Auth localStorage (SHA-256)
│   │   ├── profile.ts          # Perfiles CRUD + seed Miguel
│   │   ├── rewards.ts          # Sistema PTS, streaks, badges
│   │   ├── referidos.ts        # Sistema de referidos
│   │   ├── universo.ts         # Plataformas conectadas CRUD
│   │   ├── ecosistema.ts       # Proyectos ecosistema
│   │   ├── zafiro-data.ts      # Mock data + helpers persistencia
│   │   ├── knowledge.ts        # Búsqueda en knowledge-data.ts
│   │   ├── knowledge-data.ts   # 35 docs generados en build time
│   │   ├── comentarios.ts      # Comentarios en plataformas
│   │   ├── gemology-data.ts    # Datos gemológicos
│   │   └── gemology-types.ts   # Tipos gemológicos
│   ├── eliana/                 # Engine ELIANA (6 módulos)
│   │   ├── engine.ts
│   │   ├── memory.ts
│   │   ├── recommendations.ts
│   │   ├── knowledge.ts
│   │   ├── analyzers.ts
│   │   └── utils.ts
├── scripts/
│   └── generate-knowledge-data.mjs  # Build-time data gen
├── knowledge-pack/              # 35 docs markdown fuente
└── public/
    └── manifest.json           # PWA manifest
```

### Resumen de módulos vs especificaciones

| # | Módulo/MSM Spec | Estado | Evidencia |
|---|---|---|---|
| 1 | **ELIANA Chat Web** (Sec 4, 6, 7) | PARCIAL | Botón flotante + engine cliente + API route. Sin RAG real, sin políticas, sin handoff, sin orquestador. |
| 2 | **ELIANA WhatsApp** (Sec 12) | AUSENTE | No existe webhook, plantillas ni integración WhatsApp. |
| 3 | **Base de Conocimiento + RAG** (Sec 9) | PARCIAL | 35 docs markdown con búsqueda keyword. Sin embedding vectorial, sin metadatos completos, sin fragmentación semántica. |
| 4 | **Herramientas ELIANA** (Sec 10) | AUSENTE | No existe search_catalog, get_price, create_order, handoff. Solo existe chat genérico. |
| 5 | **Memoria ELIANA** (Sec 11) | PARCIAL | Memoria en localStorage (zafiro_eliana_memory). Sin separación empresarial/educativa/espiritual, sin consentimiento. |
| 6 | **Políticas ELIANA** (Sec 5, 6) | AUSENTE | No hay motor de políticas. No hay control de riesgo por intención. |
| 7 | **Human Handoff** (Sec 6, 7) | AUSENTE | No existe PERSONA/DON MIGUEL, cola de operadores ni creación de casos. |
| 8 | **Evaluación ELIANA** (Sec 13) | AUSENTE | No hay tests de precisión, groundedness, CSAT. 0 tests automatizados. |
| 9 | **ZAFIRO Login/Auth** (Sec 28) | PARCIAL | Auth localStorage con SHA-256. Sin Supabase Auth, sin MFA, sin RBAC, sin sesiones seguras. |
| 10 | **ZAFIRO Feed** (Sec 17, 31) | PARCIAL | Feed de preguntas mock con filtros. Sin personalización real, sin búsqueda semántica. |
| 11 | **ZAFIRO Preguntas** (Sec 18) | PARCIAL | Crear preguntas persiste localStorage. Sin estados DRAFT→PUBLISHED→AI_ANSWERED→EXPERT_REVIEW→CANONICALIZED. |
| 12 | **ZAFIRO Respuestas** (Sec 18) | PARCIAL | Respuestas mock con votos. Sin validación de expertos, sin resúmenes canónicos. |
| 13 | **ZAFIRO Perfiles/Reputación** (Sec 19) | PARCIAL | Perfiles con datos mock. Sin reputación por dominio, sin eventos positivos/negativos. |
| 14 | **ZAFIRO Moderación** (Sec 20) | AUSENTE | Sin filtros de spam, colas de revisión, reportes, apelaciones. |
| 15 | **ZAFIRO Comunidades** (Sec 17) | PARCIAL | Mock de comunidades. Sin CRUD real, sin roles, sin visibilidad. |
| 16 | **ZAFIRO Búsqueda** (Sec 17) | AUSENTE | Sin búsqueda semántica ni por palabras clave real. Solo filtros de categoría. |
| 17 | **ZAFIRO Notificaciones** (Sec 17) | PARCIAL | Mock estático de 2 notificaciones. Sin sistema de notificaciones push. |
| 18 | **ZAFIRO Membresías/Sponsors** (Sec 17) | PARCIAL | StripeModal solo confirmación. Sin suscripciones reales. |
| 19 | **Integración ELIANA+ZAFIRO** (Sec 24) | PARCIAL | ELIANA responde en chat y en preguntas (isAi). Sin eventos question.created/ai_answer.created. |
| 20 | **Integración MSM Marketplace** (Sec 25) | AUSENTE | No existe consulta de catálogo, disponibilidad ni APIs de Marketplace. |
| 21 | **APIs REST** (Sec 26) | AUSENTE | Solo existe POST /api/chat. No existe /api/v1/questions, /api/v1/profiles, etc. |
| 22 | **Eventos de Dominio** (Sec 27) | AUSENTE | No hay sistema de eventos. No existe user.created, question.created, etc. |
| 23 | **RBAC/ABAC** (Sec 28) | AUSENTE | Sin roles, sin permisos, sin RLS. |
| 24 | **Seguridad IA** (Sec 29) | AUSENTE | Sin defensa contra prompt injection, sin validación de herramientas, sin límites de costo/tokens. |
| 25 | **WhatsApp Business** (Sec 12) | AUSENTE | No hay webhook, plantillas, opt-in/opt-out. |
| 26 | **MSM Payments** (Fin. Ecosystem) | AUSENTE | No hay Stripe/PayPal/Global Payments activo. |
| 27 | **MSM Wallet & Ledger** (Fin. Ecosystem) | AUSENTE | No existe ledger, saldos, ni billetera multidivisa. |
| 28 | **Smart ATM** (Fin. Ecosystem) | AUSENTE | No existe simulador ni integración ATM. |
| 29 | **KYC/KYB** (Fin. Ecosystem) | AUSENTE | No hay verificación de identidad. |
| 30 | **CI/CD** (Sec 33) | AUSENTE | No hay GitHub Actions, tests automatizados ni despliegue. |
| 31 | **Observabilidad** (Sec 34) | AUSENTE | No hay logs JSON, métricas, trazas ni alertas. Solo console.error. |
| 32 | **PWA** (Sec 14) | PARCIAL | manifest.json existe. Sin service worker, sin caché offline, sin notificaciones push. |
| 33 | **i18n** (Sec 5) | AUSENTE | Solo español. ELIANA detecta inglés vía keywords pero no hay i18n framework. |
| 34 | **Testing** (Sec 13, 36) | AUSENTE | 0 tests. Sin Vitest, Playwright, ni pruebas de seguridad. |

---

## 2. DIFERENCIAS CLAVE: ARQUITECTURA ACTUAL vs OBJETIVO

### Arquitectura actual (real)
```
[Browser]
  └─ Next.js Client Components (100% 'use client')
       ├─ localStorage (17 keys) — única "base de datos"
       ├─ Mock data (zafiro-data.ts, comentarios.ts)
       ├─ ELIANA engine (6 módulos cliente)
       └─ POST /api/chat → Gemini o fallback keyword
```

### Arquitectura objetivo (especificación)
```
[Browser/PWA/WhatsApp]
  ├─ Next.js (SSR + RSC donde aplique)
  │    ├─ Gateway de conversación → Orquestador → Herramientas autorizadas
  │    ├─ PostgreSQL (Supabase) con RLS
  │    ├─ Redis para caché/sesiones
  │    ├─ Colas async (embeddings, moderación, notificaciones)
  │    ├─ APIs REST (14 endpoints mínimos)
  │    ├─ Eventos de dominio (13+ tipos)
  │    ├─ RBAC/ABAC con MFA
  │    └─ Observabilidad completa
  ├─ WhatsApp Business API (webhook + plantillas)
  │    └─ Human handoff con cola de operadores
  └─ Integración MSM Marketplace (solo APIs, sin tablas directas)
```

**Brecha fundamental:** El proyecto actual es un **frontend SPA con localStorage**; la especificación describe un **ecosistema backend completo con microservicios, PostgreSQL, eventos, IA orquestada, y cumplimiento regulatorio**.

---

## 3. RIESGOS CRÍTICOS

| # | Riesgo | Severidad | Descripción | Módulo Afectado |
|---|---|---|---|---|
| R1 | **Sin autenticación server-side** | 🔴 CRÍTICO | localStorage es modificable por el usuario. Cualquier "usuario" puede falsificar su sesión, nombre, email, ID. | auth.ts |
| R2 | **Sin base de datos persistente** | 🔴 CRÍTICO | localStorage tiene límite ~5-10MB. Todo se pierde al borrar datos del navegador. Sin backups, sin migraciones. | Todos |
| R3 | **Sin RLS ni permisos** | 🔴 CRÍTICO | Cualquier página client-side puede leer cualquier dato. No hay separación entre datos de usuario A y B. | Todos |
| R4 | **API route sin autenticación** | 🟠 ALTO | POST /api/chat no verifica identidad. Cualquiera puede llamarlo (rate limit es la única protección). | api/chat |
| R5 | **ELIANA sin control de políticas** | 🟠 ALTO | El engine ELIANA en cliente no tiene restricciones. Puede inventar precios, disponibilidad, estados. | eliana/ |
| R6 | **Sin manejo de secretos en producción** | 🟠 ALTO | GEMINI_API_KEY se lee de process.env. En cliente, claves expuestas via NEXT_PUBLIC_. Las vars Stripe/Supabase tienen NEXT_PUBLIC_ pero no se usan. | .env, api/chat |
| R7 | **Sin HTTPS en desarrollo** | 🟡 MEDIO | Servidor en localhost:3001 sin HTTPS. Datos de sesión viajan en texto plano. | Servidor dev |
| R8 | **Sin pruebas automatizadas** | 🟡 MEDIO | 0 tests. Cualquier cambio puede romper funcionalidad existente sin detección. | Todo el proyecto |
| R9 | **page.tsx monolítico** | 🟡 MEDIO | ~1086 líneas, 85+ useState, 6 vistas. Imposible de mantener, testear o escalar. | page.tsx |
| R10 | **Sin service worker ni offline** | 🟡 MEDIO | PWA incompleta. Sin soporte offline, sin notificaciones push. | public/manifest.json |

---

## 4. VULNERABILIDADES DE SEGURIDAD

| # | Vulnerabilidad | Tipo | Archivo | Detalle |
|---|---|---|---|---|
| V1 | **Sesión falsificable** | Autenticación | auth.ts:79-87 | getSession() lee localStorage. Usuario puede editar manualmente zafiro_session. |
| V2 | **Registro sin verificación** | Autenticación | auth.ts:42-63 | Cualquier email se registra sin verificación. No hay confirmación de email. |
| V3 | **Sin rate limiting en registro/login** | Autenticación | auth.ts:42,69 | No hay límite de intentos de login. Ataque de fuerza bruta posible. |
| V4 | **Salt fijo en hash** | Criptografía | auth.ts:20 | "zafiro_salt_v1" es fijo y visible en código. Cada contraseña usa el mismo salt. |
| V5 | **Admin sin protección** | Autorización | /admin | No hay verificación de rol admin. Cualquier usuario logueado (o no) puede ver /admin. |
| V6 | **API sin auth** | Autorización | api/chat/route.ts | POST /api/chat no requiere token, API key, ni sesión. |
| V7 | **No hay sanitización de HTML** | XSS | Varias páginas | No se usa dangerouslySetInnerHTML pero tampoco hay sanitización de entradas de usuario. |
| V8 | **Sin Content Security Policy** | HTTP Headers | next.config.ts | No hay CSP configurada. |
| V9 | **Sin rate limiters global** | DoS | api/chat/route.ts | Rate limit solo en /api/chat. Las rutas estáticas no tienen límite (menos riesgo). |
| V10 | **Datos financieros mock expuestos** | Privacidad | StripeModal, memberships | Datos de precios, IDs de productos (price_pro, price_cuba_plus) hardcodeados en cliente. |

---

## 5. PREGUNTAS BLOQUEANTES

1. **¿Cuál es la prioridad real?** ¿Sprint 1 del roadmap (Núcleo ELIANA), Sprint 2 (ZAFIRO MVP), o Fase 1 del Financial Ecosystem (Identity + Wallet demo)?

2. **¿Existe ya una instancia de Supabase configurada?** Las env vars están en .env.example pero sin valores reales. ¿Hay proyecto creado?

3. **¿MSM Marketplace existe como backend real?** La especificación indica que ZAFIRO debe integrarse mediante APIs. ¿Existe ese backend o hay que crearlo?

4. **¿Quién es el equipo de operadores para human handoff?** La especificación menciona PERSONA/DON MIGUEL. ¿Hay operadores reales o es solo mock?

5. **¿Hay requerimientos regulatorios activos?** El Financial Ecosystem menciona KYC/KYB, PCI DSS, licencias. ¿En qué jurisdicción opera y qué regulaciones aplican hoy?

6. **¿Stripe debe integrarse realmente o se pospone?** En S1 se eliminaron los inputs de tarjeta. La especificación dice "Stripe Checkout sin recolectar datos de tarjeta".

7. **¿Hay presupuesto para infraestructura?** El stack objetivo (Supabase Pro, Redis, Vercel Pro, Gemini API, WhatsApp API) tiene costos mensuales.

8. **¿El conocimiento gemológico actual (35 docs) es el conocimiento oficial para RAG?** La especificación Sec 9 requiere metadatos, versiones, fragmentación semántica. ¿Debo enriquecer los docs existentes o partir de cero?

9. **¿Qué canal es prioritario?** ¿Web primero o WhatsApp primero? La especificación los lista como iguales pero el código actual solo tiene web.

10. **¿CD/CI con qué proveedor?** GitHub Actions, Vercel, otro. ¿Hay cuentas creadas?

---

## 6. PLAN DE TRABAJO PRIORIZADO

### Fase 0: Fundación (ahora — no requiere backend)

| # | Tarea | Archivos | Dependencia | Riesgo |
|---|---|---|---|---|
| 0.1 | **Inicializar git + rama `audit-fixes`** | — | — | Ninguno |
| 0.2 | **Mover secrets de NEXT_PUBLIC_ a server-only** donde sea necesario | .env.example, next.config.ts | — | Bajo |
| 0.3 | **Agregar Content Security Policy** | next.config.ts | — | Bajo |
| 0.4 | **Proteger /admin con verificación de sesión** | app/admin/page.tsx | — | Bajo |
| 0.5 | **Agregar rate limiting a login/register** (cliente) | auth.ts | — | Bajo |
| 0.6 | **Dividir page.tsx en vistas separadas** | src/components/views/ | — | Medio — requiere refactor |
| 0.7 | **Agregar service worker básico** | public/sw.js | — | Bajo |
| 0.8 | **Documentar API surface actual** | AUDIT_REPORT.md | — | Ninguno |

### Fase 1: Núcleo ELIANA (requiere Gemini API key)

| # | Tarea | Dependencia | Riesgo |
|---|---|---|---|
| 1.1 | **Implementar RAG real con embeddings** (vector search en cliente o server) | Fase 0 | Medio |
| 1.2 | **Motor de políticas ELIANA** (riesgo por intención, herramientas permitidas/prohibidas) | — | Alto — toca decisiones de diseño |
| 1.3 | **Human handoff** (PERSONA, cola, creación de caso) | — | Medio |
| 1.4 | **Memoria con consentimiento** (separar empresarial/educativa/espiritual) | — | Medio |
| 1.5 | **WhatsApp webhook stub** (endpoint + verificación de firma) | — | Medio |

### Fase 2: ZAFIRO MVP (requiere Supabase)

| # | Tarea | Dependencia | Riesgo |
|---|---|---|---|
| 2.1 | **Migrar auth de localStorage a Supabase Auth** | Fase 0 | Alto — migración de datos |
| 2.2 | **Migrar perfiles a Supabase DB** | 2.1 | Alto |
| 2.3 | **Migrar preguntas/respuestas a Supabase DB** | 2.1 | Alto |
| 2.4 | **Implementar feed real con consultas a DB** | 2.2, 2.3 | Medio |
| 2.5 | **Búsqueda semántica con pgvector** | 2.3 | Medio |
| 2.6 | **Sistema de notificaciones** (push vía Supabase Realtime) | 2.1 | Medio |

### Fase 3: APIs + Integraciones

| # | Tarea | Dependencia | Riesgo |
|---|---|---|---|
| 3.1 | **API REST /api/v1/questions** CRUD | Fase 2 | Medio |
| 3.2 | **API REST /api/v1/profiles** | Fase 2 | Medio |
| 3.3 | **API REST /api/v1/search** | Fase 2 | Medio |
| 3.4 | **Sistema de eventos** (question.created, answer.created, etc.) | Fase 2 | Medio |
| 3.5 | **Integración MSM Marketplace** (APIs de solo lectura) | Fase 2 | Alto — requiere backend Marketplace |

### Fase 4: Financial Ecosystem (requiere aprobación regulatoria)

| # | Tarea | Dependencia | Riesgo |
|---|---|---|---|
| 4.1 | **Stripe Checkout real** (sin datos de tarjeta en frontend) | Fase 2 | Alto |
| 4.2 | **MSM Wallet demo** (ledger de doble entrada mock) | — | Alto |
| 4.3 | **KYC/KYB stub** | 4.1 | Alto |
| 4.4 | **Smart ATM simulador** | 4.2 | Alto |

---

## 7. INVENTARIO DE ARCHIVOS POR ESTADO

### EXISTENTE (funcional completo)

| Archivo | Función |
|---|---|
| src/lib/auth.ts | Auth localStorage con SHA-256 |
| src/lib/profile.ts | CRUD perfiles + seed Miguel |
| src/lib/rewards.ts | PTS, streaks, badges |
| src/lib/referidos.ts | Sistema de referidos |
| src/lib/universo.ts | CRUD plataformas conectadas |
| src/lib/ecosistema.ts | Proyectos ecosistema |
| src/lib/knowledge.ts | Búsqueda keyword en knowledge base |
| src/lib/knowledge-data.ts | 35 docs generados en build time |
| src/lib/zafiro-data.ts | Mock data + helpers persistencia |
| src/lib/comentarios.ts | Comentarios mock |
| src/lib/gemology-data.ts | Datos gemológicos |
| src/lib/gemology-types.ts | Tipos gemológicos |
| src/lib/usePageTitle.ts | Hook document.title |
| src/lib/eliana/engine.ts | Engine ELIANA cliente |
| src/lib/eliana/memory.ts | Memoria ELIANA |
| src/lib/eliana/recommendations.ts | Recomendaciones |
| src/lib/eliana/knowledge.ts | Conocimiento ELIANA |
| src/lib/eliana/analyzers.ts | Analizadores |
| src/lib/eliana/utils.ts | Utilidades |
| src/app/api/chat/route.ts | API chat con fallback |
| public/manifest.json | PWA manifest |
| scripts/generate-knowledge-data.mjs | Build-time data generation |

### PARCIAL (existe pero incompleto vs especificación)

| Archivo | Brecha |
|---|---|
| src/app/page.tsx | Monolítico, sin vistas separadas, sin personalización |
| src/components/ElianaFloatingButton.tsx | Solo chat básico, sin policy engine, sin handoff |
| src/lib/eliana/ | Sin RAG real, sin política de herramientas, sin evaluación |
| src/components/StripeModal.tsx | Solo confirmación, sin Stripe real |
| src/components/SponsorFloatingBar.tsx | Persiste pero sin integración de pagos |
| src/components/BottomNav.tsx | Navegación básica sin roles |
| src/components/Footer.tsx | Footer básico |

### AUSENTE (no existe pero especificado)

| Módulo | Especificación |
|---|---|
| WhatsApp webhook | Sec 12 |
| RAG vectorial | Sec 9 |
| Policy engine | Sec 6, 10 |
| Human handoff | Sec 6, 7 |
| API REST /api/v1/* | Sec 26 |
| Eventos de dominio | Sec 27 |
| Sistema de moderación | Sec 20 |
| Búsqueda semántica | Sec 17 |
| Notificaciones push | Sec 17 |
| Service worker | Sec 14 |
| Tests | Sec 13, 36 |
| CI/CD | Sec 33 |
| Observabilidad | Sec 34 |
| i18n | Sec 5 |
| MFA / RBAC / ABAC | Sec 28 |
| MSM Payments/Wallet | Financial Ecosystem |
| Smart ATM | Financial Ecosystem |
| KYC/KYB | Financial Ecosystem |

---

## 8. DECISIONES ARQUITECTÓNICAS REGISTRADAS (ADR)

### ADR-001: Separación estricta de dominios

**Contexto:** Las especificaciones enfatizan que ZAFIRO, ELIANA, MSM Marketplace, pagos y wallet deben mantener límites de dominio claros.  
**Decisión:** Mantener módulos separados en src/lib/ y src/eliana/. No compartir tablas financieras con datos sociales. Las integraciones serán solo vía eventos y APIs (cuando existan).  
**Estado:** ✅ Implementado parcialmente (módulos separados, pero todos en localStorage compartido).

### ADR-002: localStorage como almacenamiento temporal

**Contexto:** La especificación requiere PostgreSQL como fuente de verdad. Actualmente todo persiste en localStorage.  
**Decisión:** localStorage es aceptable para MVP/demo pero debe migrarse a Supabase antes de producción. Todos los helpers de persistencia están encapsulados (loadState/saveState) para facilitar migración.  
**Estado:** ✅ Helpers listos. Migración pendiente.

### ADR-003: Chat API con Gemini como opción

**Contexto:** La especificación requiere RAG + IA orquestada. Actualmente el chat usa Gemini si hay API key, o fallback keyword-based.  
**Decisión:** Mantener fallback local para demo. La integración Gemini real requiere backend server-side con policy engine.  
**Estado:** ⚠️ Funcional pero sin políticas de seguridad IA.

### ADR-004: Stripe sin PCI data

**Contexto:** La especificación Sec 29 prohíbe recolectar datos de tarjeta en frontend. Cumplimiento PCI DSS.  
**Decisión:** StripeModal eliminó inputs de tarjeta. Se usará Stripe Checkout (redirect) cuando se integre Stripe real.  
**Estado:** ✅ Implementado.

---

## 9. RECOMENDACIONES PARA PRÓXIMA ACCIÓN

Basado en el análisis completo:

**Acción inmediata (sin backend requerido):**
1. ✅ Ya realizadas: S1-S5 (críticos) + I4-I9 (importantes) del sprint anterior
2. Pendiente: Inicializar git + rama `audit-fixes`
3. Pendiente: Proteger /admin con verificación de sesión
4. Pendiente: Agregar CSP en next.config.ts
5. Pendiente: Documentar API surface

**Próximo sprint recomendado:**
- Elegir entre **Fase 1 (ELIANA con políticas+RAG+handoff)** o **Fase 2 (ZAFIRO MVP con Supabase)**
- Recomiendo **Fase 2 primero**: migrar auth a Supabase Auth desbloquea el resto del backend
- Pero si no hay Supabase configurado, comenzar con **Fase 0.6 (dividir page.tsx)** que es puro frontend

**Pregunta al propietario (Miguel):**
¿Cuál es el siguiente hito que necesita desbloquear: (a) ELIANA en WhatsApp, (b) ZAFIRO con login real, (c) Stripe funcional, o (d) dividir page.tsx para poder escalar el desarrollo?

---

*Documento generado por OpenCode como auditoría técnica inicial del ecosistema MSM.*  
*No sustituye revisión legal, financiera o regulatoria.*  
*Próxima acción recomendada: revisar preguntas bloqueantes con el propietario.*
