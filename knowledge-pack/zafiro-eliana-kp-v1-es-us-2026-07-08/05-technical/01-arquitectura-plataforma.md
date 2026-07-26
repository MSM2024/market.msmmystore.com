---
id: technical-01-arquitectura
title: Arquitectura de la Plataforma
description: Arquitectura técnica, stack tecnológico y estructura del proyecto ZAFIRO
category: technical
tags: [arquitectura, stack, tecnologia, estructura, nextjs]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Arquitectura de la Plataforma

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript
- **UI Library**: React 18+
- **Estilos**: Tailwind CSS con tema oscuro personalizado
- **Animaciones**: motion/react (framer-motion)
- **Iconos**: lucide-react

### Backend (API Routes)
- **API Routes**: Next.js API Routes (serverless)
- **IA**: Google Gemini API (gemini-1.5-flash)
- **Pagos**: Stripe SDK
- **Base de Datos**: Supabase (PostgreSQL) — en integración

### Estado Actual (MVP)
- **Autenticación**: localStorage (mock hasta Supabase Auth)
- **Persistencia**: localStorage para usuarios, sesiones, mensajes, contactos, perfil, campañas
- **IA**: Gemini API con fallback local gemológico

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage SPA (6 views)
│   ├── layout.tsx         # Root layout
│   ├── api/
│   │   └── chat/route.ts  # Chat API endpoint (Gemini + fallback)
│   ├── auth/              # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── recover/
│   │   └── verify/
│   ├── admin/
│   ├── contact/
│   ├── gemologia/
│   ├── help/
│   ├── memberships/
│   ├── messages/
│   ├── privacy/
│   ├── profile-page/
│   ├── rewards/
│   ├── rules/
│   ├── settings/
│   ├── sponsors-page/
│   └── terms/
├── components/            # React components
│   ├── gemology/          # Gemología components
│   │   ├── GemLab.tsx
│   │   ├── Handbook.tsx
│   │   ├── AiAssistant.tsx
│   │   └── LoreExplorer.tsx
│   ├── AddQuestionModal.tsx
│   ├── BottomNav.tsx
│   ├── DailyBrief.tsx
│   ├── ExpertLeaderboard.tsx
│   ├── KnowledgeGraph.tsx
│   ├── NotificationsDropdown.tsx
│   ├── ParticlesBackground.tsx
│   ├── SponsorAnalyticsChart.tsx
│   ├── SponsorDetailModal.tsx
│   ├── SponsorFloatingBar.tsx
│   ├── StoriesBar.tsx
│   ├── StoryViewer.tsx
│   ├── StripeModal.tsx
│   └── TrendsSection.tsx
├── lib/                   # Utilities and shared logic
│   ├── auth.ts            # Auth mock (localStorage)
│   ├── stripe.ts          # Stripe client
│   ├── supabase.ts        # Supabase client
│   ├── usePageTitle.ts    # SEO title hook
│   └── zafiro-data.ts     # Default data (stories, questions, etc.)
```

## Convenciones del Proyecto

- Todas las páginas son `'use client'` (no pueden usar `generateMetadata`)
- SEO manejado con hook `usePageTitle()` para `document.title`
- Tema oscuro: `#050816` (fondo), `#00D9FF` (acento)
- Fuente: Geist (monoespaciada)
- Mobile-first con BottomNav en homepage, Footer en páginas standalone
- Persistencia en localStorage con claves: `zafiro_messages`, `zafiro_contact_messages`, `zafiro_profile`, `zafiro_campaigns`, `zafiro_users`, `zafiro_session`
