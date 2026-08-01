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

## Resultado

- El fallo real se corrigió en código y la ruta responde con errores HTTP precisos según el caso
  (credencial no configurada, proveedor no disponible, rate limit, etc.), con reintentos e
  idempotencia.
- La frase de la sede Madrid fue eliminada por completo del código y contenido (búsqueda global
  sin coincidencias; solo quedan `Europe/Madrid` como timezone válida y la cláusula de jurisdicción
  legal en `terms` que es texto distinto y requiere decisión del cliente).

## Pendiente de validar en el entorno publicado (Vercel)

1. **Variables de entorno en Vercel**: confirmar que `GEMINI_API_KEY` está publicada con la clave
   real (y NO existe `GOOGLE_API_KEY` con placeholder ensombreciéndola). Si falta, solo agregar la
   variable `GEMINI_API_KEY`. (No se revela contenido de claves en este documento.)
2. **Formato de la clave**: si el proveedor sigue respondiendo 401/404 tras el deploy, convertir el
   token actual a una API key Gemini estándar (formato `AIza...`) o actualizar el endpoint/token de
   acceso, y verificar el nombre del modelo (`AI_MODEL`) contra la API real.
3. **Prueba de conversación ida y vuelta** en producción: enviar un mensaje y confirmar respuesta del
   proveedor; si persiste, revisar los logs del server en Vercel (la ruta registra el error real sin
   exponer claves).
4. **Supabase**: reemplazar los placeholders de `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` por las claves reales para habilitar autenticación/RLS de funciones
   que dependen de ellas.
