# PLAN DE TERMINACIÓN — ZAFIRO + ELIANA

Basado en la auditoría completa del 2026-07-29.

## Fase A — Estabilización (días 1-2)

### A.1 Auth Supabase-only
- Migrar `auth.ts` a Supabase exclusivamente
- Eliminar `localStorage` fallback para sesión
- Migrar `profile.ts` a Supabase exclusivamente
- Actualizar `getSession()` para usar solo Supabase

### A.2 Propietario real
- Obtener UUID de Don Miguel desde auth.users
- Insertar en `council_user_roles` como OWNER_SUPERADMIN
- Insertar membresía LIFETIME_UNLIMITED en `memberships`
- Verificar dashboard sin hardcodeos

### A.3 Variables y secretos
- Configurar service_role key (desde Supabase Dashboard)
- Rotar Gemini API key (desde Google AI Studio)
- Crear productos/price IDs en Stripe Dashboard
- Configurar webhook endpoint + secret en Stripe
- Crear `.env.example` sin valores

## Fase B — Persistencia (días 2-3)

### B.1 Settings → Supabase
- Migrar `/settings` de localStorage a `/api/user-settings`

### B.2 Profile → Supabase
- Migrar `/profile-page` de localStorage a `/api/user-profile`

### B.3 Context handoff production-ready
- Reemplazar Map en memoria por tabla `sso_tickets`

## Fase C — Módulos nuevos (días 3-10)

### C.1 Double-Entry Ledger
- Crear migración 00039: tablas `ledger_accounts`, `ledger_entries`, `ledger_transactions`, `ledger_reversals`
- Débitos/créditos balanceados por moneda
- SHA-256 hash por comprobante
- Reversals y cierre diario

### C.2 Documentos y Firmas
- Migración 00040: tablas `documents`, `document_versions`, `document_signatures`, `signature_requests`
- SHA-256, sello UTC, QR, certificado
- Reautenticación para firmar

### C.3 Inventa
- Migración 00041: `inventa_ideas`, `inventa_projects`, `inventa_teams`, `inventa_tasks`, `inventa_milestones`
- APIs CRUD, panel, integración con Knowledge Core

### C.4 Cultura
- Migración 00042: `cultura_countries`, `cultura_guides`, `cultura_courses`, `cultura_simulations`
- APIs, analizador de mensajes, perfil cultural

### C.5 Solver Link
- Migración 00043: `solver_problems`, `solver_solutions`, `solver_experts`, `solver_reputation`
- APIs, sistema de selección, integración con Inventa

## Fase D — ELIANA Independiente (días 5-7)

### D.1 Migraciones
- Crear migraciones para tablas ELIANA en el repo independiente

### D.2 Env reales
- Copiar valores reales de ZAFIRO a ELIANA .env.local

### D.3 Middleware
- Renombrar proxy.ts → middleware.ts o verificar configuración

### D.4 Dominio
- Mover `eliana.msmmystore.com` del proyecto Vercel ZAFIRO al proyecto ELIANA

### D.5 Build & Deploy
- Build, lint, deploy a Vercel

## Fase E — Seguridad y Pruebas (días 7-10)

### E.1 Rate limiting
- Implementar en todas las API routes

### E.2 MFA
- Implementar autenticación multifactor

### E.3 Pruebas
- Tests para auth, membresías, knowledge, ledger, firmas
- Playwright para flujos críticos

### E.4 Lint final
- Reducir 46 errores restantes (solo marketplace — congelados)
- No introducir nuevos errores

## Fase F — Deploy Final (día 10)

### F.1 ZAFIRO Vercel
- Build, lint, deploy production

### F.2 ELIANA Vercel
- Build, lint, deploy production

### F.3 Verificación
- Ambos dominios
- SSL, HTTPS
- Auth funcional
- PWA
- Navegación privada
- Móvil + escritorio

---

## Estimación de esfuerzo

| Fase | Días | Módulos | Archivos |
|------|------|---------|----------|
| A | 2 | 3 | ~10 |
| B | 1 | 2 | ~5 |
| C | 7 | 5 | ~60+ |
| D | 2 | 5 | ~20 |
| E | 3 | 4 | ~40 |
| F | 1 | 2 | ~5 |
| **Total** | **~16 días** | **~21 módulos** | **~140+ archivos** |
