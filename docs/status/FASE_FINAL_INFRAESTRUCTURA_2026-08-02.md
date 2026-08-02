# FASE FINAL — INFRAESTRUCTURA Y PRODUCCIÓN

**Fecha:** 2026-08-02
**Rama:** finish-zafiro-eliana
**Baseline:** commit `2ed03d1` (+ trabajo de cierre en HEAD)
**Entregable:** estado real de cada servicio, evidencia, errores pendientes y credenciales requeridas para completar el 100% operativo.

---

## 1. URL FUNCIONAL

| Ítem | Valor |
|---|---|
| URL pública | **https://zafiro.msmmystore.com** |
| Deployment producción | `zafiro-fj52860v9-msmmystore.vercel.app` (aliased al dominio) |
| Código desplegado | HEAD: `338f2f6` + `9c7a1db` (fix register) — sobre `2ed03d1` |
| Home | 200 — "ZAFIRO - Knowledge Future" |
| PWA | `manifest.json` 200, `sw.js` 200, 5 íconos 200 |
| E2E contra producción | **28/28 passed** |

**Cuenta de prueba creada:** ninguna aún (ver §4 bloqueo de registro).

---

## 2. ESTADO POR SERVICIO

### Vercel / Deploy ✅
- CLI autenticado como `msm2024`, proyecto `zafiro` vinculado (`prj_lVx7uFJ8vanKDhsMp4vcLyiZyBhm`).
- Se desplegó el código actual (el deploy anterior tenía 3 días y NO incluía la PWA ni los fixes).
- Envs de producción configuradas (reemplazando los `[SENSITIVE]`):
  - `NEXT_PUBLIC_SUPABASE_URL=https://vcfevlpoqwnsvkwfoprv.supabase.co` (real, recuperada del bundle desplegado del cliente)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_C7J-...` (pública)
  - `NEXT_PUBLIC_APP_URL=https://zafiro.msmmystore.com`

### Supabase 🔶 (proyecto vivo, schema casi vacío)
- Proyecto: `vcfevlpoqwnsvkwfoprv.supabase.co` — **existe y responde**.
- Tablas existentes: `profiles`, `audit_logs` (+ trigger `handle_new_user` activo, defaults role=cliente/plan=free).
- **Faltan ~60 migraciones**: no existen `marketplace_*`, `eliana_*`, `knowledge_*`, `memberships`, `user_settings`, `app_sessions`, `login_events`, `stripe_events`, `library_*`, `album_*`, `council_*`, etc. (verificado vía REST: 404 en todas).
- RPC `auto_confirm_user` (migración 00043): **NO existe** → el registro no se auto-confirma.
- RLS: las pocas tablas que existen tienen RLS (migraciones 00001). El resto se activa al aplicar migraciones.
- **No se han aplicado migraciones** → requiere acceso admin (ver §4).

### Autenticación 🔶 (mecanismo OK, E2E completo pendiente)
- El flujo de la app llega a Supabase Auth correctamente.
- `/api/auth/forgot-password` con email inexistente → **200** (comportamiento correcto).
- `/api/auth/register` → alcanza Supabase; bloqueado temporalmente por **rate limit de signups de Supabase por IP** (429). Se verificó que la app YA NO bloquea: tras la ventana, una petición inválida responde 400 (INVALID_PASSWORD), es decir el 429 es de Supabase, no de la app.
- Signup directo: el trigger `handle_new_user` inserta el profile (requiere `full_name` en metadata — la app lo envía).
- Login de `msmmystore@gmail.com`/`Admin1234` (credenciales del informe del 29-jul): ahora **401 invalid_credentials** — la contraseña cambió o la cuenta fue modificada.
- `ELIANA_API_KEY` no definida → endpoints `/api/eliana/audit` y `/api/eliana/marketplace` quedan SIN bearer check (riesgo A4 conocido).

### Stripe ❌ (bloqueado)
- `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en `.env.local` son **inválidas**: formato de 105 caracteres (las reales son ~32) y **401 Unauthorized** contra `api.stripe.com`.
- `NEXT_PUBLIC_STRIPE_PRICE_PRO/CUBA_PLUS` = placeholders (`price_TU-*`).
- `STRIPE_WEBHOOK_SECRET` = vacío.
- No hay precios ni webhook reales.

### Gemini / ELIANA ❌ (bloqueado)
- `GEMINI_API_KEY` presente (formato OAuth `AQ.`) pero la API devuelve **429 cuota agotada** (`generateContent` y `models` → 429). Requiere facturación/plan en Google.

### Seguridad / RLS 🔶
- El proxy (middleware) funciona en producción: `/biblioteca` (solo-owner) redirige sin sesión a `/` — **verificado con E2E**.
- `/api/eliana/health` exige sesión (401 sin auth) — correcto.
- RLS completo de las 60 migraciones pendiente de aplicar.

---

## 3. EVIDENCIA

- **E2E 28/28 contra https://zafiro.msmmystore.com** (`PLAYWRIGHT_BASE_URL` apuntando a producción): 14 páginas públicas + marketplace + universo + voz-viva + biblioteca owner-only.
- **PWA**: manifest válido (nombre/íconos/standalone), service worker servido, 5 íconos 200.
- **Supabase vivo**: `profiles` y `audit_logs` accesibles por REST con la anon key pública; resto de tablas 404.
- **Rate limiter de la app corregido** (commit `9c7a1db`): antes se atascaba en 429 (Map local con `setTimeout` que no expira en serverless); ahora usa `rateLimitByIp` (ventana deslizante) y se verificó que responde 400 tras la ventana.
- **Test E2E corregido** (commit `bc06bf4`): `/biblioteca` pasaba en local solo porque sin Supabase el proxy se saltaba la guardia; en producción la guardia funciona y el test ahora lo verifica.

---

## 4. CREDENCIALES / ACCESOS REQUERIDOS PARA CERRAR EL 100% (solo Don Miguel)

> Todo lo que depende de estos accesos NO puede hacerse desde el repositorio. El resto ya está desplegado y verificado.

### 4.1 Supabase — aplicar las 60 migraciones (EL BLOQUEO PRINCIPAL)
Elegir UNA opción:
- **(A) Personal Access Token (recomendado):** en https://supabase.com/dashboard/account/tokens → "Generate new token". Entregar el token; yo ejecuto:
  ```
  supabase login --token <PAT>
  supabase link --project-ref vcfevlpoqwnsvkwfoprv
  supabase db push
  ```
- **(B) Service Role Key:** copiar en Dashboard → Settings → API → `service_role` (la necesita el .env de todos modos).
- **(C) Password de la DB:** Dashboard → Settings → Database → Connection string `postgresql://postgres.vcfevlpoqwnsvkwfoprv:<password>@...` (para psql).

Además, copiar la `service_role` key (opción B) para llenar `SUPABASE_SERVICE_ROLE_KEY` (hoy `PENDIENTE`).

### 4.2 SMTP o auto-confirmación de email (para que el registro complete)
En Supabase Dashboard → Auth → Settings:
- Configurar **SMTP** (ej. app password de Gmail), **o**
- Desactivar "Confirm email" (auto-confirm), **o**
- Tras aplicar migraciones, el RPC `auto_confirm_user` (00043) resolverá el auto-confirm desde la app (con service role key set).

### 4.3 Stripe — claves válidas + precios + webhook
- Generar claves live reales en Stripe Dashboard (`sk_live_...` corta, `pk_live_...`).
- Reemplazar `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Crear Product/Prices **PRO (9.99) y CUBA_PLUS (14.99)** → copiar `price_...` reales a `NEXT_PUBLIC_STRIPE_PRICE_PRO` / `NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS`.
- Crear webhook endpoint → `STRIPE_WEBHOOK_SECRET`.

### 4.4 Gemini — resolver cuota 429
- Habilitar facturación o subir plan en Google AI Studio / Google Cloud (proyecto `gen-lang-client-0540885858` o el asociado a la key `AQ.`).

### 4.5 Admin real
- `ZAFIRO_ADMIN_PASSWORD` está en placeholder (`CAMBIA-ESTE-PASSWORD`) → definir contraseña real del owner y ejecutar `/api/admin/seed-owner` una vez.

### 4.6 Push de commits (opcional)
- Hay 3 commits nuevos locales (base + fix register + fix E2E). El deploy a Vercel ya se hizo por CLI. Push a `origin` (`github.com/MSM2024/market.msmmystore.com.git`) solo si se desea sincronizar el remoto.

---

## 5. ERRORS PENDIENTES (resumen)

| # | Error | Servicio | Bloqueo | Cómo se resuelve |
|---|---|---|---|---|
| 1 | 60 migraciones sin aplicar | Supabase | ALTO | §4.1 |
| 2 | 401 Stripe (claves inválidas) | Stripe | ALTO | §4.3 |
| 3 | 429 cuota Gemini | ELIANA | ALTO | §4.4 |
| 4 | Registro 429 (rate limit signups IP) + sin auto-confirm | Auth | MEDIO | §4.2 + espera ventana |
| 5 | Admin no puede loguear (password desconocida) | Auth | ALTO | §4.5 / reset vía service key |
| 6 | `SUPABASE_SERVICE_ROLE_KEY` PENDIENTE | Supabase | MEDIO | §4.1B |
| 7 | `ELIANA_API_KEY` sin definir (endpoints sin bearer) | Seguridad | ALTO | definir env |
| 8 | Tablas de knowledge/eliana/marketplace vacías → 500 en sus APIs | Data | ALTO | §4.1 |

---

## 6. ESTADO DE VERIFICACIÓN (código)
- `pnpm lint` → 0 errores / 0 warnings
- `pnpm typecheck` → 0
- `pnpm test` → 88/88
- `pnpm build` → 140 páginas
- `pnpm exec playwright test` contra PRODUCCIÓN → 28/28
