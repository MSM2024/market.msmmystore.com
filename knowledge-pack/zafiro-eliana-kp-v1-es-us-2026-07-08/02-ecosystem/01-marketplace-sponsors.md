---
id: ecosystem-01-marketplace-sponsors
title: Marketplace de Sponsors
description: Sistema de publicidad inteligente, campañas sponsor, y marketplace de patrocinios
category: ecosystem
tags: [sponsors, publicidad, campañas, marketplace, stripe]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Marketplace de Sponsors

## Visión General

ZAFIRO implementa un sistema de publicidad inteligente donde los sponsors crean campañas segmentadas que aparecen contextualmente en el feed de los sintonizadores. El sistema usa matching contextual basado en:
- Categoría de contenido que explora el usuario
- Palabras clave en búsquedas activas
- Membresías y Círculos del usuario
- Comportamiento histórico de navegación

## Tipos de Sponsors

### Sponsors Activos
Campañas pagadas con presupuesto diario, métricas en tiempo real y segmentación por categoría. Ejemplos:
- Nothing Tech (Ciberseguridad) — $800/día
- Vercel Systems (Inteligencia Artificial) — $1,500/día
- Stripe Quantum (Economía de Datos) — $1,200/día
- OpenAI Research (Inteligencia Artificial) — $2,000/día
- Linear Labs (Ciencia Espacial) — $600/día
- BioSynthetica (Biotecnología) — $950/día

### Noble Sponsors
Patrocinadores destacados que apoyan la infraestructura de conocimiento. Se muestran en sección especial del homepage.

## Creación de Campañas

1. El sponsor completa formulario con: nombre de empresa, mensaje, detalles, categoría objetivo
2. Selecciona presupuesto diario ($50–$2,000 USD)
3. Paga a través de Stripe (integrado con StripeModal)
4. La campaña se activa inmediatamente
5. Recibe métricas en tiempo real: impresiones, clics, conversiones, CTR

## Segmentación

Categorías disponibles para segmentar campañas:
- Inteligencia Artificial
- Ciberseguridad
- Economía de Datos
- Ciencia Espacial
- Biotecnología

## Algoritmo de Matching Contextual

El sistema `getContextualAdMatch()` evalúa:
1. Coincidencia directa con categoría activa del usuario
2. Coincidencia por palabras clave en búsqueda
3. Coincidencia por Círculos del usuario
4. Coincidencia de intelecto general (fallback)

## Persistencia

Las campañas creadas por usuarios se persisten en localStorage con la clave `zafiro_campaigns`.
