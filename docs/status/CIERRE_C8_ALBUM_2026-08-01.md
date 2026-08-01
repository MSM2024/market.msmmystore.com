# CIERRE C8 — ÁLBUM DE LA VIDA Y LEGADO (2026-08-01)

Rama: `finish-zafiro-eliana` · Modo: local, sin push ni deploy · Commit: `450debb`.

## Resumen

Se implementó el **Álbum de la Vida** completo: una familia del Álbum contiene miembros (con árbol genealógico
vía `parent_id`), una línea de tiempo de eventos y medios asociados. Todo bajo RLS por propietario (lectura
pública/comunidad, escritura del dueño o `is_admin_or_superadmin()`). Se integró con tabs en `/album` y un CTA
real desde `/ecosystem/album` (antes estabatico con "Próximamente").

## Entregables

| Componente | Archivos |
|---|---|
| Migración aditiva 00058 | `supabase/migrations/00058_album_vida.sql` (tablas `album_families`, `album_members`, `album_timeline_events`, `album_event_media`; RLS; triggers `handle_updated_at()`; índices) |
| Validación | `src/lib/album/validation.ts` (schemas Zod: family/member/event/media) |
| Persistencia | `src/lib/album/repository.ts` (CRUD + `familyOwnedBy`, tipos `AlbumFamilyRow`, `AlbumMemberRow`, `AlbumTimelineEventRow`, `AlbumFamilyDetail`) |
| API | `src/app/api/album/families/route.ts`, `families/[id]/route.ts`, `families/[id]/members/route.ts`, `families/[id]/events/route.ts`, `members/[id]/route.ts`, `events/[id]/route.ts` (rate limit + auth + Zod) |
| UI | `src/components/album/AlbumFamilies.tsx`, `AlbumTree.tsx`, `AlbumTimeline.tsx`; `src/app/album/page.tsx` (tabs historias/árbol/cronología) |
| Integración | `src/app/ecosystem/album/page.tsx` con CTA real a `/album` |
| Tests | `src/__tests__/album.test.ts` (17 tests) |

## Decisiones de seguridad/configuración segura

- RLS: solo el `owner_id` (o `is_admin_or_superadmin()`) puede escribir; lectura pública de lo publicado y
  lectura de comunidad/miembros según visibilidad. Se registra como pendiente la validación e2e en la nube.
- Todas las rutas de escritura validan con Zod, aplican rate limiting por IP y exigen sesión del propietario.
- El repositorio usa el cliente de sesión del servidor (nunca claves del servicio en el cliente).

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npx eslint` sobre carpetas C8 → 0 errores.
- `vitest run` → 64/64 (17 nuevos de Álbum).
- `npm run build` → OK (rutas `/album` y `/api/album/*` listadas).

## Pendientes registrados (PENDIENTES_ZAFIRO.md)

1. Aplicar migración 00058 en Supabase (Fase 0).
2. Validar e2e que el owner pueda insertar bajo RLS de 00058 en la nube.
3. Subida de medios reales (bucket Storage) pendiente de decisión/credenciales.
