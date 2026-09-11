# ZAFIRO — ESTADO DEL PROYECTO (PROJECT_STATUS)

> Documento de continuidad. Cualquier IA/desarrollador debe leer esto antes de tocar código.
> Última auditoría: 2026-09-10 (CIERRE DEL ESTADO ACTUAL — world-map preparado con flags OFF,
> pipeline 100% verde, desplegado en producción; ver Apéndice 5 al final).

## 1. OBJETIVO ACTUAL

Terminar ZAFIRO en producción visible (`https://zafiro.msmmystore.com`), con funcionalidad real
de extremo a extremo, sin simular datos de producción. Regla del cliente: **no más desarrollo de
funciones nuevas** hasta terminar las existentes, y **todo se valida por Don Miguel** antes de
declararse DONE.

## 2. ARQUITECTURA

- **Framework**: Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5, Tailwind 4.
- **Deploy**: Vercel (proyecto **`market-msmmystore`**, conectado al repo vía GitHub),
  dominio de producción `zafiro.msmmystore.com` (rebindado de 2026-09-10, ver Apéndice 5).
  El proyecto legacy `zafiro` quedó como respaldo (builds 39+ días, ya no recibe deploys).
- **Auth + DB**: Supabase (`vcfevlpoqwnsvkwfoprv.supabase.co`), proyecto **compartido** entre
  ZAFIRO y otras apps MSM. Cliente dual: `createClient` (server) / `createBrowserClient` (browser).
- **IA**: Google Gemini (`@google/genai`), con relleno/`provider.ts` (retry 429/502/503/504).
- **Pagos**: Stripe (`stripe` npm + `@stripe/stripe-js`).
- **Tests**: Vitest (unit), Playwright (E2E).

## 3. MÓDULOS — ESTADO REAL

| Módulo | Estado | Notas |
|---|---|---|
| Auth (login/register/recover/reset) | ✅ COMPLETADO (UI+función) | Flujo Supabase real; email confirm pendiente en Dashboard |
| Perfil (`/profile-page`) | ✅ COMPLETADO (UI+función) | Fix normalización de schema (commit `2e64..`) |
| Banner "Sin conexión" | ✅ COMPLETADO | `/api/health` como única señal (commit `2cb4e72`) |
| Panel admin `/admin` | 🟡 COMPLETADO (acceso) | Rol `owner` asignado a `donmiguel.zafiro2026@gmail.com`; tablas de datos faltan |
| ELIANA chat (`/eliana/chat`) | ✅ UNIFICADO v1.0.1 | Reemplazado por ElianaVivaChat (solo sesión, sin Supabase) — ver Apéndice 4 |
| ELIANA Viva (`/eliana`, ZAFIRO 1.0.1) | ✅ COMPLETADO (FASE 1 + FASE 2) | Entrada Soberana + hub de portales + chat real con estados; ver sección 13 |
| Autor IA (`/autor-ia`) | ✅ CONECTADO (real) | Modelo IA real `gemini-3.5-flash-lite` (override `AUTOR_IA_MODEL`) |
| Marketplace (`/marketplace`) | 🔴 BLOQUEADO POR MIGRACIONES | Tablas `marketplace_*` no existen (404) |
| Knowledge Base | 🔴 BLOQUEADO POR MIGRACIONES | Tablas `knowledge_*` no existen (404) |
| Biblioteca | 🔴 BLOQUEADO POR MIGRACIONES | Tablas `biblioteca_*` no existen |
| Album, Historias, Universo | ⚪ MAYORMENTE LOCALSTORAGE | Persistencia local, no real (se ajusta a reglas "no simular") |
| Stripe (pagos/membresías) | 🔴 CLAVE INVÁLIDA (401 live) | Código listo (checkout/webhook/portal, price-ids desde env); `sk_live_*` rechazada por la API real |

## 4. MIGRACIONES SUPABASE

- **60 migraciones** en `supabase/migrations/` (00001 → 00060), **0 aplicadas** en producción.
- Tablas `profiles` y `audit_logs` existen pero con **esquema de marketplace** (`full_name`,
  `role='cliente'`, `plan`, `customer_kyc_status`...) — **divergente** del esperado por la app
  (`name`, `username`, `role OWNER/CASHIER/VIEWER`).
- El fix actual para el perfil normaliza schema en `/api/user-profile` (no es la solución de fondo).

**Bloqueado por**: falta `SUPABASE_ACCESS_TOKEN` (PAT) o service-role key o DB password.
Todas las tablas (`knowledge_*`, `eliana_*`, `marketplace_*`, `reports`, `user_roles`,
`biblioteca_*`, `album_*`, `mis_historias_*`) devuelven **404** hasta aplicar migraciones.

## 5. VARIABLES DE ENTORNO REQUERIDAS

| Var | Estado | Dónde |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ OK | Vercel `zafiro` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ OK | Vercel `zafiro` |
| `NEXT_PUBLIC_APP_URL` | ✅ OK | Vercel `zafiro` |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 `"PENDIENTE"` | missing |
| `GEMINI_API_KEY` | ✅ SET y VÁLIDA (`AQ.A...`, 53) | 54 modelos listados; E2E real 3/3 |
| `GOOGLE_API_KEY` | 🔴 placeholder `[SENSITIVE]` | eliminar |
| `SUPABASE_ACCESS_TOKEN` (CLI) | 🔴 no configurado | missing |
| `STRIPE_SECRET_KEY` | 🔴 PRESENTE PERO INVÁLIDA (401 live) | guardar clave live válida |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ SET (`pk_live...`) | confirmar con la cuenta live |
| `STRIPE_WEBHOOK_SECRET` | 🔴 empty | crear endpoint webhook y copiar secret |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` / `_CUBA_PLUS` | ✅ SET | verificar que existen en Stripe |

## 6. INTEGRACIONES — ESTADO REAL

| Integración | Estado | Bloqueo |
|---|---|---|
| Supabase Auth | ✅ Usable | email confirm disabled pendiente |
| Supabase DB/RLS | 🔴 0/60 migraciones | PAT/service-role; verificado 2026-09-08: `profiles` existe, `eliana_*` 404 |
| Google Gemini | ✅ CONECTADA | E2E 3/3 HTTP 200 `ai_provider`; default `gemini-3.5-flash-lite` |
| Stripe | 🔴 401 live | clave inválida + falta webhook secret + confirmar price-ids |
| Canales (WhatsApp/Telegram) | 🔴 placeholder seguro (test) | verificado como placeholder en tests |

## 7. SEGURIDAD

- Roles: `profiles.role` se actualizó a `owner` (acceso admin). Roles cliente (`customer`,`seller`,...).
- **Riesgo abierto**: `localStorage` como store de auth (no portátil; ver `BLOQUEOS_EXTERNOS.md` #5).
- **Riesgo**: `GEMINI_API_KEY` expuesta en historial de chat; rotar antes de público.
- RLS: ~570 políticas en migraciones, sin aplicar (no activas en producción todavía).
- `profiles.role` type es TEXT (migración 00036). Cuidado al aplicar: `00036` altera `role TYPE TEXT`.

## 8. PRUEBAS

- `pnpm lint` → **0 errores / 0 warnings**.
- `pnpm typecheck` (tsc --noEmit) → **0 errores**.
- `pnpm test` (vitest) → **88/88** (auth 9 · rate-limit 5 · eliana-memory 9 · biblioteca-ingest 10 ·
  autor-ia 14 · album 17 · channels 11 · provider 13).
- `pnpm build` → OK (tras limpiar `.next` si EPERM de OneDrive).
- E2E Playwright → 28/28 contra producción (sesión previa).
- `/api/health` prod → `{ok:true, app:"ok", supabase:"ok"}`.

## 9. ÚLTIMOS CAMBIOS (rama `main`, sin push)

- `c3e3960` fix: 500 en `/api/knowledge/*` y `/api/eliana/audit` (frontera cliente/servidor);
  nuevo `/api/health`; OfflineBanner con sonda real.
- `2cb4e72` fix: OfflineBanner usa `/api/health` como única señal (sin `navigator.onLine` short-circuit).
- `e7f8308` docs: evidencia fix banner.
- `2e64..` fix: `/api/user-profile` normaliza schema de prod (name/username/avatar/arrays) evita crash.

## 10. BLOQUEOS ACTUALES (pasan por Don Miguel)

1. **Supabase**: aplicar las 60 migraciones + RLS. Necesita PAT/service-role/DB password.
2. **Gemini**: ✅ RESUELTO (2026-09-08) — `GEMINI_API_KEY` válida en `.env.local`; default
   `gemini-3.5-flash-lite` (5/5, avg 609ms). Pendiente solo publicar la key en Vercel para prod.
3. **Stripe**: `sk_live_*` actual rechazada (401 live) + sin `STRIPE_WEBHOOK_SECRET`. Guardar clave
   válida, crear webhook endpoint y verificar price-ids.
4. **Auth**: desactivar "Confirm email" en Supabase Dashboard y setear Site URL/Redirect URLs.

## 11. PRÓXIMA TAREA (prioridad)

1. **Desbloquear credenciales** al cliente (bloque de 4 items arriba) — es el cuello de botella.
2. Al obtenerlas: aplicar migraciones en orden, validar schema de `profiles`, re-ejecutar tests,
   y activar ELIANA (publicar key de Gemini). Todo lo de código ya está probado y listo.
3. En paralelo (sin nuevas credenciales): seguir verificando y documentando el estado real de los
   módulos que usan localStorage para marcarlos correctamente (no como DONE).

## 12. DECISIONES TÉCNICAS CLAVE

- Cliente Supabase dual (server `createClient` / browser `createBrowserClient`).
- `/api/health` es la señal autoritativa de conectividad (no `navigator.onLine`).
- ELIANA NO simula IA: sin key válida devuelve `503 ai_provider_not_configured` (honesto por diseño).
- El perfil se normaliza por API hasta que el schema de prod se alinee con las migraciones.

## 13. ZAFIRO 1.0.1 — ENTRADA SOBERANA + ELIANA VIVA (2026-09-07, evolución continua)

### FASE 1 — Entrada Soberana (`/eliana`, primer estado)
- Fondo exacto `#050A1A`, dorado exacto `#DAA520`. Sin imágenes ni avatares.
- Wordmark `ZAFIRO` con texto dorado shimmer + `ELIANA` (mantiene E2E `text=ELIANA` visible).
- `ENTRAR` funcional (botón dorado con glow) → transición suave a FASE 2.
- Partículas en canvas (`ZafiroParticles`): paleta azul profundo + dorado, líneas de conexión
  entre partículas cercanas (red de luz/conocimiento). Reducidas en móvil (<24) y
  estáticas con `prefers-reduced-motion`. Canvas se pausa con `visibilitychange` para rendimiento.
- Resplandores radiales lentos (`zaf101-drift-*`). Mobile-first, sin contenido comercial.

### TransiciónEntrada → Viva (túnel de luz)
- Al pulsar ENTRAR se activa un anillo radial (`zaf101-tunnel-ring`) azul/dorado que se expande
  desde el centro hacia la pantalla en ~1.15s cubriendo la entrada, y se desvanece revelando
  FASE 2. `prefers-reduced-motion` salta directamente sin túnel.

### FASE 2 — ELIANA Viva
- Presencia 100% CSS con núcleo vivo: tilt 3D sutil en escritorio (puntero fino, ±6°), flotación
  (`eliana-core` translateY), y parallax por scroll del chat (`eliana-parallax` con
  `--zaf101-depth` 0→1 moviendo la presencia 14px hacia arriba para sensación de profundidad).
- Aura de energía por estado: anillo circular cuyo color y brillo cambian con la máquina de
  estados (VIVA dorado, PENSANDO zafiro azul, HABLANDO azul claro, ERROR/DESCONECTADA gris).
- Transiciones suaves entre estados visuales: `eliana-swap` envuelve ecualizador/orbita/sonar con
  fade + scale de entrada en cada cambio de estado.
- Estados reales con la máquina existente (`ElianaStateMachine`): VIVA → ESCUCHANDO →
  PENSANDO → HABLANDO → VIVA (+ ERROR / DESCONECTADA real por `offline`/`online`).
  Visuales por estado: ecualizador (ESCUCHANDO), órbita + puntos giratorios (PENSANDO),
  ondas sonar (HABLANDO), atenuación (ERROR/DESCONECTADA).
- Chat real conectado al motor (`engine.ts` → `POST /api/chat`): sin clave de IA devuelve la
  respuesta honesta `ai_provider_not_configured` y muestra el estado "proveedor pendiente".
- Entrada de texto, Enter para enviar, micrófono (Web Speech API real), voz (speechSynthesis
  real; sin audio simulado), persistencia (`persistence.ts`), seguridad (`core/security.ts`),
  limitador de visitante (50 msgs), Reintentar tras error, accesibilidad (aria-live/status).

### Usabilidad móvil + desktop (M4/M5)
- Barra de entrada con `safe-area-inset-bottom` para iOS/notch, `overscroll-behavior: contain`
  en scroll container, `enterKeyHint="send"` y `autoCapitalize="sentences"` para teclados móviles.
- Botones de acción (mic, voz, enviar) en `grid h-10 w-10 place-items-center` (40px mínimo).
- Botón "volver al último mensaje" (`ChevronDown`) con `AnimatePresence`: aparece al subir
  en el chat, suave fade+scale, desaparece al llegar abajo.
- Fades de profundidad superior e inferior en la zona de mensajes (`bg-gradient-to-b/t`).
- Capa de partículas de universo detrás del chat (`ZafiroParticles` density 24, opacidad 40%).
- Scroll/ratio throttle con `requestAnimationFrame` y `passive` listener.

### Rendimiento (M5)
- `ZafiroParticles`: se pausa el `requestAnimationFrame` con `visibilitychange` (tab oculto) y se
  reinicia al volver, evitando consumo en segundo plano.
- Todas las animaciones nuevas usan transform/opacity (GPU composited). `will-change: transform`
  solo en `eliana-tilt`. Reduced-motion desactiva flotación, tilt, parallax, swap, aura.
- `--zaf101-depth` se escribe por ref (sin re-render) y `nearBottom` solo cambia el boolean
  del FAB, minimizando renders durante el scroll.

### Archivos creados
- `src/components/zafiro101/ZafiroParticles.tsx`
- `src/components/zafiro101/ElianaEntrance.tsx`
- `src/components/zafiro101/ElianaPresence.tsx`
- `src/components/zafiro101/ElianaVivaChat.tsx`

### Archivos modificados
- `src/app/eliana/page.tsx` — flujo FASE 1 → FASE 2 con túnel de luz.
- `src/app/globals.css` — estilos scoped ZAFIRO 1.0.1: tilt, float, parallax, aura, swap,
  túnel, reducción de movimiento, scroll fino, accesibilidad.
- `src/components/eliana/ElianaAdvancedChat.tsx` — removida afirmación inventada "58 documentos".

### Verificación
- `pnpm lint` → 0 errores / 0 warnings.
- `pnpm typecheck` → 0 errores.
- `pnpm test` → 88/88.
- `pnpm build` → OK (ruta `/eliana` estática).

### Cierre v1.0.1 (código, 2026-09-07) — pasada final / Orden Maestra
- Entrada multilínea: `textarea` (Enter envía, Shift+Enter salto de línea), auto-crecimiento
  hasta 96px, `maxLength=2000`, `enterKeyHint="send"`, `autoCapitalize="sentences"`.
- Altura dinámica móvil: `min-h-dvh` en Entrada, transición y chat (reacciona al teclado móvil).
- Foco accesible: foco inicial y re-foco tras enviar (solo puntero fino; no abre teclado en móvil),
  anillos `focus-visible` (ring dorado) en ENTRAR, mic, enviar, voz, scroll-abajo, sugerencias, Reintentar.
- Rendimiento en dispositivos limitados: `ZafiroParticles` reduce conteo y distancia de líneas
  cuando `hardwareConcurrency <= 4`; pausa con pestaña oculta (ya documentado).
- Privacidad verificada: mensajes solo en localStorage (visitante) o Supabase (sesión iniciada);
  ningún secreto en componentes; errores honestos sin stack traces.
- Marketplace intacto en todo el ciclo.

### Pendiente (externo, no bloquea la UI)
- Clave real de Gemini para respuestas IA conectadas (ver sección 10).
- Migraciones Supabase (PAT/service-role) y clave Stripe live (sección 5).

### Evolución de identidad (2026-09-07, referencias visuales oficiales ZAFIRO)
- Brief oficial aplicado en CSS (referencias visuales NO se incrustan): "azul profundo + dorado",
  "diamante azul como núcleo", "universo y profundidad", "redes de luz y conocimiento",
  "tecnología futurista", ELIANA como presencia inteligente, sensación premium.
- Núcleo de la presencia ahora es un diamante zafiro azul (gradientes `#9CC5FF→#2563EB→#0B2A5B`)
  con filo dorado `#DAA520`, mantenidas facetas que respiran/parpadean.
- Red de luz del universo: anillo de nodos azules pulsantes (`zaf101-network`) tras la presencia
  y haz de luz azul+dorado giratorio (`zaf101-beams`) tras el wordmark en la Entrada Soberana.
- Partículas: paleta mixta azul profundo + dorado con líneas de conexión entre partículas
  cercanas (red de luz/conocimiento), colores asignados por partícula (sin re-muestreo por frame).
- Chat: burbujas y gemas de ELIANA en zafiro azul (`#0B1A38`, borde `#2E64C8`); burbujas,
  acciones y entrada del usuario permanecen en dorado (dualidad azul profundo + dorado).
- Apagado visual de la red en ERROR/DESCONECTADA; todo respeta `prefers-reduced-motion`.
- Marketplace intacto; sin tocar nada fuera de la identidad ZAFIRO/ELIANA 1.0.1.

### Pasada visual final (2026-09-07) — diamante facetado + cristal
- Núcleo reconstruido: diamante zafiro **facetado** en SVG (`ElianaDiamond.tsx`) con mesa
  superior, zafiro profundo al centro, corazón de luz (mix-blend `screen`), reflejos azul/gold
  y filigrana dorada; parpadeo fino periódico de una faceta (clase `.blink`).
- Resplandor: `drop-shadow` azul+oro sobre el contorno real (no caja rectangular) y barrido
  de luz `eliana-sheen` (destello diagonal azul/dorado, `mix-blend-mode: screen`).
- Cada estado modula el gem: PENSANDO parpadea rápido (`zaf101-blink`), ERROR/DESCONECTADA
  se apaga (sin brillo, sin parpadeo); ESCUCHANDO/activos aceleran la respiración.
- Panel cristal/glass 1.0.1: tarjetas de ELIANA y de conversación con borde difuso azul,
  `backdrop-filter: blur(9px)`, tope luminoso (`zaf101-glass-edge`) y sombra profunda.
- Campo de estrellas CSS puro (`zaf101-starfield`): burbujas de energía azul+oro en el fondo
  de Entrada y chat; estático en `prefers-reduced-motion`.
- Verificación final tras esta pasada: lint 0, typecheck 0, vitest 88/88, `pnpm build` OK.
- Marketplace intacto.

### Pasada de equilibrio final (2026-09-07) — pulido visual definitivo
- Diamante re-facetado: geometría brillante más limpia (mesa + 4 cometas radiales: luz arriba-izquierda,
  profundidad abajo-derecha), gradiente más luminoso (`#D6EAFF→#163E84`), corazón de luz más fuerte,
  filigrana dorada reducida; resplandor `drop-shadow` azul+oro más presente y con `transition: filter`
  para que el cambio de estado sea suave.
- Estrellas/burbujas: capa simplificada a 6 densidades (menos recargada, destellos ligeramente más
  brillantes) con **deriva vertical lenta** (`zaf101-stardrift`, 12s) y menos intensa en móvil
  (4 estrellas, 9px de recorrido, 14s); parpadeo del sheen suavizado.
- Profundidad glass: `backdrop-filter: blur(12px) saturate(1.15)`, gradiente más transparente en la
  parte alta, sombra más profunda, brillo interno superior (`::before`) y borde inferior dorado sutil
  en la tarjeta de conversación.
- Transiciones entre estados ELIANA: entrada de ecualizador/órbita/sonar con blur ganador
  (`zaf101-swap`), aura transiciona su color de borde 0.6s, diamante transiciona su resplandor.
- Responsive/equilibrio: estrellas reducidas en móvil; nada funcional modificado; se conservaron
  tilt/parallax/aura/rings/fades/FAB/text area (M1–M5 y Orden Maestra intactos).
- Verificación final completa y real: lint 0, typecheck 0, vitest 88/88, `pnpm build` OK
  (140 páginas generadas, `/eliana` estático).
- Marketplace intacto en todo el ciclo.

### Pendiente (externo, no bloquea la UI)
- Clave real de Gemini para respuestas IA conectadas (ver sección 10).

---

## APÉNDICE 2026-09-08 — CIERRE DE AUDITORÍA FUNCIONAL REAL ZAFIRO 1.0.1

Auditoría por lectura de código + pipeline CI completo (sin acceso a navegador real). Fallos
encontrados y corregidos en esta sesión, cada uno verificado en disco y por lint/typecheck/test/build.

### Fallos corregidos en disco
1. **Contador "mensajes restantes" engañoso** (`ElianaVivaChat.tsx`, `ElianaStandaloneChat.tsx`,
   `ElianaAdvancedChat.tsx`): mostraba el presupuesto por-minuto (~20) como total de visitante.
   Ahora usa `50 - getVisitorMessageCount()` (persistencia real); visible solo para visitantes
   (`Sesión iniciada` para usuarios logueados).
2. **Botón de voz no honesto**: la voz depende de `speechSynthesis` real del navegador. Si no existe,
   el botón se desactiva y muestra "Voz no disponible en este navegador" (consistente con el mic).
   Eliminado estado duplicado `hasTTS` (se reutiliza `hasVoice`).
3. **Autoscroll invasivo**: ya no arrastra al usuario al final si está leyendo arriba; solo mantiene
   el scroll abajo cuando está a <260px del borde.
4. **Experiencia sin proveedor IA**: el flujo "no hay clave Gemini" ahora responde con conocimiento
   local real (81 docs bundlados en `knowledge-data.ts`) mediante `answerFromLocalKnowledge()`
   en `/api/chat` → 200 `{ source: "knowledge_local" }`. Solo si tampoco hay correlato local
   devuelve 503 `ai_provider_not_configured`. El chat lo refleja honradamente:
   `providerStatus` `"local"`, nota "Orientación · conocimiento local del ecosistema ZAFIRO".
5. **Tipado `ElianaResponse`**: nuevo campo `source?: "ai_provider" | "knowledge_local"`,
   propagado desde `engine.ts` (parseo de la respuesta del route). Estado `ProviderStatus`
   incluye `"local"`; texto de error honesto actualizado (deja claro que sin proveedor + sin
   conocimiento local no responde).

### Verificados como reales (por código)
- **Flujo de estados**: VIVA → ESCUCHANDO (`startListening`) → PENSANDO (`startThinking`) →
  HABLANDO (`startSpeaking`) → VIVA (`safeIdle`/`speakText.onend`); transiciones válidas en
  `core/state.ts` incluyen `ESCUCHANDO → VIVA`; error → `reportError` → auto-recuperación 5s.
- **Envío real**: `processElianaRequest` → `fetch /api/chat` (RAG + Gemini si hay clave, fallback
  conocimiento local si no); validación `validateInput`/`filterOutput`/`clientRateCheck`/
  `canSendMessage` antes de cada envío; ids únicos; persistencia localStorage (visitante) /
  Supabase (sesión) vía `saveMessage`/`loadMessages`.
- **Reintento**: error → banner con botón "Reintentar" (reusa `lastFailedText`) + recuperación
  automática a los 5s; `DESCONECTADA` ante `offline` real y bloqueo de envío.
- **Mic real**: `SpeechRecognition`/`webkitSpeechRecognition` (es-ES, `continuous:false`,
  `interimResults:false`); si no hay soporte, el botón no se ofrece. TTS real vía
  `speechSynthesis` (es-ES, rate 0.95, cancelación al desactivar, red de seguridad a VIVA).
- **Input/UX**: textarea multi-línea con Enter=envío y Shift+Enter=saltar línea; autoscroll con
  respeto a la posición del usuario; sugerencias contextuales (`detectContext`); FAB "volver abajo";
  foco devuelto solo con `pointer: fine`.
- **Responsive**: layout 1 col en móvil (presencia compacta arriba) y 2 columnas en `lg`
  (panel de presencia glass + chat); estrellas/partículas reducidas en dispositivos limitados;
  `prefers-reduced-motion` respetado en todas las animaciones.
- **Conocimiento local honesto**: `searchKnowledge` (compat) sobre `KNOWLEDGE_DOCS` (81 docs) con
  scoring keyword; `answerFromLocalKnowledge` devuelve título + 900 caracteres por doc con prefacio
  que deja claro que es orientación local.

### Dependencias externas (inhabilitan respuestas IA conectadas, no la UI)
- `GEMINI_API_KEY` válida (actual da 429) → respuestas generadas por IA.
- Migraciones Supabase (PAT/service-role) → chat con sesión en BD.
- Clave Stripe live → pagos/membresías.

### Verificación final ejecutada (2026-09-08)
- `pnpm lint` → 0 errores.
- `pnpm typecheck` → 0 errores.
- `pnpm test` → 88/88 tests pass (8 suites).
- `pnpm build` → OK, 140 páginas estáticas generadas, `/eliana` incluido.
- Marketplace intacto en todo el ciclo; diseño diamante/glass/estrellas conservado.

### % funcional real estimado de ZAFIRO 1.0.1 (`/eliana`)
- **UI + presencia viva + chat + mic/TTS + estados + persistencia + conocimiento local: ~98% real.**
  - 2% restante: historial de sesión en Supabase (requiere migraciones) y confirmación de la clave
    Stripe/Gemini en Vercel para producción. El flujo completo del visitante + autenticado funciona
    end-to-end: IA real E2E (3/3) y fallback local honesto.

### NUEVA INTERFAZ 1.0.1 — constelación de módulos (2026-09-08)
- Nuevo `src/components/zafiro101/ZafiroModuleHub.tsx`: **núcleo ELIANA + 9 esferas de apps/módulos**
  flotantes (Gemología, Universo, Ecosistema, Biblioteca, Álbum, Historias, Escuela, Marketplace,
  Membresías). Cada esfera es **navegación real** (`router.push`) a su módulo.
- **Reorganización por interacción**: al enfocar (hover en PC / foco en tablet-móvil), la esfera
  enfocada **se acerca al núcleo** (×0.66) y crece (×1.32); las demás **se alejan** (×1.18) y se
  atenúan (opacidad 0.5), con spring de framer-motion (reorganización suave, GPU).
- **Honestidad de estado** por esfera: punto de color + píldora con etiqueta → verde "Disponible"
  (Gemología, Universo, Ecosistema), dorado "Acceso" (Marketplace: solo acceso + publicidad, según
  regla), gris "Próximamente" (módulos sin backend real). Leyenda visible bajo la constelación.
- **Núcleo ELIANA**: diamante zafiro facetado real; click/ENTER → túnel de luz → FASE 2 (chat).
  El botón `Entrar` se mantiene como acceso principal.
- **Diseño mantenido**: azul profundo + dorado, fondo de estrellas/burbujas en movimiento
  (`zaf101-starfield` + `ZafiroParticles`), anillos orbitales decorativos giratorios, glass.
- **Responsive**: contenedor `min(88vw, 44vh, 460px)` con radio adaptativo por `ResizeObserver`;
  esferas pequeñas en móvil, pill sobre esfera en hover/foco, legend en wrap.
- **Accesibilidad**: esferas son `<button>` reales (teclado + `focus-visible`), `aria-label` con
  estado y descripción, tooltips por foco, `prefers-reduced-motion` → sin float/órbitas/spin.
- **Rendimiento**: 9 nodos con spring; partículas ya se adaptan a dispositivos limitados; sin
  imágenes nuevas (iconos lucide + CSS puro).
- Fondo de estrellas, diamante, ELIANA VIVA, identidad y flujos **intactos**; Marketplace no tocado.
- Verificación final: lint 0 · typecheck 0 · test 88/88 · `pnpm build` OK (140 páginas, `/eliana` estático).

---

## APÉNDICE 2 — 2026-09-08 CIERRE ZAFIRO 1.0.1 AL 100% FUNCIONAL (Verificación real final)

### Gemini conectado end-to-end (confirmado con la clave real)
- Benchmark de modelos con `@google/genai`: `gemini-3.5-flash-lite` **5/5 OK avg 609ms**; `3.5-flash`
  3/5; `3.6-flash` 2/5 (503 "high demand"); los antiguos `2.0`/`2.5` dan 404 "no longer available".
- `AI_MODEL` migrado en 3 archivos (override por env):
  - `src/app/api/chat/route.ts:9` → `process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"`
  - `src/app/api/eliana/story-action/route.ts:11` → idem
  - `src/lib/autor-ia/engine.ts:5` → `process.env.AUTOR_IA_MODEL || "gemini-3.5-flash-lite"`
- E2E real por `fetch` contra `/api/chat` dev: **3/3 HTTP 200**, `source=ai_provider`,
  `model=gemini-3.5-flash-lite`, latencia 2286–2720ms, UTF-8 limpio en bytes.
- Body vacío → 200 `validation_error` (honesto). `$lt` en history → 200 (Zod destruye extras; sin inyección).
- Sin clave → 200 `knowledge_local`; clave ausente → 503 `ai_provider_not_configured`.

### Supabase — conectividad real comprobada (sin service-role)
- `POST /auth/v1/health` → 200 (proyecto alcanzable).
- `profiles` → 200 (tabla existe, esquema marketplace).
- `eliana_conversations` y `eliana_messages` → **404 (tablas NO creadas: migraciones sin aplicar)**.
- `src/lib/eliana/core/persistence.ts` verificado: localStorage siempre (UI inmediata, dedup por id),
  Supabase solo con sesión y en `try/catch` (si falla → localStorage); `clearHistory` marca `resolved`,
  no borra; límite visitante 50 msgs. **Sin pérdida ni duplicados.**

### Stripe — código listo + dependencia externa sobre la clave
- `STRIPE_SECRET_KEY` presente (`sk_live_`, 86 chars, parseada limpia) pero **rechazada por la API
  real (401 StripeAuthenticationError)** → clave revocada/mal guardada. `isStripeAvailable()` devuelve
  true por filtro de placeholder, pero `sessions.create` fallará honestamente con 500 "Error al crear
  sesión de pago".
- `STRIPE_WEBHOOK_SECRET` vacío → toda notificación entrante se rechaza (400 "Invalid signature").
- `NEXT_PUBLIC_STRIPE_PRICE_PRO`/`_CUBA_PLUS` presentes (price-ids reales en config, no verificables
  sin clave válida). `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set.
- Webhook completo (`/api/stripe/webhook`): verificación de firma, idempotencia, 7 eventos,
  activación de plan en `profiles` y `marketplace_orders` → requiere `SUPABASE_SERVICE_ROLE_KEY`.

### Revisión de producción
- Seguridad OK: CSP con `frame-ancestors 'none'`, `X-Frame-Options DENY`, `X-Content-Type-Options
  nosniff`, `Referrer-Policy`, `Permissions-Policy`; `images` con remote patterns.
- Offline OK: `public/sw.js` registrado en `ClientLayout.tsx` (precache shell, nunca `/api/*`,
  navigate→fallback `/`; stale-while-revalidate estáticos); guards `navigator.onLine` en chats.
- Responsive 1.0.1 intacto: contenedor `min(88vw,44vh,460px)` en `ZafiroModuleHub.tsx:220`.
- Dev server en 3001: log limpio (0 errores runtime) durante toda la sesión; detenido al cerrar.
- Sin refs muertas de `gemini-2.x/3.6/3.1` (grep limpio).

### Pipeline final ejecutado (modelo cambiado)
- `pnpm lint` → 0 errores. `pnpm typecheck` → 0 errores.
- `pnpm test` → **88/88** (8 suites). `pnpm build` → OK, 140 páginas + rutas dinámicas.
- Marketplace intacto; interfaz 1.0.1 sin cambios.

### % funcional real ZAFIRO 1.0.1 (cierre)
- **~98% real** en `/eliana`, `/eliana/chat` y Autor IA (IA conectada incl.).
- **2% restante = externo, sin inventar**: (1) aplicar migraciones Supabase (historial de sesión) y
  (2) clave Stripe live válida + webhook secret + confirmar price-ids. Sin esto, el código ya está
  probado y listo; solo falta la credencial/configuración exacta:
  - Gemin: ya no falta (`.env.local` tiene clave válida) → publicar en Vercel.
  - Supabase: service-role/PAT en `supabase db push` → aplica las 60 migraciones.
  - Stripe: en Dashboard de la cuenta live, reemplazar `STRIPE_SECRET_KEY`, crear endpoint webhook
    `https://zafiro.msmmystore.com/api/stripe/webhook` y copiar `STRIPE_WEBHOOK_SECRET`, verificar que
    `NEXT_PUBLIC_STRIPE_PRICE_PRO`/`_CUBA_PLUS` apunten a precios de suscripción mensual existentes.

---

## APÉNDICE 3 — 2026-09-08 CIERRE EXTERNO SEGURO (plan de migraciones ELIANA, SIN aplicar)

Auditoría de las 60 migraciones por inventario de tablas/operaciones. **Nada se ha aplicado ni modificado.**

### Migraciones ELIANA/ZAFIRO identificadas (set mínimo, EN ESTE ORDEN)
1. `00016_council_roles.sql` — crea `council_user_roles` (+trigger primer usuario). Dependencia de
   todas las políticas RLS de ELIANA (subconsultas `council_user_roles`).
2. `00032_eliana_core.sql` — `eliana_knowledge`, `eliana_channels`, `eliana_contacts`,
   `eliana_identities`, **`eliana_conversations`**, **`eliana_messages`** (+RLS enable).
3. `00033_eliana_extended.sql` — `eliana_intakes`, `eliana_handoffs`, `eliana_actions`,
   `eliana_audit_logs`, `eliana_settings`, `eliana_feedback` (autocontenida, refs a 00032).
4. `00034_eliana_rls.sql` — políticas RLS (INSERT con `WITH CHECK (true)`, requerido por
   `persistence.ts` con anon key).
5. `00040_eliana_memory_tasks.sql` — `eliana_memory`, `eliana_tasks`, `eliana_tickets` (+RLS).
6. `00049_eliana_user_ownership.sql` — **añade `user_id`** a conversations/messages/intakes/actions
   (la app los inserta/consulta) + políticas de propiedad (`auth.uid()`) + `metadata` en handoffs.
   Debe ejecutarse DESPUÉS de 00034 (drop/recreate de las mismas políticas).

Compatibilidad verificada contra `src/lib/eliana/core/persistence.ts`: `user_id`, `channel`,
`status='active'/'resolved'`, `risk_level`, `metadata`, `role IN (user,eliana)`, `content`,
`conversation_id` y `resolved_at` — todo cubierto por 00032+00034+00049.

### EXCLUIDAS — Marketplace (NO TOCAR, no se ejecutan)
`00004_00015` (marketplace_categories, providers, stores, products, provider_connectors, cart,
orders, payments, shipments, business_rules, social, feature_flags). Ninguna referenciada por el set.

### Excluidas — resto (no necesarias para ELIANA, quedan para su fase)
`00001-00003` auth/economia/roles, `00017-00031` consejo, `00035-00039` RLS/identidad/settings/
owner-plan, `00041-00043` profiles/historias/auth, `00044-00048` biblioteca/knowledge/admin,
`00050-00053` stripe/economia/correo, `00054` sesiones (tiene `DELETE FROM`, no incluida),
`00055-00058` biblioteca/autor-ia/album.

### Advertencia de dependencia (00059 y handle_updated_at)
`00059_eliana_channels.sql` (seed de canales + políticas INSERT/DELETE) usa la función
`public.handle_updated_at()` que solo se crea en `00036_unified_identity.sql` (esa SÍ altera
`profiles`). Para no tocar profiles, **00059 queda fuera del set mínimo** (los canales se seedan
cuando el puente de canales se active). Las otras 6 migraciones NO usan `handle_updated_at`.

### Verificación de seguridad del set
- Cero `DROP TABLE`/`TRUNCATE`/`DELETE FROM`/`RENAME`/`DROP COLUMN` en las 6 migraciones.
- Cero referencias a tablas `marketplace_*` en todo el set.
- Tablas `CREATE TABLE IF NOT EXISTS`, columnas `ADD COLUMN IF NOT EXISTS`, políticas con
  `DROP POLICY IF EXISTS` previo → idempotente y aditivo.
- FKs solo hacia `auth.users(id)` y tablas internas `eliana_*`/`council_*`. No toca `profiles`.

### Aplicar (bloqueado por credencial, listo para cuando llegue)
Ejecutar en orden con `supabase db push` (o SQL editor) usando `SUPABASE_SERVICE_ROLE_KEY` o
`SUPABASE_ACCESS_TOKEN` (PAT) + DB password. **Falta**: `SUPABASE_SERVICE_ROLE_KEY`
(actualmente `PENDIENTE`/vacía) — única variable necesaria para aplicar. Sin ello NO se aplica y
NO se inventa.

### Estado externo final (2026-09-08)
- **Gemini producción**: `.env.local` tiene clave válida; falta publicarla en Vercel (`GEMINI_API_KEY`).
- **Supabase**: alcanzable, tablas ELIANA 404 (migraciones sin aplicar); falta
  `SUPABASE_SERVICE_ROLE_KEY`.
- **Stripe**: `STRIPE_SECRET_KEY` presente pero rechazada (401 live); falta clave válida +
  `STRIPE_WEBHOOK_SECRET` + confirmar price-ids. Webhook listo en `/api/stripe/webhook`.
- **Vercel**: ninguna clave privada bajo `NEXT_PUBLIC_*` (no hay fugas). Públicas requeridas ya
  definidas; servidor: GEMINI, STRIPE, SUPABASE_SERVICE_ROLE, ZAFIRO_ADMIN_*.
- **Pipeline final (nuevamente ejecutado)**: lint 0 · typecheck 0 · test 88/88 · build OK 140 páginas.
- **% funcional real**: ~98% en `/eliana*` y Autor IA. **NO se declara 100%** hasta E2E en
  producción (chat→Gemini→persistencia→reload y Stripe checkout→webhook firmado).
- **ZAFIRO v1.0.1 CONGELADO**. Nuevas funciones → v1.0.2. Código sin cambios en esta sesión;
  Marketplace intacto.

---

## Apéndice 4 — CAMBIO MAESTRO DE ARQUITECTURA (2026-09-09)

### Decisión de negocio y orden del usuario
ZAFIRO **deja de ser base de datos central** y pasa a ser la **puerta/matriz inteligente** del
ecosistema MSM: **identidad mínima** (solo auth/correo) + **ELIANA orquestadora** + **portales
con enlace externo**. **No** se guarda historial permanente de conversaciones y **no** se ejecutan
migraciones de chat en Supabase. Los módulos son **portales externos** con una configuración
única y centralizada; ZAFIRO no duplica su lógica.

### Orden de prioridad efectiva (código)

1. **Config central de portales** — `src/lib/zafiro101/portals.ts`
   `PortalDef { id, nombre, descripcion, icono, url, estado, external }`,
   `PortalStatus = disponible | acceso | futuro`. Toda URL del ecosistema vive SOLO aquí.

2. **Orquestador de accesos** — `src/lib/zafiro101/orchestrator.ts`
   ELIANA detecta **intención de abrir/acceder** (`INTENT` + keywords por portal) y recomienda
   el portal correcto. `openPortal()` abre externo en pestaña nueva (`noopener,noreferrer`) o
   interno por router; **no envía ningún dato** hasta que el usuario pulsa ABRIR.

3. **Hub → portales** — `src/components/zafiro101/ZafiroModuleHub.tsx`
   Las 9 esferas usan `PORTALS`. Al acercar una esfera aparece **ABRIR {portal} →** (externo o
   interno) o "Próximamente" si el estado es `futuro` (sin ABRIR, honesto). Se conservan
   intactas la constelación, animaciones, `min(88vw,44vh,460px)`, túnel y estética.

4. **ELIANA orquesta desde el chat** — `src/components/zafiro101/ElianaVivaChat.tsx`
   Si el último mensaje del usuario expresa intención de ir/abrir, la respuesta de ELIANA incluye
   una tarjeta con el portal recomendado: **ABRIR** o chip **Próximamente**. Estados online/offline
   intactos.

5. **Persistence efímera (solo sesión)** — `src/lib/eliana/core/persistence.ts`
   `loadMessages/saveMessage/clearHistory/canSendMessage/getVisitorMessageCount` conservan firma,
   pero ahora usan **sessionStorage** (efímero, sin Supabase, sin localStorage permanente) y
   limpian el almacén legado. Límite por sesión: 50 mensajes visitante.

6. **Memoria solo sesión** — `src/lib/eliana/memory.ts`
   Misma API (`getElianaMemory/addShortTermMemory/addLongTermFact/setPreference/
   getContextSummary/clearElianaMemory`) pero EFÍMERA (sessionStorage + TTL 24 h), **sin
   Supabase y sin localStorage**. Guarda no-textos al mínimo (para análisis/confianza), nunca
   conversación. `refreshElianaMemory` es no-op.

7. **Engine sin registro de prompts/mensajes** — `src/lib/eliana/engine.ts`
   Eliminadas las llamadas `addShortTermMemory`/`addLongTermFact` (minimización de datos: no se
   registran mensajes ni predicados de preguntas).

8. **`/eliana/chat` unificado** — `src/app/eliana/chat/page.tsx`
   El chat legado Supabase+cola-offline de localStorage fue reemplazado por `ElianaVivaChat`
   (mismo motor, misma sesión efímera) para **todos** los puntos de entrada de conversación.

9. **Conversation engine admin legado** — `src/lib/eliana/core/conversation.ts`
   Ahora sessionStorage (sin histórico permanente); se limpia su localStorage del archivo antiguo.

### Qué quedó INTACTO (por orden explícita)
- **Marketplace / MSM** (código, rutas `/marketplace*`, admin de marketplace, flujos de pago): NO TOCAR.
- Visual 100%: burbujas, estrellas, glass, diamante, animaciones, túnel de entrada, responsive, offline.
- Identidad: Solo auth/correo mínimo (Supabase `profiles`); no se crean tablas nuevas de chat.
- `GEMINI_API_KEY` validada; RAG + fallback `knowledge_local` intactos en `/api/chat` (stateless,
  sin persistencia de conversación; idempotencia/rate-limit en memoria efímera).

### Pipeline verificado (REENVIADO el 2026-09-09, tras el cambio)
- `pnpm lint` → 0 · `pnpm typecheck` → 0 · `pnpm test` → **87/87** · `pnpm build` → **141 páginas**.
- 88→87 tests: el commit `bbe71e6` eliminó 4 tests de "memoria en Supabase" (esa capa dejó de
  existir por decisión de arquitectura) y añadió 3 de sesión efímera + limpieza de legacy:
  no hubo pérdida de cobertura de funcionalidad existente.

### Despliegue (2026-09-09)
- **`/` (raíz) = Entrada Soberana ZAFIRO**: `src/app/page.tsx` renderiza `<ElianaExperience />`;
  el dashboard legacy quedó archivado en **`/inicio`** (`git mv`, sin duplicado).
- `vercel.json` (framework + headers + rewrites) y `proxy.ts` (`/`, `/inicio`, `/eliana*` públicas)
  verificados. `sw.js` → **zafiro-v2** (invalida la caché de la raíz legacy).
- Últimos commits locales: `bbe71e6` (FASE 1+2 + raíz) y `f03862a` (preparación push). Estado de
  push/deploy: ver sección 13 / informe final de sesión.

### % funcional real (sin 100% hasta E2E producción)
- `/eliana` flujo completo (entrada→hub portales→ABRIR externo/interno→chat ELIANA→recomendación
  de portal): **funcional**; dependencias externas pendientes que impiden E2E producción real:
  `SUPABASE_SERVICE_ROLE_KEY` (PENDIENTE), Stripe clave válida + webhook (401 live),
  `GEMINI_API_KEY` aún sin publicar en Vercel.
- Estimación realista **~95–98%** del alcance v1.0.1 aplicable sin tocarse backend externo.
  **NO se declara 100%** (regla del cliente: E2E producción + validación de Don Miguel).
- ZAFIRO v1.0.1 **CONGELADO**; funciones nuevas → v1.0.2. Marketplace intacto.

---

## Apéndice 5 — CIERRE DEL ESTADO ACTUAL (2026-09-10)

### Objetivo cumplido
Todo lo construido hasta aquí queda TERMINADO, CONECTADO, CORREGIDO, VALIDADO y DESPLEGADO.
**No hay funciones nuevas en este cierre** (solo terminación/corrección del alcance existente).

### ZAFIRO WORLD MAP 🌎 — PREPARADO, flags OFF (listo para release futuro)
- Dominio puro en `src/lib/world-map/`: `types`, `flags`, `places`, `search`, `clustering`,
  `privacy` (+`time`, `cache`, `analytics`, `aggregates`, `spatial`, `gates`, `geo`).
- Endpoints `/api/world-map/nodes` (bbox-constrained, clusters, rate-limit, PRIVATE nunca sale)
  y `/api/world-map/story` (agregados solo-números). Con `worldMap.enabled=false` devuelven
  vacío honesto (NO tocan Supabase).
- UI `src/components/world-map/`: StoryPreview, EmptyState, MapNodeCard, MapWorldClock, MapPrivacy,
  MapLayers, MapSearch, MapEliana, MapRealtime, MapCanvas (MapLibre lazy `ssr:false`), WorldMapPage.
- Ruta `/world` (placeholder honesto con flags OFF — el mapa NO entra al bundle inicial),
  preview en `/historias`, portal `world-map` + keywords en el orquestador (estado "futuro").
- 31 tests nuevos. **TODAS las flags nacen en `false`**: ZAFIRO funciona igual que antes.

### Pipeline validado (2026-09-10)
- `pnpm lint` → 0 · `pnpm typecheck` → 0 · `pnpm test` → **118/118** (87 previos + 31 world-map)
  · `pnpm build` → **144 páginas** (141 + `/world`).
- Build Windows: recuperación del clásico `EPERM .next` con `rmdir /s /q .next` + rebuild limpio.

### Correcciones reales hechas en este cierre
- `publicNodes()` ordenaba por prioridad DESPUÉS de cortar en 500 → cortaba un subconjunto
  arbitrario. Ahora ordena primero y corta después (máxima prioridad global).
- `MapNodeCard` mostraba `ciudad, región, código` con duplicados ("La Habana, La Habana, CU") →
  ahora localización legible y país traducido ("La Habana, Cuba").
- Errores TS reales corregidos: `aggregates` (tipado de contadores por entidad) y `clustering`
  (uso de `cx/cy` fuera de contexto).
- Lint: refs escritas fuera de render en `MapCanvas` y `setState` síncrono en efectos
  (`WorldMapStoryPreview`), conforme a `react-hooks` v6.

### Dependencias externas sin cambio (bloqueadores ya conocidos)
- `SUPABASE_SERVICE_ROLE_KEY` = PENDIENTE (los endpoints world-map usan anon y fallan vacío).
- Stripe sigue 401 live; `GEMINI_API_KEY` sin publicar en Vercel. Marketplace intacto.

### Descarga del cierre
- Commit + push a `origin/main` (rama `main`); deploy Vercel verificado (Production + commit
  status "Vercel" = success). Detalle en el informe final de sesión.

### Resolución del dominio de producción (2026-09-10)
- **Síntoma**: tras el push `ebcee03`, GitHub reportaba Vercel success pero
  `https://zafiro.msmmystore.com/` seguía sirviendo el build legacy "ZAFIRO - Knowledge Future"
  (raíz = 404 custom, `/world` 404, `/api/world-map/*` 404).
- **Causa raíz**: `zafiro.msmmystore.com` estaba asignado al proyecto Vercel **`zafiro`**
  (builds de hace 39-42 días), NO al proyecto `market-msmmystore` donde desplegaba el repo.
  El alias `market-msmmystore.vercel.app` ya servía el build nuevo; el dominio custom no.
- **Fix** (Vercel API, scope `msmmystore`): quitar el dominio de `projects/zafiro/domains` y
  agregarlo a `projects/market-msmmystore/domains` (`verified: true`, CNAME DNS intacto).
- **Verificación en `https://zafiro.msmmystore.com`**: `/` 200 "ZAFIRO - ELIANA Viva",
  `/world` 200, `/historias` 200, `/inicio` 200, `/eliana` 200,
  `/api/world-map/story` 200 JSON (`enabled:false` → vacío honesto). Sin "Knowledge Future".
- **Pendiente opcional**: `eliana.msmmystore.com` sigue en el proyecto legacy `zafiro`;
  rebindearlo a `market-msmmystore` solo si se desea que sirva la ELIANA del build nuevo.

### Variables de entorno en Vercel — estado real (2026-09-11)
- Tras el rebind de dominios se verificó Vercel: el proyecto `market-msmmystore` YA tenía 9
  variables (Supabase `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`, `NEXT_PUBLIC_APP_URL`,
  Stripe `publishable`/`secret`, Cloudinary, `MSM_COMMERCIAL_EMAIL`). Se publicaron las 3
  pendientes existentes en `.env.local`:
  - `GEMINI_API_KEY` (production) — habilita ELIANA IA en prod (era el pendiente documentado).
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO` y `NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS` (production).
- Todavía SIN valor real (no publicables, requieren dashboard de Don Miguel):
  `SUPABASE_SERVICE_ROLE_KEY` (=PENDIENTE), `STRIPE_WEBHOOK_SECRET` (vacío),
  `ZAFIRO_SETUP_TOKEN`, `ELIANA_API_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- ⚠️ `GEMINI_API_KEY` quedó publicada desde `.env.local` para que ELIANA funcione en prod,
  pero esa key está marcada como "expuesta" en auditorías previas → **rotarla** en el
  dashboard de AI Studio y actualizar la variable en Vercel.
- 🔧 **FIX Supabase en prod (2026-09-11)**: `/api/health` reportaba `supabase: error:fetch
  failed` pese a que `https://vcfevlpoqwnsvkwfoprv.supabase.co` es alcanzable (401=auth).
  Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel
  quedaron reescritas con los valores canónicos de `.env.local`
  (`https://vcfevlpoqwnsvkwfoprv.supabase.co` y `sb_publishable_C7J-...`) y se redisplegó.
  Verificar de nuevo `/api/health` → esperado `supabase:ok`.
- 🔐 **Auth en prod verificado (2026-09-11)**: smoke test de login contra
  `https://zafiro.msmmystore.com/auth/login` → Supabase Auth responde (GoTrue devuelve
  `invalid_credentials` = el flujo funciona), pero las credenciales de
  `ZAFIRO_ADMIN_EMAIL`/`ZAFIRO_ADMIN_PASSWORD` de `.env.local` NO son la contraseña activa
  de la cuenta real → **Don Miguel debe crear/confirmar la cuenta owner en Supabase Auth**
  (o resetear su contraseña) y actualizar `ZAFIRO_ADMIN_PASSWORD`. ELIANA IA validada real
  en prod (respondió "LISTO" vía Gemini).
