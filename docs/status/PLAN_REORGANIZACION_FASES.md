# PLAN DE TERMINACIÓN POR FASES — ZAFIRO 2026-07-30

> Reorganización total tras la auditoría real (ver `AUDITORIA_REAL_2026-07-30.md`).
> Principio rector: **primero estabilizar, después construir**. No se inicia un módulo nuevo hasta que el anterior cumpla el criterio de "terminado".

## CRITERIO DE "TERMINADO" (obligatorio por función)

Una función se marca **TERMINADA** solo cuando cumple TODOS estos puntos, verificados en una prueba real (no en teoría):

1. **Desarrollada** — código completo e integrado.
2. **Probada** — pasan: `npx vitest run`, build (`npx next build`) con 0 errores, ESLint 0 errores.
3. **Validada end-to-end con datos reales** — probada contra Supabase/Stripe reales por Don Miguel (login, crear tienda, crear producto, comprar, recibir pago, ver pedido).
4. **Sin errores conocidos** — sin bugs abiertos de la función.
5. **Documentada** — actualizado `docs/status/` con la evidencia de la prueba.
6. **Lista para producción** — sin datos demo simulando la función, sin placeholders, sin localStorage fingiendo el backend.

Regla: **"existe la UI" ≠ "terminado"**. Un módulo con UI pero cuyo flujo no completa un ciclo real con datos se reporta al % real de la auditoría.

---

## FASE 0 — DESBLOQUEAR AMBIENTE (prerequisito de todo)

Nada de la Fase 1 puede validarse en producción sin esto. Se trabaja en paralelo mientras tanto.

| Tarea | Detalle | Bloquea |
|---|---|---|
| 0.1 Claves Supabase reales | Don Miguel copia `SUPABASE_SERVICE_ROLE_KEY`, URL y anon/publishable key a `.env.local` (y Vercel). | Todas las fases |
| 0.2 Claves Stripe reales | Webhook secret + crear Price IDs (pro mensual/anual, cuba_plus mensual/anual). | Fase 3 |
| 0.3 `ZAFIRO_SETUP_TOKEN` | Generar valor seguro; documentar seed de owner. | Fase 1 (admin) |
| 0.4 Verificar migraciones aplicadas | Confirmar en Supabase que 00001–00044 corrieron en orden (incluye **00037**, creada el 2026-07-31 para la taxonomía de roles); 00044 necesita `pgvector`. | Todas |
| 0.5 Rotar clave Gemini | La clave expuesta en historial de chat debe regenerarse. | Seguridad |

## FASE 1 — NÚCLEO: USUARIOS, SEGURIDAD, CONFIGURACIÓN, ADMIN

Objetivo: una persona puede registrarse, iniciar sesión, ser configurada, y Don Miguel administra. **Sin esto, nada más importa.**

| # | Tarea | Prioridad | Cómo verificar |
|---|---|---|---|
| 1.1 | **Unificar taxonomía de roles** (P0): resolver 00003 vs 00036 CHECK vs 00041 (`admin`/`seller`/`owner`), corregir `proxy.ts` para que `owner` acceda a `/admin` y vendedor a `/dashboard`, alinear `hasRole`/`isAdmin`/`isOwner`. ✅ **Código 2026-07-31** (`00037_role_taxonomy_fix.sql` + `src/proxy.ts` + `src/lib/auth.ts` + `unified-identity/config.ts`). ⏳ Pendiente validación e2e con claves reales. | P0 | Login como owner → entra a `/admin`. Login seller → entra a `/dashboard`. 403 reales en API. |
| 1.2 | **Endurecer API auth** (P0): auth+rol en `api/biblioteca/*` (8 rutas), `api/knowledge/seed`, `api/stripe/{checkout,billing,portal}` (verificar sesión real, no `userId` del body), `api/eliana/health`. | P0 | Pruebas: petición sin token → 401; con rol no autorizado → 403. |
| 1.3 | **Cerrar flujo de registro/login/verificación** e2e: verificación de email real, reenvío, recovery con código, reset, expiración de sesión. | P0 | Don Miguel registra cuenta nueva → verifica email → login → cierra sesión → recupera contraseña. |
| 1.4 | **Configuración completa**: `/settings` con perfil, seguridad, notificaciones, cuenta; persistencia real en `user_settings`; borrado de cuenta con cascada real. | P0 | Guardar cambios → recargar → persistidos. |
| 1.5 | **Admin real**: stats reales (`fetchPlatformStats` ya lee DB), aprobaciones de tiendas/productos, ver usuarios, system-status con lista de migraciones reales (00001–00044). | P1 | Aprobar/rechazar una tienda y ver el cambio en el marketplace. |
| 1.6 | **Auditoría de auth**: escribir `audit_logs` en login/logout/registro/cambios; UI admin para consultarla. | P1 | Cada acción aparece en el log. |

**Salida Fase 1:** un usuario real puede entrar y Don Miguel administra con datos reales. ✅ Valida Don Miguel.

## FASE 2 — ZAFIRO, ELIANA, KNOWLEDGE CORE

Objetivo: la plataforma social y la IA funcionan sobre datos reales.

| # | Tarea | Prioridad | Cómo verificar |
|---|---|---|---|
| 2.1 | **Migración 00045 Knowledge Core**: crear `knowledge_*` (15+ tablas) + RPC `search_knowledge_chunks` + RLS + índices; migrar `KNOWLEDGE_DOCS`/`knowledge-pack/` como seed. | P0 | `/api/knowledge/stats` devuelve doc reales; ingest crea documentos. |
| 2.2 | **Embeddings reales**: proveedor (Gemini embedding u otro), `generate_embeddings=true`, búsqueda híbrida keyword+vector. | P0 | Búsqueda semántica devuelve resultados relevantes. |
| 2.3 | **RAG en ELIANA**: conectar Knowledge Core a `/api/chat` (contexto de DB, no estático); persistir conversaciones en `eliana_conversations`. | P0 | ELIANA responde citando el corpus real de Don Miguel. |
| 2.4 | **Cerrar rutas knowledge faltantes**: `gaps`, `feedback`, `settings`, `audit` (auth + rol). | P1 | CRUD funcional desde admin. |
| 2.5 | **Red social real**: mover feed de inicio a tablas (posts/preguntas/tendencias) con datos de DB; integrar universo con datos reales. | P1 | Publicar desde el muro → aparece al recargar. |
| 2.6 | **ZAFIRO consolidar**: eliminar duplicados (perfil, álbum, escuela) y unificar. | P2 | Una sola ruta canónica por concepto. |

**Salida Fase 2:** ELIANA responde con el conocimiento real de Don Miguel; el muro no depende de demo data. ✅ Valida Don Miguel.

## FASE 3 — COMERCIO: INVENTARIO, PEDIDOS, ECONOMÍA, PAGOS, MEMBRESÍAS

Objetivo: comprar y vender de verdad con dinero real.

| # | Tarea | Prioridad | Cómo verificar |
|---|---|---|---|
| 3.1 | **Arreglar `createOrder`** (P0): enviar `buyer_id` y `store_id`, crear `order_items`, transacción. | P0 | Crear pedido → aparece en `/marketplace/pedidos` y en dashboard vendedor. |
| 3.2 | **Checkout Stripe real**: sesión server-side con orderId real, webhook actualizando `marketplace_orders` y `marketplace_payments` (no `orders`/`payments`), desalinear CHECK de plan 00039. | P0 | Pagar con tarjeta de prueba → pedido pasa a pagado → dinero visible en dashboard. |
| 3.3 | **Inventario transaccional**: decremento de stock + variantes al confirmar pedido; alerta de stock bajo. | P0 | Vender el último stock → producto se marca agotado. |
| 3.4 | **Membresías reales**: `userId` en checkout, anualidad con precios reales, activación de `profiles.plan` respetando CHECK. | P1 | Comprar Pro → plan activo en perfil. |
| 3.5 | **Economía real en DB**: mover PTS/referidos/rewards a tablas transaccionales (`rewards_log`, `referrals`, `economia_*`); ELIANA lee balance de DB. | P1 | Ganar PTS por acción → se reflejan al recargar y en otra sesión. |
| 3.6 | **Márgenes/feature flags en DB** (`marketplace_config`), no localStorage. | P1 | Cambiar comisión → se aplica a cálculos. |
| 3.7 | **Notificaciones de pedidos**: evento al crear/pagar/enviar. | P2 | Comprador y vendedor reciben aviso. |

**Salida Fase 3:** ciclo completo compra→pago→inventario→pedido→economía. ✅ Valida Don Miguel con un pedido real (tarjeta de prueba).

## FASE 4 — ÁLBUM, MENTE MAESTRA, VOZ VIVA, AUDITORÍA, INTEGRACIONES

Objetivo: completar la visión con lo que falta y limpiar la deuda técnica.

| # | Tarea | Prioridad | Cómo verificar |
|---|---|---|---|
| 4.1 | **Álbum**: escritura de versiones (`story_versions`), subida de medios (storage Supabase), RLS auditado. | P1 | Editar historia → versión guardada; subir foto → visible. |
| 4.2 | **Voz Viva avanzada**: grabación de audio + transcripción (Gemini/Web Speech) + clasificación IA + historial. | P1 | Hablar → texto → acción guardada. |
| 4.3 | **Auditoría integral**: log de acciones de negocio + UI admin + exportación. | P1 | Consultar log de una acción realizada. |
| 4.4 | **Mente Maestra v1**: módulo real (comunidad + conocimiento colectivo + mapa vivo) sobre Knowledge Core. | P2 | Crear tema → validación → visible. |
| 4.5 | **API pública**: tokens + docs + endpoints estables versionados. | P2 | Endpoint con token → datos reales. |
| 4.6 | **Limpieza de deuda**: eliminar dead code (useCart, StandaloneChat, providers, unified-identity, economia-legacy), rutas de prueba (`test-forgot`), deps muertas; consolidar duplicados. | P2 | `git grep` de cada módulo muerto = 0; build verde. |
| 4.7 | **Documentación al día**: actualizar todos los docs con la realidad (rutas, migraciones, tests, proxy). | P1 | Docs ≥ la versión del código. |

**Salida Fase 4:** la visión de la auditoría queda cubierta y el repositorio es mantenible. ✅ Valida Don Miguel.

---

## GESTIÓN DEL TRABAJO

- **Regla de 1 en curso:** solo una tarea a la vez; se mueve a "terminada" solo con el checklist completado.
- **No marcar nada terminado sin prueba real:** cada cierre requiere la verificación de la columna "Cómo verificar" ejecutada con datos reales.
- **Frecuencia:** al cierre de cada fase, commit + merge a `main` + despliegue + prueba de Don Miguel en producción.
- **Prioridad P0 es bloqueante:** si una tarea P0 tiene dependencia externa, se documenta en `BLOQUEOS_EXTERNOS.md` y se continúa con la siguiente que no dependa.
- **Seguimiento:** registrar avance por tarea en este documento (fecha, estado, evidencia).
