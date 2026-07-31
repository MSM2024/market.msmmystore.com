# TAREA 1.2 — Endurecer auth en API (P0)

**Fecha:** 2026-07-31
**Estado:** ✅ Código implementado y verificado · ⏳ Validación e2e pendiente (requiere claves Supabase/Stripe reales, Fase 0)

## Problema (de la auditoría real 2026-07-30)

Rutas API con mutaciones y datos internos **sin verificación de sesión ni rol**:

- `api/biblioteca/*` (8 rutas): POST/PUT/DELETE de libros, capítulos, personas, lugares, fuentes, aprobaciones, trabajos de importación **abiertos a cualquiera**; GET de aprobaciones e imports (datos internos del flujo editorial) también abiertos.
- `api/knowledge/seed`: POST (siembra la base de conocimiento) y GET (stats) abiertos.
- `api/stripe/checkout|billing|portal`: aceptaban `userId`/`customerId` del **body sin verificar sesión** → un atacante podía crear un checkout a nombre de otro usuario o manipular una suscripción ajena (`customerId` libre en billing `subscribe` y en portal).
- `api/eliana/health`: GET abierto (revela si Gemini está configurado).

Problema adicional detectado al inspeccionar el código: `BibliotecaRepository` usa `getSupabaseClient()` (**cliente browser**, `src/lib/supabase.ts`), que en una ruta server-side no lleva las cookies de sesión → RLS vería `auth.uid()=null` y **el gate de auth no tendría efecto** sobre qué filas devuelve el repo.

## Solución aplicada

### Nuevo `src/lib/api-auth.ts`
- `requireAuth()` → 503 si Supabase no configurado; 401 sin sesión (`auth.getUser()`); devuelve `{ userId, email, role }` (rol desde `profiles.role`, default `customer`).
- `requireAdmin()` → `requireAuth` + 403 si el rol no está en `owner|admin|superadmin`.
- `ADMIN_ROLES` exportado (misma lista que `proxy.ts` y la migración 00037).

### `src/lib/biblioteca/repository.ts`
- `BibliotecaRepository` ahora acepta un cliente por constructor (`new BibliotecaRepository(serverClient)`); si no se pasa, mantiene el comportamiento anterior (cliente browser singleton). Así las rutas API usan **`getSupabaseServerClient()` per-request** → el JWT de la cookie es el que ve RLS.

### Rutas endurecidas (401 sin sesión / 403 sin rol admin)

| Ruta | Antes | Ahora |
|---|---|---|
| `api/biblioteca/books` GET | público (fallback) | público + cliente server (RLS real) |
| `api/biblioteca/books` POST | abierto | admin |
| `api/biblioteca/books/[id]` GET | público (fallback) | público + cliente server |
| `api/biblioteca/books/[id]` PUT/DELETE | abierto | admin |
| `api/biblioteca/approvals` GET/POST | abierto | admin |
| `api/biblioteca/chapters` POST/PUT | abierto | admin |
| `api/biblioteca/imports` GET/POST | abierto | admin |
| `api/biblioteca/people` GET/POST | abierto | admin |
| `api/biblioteca/places` GET/POST | abierto | admin |
| `api/biblioteca/sources` GET/POST | abierto | admin |
| `api/knowledge/seed` GET/POST | abierto | admin |
| `api/stripe/checkout` POST | userId del body sin verificar | sesión requerida; `userId` real en metadata + `client_reference_id`; se ignora `userId` del body |
| `api/stripe/billing` GET | público | público (catálogo de planes, sin datos sensibles) |
| `api/stripe/billing` POST | `customerId` del body sin verificar | sesión requerida; `subscribe` resuelve/crea el cliente por el **email de la sesión**; `cancel`/`reactivate`/`upgrade` verifican propiedad vía `metadata.userId` o `customer` de la suscripción (403 si no coincide) |
| `api/stripe/portal` POST | `customerId` del body sin verificar | sesión requerida; cliente resuelto por email de la sesión; se ignora `customerId` del body |
| `api/eliana/health` GET | abierto | sesión requerida (cualquier usuario logueado) |

Los GET públicos de `biblioteca` (books y books/[id]) se mantienen públicos porque los consumen las páginas públicas `/biblioteca` y `/biblioteca/[id]`; la protección de datos sigue garantizada por RLS **ahora con el cliente server** (el JWT de la cookie se respeta).

## Verificación realizada

- `next build`: ✅ OK — 127 páginas, TypeScript OK, Proxy (Middleware) compilado.
- `vitest run`: ✅ 9/9.
- `eslint` sobre los 15 archivos tocados: ✅ 0 errores, 0 warnings.
- `tsc --noEmit`: ✅ sin errores nuevos (solo los 15 pre-existentes de `src/__tests__/setup.ts`).
- `git status`: exactamente los 15 archivos esperados (14 modificados + `src/lib/api-auth.ts` nuevo), sin regenerados.

## Pendiente (bloqueado — Fase 0)

- Claves Supabase reales: verificar que sin sesión → 401 y que usuario no-admin → 403 en cada ruta.
- Claves Stripe reales: validar checkout con `userId` real en metadata y rechazo de suscripciones ajenas.
- Fase 0.4: aplicar migraciones 00001–00044 antes de la validación e2e.

## Nota

- El resto de callers de `bibliotecaRepo` (singleton, cliente browser) no cambian de comportamiento: scripts server-side de biblioteca (`seed-catalog`, `search`, `google-drive-sync`) y componentes clientes siguen usando el cliente browser. El binding al cliente server es solo en las rutas API (per-request).
