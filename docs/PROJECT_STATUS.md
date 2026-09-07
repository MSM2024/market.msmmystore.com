# ZAFIRO — ESTADO DEL PROYECTO (PROJECT_STATUS)

> Documento de continuidad. Cualquier IA/desarrollador debe leer esto antes de tocar código.
> Última auditoría: 2026-09-07 (rama `main`, ZAFIRO 1.0.1 FASE 1 + FASE 2 completadas).

## 1. OBJETIVO ACTUAL

Terminar ZAFIRO en producción visible (`https://zafiro.msmmystore.com`), con funcionalidad real
de extremo a extremo, sin simular datos de producción. Regla del cliente: **no más desarrollo de
funciones nuevas** hasta terminar las existentes, y **todo se valida por Don Miguel** antes de
declararse DONE.

## 2. ARQUITECTURA

- **Framework**: Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5, Tailwind 4.
- **Deploy**: Vercel (proyecto `zafiro`), dominio `zafiro.msmmystore.com`.
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
| ELIANA chat (`/eliana/chat`) | 🔴 BLOQUEADO POR CREDENCIALES | Motor por reglas + gemología OK; responde `503 ai_provider_not_configured` |
| ELIANA Viva (`/eliana`, ZAFIRO 1.0.1) | ✅ COMPLETADO (FASE 1 + FASE 2) | Entrada Soberana + presencia viva + chat real con estados; ver sección 13 |
| Autor IA (`/autor-ia`) | 🔴 BLOQUEADO POR CREDENCIALES | Requiere `GEMINI_API_KEY` válida (cuota 429) |
| Marketplace (`/marketplace`) | 🔴 BLOQUEADO POR MIGRACIONES | Tablas `marketplace_*` no existen (404) |
| Knowledge Base | 🔴 BLOQUEADO POR MIGRACIONES | Tablas `knowledge_*` no existen (404) |
| Biblioteca | 🔴 BLOQUEADO POR MIGRACIONES | Tablas `biblioteca_*` no existen |
| Album, Historias, Universo | ⚪ MAYORMENTE LOCALSTORAGE | Persistencia local, no real (se ajusta a reglas "no simular") |
| Stripe (pagos/membresías) | 🔴 BLOQUEADO POR CREDENCIALES | Sin `sk_live_*`/webhook/price-ids válidos (401) |

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
| `GEMINI_API_KEY` | 🔴 da 429 (cuota no activa) | missing válida |
| `GOOGLE_API_KEY` | 🔴 placeholder `[SENSITIVE]` | eliminar |
| `SUPABASE_ACCESS_TOKEN` (CLI) | 🔴 no configurado | missing |
| `STRIPE_SECRET_KEY` | 🔴 inválida (401) | missing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🔴 missing | missing |
| `STRIPE_WEBHOOK_SECRET` | 🔴 empty | missing |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` / `_CUBA_PLUS` | 🔴 placeholder | missing |

## 6. INTEGRACIONES — ESTADO REAL

| Integración | Estado | Bloqueo |
|---|---|---|
| Supabase Auth | ✅ Usable | email confirm disabled pendiente |
| Supabase DB/RLS | 🔴 0/60 migraciones | PAT/service-role |
| Google Gemini | 🔴 429 | activar billing en ai.google.dev + publicar key en Vercel |
| Stripe | 🔴 401 | claves live + productos/precios en Dashboard |
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
2. **Gemini**: habilitar billing en Google AI Studio + publicar la key real en Vercel (para ELIANA y Autor IA).
3. **Stripe**: claves live + productos/precios + signing secret del webhook.
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

## 13. ZAFIRO 1.0.1 — ENTRADA SOBERANA + ELIANA VIVA (2026-09-07)

### FASE 1 — Entrada Soberana (`/eliana`, primer estado)
- Fondo exacto `#050A1A`, dorado exacto `#DAA520`. Sin imágenes ni avatares.
- Wordmark `ZAFIRO` con texto dorado shimmer + `ELIANA` (mantiene E2E `text=ELIANA` visible).
- `ENTRAR` funcional (botón dorado con glow) → transición suave a FASE 2.
- Partículas doradas suaves en canvas (`ZafiroParticles`), reducidas en móvil (<22) y
  estáticas con `prefers-reduced-motion`.
- Resplandores radiales lentos (`zaf101-drift-*`). Mobile-first, sin contenido comercial.

### FASE 2 — ELIANA Viva
- Presencia 100% CSS (diamante abstracto con facetas que "respiran" y "parpadean").
- Estados reales con la máquina existente (`ElianaStateMachine`): VIVA → ESCUCHANDO →
  PENSANDO → HABLANDO → VIVA (+ ERROR / DESCONECTADA real por `offline`/`online`).
  Visuales por estado: ecualizador (ESCUCHANDO), órbita + puntos giratorios (PENSANDO),
  ondas sonar (HABLANDO), atenuación (ERROR/DESCONECTADA).
- Chat real conectado al motor (`engine.ts` → `POST /api/chat`): sin clave de IA devuelve la
  respuesta honesta `ai_provider_not_configured` y muestra el estado "proveedor pendiente".
- Entrada de texto, Enter para enviar, micrófono (Web Speech API real), voz (speechSynthesis
  real; sin audio simulado), persistencia (`persistence.ts`), seguridad (`core/security.ts`),
  limitador de visitante (50 msgs), Reintentar tras error, accesibilidad (aria-live/status).

### Archivos creados
- `src/components/zafiro101/ZafiroParticles.tsx`
- `src/components/zafiro101/ElianaEntrance.tsx`
- `src/components/zafiro101/ElianaPresence.tsx`
- `src/components/zafiro101/ElianaVivaChat.tsx`

### Archivos modificados
- `src/app/eliana/page.tsx` — reescrito como flujo FASE 1 → FASE 2 (reemplaza dashboard con
  métricas y feed de actividad simulados).
- `src/app/globals.css` — estilos scoped ZAFIRO 1.0.1 (paleta exacta, keyframes, reduced-motion).
- `src/components/eliana/ElianaAdvancedChat.tsx` — removida afirmación inventada "58 documentos".

### Verificación
- `pnpm lint` → 0 errores / 0 warnings.
- `pnpm typecheck` → 0 errores.
- `pnpm test` → 88/88.
- `pnpm build` → OK (ruta `/eliana` estática).

### Pendiente (externo, no bloquea la UI)
- Clave real de Gemini para respuestas IA conectadas (ver sección 10).
