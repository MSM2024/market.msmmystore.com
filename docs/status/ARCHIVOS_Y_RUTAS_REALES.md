# ARCHIVOS Y RUTAS REALES — ZAFIRO

## Rutas de página (97 total)

### Públicas
- `/` — Home / feed
- `/about`, `/contact`, `/help`, `/how-it-works`, `/mission`, `/privacy`, `/rules`, `/terms`, `/values`, `/vision`, `/what-we-do`, `/universo`, `/ecosystem`, `/gemologia`
- `/ecosystem/album`, `/ecosystem/delivery`, `/ecosystem/escuela`, `/ecosystem/payments`

### Auth
- `/auth/login`, `/auth/register`, `/auth/recover`, `/auth/update-password`, `/auth/verify`

### ZAFIRO Core
- `/dashboard`, `/dashboard/clientes`, `/dashboard/configuracion`, `/dashboard/ganancias`, `/dashboard/pedidos`, `/dashboard/productos`, `/dashboard/publicidad`, `/dashboard/tienda`
- `/settings`
- `/profile-page`, `/profile-page/connections`, `/profile-page/edit`, `/profile-page/projects`
- `/perfil/[username]`
- `/messages`
- `/rewards`, `/referidos`
- `/memberships`

### ELIANA (dentro de ZAFIRO)
- `/eliana`, `/eliana/chat`, `/eliana/conversaciones`, `/eliana/memoria`, `/eliana/tareas`
- `/eliana/configuracion`, `/eliana/configuracion/privacidad`, `/eliana/configuracion/voz`

### Admin
- `/admin`, `/admin/eliana`, `/admin/knowledge`
- `/admin/marketplace`, `/admin/marketplace/disputas`, `/admin/marketplace/margenes`, `/admin/marketplace/pedidos`, `/admin/marketplace/productos`, `/admin/marketplace/proveedores`, `/admin/marketplace/tiendas`

### Consejo Invisible
- `/consejo-invisible`

### Marketplace (protegido/congelado)
- `/marketplace`, `/marketplace/crear-tienda`, `/marketplace/pedidos`, `/marketplace/productos`, `/marketplace/productos/[slug]`, `/marketplace/proveedores`, `/marketplace/tiendas`, `/marketplace/tiendas/[slug]`, `/marketplace/vender`, `/marketplace/vender/crear-producto`

### Sponsors
- `/sponsors-page`

## APIs (25+)

### Auth/Profile/Settings
- `GET/PUT /api/user-profile`
- `GET/PUT /api/user-settings`

### ELIANA
- `POST /api/chat` — Gemini chat con RAG
- `GET/POST/DELETE /api/eliana/conversations`
- `GET/POST /api/eliana/messages`
- `GET/POST/PUT /api/eliana/intakes`
- `GET/POST/PUT /api/eliana/actions`
- `POST /api/eliana/context-handoff`

### Knowledge
- `GET/POST/PUT/DELETE /api/knowledge/documents`
- `GET/POST /api/knowledge/search`
- `POST /api/knowledge/ingest`
- `GET/POST/PUT /api/knowledge/gaps`
- `GET/POST/PUT /api/knowledge/approvals`
- `GET/POST /api/knowledge/ask`
- `GET /api/knowledge/audit`
- `POST /api/knowledge/feedback`
- `GET /api/knowledge/settings`
- `GET /api/knowledge/stats`
- `POST /api/knowledge/seed`

### Stripe
- `POST /api/stripe/checkout`
- `POST /api/stripe/portal`
- `POST /api/stripe/webhook`
- `GET /api/stripe/billing`

### Marketplace (protegido)
- `POST /api/marketplace/checkout`

## Librerías clave (src/lib/)
- `auth.ts` — Auth dual (localStorage + Supabase)
- `profile.ts` — Profile (localStorage)
- `supabase.ts` — Browser Supabase client
- `supabase-server.ts` — Server Supabase client
- `EconomiaService.ts` — Economy service
- `knowledge/` — 9 módulos (types, repository, search, ingestion, guardrails, compat, seed, eliana-integration, index)
- `eliana/` — 6 módulos (engine, etc.)
- `eliana/core/` — 9 módulos (types, conversation, state, persistence, security, knowledge, intelligent-search, adapters, validation)
- `stripe/` — 5 módulos (config, server, browser, types, idempotency)
- `marketplace/` — 8 módulos (client, types, constants, pricing-engine, feature-flags, eliana-integration, useCart, providers/)
- `unified-identity/` — 4 módulos (types, session, crypto, config)

## Migraciones (37 archivos)
- `supabase/migrations/00001` a `00036`, `00038`
- Migration faltante: `00037`
