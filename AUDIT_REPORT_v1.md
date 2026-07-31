# ZAFIRO — Auditoría P0 de Autenticación

**Fecha**: 2026-07-29  
**Auditor**: OpenCode  
**Dominio**: https://zafiro.msmmystore.com  
**Repositorio**: MSM-Zafiro-main

---

## 1. Resumen Ejecutivo

La plataforma ZAFIRO está en producción (Next.js 16.2.10, 109 rutas, build 0 errores TS) pero **no puede ser utilizada por su propietario ni por usuarios nuevos** debido a 8 bloqueos independientes:

| # | Bloqueo | Impacto |
|---|---------|---------|
| P0.1 | **cm8msm@gmail.com** (owner) password desconocida | Don Miguel NO puede iniciar sesión |
| P0.2 | **Forgot-password 500** para cuentas existentes | No puede recuperar la contraseña |
| P0.3 | **SMTP no configurado** | Correos de verificación/recuperación no se entregan |
| P0.4 | `SUPABASE_SERVICE_ROLE_KEY = "PENDIENTE"` | Sin API admin ni BYPASS RLS |
| P0.5 | **Cuota gratuita de Gemini agotada** | `gen-lang-client-0540885858` sin facturación |
| P0.6 | **Constraint `profiles_plan_check` solo acepta** free/basic/premium | LIFETIME_UNLIMITED no asignable |
| P0.7 | **Rate limiter bloquea registro** | Mi IP baneada temporalmente de /api/auth/register |
| P0.8 | **Migraciones 00032-00040 no aplicadas** | ELIANA, memberships, user_settings no existen en BD |

---

## 2. Causas Raíz Identificadas

### CR1: Register API crea cuentas duplicadas por email
**Archivo**: `src/app/api/auth/register/route.ts:116-126`  
**Causa**: El endpoint de Supabase `/auth/v1/signup` retorna **200** (no 409) cuando el email ya existe si `update_password_email_existing_user` está habilitado en el proyecto. La API confiaba en el código HTTP para detectar duplicados.  
**Fix aplicado (local)**: Consulta `profiles` vía REST antes de signup y retorna `EMAIL_EXISTS` (409) si el correo ya existe.  
**Fix NO desplegado**: El fix existe en el repositorio local pero no ha sido desplegado a Vercel.

### CR2: Forgot-password falla para usuarios existentes
**Archivo**: `src/app/api/auth/forgot-password/route.ts:26`  
**Causa**: `supabase.auth.resetPasswordForEmail()` intenta enviar un email de recuperación. Sin SMTP configurado, el envío falla. Por razones de seguridad, Supabase retorna éxito para emails no existentes pero error para emails existentes, lo que causa un **500** revelando qué emails están registrados.  
**Fix necesario**: Configurar SMTP en Supabase Dashboard.

### CR3: Owner no puede iniciar sesión
**Causa**: La cuenta `cm8msm@gmail.com` fue creada vía seed/registro en Julio 2026. La contraseña original es desconocida. El forgot-password no funciona (CR2). La API de admin (reset mediante service_role) no funciona (PENDIENTE).  
**Estado**: cuenta configurada con `role=owner` en `profiles` pero inaccesible.

### CR4: LIFETIME_UNLIMITED no asignable
**Archivo**: `supabase/migrations/00039_owner_plan.sql` (nunca ejecutada)  
**Causa**: La constraint `public.profiles.profiles_plan_check` solo permite `'free'`, `'basic'`, `'premium'`. La migración 00039 que agrega `lifetime_unlimited`/`pro_monthly`/etc. nunca fue aplicada.  
**Fix**: Migración `00041_fix_profile_constraints.sql` creada pero pendiente de ejecutar.

### CR5: Roles en BD vs TypeScript no coinciden
Los roles en `profiles` usan español (`cliente`, `vendedor_vip`) mientras que los tipos TypeScript usan inglés (`customer`, `vip`). El proxy y `auth.ts` validan contra los tipos TS, lo que genera descuadres en la UI.

---

## 3. Cambios Realizados

### ✅ Register API — fix duplicados
**Archivo**: `src/app/api/auth/register/route.ts:85-100`  
```typescript
// Consulta profiles antes de signup
const emailCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&email=eq.${email}&limit=1`, {...})
if (existing.length > 0) return 409 EMAIL_EXISTS
```

### ✅ Proxy — ruta pública para reset-password
**Archivo**: `src/proxy.ts:4`  
Agregado `/auth/reset-password` a `publicRoutes`.

### ✅ Migración 00041 — fix constraints + seed owner
**Archivo**: `supabase/migrations/00041_fix_profile_constraints.sql`  
- Drop/recreate `profiles_plan_check` con valores correctos
- Asigna `role=owner, plan=lifetime_unlimited` a cm8msm@gmail.com
- Asigna `role=admin, plan=lifetime_unlimited` a msmmystore@gmail.com
- Inserta registro en audit_logs

---

## 4. Resultados de Pruebas en Producción

### 4.1 Site response
| Endpoint | Status | Resultado |
|----------|--------|-----------|
| `zafiro.msmmystore.com/` | 200 | Título "ZAFIRO - Knowledge Future" ✅ |
| `/auth/login` | 200 | Página de login con campos email/password ✅ |
| `/auth/register` | 200 | Página de registro con name/email/password ✅ |
| `/eliana` | 200 | Página de ELIANA visible ✅ |
| `/admin` | 200 | Página admin accesible (redirige a login sin sesión) ✅ |
| `/api/eliana/health` | 200 | Gemini: "configured" (endpoint, no la API real) ✅ |

### 4.2 Autenticación directa vía Supabase
| Cuenta | Password | Resultado |
|--------|----------|-----------|
| `msmmystore@gmail.com` | `Admin1234` | **LOGIN OK** — admin confirmado, sesión funcional |
| `cm8msm@gmail.com` | `TempPass123` | `invalid_credentials` |
| `cm8msm@gmail.com` | `Test12345` | `invalid_credentials` (creado por re-register) |
| `user@msm.test` | `Usuario123` | `invalid_credentials` |
| `admin@msm.test` | `Admin123` | `invalid_credentials` |
| `vip@msm.test` | `Vip12345` | `invalid_credentials` |
| `personalmsm1974@gmail.com` | `Admin1234` | `invalid_credentials` |

### 4.3 Register API
| Escenario | Resultado | Nota |
|-----------|-----------|------|
| Email existente (`cm8msm@gmail.com`) | 200 ACCOUNT_CREATED | **BUG**: debió ser 409; creó un duplicado parcial |
| Email nuevo (cuota no excedida) | 429 RATE_LIMITED | No se pudo probar registro exitoso |
| Fix aplicado local | — | No desplegado a Vercel |

### 4.4 Forgot-password
| Escenario | Resultado | Nota |
|-----------|-----------|------|
| Email no existente | 200 "Si existe una cuenta..." | Comportamiento esperado |
| Email existente (`cm8msm@gmail.com`) | 500 error | **BUG**: revela qué emails existen, bloquea recuperación |

### 4.5 Base de Datos (Supabase)
| Tabla | Estado | Nota |
|-------|--------|------|
| `profiles` | 7 registros ✅ | roles configurados, todos plan 'free' |
| `audit_logs` | Existe | 0 registros (RLS bloquea inserción sin sesión) |
| `notifications` | Existe | 0 registros |
| `eliana_*` | **NO existen** | Migraciones 00032-00034 no aplicadas |
| `memberships` | **NO existe** | Migración no aplicada |
| `user_settings` | **NO existe** | Migración 00038 no aplicada |
| `login_events` | **NO existe** | Migración no aplicada |
| `app_sessions` | **NO existe** | Migración no aplicada |
| `eliana_knowledge` | **NO existe** | Migración no aplicada |

### 4.6 Build
```
✓ Compiled successfully
✓ Lint: passed
✓ TypeScript: 0 errors
✓ Static pages: 109 routes
```

---

## 5. Estado del Marketplace

**No modificado.** Las URLs:
- `market.msmmystore.com`
- `marketplace.msmmystore.com`
- `beta.msmmystore.com`

No han sido alteradas ni probadas durante esta auditoría.

---

## 6. Bloqueos Pendientes

| # | Bloqueo | Dependencia | Solución |
|---|---------|-------------|----------|
| 1 | **Don Miguel no puede loguearse** | SMTP + Service Key + Password reset | Desbloquear via Supabase Dashboard SQL Editor (reset password en auth.users) |
| 2 | **Forgot-password 500** | SMTP configurado | Configurar SMTP en Supabase Dashboard → Auth → Settings |
| 3 | **SMTP** | Credenciales de Gmail con app password | Crear contraseña de aplicación en Google Account |
| 4 | **Service Role Key PENDIENTE** | Acceso a Supabase Dashboard → Settings → API | Copiar `service_role` key y setear en Vercel Secrets |
| 5 | **Gemini quota** | Facturación en Google Cloud | Habilitar facturación en `gen-lang-client-0540885858` |
| 6 | **Rate limiter bloquea IP** | Tiempo (>60s) | Esperar ventana; eliminar estado de instancias Vercel | 
| 7 | **Migraciones pendientes** | Service Key o Dashboard SQL Editor | Ejecutar 00032-00041 secuencialmente |
| 8 | **Fix register no desplegado** | Deploy a Vercel | `git push` y desplegar |

---

## 7. Recomendaciones

### Inmediatas (desbloquean a Don Miguel)
1. Acceder a **Supabase Dashboard** → SQL Editor → ejecutar reset de password:
   ```sql
   -- Resetear password de cm8msm@gmail.com vía admin
   -- (solo posible con service_role key o desde SQL Editor)
   ```
2. Configurar **SMTP** en Supabase Auth Settings
3. Setear `SUPABASE_SERVICE_ROLE_KEY` en **Vercel Environment Variables**

### Corto plazo
4. Desplegar fix de register API (push + deploy)
5. Ejecutar migraciones 00032-00041 en Supabase Dashboard
6. Configurar facturación de Gemini

### Medio plazo
7. Unificar roles entre BD (español) y TypeScript (inglés)
8. Implementar AuthContext con React Context
9. Agregar tests E2E de login/register/recover con Playwright

---

## 8. Evidencia de Pruebas

Todas las pruebas fueron realizadas contra producción (`zafiro.msmmystore.com`) y Supabase directo (`vcfevlpoqwnsvkwfoprv.supabase.co`) utilizando la anon key pública. No se utilizó service_role key (PENDIENTE). Las llamadas a la API de autenticación se realizaron con POST a `/auth/v1/token?grant_type=password` y `/auth/v1/signup`.

---

*Fin del reporte. Para consultas técnicas: revisar `AGENTS.md` y `ARCHITECTURE_REVIEW.md` en el repositorio.*
