---
id: technical-06-estado-proyecto
title: Estado del Proyecto
description: Estado actual del desarrollo, tareas completadas, activas y bloqueadas
category: technical
tags: [estado, desarrollo, roadmap, qa, progreso]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Estado del Proyecto

## Completado

### Auth (Supabase)
- `src/lib/auth.ts` con `registerUser`, `loginUser`, `getSession`, `refreshSession`, `logout`, `getUserRoles`
- Registro y login autentican contra Supabase Auth (sin proyecto configurado devuelven error honesto)
- Sesión y roles con caché local sincronizada (`zafiro_session`, `zafiro_user_roles`)
- Recuperación de contraseña real vía `/api/auth/reset-password` (requiere Supabase)
- Guardas del servidor `requireAuth` / `requireAdmin` / `requireOwner` en `src/lib/api-auth.ts`
- 60 migraciones Supabase (RLS activo en ~570 políticas) listas para aplicar

### Títulos SEO Únicos
- Hook `usePageTitle` agregado a las 16 páginas standalone
- Cada página tiene `<title>` propio vía `document.title`

### AGENTS.md
- Creado con comandos de workflow (start server, build, verify routes)
- Convenciones del proyecto documentadas

### Navegación Mobile
- Links a `/messages`, `/profile-page`, `/settings` visibles en header en todos los tamaños

### 22 Fixes de QA
- Imports muertos removidos, dead code eliminado
- Links de navegación agregados
- Colores de acento unificados a `#00D9FF`
- Formularios con persistencia localStorage
- Colores StripeModal normalizados
- Validación env vars en supabase.ts

## Bloqueado / Pendiente

### Stripe Real
- Requiere `.env.local` con STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PRICE_PRO, NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS

### Supabase Real
- Requiere proyecto Supabase + .env.local + migraciones SQL (profiles, questions, replies, communities, memberships, sponsors, notifications, referrals, rewards)

### Gemini AI
- Requiere GEMINI_API_KEY en .env.local

### Knowledge Pack v1
- Requiere recolección de fuentes, limpieza, canonización a Markdown, y despliegue de Dify CE + Qdrant

## Próximos Pasos

1. Aplicar las 60 migraciones Supabase en un proyecto real y setear las credenciales en el entorno
2. Configurar Stripe real (price IDs + webhook secret) para membresías y sponsors
3. Aumentar cuota de Gemini para desbloquear las respuestas de ELIANA
4. Conectar los datasets de Knowledge Pack v1 (retrieval con Qdrant/Dify) cuando estén desplegados
5. Desplegar en Vercel y validar PWA/service worker en el dominio real
