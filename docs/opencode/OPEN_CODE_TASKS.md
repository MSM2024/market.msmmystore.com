# OpenCode Tasks — MSM-Zafiro Project

**Generated:** 2026-07-27  
**Purpose:** Specific, actionable tasks for OpenCode AI agent

---

## Task 1: Get Real Credentials from Don Miguel

**Priority:** CRITICAL  
**Blocks:** Everything else  
**Status:** TODO

### What to Ask
Ask Don Miguel (OWNER_SUPERADMIN) for:
1. **Supabase credentials:**
   - Project URL (format: `https://xxxxx.supabase.co`)
   - Anon/public key (format: `eyJxxxxx`)
   - Service role key (format: `eyJxxxxx`)

2. **Google Gemini API key:**
   - Format: `AIzaxxxxx`
   - Get from: https://aistudio.google.com/apikey

3. **Stripe keys (test mode first):**
   - Secret key (format: `sk_test_xxxxx`)
   - Publishable key (format: `pk_test_xxxxx`)
   - Webhook secret (format: `whsec_xxxxx`)
   - Get from: https://dashboard.stripe.com/apikeys

### How to Configure
1. Open `.env.local` in project root
2. Replace placeholder values with real credentials
3. Run `npm run dev` to test
4. Test Supabase connection in browser console:
   ```javascript
   // Should return data, not error
   fetch('https://YOUR-PROJECT.supabase.co/rest/v1/').then(r => r.json()).then(console.log)
   ```

---

## Task 2: Consolidate Supabase Clients

**Priority:** HIGH  
**Depends on:** Task 1  
**Status:** TODO

### Current State
4 separate Supabase client instantiations:
- `src/lib/supabase.ts` (main)
- `src/lib/consejo-invisible/queries.ts` (duplicate)
- `src/lib/marketplace/feature-flags.ts` (duplicate)
- `src/lib/proxy.ts` (duplicate)

### What to Do
1. Keep `src/lib/supabase.ts` as single source
2. Update imports in other files:
   ```typescript
   // Before
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(url, key)
   
   // After
   import { supabase } from '@/lib/supabase'
   ```
3. Test all Supabase operations

---

## Task 3: Run Database Migrations

**Priority:** HIGH  
**Depends on:** Task 1  
**Status:** TODO

### Current State
34 SQL migration files in `supabase/migrations/` covering:
- Users, profiles, roles
- Consejo Invisible (19 tables)
- Marketplace (67 tables)
- Knowledge base
- Audit logs

### What to Do
1. Install Supabase CLI: `npm install -g supabase`
2. Link to project: `supabase link --project-ref YOUR-PROJECT-ID`
3. Run migrations: `supabase db push`
4. Verify tables exist in Supabase dashboard

---

## Task 4: Replace localStorage with Supabase Queries

**Priority:** HIGH  
**Depends on:** Task 3  
**Status:** TODO

### Files to Update
- `src/lib/auth.ts` → Use Supabase Auth
- `src/lib/profile.ts` → Use `profiles` table
- `src/lib/eliana/memory.ts` → Use `eliana_memories` table
- `src/lib/memberships.ts` → Use `memberships` table
- `src/app/settings/page.tsx` → Use Supabase for all settings

### Pattern
```typescript
// Before (localStorage)
const user = JSON.parse(localStorage.getItem('zafiro_user') || '{}')

// After (Supabase)
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

---

## Task 5: Connect ELIANA to Real Gemini

**Priority:** MEDIUM  
**Depends on:** Task 1  
**Status:** TODO

### Current State
- `GEMINI_API_KEY` is placeholder
- ELIANA uses intelligent knowledge search (57 docs)
- Works but not truly AI-powered

### What to Do
1. Update `GEMINI_API_KEY` in `.env.local`
2. Test ELIANA chat with real AI responses
3. Verify knowledge search still works as fallback
4. Test edge cases (empty responses, errors)

### Files to Check
- `src/app/api/chat/route.ts` — Main chat endpoint
- `src/lib/eliana/engine.ts` — ELIANA engine (calls /api/chat)
- `src/lib/eliana/core/intelligent-engine.ts` — v2.0 engine

---

## Task 6: Connect Stripe

**Priority:** MEDIUM  
**Depends on:** Task 1  
**Status:** TODO

### Current State
- Stripe package installed
- Checkout endpoint returns 503 when unconfigured
- Price IDs are placeholders (`price_placeholder_*`)

### What to Do
1. Update Stripe keys in `.env.local`
2. Create real products/prices in Stripe dashboard
3. Update Price IDs in:
   - `src/app/api/stripe/checkout/route.ts`
   - `src/app/api/stripe/webhooks/route.ts`
   - `src/lib/memberships.ts`
4. Test checkout flow
5. Test webhook handling

---

## Task 7: Complete Incomplete Pages

**Priority:** LOW  
**Depends on:** Tasks 1-5  
**Status:** TODO

### Pages to Complete
1. **`/dashboard/publicidad`** — Currently pure placeholder
2. **`/ecosystem/payments`** — Mockup with blur overlay
3. **`/ecosystem/delivery`** — Mockup only
4. **`/ecosystem/album`** — Partial implementation
5. **`/ecosystem/escuela`** — Partial implementation
6. **`/admin/*`** — 6 pages with hardcoded data

### Approach
For each page:
1. Review current state
2. Define required Supabase tables
3. Add migrations if needed
4. Implement real data fetching
5. Add loading states
6. Test with real data

---

## Task 8: Add Test Suite

**Priority:** LOW  
**Depends on:** Tasks 1-5  
**Status:** TODO

### Current State
- No tests exist anywhere
- No test framework configured

### What to Do
1. Install test framework:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```
2. Add test config (`vitest.config.ts`)
3. Create test directory structure:
   ```
   src/
     __tests__/
       components/
       lib/
       api/
   ```
4. Write tests for:
   - Core business logic (`auth.ts`, `profile.ts`, `memberships.ts`)
   - ELIANA engine (`eliana/engine.ts`, `eliana/core/intelligent-engine.ts`)
   - API routes (chat, checkout, webhooks)
   - Components (settings, chat, consejo)
5. Add test script to `package.json`:
   ```json
   "scripts": {
     "test": "vitest",
     "test:run": "vitest run"
   }
   ```

---

## Task 9: Add Error Boundaries

**Priority:** MEDIUM  
**Status:** TODO

### What to Do
1. Create `src/components/ErrorBoundary.tsx`
2. Wrap key routes:
   - `src/app/layout.tsx`
   - `src/app/eliana/layout.tsx`
   - `src/app/admin/layout.tsx`
3. Add error pages:
   - `src/app/error.tsx`
   - `src/app/not-found.tsx`
   - `src/app/admin/error.tsx`

---

## Task 10: Add Loading States

**Priority:** MEDIUM  
**Status:** TODO

### What to Do
1. Create skeleton components:
   - `src/components/ui/skeleton.tsx`
2. Add loading.tsx to key routes:
   - `src/app/dashboard/loading.tsx`
   - `src/app/admin/loading.tsx`
   - `src/app/eliana/loading.tsx`
   - `src/app/marketplace/loading.tsx`
3. Use Suspense boundaries in layouts

---

## Verification Checklist

After completing tasks, verify:
- [ ] Supabase connection works
- [ ] Auth flow works (login, signup, roles)
- [ ] ELIANA responds with real AI
- [ ] Stripe checkout works
- [ ] All pages load without errors
- [ ] No console errors in browser
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Deploy works (`npx vercel --prod`)

---

## Notes

- **Don't break localStorage** — Keep backward compatibility until Supabase is confirmed working
- **Test incrementally** — Don't try to fix everything at once
- **Check console** — Most errors appear in browser dev tools
- **Use real data** — Don't test with mock data after credentials are configured
- **Document changes** — Update FILES_CHANGED.md with every modification

---

*Generated by opencode/big-pickle on 2026-07-27*
