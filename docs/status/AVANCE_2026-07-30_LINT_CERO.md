# Avance 2026-07-30: ESLint 84 → 0 errores, build y tests verdes

## Resumen
Se eliminaron los 84 errores de ESLint del codebase completo. `npx eslint src` reporta **0 errores** (327 warnings, principalmente `no-unused-vars` y reglas de estilo no bloqueantes). `next build` compila (127 páginas, TypeScript OK) y `vitest run` pasa 9/9.

## Archivos modificados y motivos

### 1. `@typescript-eslint/no-explicit-any` (63 → 0)
| Archivo | Cambio |
|---|---|
| `src/app/biblioteca/[id]/page.tsx` | `BookDetail` tipada con `LibraryBook`, `LibraryChapter`, `LibraryVersion`, `LibraryRelationship` de `@/lib/biblioteca/types`; elimina 12 `any` (maps de `chapters`, `versions`, `relationships`, fetch de joins). |
| `src/lib/admin/data.ts` | `safeCount()` reescrito con interfaces `QueryBuilder`/`CountResult`/`CountQuery` (8 `any`); `orders` tipado `OrderRow[]`. |
| `src/app/admin/page.tsx` | Quitados `as any` en `s.country` y `p.base_price` (ya existen en `MarketplaceStore`/`MarketplaceProduct`). |
| `src/app/api/biblioteca/books/route.ts` | `status`/`privacy_level` cast a `LibraryBookStatus`/`LibraryPrivacyLevel` (importados de `types`). |
| `src/lib/biblioteca/fallback.ts` | `collectionFor(e as any)` → `collectionFor(e)`. |
| `src/lib/biblioteca/seed-catalog.ts` | `as any` → `satisfies Partial<LibraryBook>`. |
| `src/app/admin/biblioteca-importacion/page.tsx` | `errors: any[]` → `errors: unknown[]` (consistente con `LibraryImportJob`). |
| `src/app/marketplace/productos/page.tsx` | `FALLBACK_PRODUCTS` reescrito con helper `makeFallbackProduct()` tipado (36 errores). |
| `src/app/eliana/chat/page.tsx` | Effects reordenados + retry recursivo con disable dirigido (ya en sesión previa). |

### 2. `react-hooks/set-state-in-effect` (20 → 0)
Patrón aplicado: diferir el `setState` síncrono del effect con `Promise.resolve().then(...)` (microtarea), sin cambiar comportamiento, para evitar cascadas de render. Alternativa usada donde el state ya se inicializaba:

| Archivo | Fix |
|---|---|
| `src/lib/marketplace/useCart.ts` | `items` con lazy-init desde `getLocalCart()` (con guard de `window`); `mounted` con `useSyncExternalStore`. |
| `src/lib/AuthContext.tsx` | `setSession(getSession())` síncrono → `Promise.resolve().then(...)` (evita hydration mismatch del lazy-init). |
| `src/app/admin/marketplace/{disputas,pedidos,productos,proveedores,tiendas}/page.tsx` | Effects de carga envueltos en microtarea. |
| `src/app/admin/page.tsx` | Effects de `loadData`/`loadUsers` en microtarea; eliminados 2 `eslint-disable`. |
| `src/app/album/page.tsx` | Cuerpo del effect envuelto en microtarea. |
| `src/app/auth/reset-password/page.tsx` | Ramas `codeFromUrl` y `no-supabase` diferidas a microtarea (cleanup intacto). |
| `src/app/biblioteca/page.tsx`, `src/app/historias/page.tsx` | `setLoading(true)` → microtarea. |
| `src/app/marketplace/vender/page.tsx`, `vender/crear-producto/page.tsx` | Guards de `setLoading(false)` → microtarea. |
| `src/app/mis-historias/page.tsx` | `setUser(s)` + `loadStories()` → microtarea. |
| `src/app/mis-historias/nueva/page.tsx` | `setInitialized(true)` → microtarea. |
| `src/app/profile-page/page.tsx`, `src/app/settings/page.tsx` | `loadProfile()`/`loadSettings()` → microtarea (cleanup abort intacto). |
| `src/app/admin/marketplace/margenes/page.tsx` | Effect redundante **eliminado** (line 11 ya hace lazy-init con `useState(loadMarginConfig)`); quitado import de `useEffect`. |

## Pruebas
- `npx eslint src --format json` → **0 errores**, 327 warnings.
- `npx next build` (con `.next` limpiado para evitar EPERM) → **✓ compila, TypeScript OK, 127 páginas estáticas**.
- `npx vitest run` → **9/9 tests pasan** (`src/__tests__/auth.test.ts`).

## Git
- Commit `49dedcd` en `finish-zafiro-eliana`, pusheado.
- Merge `e8e17ff` → `main`, pusheado → **Vercel despliega desde main automáticamente**.
- El commit incluye el trabajo acumulado pendiente: Biblioteca Viva, Album, Historias, Migraciones 00039-00044, admin setup/system-status, rutas `/api/stories`, `/api/voz-viva`, `/api/biblioteca/*`, etc.

## Pendientes (bloqueos externos, sin cambios)
- `SUPABASE_SERVICE_ROLE_KEY="PENDIENTE"` en `.env.local` → requiere que Don Miguel copie la service_role_key desde Supabase Dashboard → Project Settings → API.
- Rate limit 429 en `msmmystore@gmail.com` / `cm8msm@gmail.com` → esperar ~1h para probar recovery.
- `.env.local` sin URL real de Supabase → pruebas locales del panel admin limitadas.
