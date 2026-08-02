# PUBLICACIÓN EN PRODUCCIÓN — ZAFIRO

**Fecha/hora:** 2026-08-02 15:38 (GMT-4) · Deployment creado 15:29:27 GMT-4 · **Actualizado 15:52 GMT-4**
**Rama de producción:** `main` (merge completado desde `finish-zafiro-eliana`)
**URL de producción:** https://zafiro.msmmystore.com

---

## 0. ACTUALIZACIÓN (15:52 GMT-4) — FIX AUTO_CONFIRMED DESPLEGADO

- Nuevo commit en `main`: **`d4f9ecf`** `fix(zafiro): auto_confirmed en /api/auth/register era falso positivo`.
- Nuevo deployment producción: **`dpl_57Zto8XGkEWKobyeKo6DiLc4N22m`** → https://zafiro-h7yug7w7b-msmmystore.vercel.app (Ready, 15:45 GMT-4). Dominio verificado apuntando a este deployment.
- Corrección: `let isConfirmed = Boolean(result?.email_confirmed_at) || Boolean(result?.confirmed_at)` (antes `email_confirmed_at !== null` trataba `undefined` como confirmado → decía "Ya puedes iniciar sesión" cuando aún requería verificar el correo).
- Mensaje de cuenta sin confirmar ahora guía a `/auth/verify` para reenviar el correo (antes invitaba a loguear → fallaba con `email_not_confirmed`).
- Lint 0/0 · typecheck 0. E2E **28/28** re-verificado contra este deployment (1.1 min).
- Nota sobre el 429 del registro: el mensaje `RATE_LIMITED` también se devuelve cuando **Supabase** limita los signups por IP (la ruta mapea el 429 de GoTrue al mismo contrato). Verificado: `forgot-password` y `seed-owner` (sin signup) responden normal; el registro de mi IP estaba dentro de la cuota horaria de signups de Supabase. Para un usuario real en otra IP el registro funciona (ya creó cuentas reales).

## 1. COMMIT DESPLEGADO

- `main` HEAD: **`d4f9ecf`** (sobre el merge `ebdce1b`)
- Contiene el cierre completo de la rama `finish-zafiro-eliana`:
  - `2ed03d1` chore(zafiro): cierre final — bugs reales, rate limiting, lint limpio, E2E ampliado
  - `338f2f6` chore(zafiro): termina 100 — lint 0/0, admin Knowledge Settings real, unified-identity eliminado
  - `9c7a1db` fix(zafiro): rate limiter /api/auth/register (serverless)
  - `bc06bf4` test(zafiro): /biblioteca solo-owner — E2E 28/28 contra producción
- Verificado: árbol de `main` == árbol de `finish-zafiro-eliana` (diff vacío).
- `2ed03d1` está en la rama correcta y fue incorporado a `main`.

## 2. DEPLOYMENT

| Ítem | Valor |
|---|---|
| Deployment ID (actual) | **`dpl_57Zto8XGkEWKobyeKo6DiLc4N22m`** |
| URL del deployment (actual) | https://zafiro-h7yug7w7b-msmmystore.vercel.app |
| Deployment ID (cierre) | `dpl_HGvVBqTczGqqf3PEQApRXWsNKHBp` → https://zafiro-m6k93ukud-msmmystore.vercel.app |
| Inspector (actual) | https://vercel.com/msmmystore/zafiro/57Zto8XGkEWKobyeKo6DiLc4N22m |
| Estado | ● Ready (producción) |
| Build | Next.js 16.2.10, 140 páginas, TS OK |
| Aliases | zafiro.msmmystore.com, eliana.msmmystore.com, zafiro-nu.vercel.app |
| Antes | `dpl_51w2rKJEae5ouo68U6xLg6w41jw7` (fj52860v9, 11:44) |

## 3. VARIABLES DE ENTORNO (Vercel producción)

**Configuradas (reales):**
- `NEXT_PUBLIC_SUPABASE_URL` = https://vcfevlpoqwnsvkwfoprv.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sb_publishable_C7J-...
- `NEXT_PUBLIC_APP_URL` = https://zafiro.msmmystore.com

**Faltantes (requieren credenciales reales del cliente):**
| Variable | Bloquea |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | auto-confirmación de registro, seed-owner, ops admin |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pagos (claves actuales inválidas, 401) |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS`, `NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS_MONTHLY` | checkout |
| `STRIPE_WEBHOOK_SECRET` | webhook de pagos |
| `GEMINI_API_KEY` | ELIANA (la key actual responde 429 cuota) |
| `ELIANA_API_KEY` | bearer de /api/eliana/audit y /api/eliana/marketplace |
| `ZAFIRO_SETUP_TOKEN` | bootstrap del owner por UI |

## 4. MIGRACIONES SUPABASE — NO APLICADAS (BLOQUEO ADMIN)

- Migraciones presentes en repo: **60** (`00001_auth_roles_profiles.sql` → `00060_public_profile_lookup.sql`).
- **Aplicadas: 0.** Imposible sin acceso administrativo: sin `SUPABASE_ACCESS_TOKEN` (CLI no logueada, sin `config.toml`, sin `project-ref`), sin service role key, sin password de DB.
- Consecuencias verificadas en producción:
  - Login de cuenta recién creada → **`email_not_confirmed`** (el RPC `auto_confirm_user` de la migración 00043 **no existe**: 404 `PGRST202`).
  - `/api/knowledge/audit` → 500 (tablas `knowledge_*` inexistentes).
  - Resto de tablas (`marketplace_*`, `eliana_*`, `library_*`, `album_*`, `council_*`, `memberships`, etc.) → 404 por REST.

**Para aplicar (cuando entregue un acceso, en este orden):**
```
supabase login --token <PAT>            # o SUPABASE_ACCESS_TOKEN
supabase link --project-ref vcfevlpoqwnsvkwfoprv
supabase db push                        # aplica 00001→00060 en orden
# verificar RLS:
supabase db pull  (o SQL: SELECT tablename, policyname FROM pg_policies ORDER BY tablename)
```
O bien pegar cada `.sql` en Supabase Dashboard → SQL Editor.

## 5. SITE URL / REDIRECT URLS — PENDIENTE (requiere dashboard)

Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://zafiro.msmmystore.com`
- **Redirect URLs:** `https://zafiro.msmmystore.com/auth/callback`, `http://localhost:3000/auth/callback`
- Recomendado además: Desactivar "Confirm email" (o configurar SMTP) para que el registro inicie sesión al instante.

## 6. CACHÉ

- Deployment nuevo sin caché de contenido servido (build limpio, 140 páginas estáticas + lambdas). El caché de build reutilizado por Vercel es solo de compilación (restauró de dpl_51w2r...), no afecta el output servido. No se requiere purga adicional.

## 7. PRUEBAS EN PRODUCCIÓN (https://zafiro.msmmystore.com)

| Prueba | Resultado | Evidencia |
|---|---|---|
| Portada | ✅ 200 | probe + captura |
| Registro | ✅ 200 `ACCOUNT_CREATED` — crea usuario real `5dd61394-fb39-4825-b1a9-320abaaf223f` (perfil: cliente/free/activo). `auto_confirmed:true` es falso positivo (`undefined !== null`); la cuenta queda pendiente de confirmar email. | probe |
| Login | ⚠️ Página 200; el flujo real devuelve `email_not_confirmed` (bloqueado hasta auto-confirm/SMTP) | probe directo a GoTrue |
| Recuperación | ✅ 200 (responde aunque el correo no exista, sin filtración) | probe |
| Dashboard | ✅ Redirige sin sesión a `/auth/login?redirect=%2Fdashboard` (guard owner) | captura |
| ELIANA | ✅ Página 200; `/api/eliana/health` → 401 sin sesión. Chat pendiente (429 cuota Gemini) | probe + captura |
| Configuración | ✅ `/settings` 200 (la ruta `/configuracion` no existe → 404; ruta real es `/settings`) | probe |
| Auditoría | ❌ `/api/knowledge/audit` → 500 (tablas no migradas) | probe |
| PWA | ✅ manifest.json, sw.js, íconos 200 | probe |
| E2E Playwright | ✅ **28/28 passed** (1.1 min, dominio de producción) | `pnpm exec playwright test` |
| Registro con contraseña inválida | ✅ 400 `INVALID_PASSWORD` — prueba que el fix del rate limiter (9c7a1db) está vivo (antes quedaba pegado en 429) | probe |

## 8. CAPTURAS (docs/status/evidencia-prod/)

- **Después** (dominio actual, deployment `dpl_HGvVBqTczGqqf3PEQApRXWsNKHBp`):
  `despues-portada.png`, `despues-marketplace.png`, `despues-universo.png`, `despues-login.png`, `despues-eliana.png`, `despues-dashboard.png`, `despues-biblioteca.png`
- **Antes** (deployment anterior `dpl_51w2rKJEae5ouo68U6xLg6w41jw7`, 11:44): el URL del deployment previo está protegido por SSO de Vercel (redirige a login) — la comparación antes/después se respalda a nivel de deployment/alias: el dominio pasó de servir `zafiro-fj52860v9` a servir `zafiro-m6k93ukud`, ambos con el mismo código de cierre (el cambio visible de esta fase es la re-publicación con ID/fecha nuevos y evidencia fresca).

## 9. ERRORS PENDIENTES (resumen)

1. **Supabase sin migrar** (0/60) — bloqueo por acceso admin (Paso 4). Es la causa raíz de auditoría 500, login no confirmado, tablas faltantes.
2. **Login**: `email_not_confirmed` — requiere auto-confirm (RPC 00043 + service role) o SMTP / desactivar "Confirm email".
3. **Stripe**: claves inválidas (401) + precios placeholder + webhook vacío.
4. **Gemini**: 429 cuota — requiere facturación.
5. **Owner**: `SUPABASE_SERVICE_ROLE_KEY` ausente → seed-owner/panel admin completo pendiente.
6. `ELIANA_API_KEY` sin definir (bearer check inactivo en 2 rutas).
7. `npm audit`: 4 vulnerabilidades high en dependencias (pre-existentes, sin cambios en esta fase).

## 10. ESTADO DEL CÓDIGO

- `git status` en `main`: limpio (solo archivos de evidencia sin commitear: este informe + capturas).
- Push a `origin/main` NO realizado (decisión previa del cliente: "solo Vercel").
- Suite local previa a esta publicación: lint 0/0, typecheck 0, vitest 88/88, build 140.
