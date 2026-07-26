---
id: technical-05-integraciones
title: Integraciones Externas
description: Documentación de servicios externos: Stripe, Supabase, Gemini API
category: technical
tags: [integraciones, stripe, supabase, gemini, externo]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Integraciones Externas

## Stripe (Pagos)

### Estado: En integración (requiere API keys reales)

### Variables de Entorno
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_CUBA_PLUS=price_...
```

### Componentes
- `src/lib/stripe.ts` — Cliente Stripe frontend con `loadStripe()`
- `src/components/StripeModal.tsx` — Modal de pago Stripe
- Stripe Checkout para procesar pagos de membresías y campañas sponsor

### Uso Actual
- Sin API keys reales, el modal muestra interfaz placeholder
- Las campañas se crean igualmente en el estado local (persistencia localStorage)

## Supabase (Base de Datos + Auth)

### Estado: En integración (requiere API keys reales + proyecto)

### Variables de Entorno
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Componentes
- `src/lib/supabase.ts` — Cliente Supabase browser con `createClient()`
- Validación de variables de entorno al inicializar
- Proporciona cliente tipado para consultas futuras

### Esquema Planeado
Tablas: profiles, questions, replies, communities, memberships, sponsors, notifications, referrals, rewards

## Google Gemini (IA)

### Estado: Funcional con fallback local

### Variables de Entorno
```
GEMINI_API_KEY=AIza...
```

### Implementación
- API Route: `src/app/api/chat/route.ts`
- Modelo: `gemini-1.5-flash`
- System instruction para personalidad de ELIANA
- Fallback local con respuestas predeterminadas gemológicas
- Parámetros: temperature 0.7, maxOutputTokens 800

## Qdrant (Vector Store — Planeado)

### Estado: Planeado para Knowledge Pack v1

### Uso
- Almacenamiento de embeddings de documentos del Knowledge Pack
- Búsqueda semántica para RAG (Retrieval Augmented Generation)
- Integración con Dify CE como orquestador

## Dify CE (Orquestador IA — Planeado)

### Estado: Planeado para Knowledge Pack v1

### Uso
- Gestión de datasets de conocimiento
- Pipeline RAG completo
- Conexión con Qdrant como vector store
- API para consultas desde la app ZAFIRO
