---
id: technical-02-rutas-componentes
title: Rutas y Componentes
description: Catálogo completo de rutas, componentes y su propósito en ZAFIRO
category: technical
tags: [rutas, componentes, navegacion, pages]
version: 1.0
date: 2026-07-08
language: es
doc_form: hierarchical_model
---

# Rutas y Componentes

## Rutas Estáticas (22)

### Homepage
| Ruta | Archivo | Título SEO |
|------|---------|------------|
| `/` | `page.tsx` | ZAFIRO — Knowledge Future |

### Standalone Pages
| Ruta | Archivo | Título SEO |
|------|---------|------------|
| `/terms` | `terms/page.tsx` | Términos y Condiciones |
| `/privacy` | `privacy/page.tsx` | Política de Privacidad |
| `/rules` | `rules/page.tsx` | Reglas de la Comunidad |
| `/help` | `help/page.tsx` | Centro de Ayuda |
| `/contact` | `contact/page.tsx` | Contacto |
| `/memberships` | `memberships/page.tsx` | Membresías |
| `/settings` | `settings/page.tsx` | Configuración |
| `/messages` | `messages/page.tsx` | Mensajes |
| `/rewards` | `rewards/page.tsx` | MSM Rewards |
| `/admin` | `admin/page.tsx` | Panel de Administración |
| `/sponsors-page` | `sponsors-page/page.tsx` | Sponsors |
| `/profile-page` | `profile-page/page.tsx` | Perfil |
| `/gemologia` | `gemologia/page.tsx` | Gemología |

### Auth Pages
| Ruta | Archivo | Título SEO |
|------|---------|------------|
| `/auth/login` | `auth/login/page.tsx` | Iniciar Sesión |
| `/auth/register` | `auth/register/page.tsx` | Crear Cuenta |
| `/auth/recover` | `auth/recover/page.tsx` | Recuperar Contraseña |
| `/auth/verify` | `auth/verify/page.tsx` | Verificar |

### API
| Ruta | Método | Propósito |
|------|--------|-----------|
| `/api/chat` | POST | Chat con ELIANA (Gemini + fallback) |

## Componentes Principales

### Homepage (page.tsx) — ~1160 líneas
SPA con 6 vistas manejadas por `activeNav`:
1. **Inicio**: Stories, search, daily brief, knowledge graph, trends, questions, noble sponsors
2. **Explorar**: Search + filter by category, question results
3. **Círculos**: Community cards, join/leave functionality
4. **Gemología**: 4 sub-tabs (Lab, Handbook, AI, Lore)
5. **Sponsors**: Analytics, create campaign, campaigns list
6. **Perfil**: User info, streak, PTS, expert leaderboard

### Componentes Reutilizables
- `BottomNav` — Navegación inferior mobile con 5 íconos y labels
- `ParticlesBackground` — Fondo animado de partículas
- `NotificationsDropdown` — Dropdown de notificaciones con badge
- `StoriesBar` / `StoryViewer` — Stories estilo Instagram
- `DailyBrief` — Resumen diario con preguntas ELIANA
- `KnowledgeGraph` — Grafo interactivo de nodos de conocimiento
- `TrendsSection` — Tarjetas de tendencias con sparklines
- `ExpertLeaderboard` — Ranking de top experts
- `SponsorFloatingBar` — Barra flotante de anuncios
- `SponsorAnalyticsChart` — Gráfico de métricas de sponsor
- `SponsorDetailModal` — Modal de detalle de sponsor
- `StripeModal` — Modal de pago Stripe
- `AddQuestionModal` — Modal para crear preguntas
- `GemLab`, `Handbook`, `AiAssistant`, `LoreExplorer` — Subcomponentes de Gemología
