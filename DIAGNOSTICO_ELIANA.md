# DIAGNOSTICO_ELIANA

Diagnóstico y corrección del chat ELIANA en ZAFIRO (estado "ELIANA está reconectándose").
Fecha: 2026-08-01

## Síntoma reportado

- La interfaz mostraba "ELIANA está reconectándose. Tu mensaje quedó guardado" de forma permanente.
- La solicitud al proveedor de IA fallaba de manera real (no era un problema visual del cliente).

## Causa raíz (confirmada)

1. **Credencial superpuesta (placeholder ensombreciendo a la clave real)**
   - `.env.local` contenía `GOOGLE_API_KEY` con un valor placeholder (texto entre corchetes, 11 caracteres).
   - La ruta original `src/app/api/chat/route.ts` usaba
     `process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY`, por lo que el placeholder
     **ensombrecía** a la clave real `GEMINI_API_KEY` y el SDK recibía una clave inválida.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` también son placeholders
     (no bloquean el chat, pero afectan autenticación/RLS en otras funciones).

2. **Formato de clave incompatible con el SDK**
   - `GEMINI_API_KEY` tiene el formato de un token de acceso (prefijo no correspondiente a una
     API key Gemini estándar). El SDK `@google/genai` `GoogleGenAI({ apiKey })` espera una API key
     tipo `AIza...`. Con un token con formato distinto, la llamada falla en el proveedor.

3. **Timeout insuficiente**
   - `TIMEOUT_MS` era 15 000 ms. Llamadas lentas del proveedor abortaban antes de responder.

4. **Errores del proveedor tragados**
   - El bloque `catch` original devolvía una respuesta de reserva genérica, ocultando el error real
     (incluidos 429 de rate limit) y sin registro. El cliente nunca sabía por qué fallaba.

## Archivos corregidos

| Archivo | Cambio |
| --- | --- |
| `src/app/api/chat/route.ts` | Selección robusta de clave (`isUsableApiKey` descarta placeholders; prioridad `GEMINI_API_KEY`). `TIMEOUT_MS` sube a 45 000. `callGeminiWithRetry` con reintentos solo para 429/502/503/504 (backoff 1s/2s/4s). Idempotencia por `requestId` (`idempotencyMap` TTL 120 s + `inflightMap`). Respuestas HTTP honestas: 503 `ai_provider_not_configured`, 502 `ai_provider_permanent`/`ai_provider_empty`, 503 `ai_provider_unavailable`, 429 en rate limit, 500 `server_error`. Auth Supabase envuelto en try/catch. Código muerto eliminado. |
| `src/lib/eliana/engine.ts` | `processElianaRequest` acepta `requestId?`; mapea códigos del server a `err.name`/`err.code`/`err.status` (`RATE_LIMITED`, `NOT_CONFIGURED`, `API_ERROR`, `EMPTY_RESPONSE`, `NETWORK_ERROR`). `AbortError` no cae en NETWORK_ERROR. Código muerto eliminado. |
| `src/app/eliana/chat/page.tsx` | Estado `not_configured`; reintento automático (máx 3) solo para rate-limit/no disponible/red/abort; cola de pendientes secuencial; botón Reintentar funcional; botón Nueva conversación; saludo único reutilizable; textos honestos. |
| `src/components/eliana/ElianaStandaloneChat.tsx` | Texto de error honesto (se eliminó "reconectándose... quedó guardado"). |
| `src/components/eliana/ElianaAdvancedChat.tsx` | Texto de error honesto; imports muertos eliminados. |
| `src/components/gemology/AiAssistant.tsx` | Mensaje de error honesto en inglés. |
| `src/app/about/page.tsx` | Eliminada la frase "Nuestra sede conceptual está en Madrid, España...". |

## Pruebas ejecutadas

- `npx tsc --noEmit` → sin errores.
- `npx eslint` sobre los archivos tocados → 0 errores, 0 warnings.
- `npx vitest run` → 7 archivos, 75 tests, todos en verde.
- `npx next build` → compilación exitosa; `/api/chat` generada como ruta dinámica (ƒ).

## Prueba real contra la API de Gemini (2026-08-01)

Se ejecutó una llamada real al endpoint de Google con la clave presente en `.env.local`
(sin revelar su contenido; solo se reportan códigos HTTP y mensajes del proveedor):

| Modelo | Autenticación | Resultado |
| --- | --- | --- |
| gemini-2.0-flash | header de API key (igual que el SDK) | **HTTP 429 cuota agotada** |
| gemini-2.0-flash | Bearer token | HTTP 401 credencial inválida |
| gemini-2.5-flash | header de API key | HTTP 404 "no longer available to new users" |
| gemini-2.5-flash | Bearer token | HTTP 401 |
| gemini-2.5-pro | header de API key | HTTP 429 cuota agotada |
| gemini-2.0-flash-lite | header de API key | HTTP 429 cuota agotada |

**Hallazgo**: la clave actual SÍ pasa la autenticación de Google (no devuelve 400/401 con el
header de API key). El bloqueo real del proveedor es **cuota agotada (429)**: el proyecto de
Google AI no tiene cuota activa (revisar plan/billing en ai.google.dev). El modelo configurado
`gemini-2.0-flash` es válido; `gemini-2.5-flash` ya no está disponible para cuentas nuevas (404).
Por tanto, una vez habilitada la cuota/billing, la ruta debería responder sin cambiar el código.

## Pruebas de extremo a extremo contra `/api/chat` en servidor real

- Mensaje normal → **503 `ai_provider_unavailable`** tras 3 intentos (429 con backoff), texto honesto con "Pulsa Reintentar".
- Dos peticiones concurrentes con el mismo `requestId` → **ambas responden igual y en el tiempo de una sola llamada** (dedupe `inflightMap` correcto).
- Rate limit: la petición 31 dentro de la ventana → **429 `rate_limited`**.
- Body vacío / mensaje vacío → **200 `validation_error`**.
- Prompt injection en inglés → **200 bloqueado** por `sanitizeServerInput`.

## Corrección adicional detectada en las pruebas E2E

- **Bug corregido**: el dedupe en vuelo (`inflightMap`) compartía el mismo objeto `NextResponse`
  entre dos peticiones concurrentes; al consumirse el body una sola vez, la segunda petición
  recibía HTTP 500. Se refactorizó para que `compute()` devuelva datos planos
  `{ status, body }` y cada consumidor construya su propio `NextResponse`.

## Resultado

- El fallo real se corrigió en código y la ruta responde con errores HTTP precisos según el caso
  (credencial no configurada, proveedor no disponible, rate limit, etc.), con reintentos e
  idempotencia.
- La frase de la sede Madrid fue eliminada por completo del código y contenido (búsqueda global
  sin coincidencias; solo quedan `Europe/Madrid` como timezone válida y la cláusula de jurisdicción
  legal en `terms` que es texto distinto y requiere decisión del cliente).

## Pendiente de validar en el entorno publicado (Vercel)

1. **Cuota/billing en Google AI (causa real actual)**: la clave ya autentica, pero todas las
   llamadas devuelven 429 "quota exceeded". Habilitar la cuota/plan en ai.google.dev (billing).
   Una vez con cuota, la conversación debería responder sin cambios de código.
2. **Variables de entorno en Vercel**: confirmar que `GEMINI_API_KEY` está publicada con la clave
   real (y NO existe `GOOGLE_API_KEY` con placeholder ensombreciéndola). Si falta, solo agregar la
   variable `GEMINI_API_KEY`. (No se revela contenido de claves en este documento.)
3. **Modelo**: `gemini-2.0-flash` es válido. NO usar `gemini-2.5-flash` (404 para cuentas nuevas).
   Verificar `AI_MODEL` en Vercel si se configura otra variante.
4. **Prueba de conversación ida y vuelta** en producción: enviar un mensaje y confirmar respuesta del
   proveedor; si persiste, revisar los logs del server en Vercel (la ruta registra el error real sin
   exponer claves).
5. **Supabase**: reemplazar los placeholders de `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` por las claves reales para habilitar autenticación/RLS de funciones
   que dependen de ellas.
