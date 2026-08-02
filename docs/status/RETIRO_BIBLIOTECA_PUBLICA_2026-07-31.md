# RETIRO DE LA BIBLIOTECA DEL ÁREA PÚBLICA — 2026-07-31

**Estado final: ✅ RETIRADA DEL ÁREA PÚBLICA Y PROTEGIDA (código) · ⏳ Validación e2e con claves reales (Fase 0)**

## Problema

`https://zafiro.msmmystore.com/biblioteca` (y `/biblioteca/[id]`) exponían el catálogo personal de Don Miguel a cualquier visitante, cliente o miembro de ZAFIRO. Además:

- Enlaces públicos en: menú superior de inicio, menú móvil (BottomNav), footer, accesos rápidos de ELIANA.
- APIs `api/biblioteca/*` sin restricción de lectura (GET books público; solo escrituras admin tras la tarea 1.2).
- **RLS abierto en la base de datos**: `00044_biblioteca_viva.sql` permitía SELECT anónimo de libros `privacy_level IN ('publico','comunidad')` (`books_select_privacy`), versiones/capítulos/chunks de esos libros, y `*_select_all` en `library_people`, `library_places`, `library_topics`, `library_book_*` y `library_relationships`. Además `admin` tenía acceso de lectura/escritura en todas las tablas.

## Solución aplicada

### 1. Bloqueo de la ruta pública `/biblioteca` (server-side en `src/proxy.ts`)

Nueva lista `ownerOnlyRoutes = ["/biblioteca", "/admin/biblioteca-importacion"]` y regla:

| Visitante | Resultado |
|---|---|
| Sin sesión en `/biblioteca*` o `/admin/biblioteca-importacion` | → redirect a `/` |
| Sesión con rol `owner` o `superadmin` | → acceso (área privada) |
| Cualquier otro rol autenticado (incluido `admin`, `seller`, `customer`) | → redirect a `/dashboard` |

### 2. Retiro de enlaces públicos (sin crear módulo nuevo)

| Archivo | Antes | Después |
|---|---|---|
| `src/app/page.tsx` (menú top desktop) | `Biblioteca → /biblioteca` | `Mis Pedidos → /marketplace/pedidos` |
| `src/components/BottomNav.tsx` (nav móvil) | `Biblioteca → /biblioteca` | `Pedidos → /marketplace/pedidos` |
| `src/components/Footer.tsx` | `Biblioteca Viva → /biblioteca` | `Mis Pedidos → /marketplace/pedidos` |
| `src/app/eliana/page.tsx` (accesos rápidos) | `Biblioteca Viva → /biblioteca` | `Mis Pedidos → /marketplace/pedidos` |

No existe sitemap ni `robots.txt` en el proyecto (verificado); el layout raíz tiene metadata genérica de ZAFIRO, sin contenido personal. Las páginas `/biblioteca` no exportan metadata/OpenGraph.

### 3. Autorización server-side en las APIs (`src/lib/api-auth.ts`)

Nuevo helper `requireOwner()` (roles `owner` | `superadmin`; 401 sin sesión, 403 sin permiso). Se aplica a **las 8 rutas** `api/biblioteca/*` (GET y POST/PUT/DELETE), reemplazando `requireAdmin`:

`books`, `books/[id]`, `approvals`, `chapters`, `imports`, `people`, `places`, `sources`.

Un cliente sin token → 401. Un cliente autenticado que no sea owner/superadmin → 403. Las rutas usan `getSupabaseServerClient()` per-request (tarea 1.2), así que el JWT de la cookie es el que ve RLS.

### 4. Cierre de RLS en base de datos (`supabase/migrations/00046_biblioteca_privada.sql`)

- Se **eliminan todas las políticas** de `00044` (incluidas `books_select_privacy`, `versions/chapters/chunks_select_privacy`, `people/places/topics_select_all`, `book_*_select`, `relationships_select`).
- Se **recrean** para **todas** las tablas `library_*` con check exclusivo `role IN ('owner','superadmin')` en SELECT, INSERT, UPDATE y DELETE.
- `admin` pierde todo acceso a la biblioteca a nivel de base de datos (antes podía leer/escribir).
- `search_library_chunks()` (función de búsqueda RAG) queda protegida por el nuevo RLS: un llamador anónimo no obtiene filas.
- La numeración usa el hueco `00046` (00045 queda reservada para Knowledge Core, tarea 2.1).

### 5. Revisión de datos y componentes (inventario)

- **Tablas**: `library_sources, library_books, library_versions, library_chapters, library_chunks, library_people, library_places, library_topics, library_book_people, library_book_places, library_book_topics, library_relationships, library_import_jobs, library_approvals, library_access_logs` → todas en `00046` con RLS owner/superadmin.
- **Endpoints**: `api/biblioteca/*` (8) → `requireOwner`. Sin otros callers HTTP de `bibliotecaRepo`.
- **Componentes**: `src/app/biblioteca/*` (páginas privadas) y `src/app/admin/biblioteca-importacion` (herramienta de importación del owner). Ambos protegidos por el gate de `proxy.ts`.
- **Fallback**: `src/lib/biblioteca/fallback.ts` (datos de catálogo) solo se importa en rutas API server-side — nunca llega al bundle del cliente. Con `requireOwner`, solo se sirve al owner.
- **Nada público responde contenido**: GET `books` ya no es público (requiere owner). El buscador público del feed no indexa la biblioteca. ELIANA usa su propio corpus (`knowledge-data.ts`, dominio Knowledge Core, tarea 2.1) — se deja intacto.
- **Marketplace: no modificado.**

## Área privada donde quedó el contenido

- `/biblioteca` y `/biblioteca/[id]` — visor de la biblioteca, solo owner/superadmin.
- `/admin/biblioteca-importacion` — importación y gestión, solo owner/superadmin (la tarjeta en el Automation Center `/admin` se conserva).

## Pruebas realizadas

- `npx next build`: ✅ 127 páginas, TypeScript OK, Proxy (Middleware) compilado.
- `npx vitest run`: ✅ 9/9.
- `npx eslint` (14 archivos tocados): ✅ 0 errores (warnings pre-existentes en `page.tsx`/`eliana/page.tsx`).
- `npx tsc --noEmit`: ✅ sin errores nuevos (solo los 15 pre-existentes de `src/__tests__/setup.ts`).
- Revisión manual del SQL de `00046` línea a línea (sin Postgres local ni Supabase CLI).

## Pruebas obligatorias pendientes (requieren claves Supabase reales — Fase 0)

| Caso | Esperado |
|---|---|
| No autenticado visita `/biblioteca` (URL directa, móvil, navegación) | redirect a `/` |
| Cliente autenticado (`customer`/`seller`/`vip`) visita `/biblioteca` | redirect a `/dashboard` |
| `admin` (normal) visita `/biblioteca` o `/admin/biblioteca-importacion` | redirect a `/dashboard` |
| `owner`/`superadmin` visita `/biblioteca` | ve el contenido (área privada) |
| `GET /api/biblioteca/books` sin token | 401 |
| `GET /api/biblioteca/books` con rol no-owner | 403 |
| `GET /api/biblioteca/books` con owner | 200 |
| Consulta SQL anónima a `library_books` / `library_people` / etc. | 0 filas (RLS) |
| Búsqueda pública | sin resultados de biblioteca |

## Archivos modificados

- `src/proxy.ts` — gate owner-only (`/biblioteca*`, `/admin/biblioteca-importacion`).
- `src/lib/api-auth.ts` — `requireOwner()` + `OWNER_ROLES`.
- `src/app/api/biblioteca/{books,books/[id],approvals,chapters,imports,people,places,sources}/route.ts` — `requireAdmin` → `requireOwner`.
- `supabase/migrations/00046_biblioteca_privada.sql` — **nueva**, RLS owner/superadmin.
- `src/app/page.tsx`, `src/components/Footer.tsx`, `src/components/BottomNav.tsx`, `src/app/eliana/page.tsx` — retiro de enlaces, sustituidos por "Mis Pedidos".

## Nota

- Los datos de Don Miguel **no se borran**: las tablas `library_*` se conservan intactas; solo se restringe el acceso.
- 00045 sigue reservada para Knowledge Core; el retiro usa el hueco 00046 (se aplica después de 00044 y de la taxonomía 00037).
