# ZAFIRO Project — Workflow & Commands

## Server
- **Start server**: `Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx next dev -p 3001" -NoNewWindow`
- **Kill server**: `Get-Process -Name node | Stop-Process -Force`
- **Build**: `cmd.exe /c "npm run build"`
- **Verify routes**:
  ```
  node -e "const http=require('http');['/','/terms','/privacy','/rules','/help','/contact','/memberships','/settings','/messages','/rewards','/admin','/sponsors-page','/profile-page','/gemologia','/universo','/about','/what-we-do','/how-it-works','/eliana','/ecosystem','/vision','/mission','/values','/dashboard','/referidos','/auth/login','/auth/register','/auth/recover','/auth/verify'].forEach(r=>http.get('http://localhost:3001'+r,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>console.log(r,res.statusCode,Math.round(d.length/1024)+'KB'))}).on('error',e=>console.log(r,'ERR')))"
  ```

## Routes
- **App**: `/` (SPA with 6 views: Inicio, Explorar, Gemología, Círculos, Sponsors, Perfil)
- **Standalone**: /terms, /privacy, /rules, /help, /contact, /memberships, /settings, /messages, /rewards, /admin, /sponsors-page, /profile-page, /gemologia, /about, /what-we-do, /how-it-works, /eliana, /ecosystem, /vision, /mission, /values, /dashboard, /referidos
- **Universo**: /universo (conexión de redes sociales y plataformas externas)
- **Perfil público**: /perfil/[username] (página pública de creador con ecosistema, conexiones, reputación; solo muestra plataformas `isActive: true`)
- **Panel Mis Conexiones**: /universo (modal de agregar/editar, toggle visibilidad, reordenar arriba/abajo, eliminar, vista previa con portada, agrupación por categorías)
- **Admin / Automation Center**: /admin (dashboard ELIANA con 8 tabs: Automation, Dashboard, Usuarios, Reportes, Contenido, Moderación, Config; métricas de automatización, alertas de fraude, rendimiento del sistema)
- **Auth**: /auth/login, /auth/register, /auth/recover, /auth/verify
- **API**: /api/chat (POST)
- **Total**: 33 static + 2 dynamic

## Conventions
- All pages are `'use client'` (can't use `generateMetadata`)
- Use `usePageTitle("Name")` from `@/lib/usePageTitle` for document.title
- Mobile-first: dark theme `#050816`, accent `#00D9FF`, font Geist
- BottomNav on `/`, Footer on all standalone pages (via ClientLayout)
- Icons: `lucide-react`. Animation: `motion/react`
- State persistence: localStorage (keys: `zafiro_messages`, `zafiro_contact_messages`, `zafiro_profile`, `zafiro_campaigns`, `zafiro_universo`, `zafiro_comentarios`, `zafiro_publicaciones`, `zafiro_following`, `zafiro_dark`, `zafiro_pts_accounts`, `zafiro_referrals`, `zafiro_rewards`)
- **Documentación oficial**: /about, /what-we-do, /how-it-works, /eliana, /ecosystem, /vision, /mission, /values, /help, /terms, /privacy, /rules

## Required ENV (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS`
- `GEMINI_API_KEY`
