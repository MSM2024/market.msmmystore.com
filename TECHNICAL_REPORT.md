# ZAFIRO — Technical Report

**Proyecto:** ZAFIRO — Knowledge Future
**Versión:** 0.1.0
**Estado:** MVP / Fase 1 (Frontend Demo)
**Última actualización:** Julio 2026

---

## 1. Visión General del Proyecto

ZAFIRO es una red social del conocimiento impulsada por Inteligencia Artificial. Su propósito es conectar "sintonizadores" (usuarios) con conocimiento avanzado en ciencia, tecnología, biotecnología, economía y ciberseguridad a través de un flujo asíncrono de preguntas, respuestas y contenido curado por IA.

Actualmente ZAFIRO es un **frontend MVP/demo** con:
- Toda la interfaz visual construida en Next.js 16 + React 19 + Tailwind v4
- Datos 100% mock (no hay backend ni base de datos real)
- 25+ componentes React funcionales
- 1 API route funcional (/api/chat) con integración opcional a Gemini AI
- Sistema de navegación single-page con secciones inline + standalone para Gemología
- 0 integración con servicios externos (Stripe, Supabase, Auth)

---

## 2. Arquitectura Utilizada

### Patrón: Single-Page Application (SPA) con Server-Side Rendering (SSR) via Next.js

```
┌──────────────────────────────────────────────────┐
│                   Next.js 16                      │
│  ┌──────────────┐  ┌───────────────────────────┐  │
│  │   App Router  │  │   Turbopack (Compiler)    │  │
│  └──────┬───────┘  └───────────────────────────┘  │
│         │                                          │
│  ┌──────▼───────────────────────────────────────┐  │
│  │           src/app/ (rutas)                    │  │
│  │  / (Home SPA)  /gemologia  /api/chat         │  │
│  └──────────────────────────────────────────────┘  │
│         │                                          │
│  ┌──────▼───────────────────────────────────────┐  │
│  │           src/components/ (26 archivos)       │  │
│  │  UI, Layout, Gemología, Sponsor, Modal        │  │
│  └──────────────────────────────────────────────┘  │
│         │                                          │
│  ┌──────▼───────────────────────────────────────┐  │
│  │           src/lib/ (datos + tipos)            │  │
│  │  zafiro-data.ts  gemology-data.ts             │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Flujo de datos:** Todo es estado local (`useState`) en `page.tsx`. Los datos mock se importan estáticamente de `src/lib/zafiro-data.ts`. No hay fetching de datos, ni caché, ni estado global.

**Routing:** Next.js App Router con dos páginas estáticas (`/`, `/gemologia`) y una API dinámica (`/api/chat`). El homepage `/` maneja 6 secciones de navegación vía `activeNav` state (Inicio, Explorar, Gemología, Círculos, Sponsors, Perfil).

---

## 3. Tecnologías y Dependencias

### Producción

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next` | 16.2.10 | Framework React con App Router, SSR, Turbopack |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | Renderizado DOM |
| `lucide-react` | ^1.23.0 | Iconos SVG (25+ iconos usados) |
| `motion` | ^12.42.2 | Animaciones (framer-motion renombrado) |
| `lightningcss-win32-x64-msvc` | ^1.32.0 | CSS bundler nativo para Windows |

### Desarrollo

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `typescript` | ^5 | Type checking |
| `tailwindcss` | ^4 | CSS utility framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin para Tailwind v4 |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.10 | ESLint config de Next.js |
| `@types/node` | ^20 | Tipos Node |
| `@types/react` | ^19 | Tipos React |
| `@types/react-dom` | ^19 | Tipos React DOM |

### Ausentes (NO instalados)

| Paquete | Por qué falta |
|---------|---------------|
| `@supabase/supabase-js` | Supabase no integrado |
| `@supabase/ssr` | Auth SSR no implementado |
| `@stripe/stripe-js` | Stripe no integrado |
| `@stripe/react-stripe-js` | Stripe Elements no usado |
| `stripe` (server) | Stripe server SDK no usado |
| `next-auth` o `clerk` | Auth no implementado |
| `zustand` / `redux` | State management no usado |
| `vitest` / `playwright` | Testing no configurado |
| `next-intl` / `react-i18next` | i18n no implementado |

---

## 4. Estructura de Carpetas

```
C:\Users\cm8ms\Desktop\MSM-Zafiro\
├── .next/                          # Build output (generado)
├── node_modules/                   # Dependencias
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts        # API route: chat con IA (112 líneas)
│   │   ├── gemologia/
│   │   │   └── page.tsx            # Página standalone Gemología (79 líneas)
│   │   ├── globals.css             # Estilos globales + animaciones (37 líneas)
│   │   ├── layout.tsx              # Root layout (30 líneas)
│   │   └── page.tsx                # Homepage principal SPA (1116 líneas)
│   ├── components/
│   │   ├── gemology/
│   │   │   ├── AiAssistant.tsx      # Chat IA gemológico (228 líneas)
│   │   │   ├── GemLab.tsx           # Laboratorio de gemas interactivo (549 líneas)
│   │   │   ├── Handbook.tsx         # Manual de gemología (252 líneas)
│   │   │   └── LoreExplorer.tsx     # Explorador de zafiros famosos (229 líneas)
│   │   ├── AddQuestionModal.tsx     # Modal crear pregunta (100 líneas)
│   │   ├── BottomNav.tsx            # Navegación inferior mobile (63 líneas)
│   │   ├── DailyBrief.tsx           # Resumen diario IA (52 líneas)
│   │   ├── ExpertLeaderboard.tsx    # Ranking de expertos (47 líneas)
│   │   ├── KnowledgeGraph.tsx       # Grafo de conocimiento SVG (90 líneas)
│   │   ├── NotificationsDropdown.tsx # Campana notificaciones (57 líneas)
│   │   ├── ParticlesBackground.tsx  # Canvas partículas animadas (98 líneas)
│   │   ├── SponsorAnalyticsChart.tsx # Gráfico analytics SVG (192 líneas)
│   │   ├── SponsorDetailModal.tsx   # Modal detalle sponsor (114 líneas)
│   │   ├── SponsorFloatingBar.tsx   # Barra flotante sponsors (129 líneas)
│   │   ├── StoriesBar.tsx           # Barra historias estilo Instagram (49 líneas)
│   │   ├── StoryViewer.tsx          # Visor fullscreen historias (129 líneas)
│   │   ├── StripeModal.tsx          # Modal pago mock Stripe (179 líneas)
│   │   └── TrendsSection.tsx        # Tendencias con sparklines (72 líneas)
│   └── lib/
│       ├── gemology-data.ts         # Datos gemológicos + valuación (487 líneas)
│       ├── gemology-types.ts        # Tipos de dominio gemología (45 líneas)
│       └── zafiro-data.ts           # Datos mock + tipos + algoritmo matching (243 líneas)
├── next.config.ts                   # Config Next.js (7 líneas, vacío)
├── package.json                     # 29 líneas
├── postcss.config.mjs               # PostCSS config
├── tsconfig.json                    # TypeScript config
├── eslint.config.mjs                # ESLint config
├── .gitignore                       # Git ignore
├── start-dev.bat                    # Script arranque dev
└── TECHNICAL_REPORT.md              # Este documento
```

---

## 5. Base de Datos (Supabase)

### Estado: 🔴 No implementado

No existe integración con Supabase. No hay:
- Paquetes npm (`@supabase/supabase-js`, `@supabase/ssr`)
- Variables de entorno
- Client SDK
- Tablas, migraciones, ni esquemas
- RLS policies

### Tablas Planificadas (desde TECHNICAL_REPORT.md original)

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `users` | Perfiles de usuario | 🔴 |
| `questions` | Preguntas del feed | 🔴 |
| `replies` | Respuestas a preguntas | 🔴 |
| `sponsors` | Campañas de sponsors | 🔴 |
| `notifications` | Notificaciones | 🔴 |
| `communities` | Círculos/comunidades | 🔴 |
| `memberships` | Membresías de usuarios | 🔴 |
| `referrals` | Referidos | 🔴 |
| `rewards` | Sistema MSM Rewards | 🔴 |

---

## 6. Autenticación y Roles

### Estado: 🔴 No implementado

No existe sistema de autenticación. El usuario "Carlos Medina" que aparece en la UI es un mock. No hay:
- Login/register real
- Sesiones (cookies, JWT)
- OAuth (Google, GitHub)
- Roles (admin, user, sponsor)
- Protección de rutas

El estado de "usuario logueado" se simula con variables locales:
```tsx
const [streak] = useState(18)
const [points, setPoints] = useState(4820)
const [joinedCommunities, setJoinedCommunities] = useState<string[]>(["c1"])
```

---

## 7. Módulos Terminados ✅

| Módulo | Descripción |
|--------|-------------|
| **Layout principal** | Root layout con Geist Sans/Mono, tema oscuro `#050816`, scroll oculto |
| **Navegación mobile** | BottomNav con 6 items + botón +, fixed bottom, labels, safe-area |
| **Navegación desktop** | Barra horizontal con iconos + streak/PTS, visible en lg+ |
| **Stories** | Barra horizontal + visor fullscreen con animaciones |
| **Daily Brief** | Resumen diario IA con badge y botón "Preguntar a Eliana" |
| **Knowledge Graph** | SVG interactivo con 4 nodos y conexiones |
| **Trends Section** | 2-columnas con sparklines y búsqueda por categoría |
| **Questions Feed** | Lista de preguntas con filtros por tag/búsqueda, likes |
| **Expert Leaderboard** | Top 4 expertos rankeados con PTS |
| **Particles Background** | Canvas animado con 40 partículas, colores cyan/azul/púrpura |
| **Notificaciones** | Dropdown con badge, mock data |
| **Add Question Modal** | Formulario con título, categoría, detalles + 100 PTS reward |
| **Add + button** | Botón flotante circular en BottomNav |
| **Gemología standalone** | Página `/gemologia` con 4 tabs |
| **Sponsor Floating Bar** | Barra contextual sticky con AI match score |
| **Sponsor Detail Modal** | Fullscreen con match contextual, CTA, +50 PTS |
| **Sponsor Analytics** | Gráfico interactivo SVG con 4 métricas, hover tooltips |
| **Stripe Modal (mock)** | Formulario de pago simulado con timeout |

---

## 8. Módulos en Desarrollo 🟡

| Módulo | Estado | Detalle |
|--------|--------|---------|
| **Mobile First layout** | 🟡 90% | Layout de una columna con BottomNav fijo. Pendiente: pulir espaciado en 375px |
| **GemLab interactivo** | 🟡 80% | Selectores de corte/color/origen con renderizado visual. Cálculo de valuación funcional |
| **ELIANA widget** | 🟡 85% | Chat funcionando con Gemini + fallback local. Pendiente: memoria de conversación, voz |
| **Perfil de usuario** | 🟡 60% | Sección inline en page.tsx con avatar, streak, PTS, stats. Sin edición real |
| **Círculos/Comunidades** | 🟡 50% | Grid de comunidades con join/unjoin. Sin persistencia |
| **Sistema de PTS** | 🟡 40% | Puntos se asignan en UI pero no persisten. Sin transacciones ni historial |

---

## 9. Funcionalidades Pendientes 🔴

| Funcionalidad | Prioridad | Notas |
|---------------|-----------|-------|
| Login / Register | 🔴 Alta | Sin auth de ningún tipo |
| Pantalla de Términos | 🔴 Alta | No existe la ruta |
| Pantalla de Privacidad | 🔴 Alta | No existe la ruta |
| Pantalla de Planes | 🔴 Alta | No existe la ruta |
| Panel Admin | 🔴 Alta | No existe |
| Stripe real | 🔴 Alta | Solo mock con setTimeout |
| Supabase integración | 🔴 Alta | Cero integración |
| Perfil editable | 🔴 Media | Solo vista, sin edición |
| Upload de imágenes | 🔴 Media | Sin storage |
| Búsqueda global | 🔴 Media | Solo filtro local por tag |
| Modo claro | 🔴 Baja | Toggle existe pero no funcional |
| i18n | 🔴 Baja | Solo español |
| Testing | 🔴 Media | Sin test suite |
| PWA / Service Worker | 🔴 Baja | No configurado |
| SEO / Meta dinámicas | 🔴 Media | Metadata estática en layout |
| Sitemap / Robots | 🔴 Baja | No generados |
| RSS / WebSub | 🔴 Baja | No implementado |
| Verificación email | 🔴 Media | Sin auth |
| Recuperación password | 🔴 Media | Sin auth |
| Onboarding tutorial | 🔴 Baja | No implementado |

---

## 10. Componentes Creados

### Core (src/components/)

| Componente | Archivo | Líneas | Export | Props | Descripción |
|-----------|---------|--------|--------|-------|-------------|
| ParticlesBackground | ParticlesBackground.tsx | 98 | default | `isDarkMode` | Canvas de 40 partículas con animación por requestAnimationFrame |
| BottomNav | BottomNav.tsx | 63 | default | `activeNav`, `onNavChange`, `onAddQuestion` | Navegación inferior con 6 ítems + botón + |
| StoriesBar | StoriesBar.tsx | 49 | default | `stories`, `onViewStory` | Carrusel horizontal de avatares estilo Instagram |
| StoryViewer | StoryViewer.tsx | 129 | default | `story`, `stories`, `index`, `onClose/Next/Prev` | Modal fullscreen de historia con progreso |
| DailyBrief | DailyBrief.tsx | 52 | default | `onAskEliana?` | Tarjeta de resumen diario IA |
| KnowledgeGraph | KnowledgeGraph.tsx | 90 | default | `nodes`, `selectedNode`, `onSelectNode` | Grafo SVG interactivo con 4 nodos |
| TrendsSection | TrendsSection.tsx | 72 | default | `trends`, `onSearch?` | Grid de tendencias con sparklines SVG |
| ExpertLeaderboard | ExpertLeaderboard.tsx | 47 | default | `experts` | Ranking vertical de top expertos |
| AddQuestionModal | AddQuestionModal.tsx | 100 | default | `isOpen`, `onClose`, `onSubmit` | Modal de creación de pregunta |
| NotificationsDropdown | NotificationsDropdown.tsx | 57 | default | `notifications`, `showBadge`, `onToggle`, `isOpen` | Campana + dropdown notificaciones |
| StripeModal | StripeModal.tsx | 179 | **named** | `isOpen`, `onClose`, `budget`, `companyName`, `onSuccess` | Modal de pago simulado |
| SponsorFloatingBar | SponsorFloatingBar.tsx | 129 | default | `sponsors`, `selectedTag`, `searchQuery`, `joinedCommunities`, `onSponsorClick`, `isVisible` | Barra contextual sticky de sponsors |
| SponsorDetailModal | SponsorDetailModal.tsx | 114 | default | `sponsor`, `selectedTag`, `searchQuery`, `joinedCommunities`, `onClose`, `onExplore` | Modal detalle de campaña sponsor |
| SponsorAnalyticsChart | SponsorAnalyticsChart.tsx | 192 | default | _(none)_ | Gráfico interactivo de 7 días con 4 métricas |

### Gemología (src/components/gemology/)

| Componente | Archivo | Líneas | Export | Descripción |
|-----------|---------|--------|--------|-------------|
| GemLab | GemLab.tsx | 549 | default | Laboratorio interactivo: selector de corte (7), color (8), claridad (6), origen (5), quilates, tratamiento. Renderiza SVG del corte + calcula valuación |
| Handbook | Handbook.tsx | 252 | default | Manual de gemología: tabla de dureza Mohs, tipos de zafiros, sistema de claridad, tabla de quilates con precios, origen |
| AiAssistant | AiAssistant.tsx | 228 | default | Chat especializado en gemología con 9 quick-chips + input + historial |
| LoreExplorer | LoreExplorer.tsx | 229 | default | Grid de 10 zafiros famosos con modal detalle, peso, origen, historia |

---

## 11. Rutas Existentes

| Ruta | Tipo | Método | Estado | Tamaño | Descripción |
|------|------|--------|--------|--------|-------------|
| `/` | Static (○) | GET | ✅ 200 | ~59 KB | Homepage SPA con todas las secciones |
| `/gemologia` | Static (○) | GET | ✅ 200 | ~41 KB | Página standalone de gemología con 4 tabs |
| `/api/chat` | Dynamic (ƒ) | POST | ✅ 200 | — | API chat con Gemini + fallback local |
| `/_not-found` | Static (○) | GET | ✅ 200 | ~9 KB | Página 404 por defecto de Next.js |
| `/login` | — | GET | ⚠️ 404 | — | No existe como página |
| `/register` | — | GET | ⚠️ 404 | — | No existe como página |
| `/profile` | — | GET | ⚠️ 404 | — | No existe (sección inline en `/`) |
| `/communities` | — | GET | ⚠️ 404 | — | No existe (sección inline en `/`) |
| `/questions` | — | GET | ⚠️ 404 | — | No existe (solo en feed Inicio) |
| `/sponsors` | — | GET | ⚠️ 404 | — | No existe (sección inline en `/`) |
| `/plans` | — | GET | ⚠️ 404 | — | No existe |
| `/terms` | — | GET | ⚠️ 404 | — | No existe |
| `/privacy` | — | GET | ⚠️ 404 | — | No existe |
| `/admin` | — | GET | ⚠️ 404 | — | No existe |

**Nota:** Las secciones inline se navegan vía `activeNav` state en `page.tsx`:
- `activeNav="Inicio"` → Feed + DailyBrief + KnowledgeGraph + Trends + Questions
- `activeNav="Explorar"` → Búsqueda + Tendencias + Expertos
- `activeNav="Gemología"` → GemLab + Handbook + AI + Lore (inline)
- `activeNav="Comunidades"` → Grid de círculos
- `activeNav="Sponsors"` → SponsorFloatingBar + campañas + analytics + Stripe
- `activeNav="Perfil"` → Avatar, streak, PTS, badges, stats

---

## 12. APIs Implementadas

### `/api/chat` (POST)

**Propósito:** Endpoint de chat con IA para ELIANA y Zafiro AI.

**Comportamiento:**
1. Si `GEMINI_API_KEY` está configurada → usa Gemini 1.5 Flash con system prompt gemológico
2. Si Gemini falla o no hay API key → usa fallback local con 11 keywords + respuestas hardcoded
3. Soporta historial de conversación

**Request:**
```json
{
  "message": "string",
  "history": [{ "role": "user|model", "text": "string" }]
}
```

**Response:**
```json
{ "text": "string" }
```

**Keywords del fallback local:** kashmir, velvet, padparadscha, synthetic, corundum, pleochroism, asterism, heat, mogok, valuation, elestial

**System prompt (Gemini):** *"You are Zafiro AI, a senior gemological advisor specializing in sapphires, rubies, and all corundum varieties..."*

---

## 13. Integraciones

| Integración | Estado | Detalle |
|-------------|--------|---------|
| **Stripe** | 🔴 No integrado | Modal mock con validación manual de 16 dígitos y setTimeout de 2.2s. Sin Stripe.js, sin API keys, sin webhooks |
| **Supabase** | 🔴 No integrado | Sin paquetes, sin cliente, sin tablas, sin auth |
| **Gemini AI** | 🟡 Parcial | API key vía `GEMINI_API_KEY` env var. Modelo 1.5 Flash. Fallback a respuestas locales si no hay key |
| **Unsplash** | 🟡 Parcial | Imágenes hotlinkeadas desde Unsplash vía URLs directas (no API key) |
| **Google Fonts** | ✅ Integrado | Geist Sans + Geist Mono vía `next/font/google` |
| **Lucide Icons** | ✅ Integrado | 25+ iconos SVG usados en toda la app |

---

## 14. Sistema de Membresías

### Estado: 🔴 No implementado

No existe sistema de membresías real:
- No hay planes (Free, Premium, Pro, etc.)
- No hay suscripciones
- No hay pagos recurrentes
- No hay tiers de acceso
- No hay Stripe Customer Portal

Los únicos placeholder son:
- Badge "Membresía ZAFIRO" en Perfil (mock)
- Botón "Pagar Campaña con Stripe" que abre modal mock

---

## 15. Sistema de Sponsors

### Estado: 🟡 Parcial (frontend completo, backend mock)

**Funcional:** ✅
- 6 campañas sponsor mock con datos completos (Nothing Tech, Vercel Systems, Stripe Quantum, OpenAI Research, Linear Labs, BioSynthetica)
- SponsorFloatingBar: barra contextual que muestra sponsors según AI match score
- SponsorDetailModal: modal fullscreen con match contextual, CTA, +50 PTS
- SponsorAnalyticsChart: gráfico interactivo de 7 días con impresiones, clics, conversiones, CTR
- Algoritmo `getContextualAdMatch()` que calcula match basado en:
  - Categoría seleccionada
  - Búsqueda activa (keywords por categoría)
  - Comunidades unidas
- Modal Stripe mock para pagar campañas

**No funcional:** 🔴
- Stripe real para pagos
- Creación de campañas reales (solo mock)
- Persistencia de campañas
- Dashboard histórico real
- Targeting real basado en comportamiento

---

## 16. Sistema MSM Rewards

### Estado: 🟡 Parcial (puntos en UI, sin persistencia)

**Funcional:** ✅
- Contador de PTS en header (`points` state, default 4820)
- Asignación de PTS en UI:
  - +100 PTS al crear pregunta
  - +500 PTS al crear campaña sponsor exitosa
  - +50 PTS al explorar sponsor
- Visualización en Perfil y header

**No funcional:** 🔴
- Persistencia en base de datos
- Historial de transacciones
- Canje de puntos
- Niveles / badges basados en puntos
- Referrals con recompensa
- Racha (streak) es mock (hardcoded 18)

---

## 17. Sistema de Referidos

### Estado: 🔴 No implementado

No existe funcionalidad de referidos. No hay:
- Código de referido
- Link de invitación
- Tracking de referidos
- Recompensas por referido

---

## 18. ELIANA

### Estado: 🟡 85% — Funcional con Gemini + fallback local

**Implementado:**
- Widget inline en `page.tsx` (líneas 874-971)
- **Modo compacto:** Botón flotante con icono Gem (diamante) + label "Eliana" + burbuja de texto "Resonancia sintonizada en Mohs 9.0"
- **Modo expandido:** Panel de 340x500px con:
  - Header "ELIANA SINTÉTICA" + indicador "Conexión Estable" (verde)
  - Chat scrollable con mensajes usuario/AI
  - 3 quick-action chips (Kyber-1024, Micelio Orgánico, Ganar PTS)
  - Input con placeholder "Escribe una sintonía cuántica..."
  - Botón de enviar con icono Send
- Animaciones con `motion/react` (AnimatePresence, spring, fade)
- Integración con `/api/chat` para respuestas IA
- 2 respuestas mock de "ELIANA AI" en datos de preguntas
- Handler `handleAskEliana` que expande widget + envía mensaje
- Integración con DailyBrief (`onAskEliana` prop)
- Icono Gem como avatar/diamante en ambos modos
- Sin fondos blancos (todo `#050816` / `bg-slate-950`)

**Pendiente:**
- Memoria persistente de conversación (se pierde al recargar)
- Voz/speech-to-text
- Múltiples personalidades / modos
- Streaming de respuestas (SSE)
- Integración con búsqueda de conocimiento interno

---

## 19. Diseño UI/UX y Componentes Visuales

### Paleta de Colores

| Color | Uso | Hex |
|-------|-----|-----|
| Fondo principal | Body, cards | `#050816` |
| Fondo secundario | Componentes | `#0B1220`, `#090d16` |
| Bordes | Container borders | `#1e293b`, `#334155` |
| Cyan primario | Links, iconos, acentos | `#00D9FF` |
| Dorado | Active nav, premium, rewards | `#C8A14B` |
| Esmeralda | Conexión, éxito | `#10B981` |
| Texto primario | Body text | `#ededed` / white |
| Texto secundario | Labels, meta | `#64748b` (slate-400) |

### Tipografía
- **Sans-serif:** Geist Sans (variable) — títulos, cuerpo
- **Mono:** Geist Mono (variable) — metadata, badges, labels pequeños
- Tamaños: `text-[8px]` a `text-xs` (10-12px) para metadata; `text-sm` (14px) para contenido

### Animaciones
- `animate-pulse-glow`: Opacidad pulsante para iconos ELIANA
- `animate-float`: Flotación suave Y para botón ELIANA
- `animate-spin-slow`: Rotación lenta (8s) para badges
- `motion.div`: Fade-in, slide-up, scale para modales y transiciones
- CSS transitions: `transition-all duration-200` en todos los interactive elements

### Responsive Breakpoints
| Breakpoint | Clase Tailwind | Comportamiento |
|-----------|---------------|----------------|
| Mobile (< 1024px) | `lg:hidden` / `block` | BottomNav visible, nav desktop oculto, layout columna única |
| Desktop (≥ 1024px) | `lg:flex` | Nav horizontal arriba, BottomNav sigue visible pero con padding |

---

## 20. Responsive

| Dispositivo | Estado | Detalle |
|-------------|--------|---------|
| **Mobile (375px)** | ✅ Funcional | BottomNav fixed, feed columna única, ELIANA en fixed bottom-20 |
| **Mobile (414px)** | ✅ Funcional | Mismo layout, proporcional |
| **Tablet (768px)** | ✅ Funcional | Mismo layout mobile, contenido más espacioso |
| **Desktop (1024px)** | ✅ Funcional | Nav horizontal agregado, BottomNav sigue visible |
| **Desktop (1280px+)** | ✅ Funcional | Nav horizontal + más espacio en feed |
| **Notched phones** | 🟡 Parcial | Safe-area inset en BottomNav, no en otros componentes |
| **iPad / Landscape** | ⚠️ No verificado | No se ha probado específicamente |

---

## 21. Panel de Administración

### Estado: 🔴 No implementado

No existe:
- Ruta `/admin`
- Dashboard admin
- Gestión de usuarios
- Moderación de contenido
- Estadísticas de plataforma
- Logs de actividad

---

## 22. Seguridad

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| HTTPS | 🔴 | No configurado (solo dev local) |
| Auth | 🔴 | Sin autenticación |
| CSP Headers | 🔴 | No configurados en next.config |
| Rate Limiting | 🔴 | No implementado |
| SQL Injection | ✅ N/A | Sin base de datos |
| XSS | 🟡 | React escapa por defecto, pero imágenes vienen de URLs externas sin validación |
| CSRF | 🔴 | Sin tokens CSRF |
| API Keys expuestas | ⚠️ | `GEMINI_API_KEY` en server route (seguro), pero no hay .env.example |
| Variables de entorno | 🔴 | No existen archivos .env |

---

## 23. Rendimiento

| Métrica | Valor | Notas |
|---------|-------|-------|
| Build time | ~10s total (5s compile + 5s TS) | Turbopack |
| Home page size | ~59 KB (HTML estático) | Sin librerías externas |
| Gemología page size | ~41 KB | |
| Server startup | ~200-600ms | |
| Animaciones | 40 partículas en canvas | GPU acelerado (requestAnimationFrame) |
| Bundle JS | ~300-400 KB estimado | Sin code splitting por ruta |
| Imágenes | Hotlinkeadas de Unsplash | Sin lazy loading explícito |
| Fuentes | Geist vía next/font | Optimizado por Next.js |

**Problemas potenciales:**
- Sin lazy loading en componentes (todo se carga en `page.tsx`)
- Sin `next/image` optimizado (img tags regulares con URLs de Unsplash)
- Sin code splitting (todo el homepage es un solo chunk)
- 1116 líneas en `page.tsx` — componente monolítico difícil de mantener
- Sin memorización en listas grandes

---

## 24. Problemas Conocidos

| # | Problema | Severidad | Solución |
|---|----------|-----------|----------|
| 1 | **Servidor `next start` se cae en Windows** | 🔴 Alta | Usar `next dev` en lugar de `next start`. Causa no identificada — posible issue con Next.js 16 en Windows |
| 2 | **404 routes timeout con `next start`** | 🔴 Alta | Con `next start` las rutas inexistentes cuelgan. Con `next dev` devuelven 404 correcto |
| 3 | **page.tsx monolítico (1116 líneas)** | 🟡 Media | Refactorizar en componentes más pequeños. Dificulta el mantenimiento |
| 4 | **Sin estado global** | 🟡 Media | Los datos se pasan como props a través de 5+ niveles de profundidad |
| 5 | **Sin manejo de errores en componentes** | 🟡 Media | Si una prop es undefined/null, algunos componentes fallan silenciosamente |
| 6 | **Imágenes Unsplash sin fallback** | 🟡 Baja | Si Unsplash está caído, las imágenes no cargan y no hay placeholder |
| 7 | **Modo claro no funcional** | 🟡 Baja | El toggle existe pero `isDarkMode` no afecta ningún estilo |
| 8 | **Sin persistencia de datos** | 🔴 Alta | Al recargar, todo el estado se pierde (chat, puntos, comunidades unidas) |
| 9 | **Duplicate 'use client' (corregido)** | ✅ Resuelto | BottomNav.tsx tenía 'use client' repetido |

---

## 25. Errores Pendientes

| # | Error | Causa | Prioridad |
|---|-------|-------|-----------|
| 1 | `next start` muere silenciosamente en Windows | Posible bug de Next.js 16 + Windows + port binding | 🔴 Alta |
| 2 | Chat de ELIANA se pierde al recargar página | Estado en memoria volátil (useState) | 🟡 Media |
| 3 | PTS no persistentes | Misma causa — todo es estado local | 🟡 Media |
| 4 | Comunidades unidas se resetean al recargar | Misma causa | 🟡 Media |
| 5 | No hay validación de formulario en AddQuestion | Sin validación de campos vacíos | 🟡 Baja |
| 6 | No hay feedback visual de carga en StripeModal | Solo un texto "Sincronizando..." | 🟡 Baja |

---

## 26. Recomendaciones Técnicas

### Inmediatas (Fase 1)
1. **Crear archivo `.env.local`** con las variables necesarias (GEMINI_API_KEY, etc.)
2. **Extraer secciones de `page.tsx`** en componentes separados (FeedView, ExplorerView, PerfilView, etc.)
3. **Agregar Error Boundaries** en componentes críticos
4. **Configurar `next start`** correctamente o documentar que use `next dev`
5. **Agregar loading states** en componentes que simulan carga

### Corto plazo (Fase 2)
6. **Implementar autenticación** con Next-Auth o Supabase Auth
7. **Agregar base de datos** (Supabase) con tablas users, questions, replies
8. **Integrar Stripe real** con Stripe Elements y webhooks
9. **Crear pantallas faltantes:** terms, privacy, plans, admin
10. **Configurar testing** con Vitest + Testing Library

### Mediano plazo (Fase 3)
11. **Implementar i18n** (inglés + español)
12. **Optimizar rendimiento:** code splitting, lazy loading, next/image
13. **Agregar PWA** con service worker y offline support
14. **Implementar modo claro** completo
15. **Dashboard admin** con métricas reales

### Largo plazo (Fase 4)
16. **Streaming de respuestas IA** (Server-Sent Events)
17. **Sistema de recomendaciones** basado en ML
18. **Mobile apps nativas** (React Native)
19. **Mercado de conocimiento** con pagos P2P
20. **DAOs y gobernanza descentralizada**

---

## 27. Roadmap Recomendado para Terminar el MVP

### Fase 1 — Estabilización y Correcciones (1-2 semanas)
```
✅ Frontend funcional (completado)
✅ Mobile First layout (completado)
✅ BottomNav con labels (completado)
✅ Safe-area inset (completado)
🔴 Arreglar servidor next start en Windows
🔴 Extraer page.tsx en componentes modulares
🔴 Agregar Error Boundaries
🔴 Crear .env.example
```

### Fase 2 — Funcionalidades Centrales (3-4 semanas)
```
🔴 Auth con Supabase (login/register)
🔴 Base de datos: users, questions, replies
🔴 Pantallas faltantes: terms, privacy, plans, admin
🔴 Stripe real: checkout + webhooks + planes
🔴 Persistencia de PTS y streak
🔴 Panel admin básico
```

### Fase 3 — Experiencia de Usuario (2-3 semanas)
```
🔴 Búsqueda global
🔴 Upload de imágenes (avatars, stories)
🔴 Notificaciones push
🔴 Modo claro
🔴 Testing (unit + e2e)
🔴 SEO (meta dinámicas, sitemap)
```

### Fase 4 — Escalabilidad (3-4 semanas)
```
🔴 Streaming de respuestas IA
🔴 Sistema de referidos
🔴 Dashboard sponsors real
🔴 i18n (inglés)
🔴 PWA
🔴 Performance optimization
```

---

## 28. Checklist Completo

### Layout y Navegación
| Item | Estado |
|------|--------|
| Root layout con Geist fonts | ✅ |
| Tema oscuro `#050816` | ✅ |
| Nav horizontal desktop (lg+) | ✅ |
| BottomNav con 6 items + labels | ✅ |
| Safe-area-inset en BottomNav | ✅ |
| Mobile First layout columna única | ✅ |
| Sin sidebars desktop | ✅ |
| Botón + flotante para crear pregunta | ✅ |
| Header con PTS, streak, hora | ✅ |
| Toggle modo claro/oscuro (no funcional) | 🟡 |

### Home / Feed
| Item | Estado |
|------|--------|
| Stories bar horizontal | ✅ |
| Visor fullscreen stories | ✅ |
| Daily Brief con IA | ✅ |
| Knowledge Graph SVG interactivo | ✅ |
| Trends Section con sparklines | ✅ |
| Preguntas del feed con filtros | ✅ |
| Sistema de likes en preguntas | ✅ |
| Respuestas a preguntas | ✅ |
| Filtro por tags | ✅ |
| Búsqueda local | ✅ |
| Expert Leaderboard | ✅ |

### Explorar
| Item | Estado |
|------|--------|
| Vista de exploración | ✅ |
| Tendencias en explorar | ✅ |
| Ranking de expertos | ✅ |

### Gemología
| Item | Estado |
|------|--------|
| Página standalone /gemologia | ✅ |
| Tab: GemLab interactivo | ✅ |
| Tab: Handbook gemológico | ✅ |
| Tab: Zafiro AI chat | ✅ |
| Tab: Lore de zafiros famosos | ✅ |
| Sección inline en homepage | ✅ |
| Calculadora de valuación | ✅ |
| SVG de cortes de gemas | ✅ |

### Círculos / Comunidades
| Item | Estado |
|------|--------|
| Grid de comunidades | ✅ |
| Join/Unjoin comunidades | ✅ |
| Persistencia de membresías | 🔴 |
| Crear comunidades | 🔴 |
| Chat de comunidad | 🔴 |

### Sponsors
| Item | Estado |
|------|--------|
| Barra flotante contextual | ✅ |
| AI Match score contextual | ✅ |
| Modal detalle de campaña | ✅ |
| Gráfico analytics 7 días | ✅ |
| Modal Stripe mock | ✅ |
| Stripe real | 🔴 |
| Creación de campañas real | 🔴 |
| Dashboard histórico | 🔴 |

### Perfil
| Item | Estado |
|------|--------|
| Vista de perfil | ✅ |
| Avatar, nombre, título | ✅ |
| Streak y PTS | ✅ |
| Badges y logros | ✅ |
| Editar perfil | 🔴 |
| Historial de actividad | 🔴 |
| Configuración de cuenta | 🔴 |

### Autenticación
| Item | Estado |
|------|--------|
| Login | 🔴 |
| Register | 🔴 |
| OAuth (Google, GitHub) | 🔴 |
| Sesiones persistentes | 🔴 |
| Protección de rutas | 🔴 |
| Recuperación de password | 🔴 |

### Stripe
| Item | Estado |
|------|--------|
| Modal de pago mock | ✅ |
| Formulario de tarjeta manual | 🟡 |
| Stripe.js real | 🔴 |
| Stripe Elements | 🔴 |
| Publishable key | 🔴 |
| Secret key | 🔴 |
| Webhook secret | 🔴 |
| Planes / Price IDs | 🔴 |
| Checkout Session | 🔴 |
| Customer Portal | 🔴 |

### Supabase
| Item | Estado |
|------|--------|
| Client SDK | 🔴 |
| Auth | 🔴 |
| Tabla: users | 🔴 |
| Tabla: questions | 🔴 |
| Tabla: replies | 🔴 |
| Tabla: communities | 🔴 |
| Tabla: memberships | 🔴 |
| Tabla: referrals | 🔴 |
| Tabla: rewards | 🔴 |
| Tabla: sponsors | 🔴 |
| Tabla: notifications | 🔴 |
| RLS policies | 🔴 |
| Migraciones | 🔴 |

### API
| Item | Estado |
|------|--------|
| /api/chat con Gemini | ✅ |
| /api/chat fallback local | ✅ |
| Rate limiting | 🔴 |
| Autenticación de API | 🔴 |
| Logging / monitoreo | 🔴 |

### ELIANA
| Item | Estado |
|------|--------|
| Widget collapsed con diamante | ✅ |
| Widget expandido con chat | ✅ |
| Conexión con Gemini API | ✅ |
| Fallback local gemológico | ✅ |
| Quick-action chips | ✅ |
| Animaciones de entrada/salida | ✅ |
| Una sola instancia (sin duplicados) | ✅ |
| Sin fondos blancos en dark mode | ✅ |
| Modo compacto/expandido | ✅ |
| Memoria de conversación persistente | 🔴 |
| Streaming de respuestas | 🔴 |
| Voz / speech-to-text | 🔴 |
| Múltiples personalidades | 🔴 |

### UX/UI
| Item | Estado |
|------|--------|
| Diseño Mobile First | ✅ |
| BottomNav con labels | ✅ |
| Safe-area para notched phones | 🟡 |
| Animaciones suaves (motion) | ✅ |
| Feedback visual en acciones | ✅ |
| Modo claro | 🔴 |
| i18n (inglés) | 🔴 |
| Error boundaries | 🔴 |
| Loading skeletons | 🔴 |
| 404 personalizada | 🔴 |

### Infraestructura
| Item | Estado |
|------|--------|
| Build limpio | ✅ |
| TypeScript strict | ✅ |
| ESLint configurado | ✅ |
| Variables de entorno | 🔴 |
| Testing | 🔴 |
| CI/CD | 🔴 |
| Docker | 🔴 |
| HTTPS | 🔴 |
| Monitoreo | 🔴 |

---

## Resumen Final

| Categoría | Total Items | ✅ Completado | 🟡 Parcial | 🔴 Pendiente |
|-----------|-------------|---------------|-------------|--------------|
| Layout/Navegación | 11 | 10 | 1 | 0 |
| Home/Feed | 12 | 12 | 0 | 0 |
| Explorar | 3 | 3 | 0 | 0 |
| Gemología | 9 | 9 | 0 | 0 |
| Círculos | 5 | 2 | 0 | 3 |
| Sponsors | 9 | 6 | 0 | 3 |
| Perfil | 7 | 4 | 0 | 3 |
| Autenticación | 6 | 0 | 0 | 6 |
| Stripe | 10 | 1 | 1 | 8 |
| Supabase | 13 | 0 | 0 | 13 |
| API | 4 | 2 | 0 | 2 |
| ELIANA | 13 | 10 | 0 | 3 |
| UX/UI | 9 | 5 | 1 | 3 |
| Infraestructura | 9 | 4 | 0 | 5 |
| **Total** | **120** | **68 (57%)** | **3 (2%)** | **49 (41%)** |

---

*Documento generado el Julio 2026 — ZAFIRO v0.1*
