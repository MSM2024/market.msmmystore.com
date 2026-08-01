# CIERRE C7 — AUTOR DE LIBROS CON IA (2026-08-01)

Rama: `finish-zafiro-eliana` · Modo: local, sin push ni deploy · Motor: Gemini (`gemini-2.0-flash`).

## Resumen

Se implementó el **Autor IA** completo sobre el esquema del Consejo Invisible (`invisible_council_books`):
un libro se define (título/subtítulo/propósito/lector/voz/estilo), se genera el outline con IA, se crean
capítulos y secciones generadas por Gemini con contexto RAG de la Biblioteca Viva, y se publica el resultado
en la Biblioteca Viva (`library_books/chapters/chunks/versions`) quedando pendiente de revisión.

## Entregables

| Componente | Archivos |
|---|---|
| Migración aditiva 00057 | `supabase/migrations/00057_autor_ia_books.sql` (columnas `outline`, `voice`, `style_guide`, `published_book_id`, `generation_metadata`; índice; reversible, sin tocar RLS) |
| Motor de escritura | `src/lib/autor-ia/engine.ts` (generateText, extractSectionsFromMarkdown, sanitizeGeneratedText), `src/lib/autor-ia/prompts.ts` |
| Persistencia | `src/lib/autor-ia/repository.ts` (CRUD books/chapters/sections, auditoría `invisible_council_ai_interactions`, publishToLibrary) |
| API (owner-only) | `src/app/api/consejo/autor/route.ts`, `[bookId]/route.ts`, `[bookId]/outline/route.ts`, `[bookId]/chapters/route.ts`, `[bookId]/publish/route.ts`, `chapters/[chapterId]/route.ts`, `chapters/[chapterId]/generate/route.ts`, `chapters/[chapterId]/sections/route.ts` |
| UI | `src/app/admin/autor-ia/page.tsx` + `src/components/autor-ia/AutorIaAdmin.tsx` |
| Tests | `src/__tests__/autor-ia.test.ts` (14 tests) |

## Decisiones de seguridad/configuración segura

- Todas las rutas exigen `requireOwner()` (owner/superadmin) en el servidor.
- Escrituras council mediante **cliente admin (service role)** tras autenticar al owner: evita depender del
  estado de `council_user_roles` en la nube (se registra como pendiente e2e).
- Publicación a Biblioteca Viva: status `pendiente_revision`, privacidad derivada de la visibilidad del libro
  council (public→publico, members/team→comunidad, family→familia, resto→privado_don_miguel). Nada se publica directo.
- Rate limiting por IP en rutas de generación (outline 6/min, capítulo 6/min, sección 10/min, creación 10/min).
- Sin generar contenido fuera del modelo autorizado; el motor devuelve error 502 claro si falta `GOOGLE_API_KEY`.

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npx eslint <carpetas C7>` → 0 errores (0 warnings en código C7).
- `npm test` → 47/47 (14 nuevos de Autor IA).
- `npm run build` → OK (incluye `/admin/autor-ia` y 8 rutas API nuevas).

## Pendientes registrados (PENDIENTES_ZAFIRO.md)

1. Aplicar migraciones 00054–00057 en Supabase (Fase 0).
2. Validar e2e que el owner pueda insertar en tablas council bajo RLS (o ajustar política) — ver bloqueo.
3. Confirmar clave Gemini válida y presupuesto del modelo.
4. Editar/eliminar contenido generado por IA queda en manos del panel (el borrador no se auto-aprueba).
