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

### Auth Funcional (Demo)
- `src/lib/auth.ts` con `registerUser`, `loginUser`, `getSession`, `logout`, `getUsers`
- Formularios de registro y login escriben/leen de localStorage
- Validación de errores y redirección al home
- Recuperación de contraseña valida existencia del email
- Perfil en homepage muestra nombre del usuario logueado
- Settings tiene botón de Cerrar Sesión funcional

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

1. Ejecutar plan de Knowledge Pack v1: recolectar fuentes, limpiar, canonizar, generar manifiesto y hashes
2. Desplegar Dify CE + Qdrant con Docker Compose
3. Crear scripts de importación y prueba de retrieval
4. Conectar los datasets a la app ELIANA en Dify
5. Migrar auth de localStorage a Supabase Auth
6. Integrar Stripe real para membresías y sponsors
7. Implementar Supabase DB completa
