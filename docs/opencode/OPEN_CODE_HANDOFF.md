# OpenCode Handoff — MSM-Zafiro Project

**Date:** 2026-07-27  
**Author:** opencode/big-pickle (audit agent)  
**Purpose:** Complete technical state documentation for OpenCode AI agent continuation

---

## 1. What This Project Is

**MSM-Zafiro** is a Next.js 16 web application serving as the central platform for **MSM MY STORE LLC**. It integrates:
- **ZAFIRO** — Main storefront/management system
- **ELIANA** — AI-powered assistant (Google Gemini, currently using knowledge-fallback)
- **Consejo Invisible** — 19-table governance system with role-based council
- **MSM Marketplace** — Multi-seller marketplace (67 tables, 7 entities)
- **Solver Link** — Support/helpdesk system
- **ZAFIRO Inventario/Cultura/IA** — Inventory, culture, and AI modules

**Owner:** Miguel Soria Martínez (OWNER_SUPERADMIN)  
**Organization:** MSM MY STORE LLC  
**Deployed at:** `zafiro.msmmystore.com` and `eliana.msmmystore.com` (Vercel)

---

## 2. Current State Summary

### Working
- ✅ Next.js 16.2.10 app builds and deploys to Vercel
- ✅ 68 pages (App Router), 31 components, 12 API routes
- ✅ 34 SQL migrations in `supabase/migrations/`
- ✅ 57 knowledge documents in `knowledge-pack/`
- ✅ ELIANA chat works with intelligent knowledge search (no real Gemini)
- ✅ Consejo Invisible page with role-based access
- ✅ Member plans page with entitlement checks (localStorage)
- ✅ Auth system (localStorage-based, roles: customer→superadmin)
- ✅ Security: rate limiting, input injection detection, output filtering

### Broken / Incomplete
- ❌ **Supabase not connected** — no real DB credentials; all data in localStorage
- ❌ **Gemini API key is placeholder** — ELIANA uses knowledge-fallback
- ❌ **Stripe not configured** — checkout returns 503; Price IDs are placeholders
- ❌ **4 duplicate Supabase client instances** — need consolidation
- ❌ **No tests exist** anywhere in the project
- ❌ **Git not in PATH** — no commit history available
- ❌ **6 incomplete pages** (payments, delivery, album, escuela, publicidad, admin/*)
- ❌ **No RLS policies enforced** without Supabase connection
- ❌ **Memberships have no DB tables** — only UI + localStorage

---

## 3. Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Modern RSC support, Vercel-native |
| Language | TypeScript 5.x + Zod v4.4.3 | Type safety, runtime validation |
| Styling | Tailwind CSS 4 + shadcn/ui | Rapid UI development |
| Animation | Framer Motion 12 | Page transitions, micro-interactions |
| Database | Supabase (PostgreSQL) | Auth + DB + RLS in one |
| AI | Google Gemini 2.0 | Multimodal capabilities |
| Payments | Stripe | Industry standard |
| State | localStorage (temporary) | Until Supabase is connected |
| Deployment | Vercel | Zero-config, edge functions |

---

## 4. What OpenCode Should Do Next

### Priority 1: Get Real Credentials
- [ ] Ask Don Miguel for Supabase URL + anon key + service role key
- [ ] Ask for real Google Gemini API key
- [ ] Ask for Stripe live/test keys
- [ ] Update `.env.local` with real values
- [ ] Test Supabase connection

### Priority 2: Consolidate Supabase Clients
- [ ] Merge 4 duplicate clients into single factory at `src/lib/supabase.ts`
- [ ] Update imports in `consejo-invisible/queries.ts`, `marketplace/feature-flags.ts`, `proxy.ts`

### Priority 3: Connect to Real Database
- [ ] Run all 34 migrations against Supabase
- [ ] Verify RLS policies are correct
- [ ] Replace localStorage calls with Supabase queries
- [ ] Test auth flow end-to-end

### Priority 4: Connect Gemini
- [ ] Replace placeholder API key with real one
- [ ] Test ELIANA with real AI responses
- [ ] Remove knowledge-fallback as primary (keep as backup)

### Priority 5: Connect Stripe
- [ ] Configure real Price IDs
- [ ] Test checkout flow
- [ ] Set up webhook endpoints

### Priority 6: Complete Incomplete Pages
- [ ] `dashboard/publicidad` — currently pure placeholder
- [ ] `ecosystem/payments` — mockup with blur overlay
- [ ] `ecosystem/delivery` — mockup only
- [ ] `ecosystem/album` — partial implementation
- [ ] `ecosystem/escuela` — partial implementation
- [ ] `admin/*` — 6 admin pages use hardcoded data

### Priority 7: Add Tests
- [ ] Unit tests for core business logic
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (auth, checkout, ELIANA chat)

---

## 5. File Locations

All paths relative to `C:\Users\cm8ms\OneDrive\Documents\MSM-Zafiro-main\`:

| Category | Path |
|----------|------|
| Config | `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json` |
| Env | `.env.local` (actual), `.env.example` (template) |
| Auth | `src/lib/auth.ts`, `src/lib/profile.ts` |
| Supabase | `src/lib/supabase.ts`, `src/lib/supabase-server.ts` |
| ELIANA | `src/lib/eliana/` (engine, memory, knowledge, analysis, recommendations) |
| Consejo | `src/lib/consejo-invisible/`, `src/app/consejo/` |
| Marketplace | `src/lib/marketplace/`, `src/app/marketplace/` |
| Memberships | `src/app/memberships/`, `src/lib/memberships.ts` |
| API Routes | `src/app/api/` (12 routes) |
| Pages | `src/app/` (68 page.tsx files) |
| Components | `src/components/` (31 components) |
| Migrations | `supabase/migrations/` (34 SQL files) |
| Knowledge | `knowledge-pack/` (57 markdown files) |
| Audit | `docs/opencode/` (this directory) |

---

## 6. Known Issues

1. **4 Supabase clients** — `src/lib/supabase.ts`, `consejo-invisible/queries.ts`, `marketplace/feature-flags.ts`, `proxy.ts`
2. **No error boundaries** — App crashes on unhandled errors
3. **No loading states** — Many pages lack skeleton/loading UI
4. **Hardcoded data** — Admin pages use mock data
5. **No real-time** — Supabase realtime not configured
6. **Missing types** — Some components use `any` type
7. **No middleware for API routes** — Only page routes are protected

---

## 7. Environment Variables Required

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# AI (REQUIRED for ELIANA)
GEMINI_API_KEY=xxxxx

# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App
NEXT_PUBLIC_APP_URL=https://zafiro.msmmystore.com
```

---

## 8. Build & Deploy

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Build for production
npm run build

# Deploy to Vercel (requires auth)
npx vercel --prod
```

**Vercel Project:** `msmmystore/zafiro`  
**Org ID:** `team_eYjbIlfQF6GWALFMxqAXYyZo`  
**Deploy URL:** `https://zafiro-lbcum51sg-msmmystore.vercel.app`

---

*This document was generated by opencode/big-pickle audit agent on 2026-07-27.*
