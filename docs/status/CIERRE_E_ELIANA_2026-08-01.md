# CIERRE E — REPARACIÓN ELIANA Y DIAGNÓSTICO REAL (2026-08-01)

Rama: `finish-zafiro-eliana` · Modo: local, sin push ni deploy · Commits: `8f27163`, `66bd33b`, `c6404fc`, `a08eb0e`, `48efbfb`.

## Resumen

Cierre del bloque ELIANA: se corrigió el chat que quedaba en "ELIANA está reconectándose" y se
verificó el proveedor de IA con una **llamada real**. La causa raíz era una credencial placeholder
ensombreciendo a la clave real, más timeout corto y errores del proveedor tragados por el catch.

## Causa raíz (confirmada)

1. `GOOGLE_API_KEY` placeholder (`[SENSITIVE]`) en `.env.local` ensombrecía a `GEMINI_API_KEY` real
   porque la ruta usaba `GOOGLE_API_KEY || GEMINI_API_KEY`.
2. `TIMEOUT_MS` era 15 000 ms (lentitud del proveedor abortaba antes de responder).
3. El catch original devolvía respuesta de reserva genérica y ocultaba el error real (incluido 429).
4. Prueba live (2026-08-01): la clave real **autentica** en Google, pero **todas** las llamadas
   devuelven **HTTP 429 "quota exceeded"** → el bloqueo operativo actual es cuota/billing del
   proyecto, no el código. `gemini-2.5-flash` da 404 para cuentas nuevas; `gemini-2.0-flash` es válido.

## Entregables

| Componente | Detalle |
|---|---|
| `/api/chat` | `isUsableApiKey` (descarta placeholders), prioridad `GEMINI_API_KEY`, `TIMEOUT_MS=45_000`, reintentos solo 429/502/503/504 con backoff, idempotencia por `requestId` (`idempotencyMap` TTL 120 s + `inflightMap`), respuestas HTTP honestas (503/502/429/500), auth Supabase no bloquea el chat |
| Bug E2E corregido | El dedupe en vuelo compartía el mismo `NextResponse` → HTTP 500 en la 2ª petición concurrente; `compute()` devuelve datos planos `{ status, body }` y cada consumidor construye su respuesta |
| Cliente | `engine.ts` (`requestId`, códigos de error), `eliana/chat/page.tsx` (Reintentar, Nueva conversación, cola secuencial, estado `not_configured`, textos honestos), `ElianaStandaloneChat`, `ElianaAdvancedChat`, `AiAssistant` |
| Otros consumidores IA | `autor-ia/engine.ts`, `story-action/route.ts`, `health` usaban el mismo `GOOGLE_API_KEY || GEMINI_API_KEY`; ahora `isUsableApiKey` con prioridad a `GEMINI_API_KEY` |
| Lógica reutilizable | `src/lib/eliana/provider.ts` (13 tests unitarios) |
| Contenido | Frase "Nuestra sede conceptual está en Madrid, España..." eliminada de `/about` |
| Knowledge ELIANA (RAG) | `knowledge-data.ts`: docs de chat/integraciones actualizados (gemini-2.0-flash, sin fallback local, errores honestos 503/502/429/500, sin tabla de palabras clave de reserva, system instruction nueva de ELIANA) |
| Diagnóstico | `DIAGNOSTICO_ELIANA.md` en raíz |

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npx eslint` sobre archivos tocados → 0 errores (0 warnings).
- `vitest run` → **88/88** (auth 9 · rate-limit 5 · eliana-memory 9 · biblioteca-ingest 10 · autor-ia 14 · album 17 · channels 11 · provider 13).
- `npm run build` → OK (tras limpiar `.next` por bloqueo OneDrive `EPERM`, conocido).
- E2E real vs `/api/chat` en servidor local: 503 honesto por cuota (~3.8 s), 429 rate-limit, dedupe
  concurrente sin 500, `validation_error`, inyección bloqueada.
- Prueba live vs Gemini: todos los modelos autentican pero 429 por cuota (ver `DIAGNOSTICO_ELIANA.md`).

## Pendientes registrados (PENDIENTES_ZAFIRO.md / DIAGNOSTICO_ELIANA.md)

1. Habilitar cuota/plan de Google AI (429) en ai.google.dev.
2. Publicar `GEMINI_API_KEY` real en Vercel; eliminar `GOOGLE_API_KEY` placeholder.
3. Reemplazar placeholders de `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
4. Probar conversación ida y vuelta en producción tras habilitar la cuota.
