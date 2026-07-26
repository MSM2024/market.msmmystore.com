---
id: core-05-equipo-ecosistema
title: Equipo y Ecosistema
description: Estructura del equipo detrás de ZAFIRO y los roles dentro del ecosistema
category: core
tags: [equipo, ecosistema, roles, administracion]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Equipo y Ecosistema

## Propiedad

ZAFIRO y la marca ELIANA son propiedad de **MSM**.

## Roles en el Ecosistema

### Sintonizadores (Usuarios)
- Usuarios registrados que participan en la plataforma
- Pueden hacer preguntas, responder, unirse a Círculos y ganar PTS
- Su perfil muestra su reputación, logros y actividad

### Expertos
- Sintonizadores con alta reputación (PTS) en categorías específicas
- Aparecen en el leaderboard de Expertos
- Sus respuestas tienen mayor visibilidad y credibilidad

### Administradores
- Gestionan la plataforma desde el Panel de Administración
- Revisan reportes, moderan contenido y configuran el sistema
- Tienen acceso a estadísticas globales de la plataforma

### Sponsors
- Empresas o marcas que crean campañas publicitarias segmentadas
- Pagan a través de Stripe para promocionar sus productos/servicios
- Reciben métricas de impresiones, clics y conversiones

## Equipo Técnico (Demo/MVP)

- **Frontend**: Next.js 14+ con App Router, React, TypeScript
- **Estilos**: Tailwind CSS con tema oscuro personalizado
- **Animaciones**: motion/react (framer-motion)
- **Iconos**: lucide-react
- **IA**: Google Gemini API (gemini-1.5-flash)
- **Pagos**: Stripe (en integración)
- **Base de Datos**: Supabase (en integración, actualmente localStorage)
- **Despliegue**: Next.js standalone build

## Stack Planeado (Producción)

- Frontend: Next.js + React + TypeScript
- Backend: Next.js API Routes + Supabase
- Base de Datos: PostgreSQL (vía Supabase)
- Autenticación: Supabase Auth
- Pagos: Stripe Connect
- IA: Google Gemini API + Dify CE como orquestador
- Vector Store: Qdrant para RAG
- Despliegue: Vercel / Docker
- Cache: Redis (planeado)
