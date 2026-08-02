---
id: help-04-solucion-problemas
title: Solución de Problemas
description: Guía de solución de problemas comunes en la plataforma ZAFIRO
category: help-faq
tags: [problemas, errores, troubleshooting, solucion]
version: 1.0
date: 2026-07-08
language: es
doc_form: hierarchy_model
---

# Solución de Problemas

## Problemas de Cuenta

### No puedo iniciar sesión
- Verifica que el correo esté registrado (prueba con "¿Olvidaste tu contraseña?")
- La contraseña distingue mayúsculas y minúsculas
- El login requiere que el servidor de autenticación (Supabase) esté configurado; si no, verás un mensaje claro de "no configurado"

### No recibo el correo de recuperación
- El envío de correos de recuperación depende del servicio de email configurado en Supabase
- Revisa la carpeta de spam; si el servicio no está configurado, la app lo indica
- Si el correo no llega, contacta soporte para validar tu cuenta

### Error "Correo ya registrado"
- Cada correo electrónico solo puede tener una cuenta
- Usa "Recuperar Contraseña" si olvidaste tus credenciales

## Problemas de Contenido

### Mi pregunta no aparece en el feed
- Verifica que el filtro de categoría no esté activo
- La búsqueda por texto es sensible a mayúsculas/minúsculas
- Las preguntas se filtran por `selectedTag` y `searchQuery`

### No puedo ver respuestas
- Las respuestas se cargan al hacer clic en una pregunta (vista `selectedQuestion`)
- Verifica que la pregunta tenga respuestas en su array `replies`

## Problemas de PTS

### Mis PTS no se actualizan
- Las acciones que otorgan PTS se procesan en tiempo real en el estado local
- En el demo, los PTS se reinician al recargar la página (no hay persistencia de puntos individuales)

### La racha se reinició
- La racha se calcula por actividad diaria consecutiva
- En el demo actual, el valor de racha es estático (18 días)
- La implementación real requerirá Supabase para tracking de actividad

## Problemas de Sponsors

### Mi campaña no se muestra
- Verifica que el estado sea "Activa"
- Las campañas se filtran por coincidencia contextual con el contenido del usuario
- Prueba seleccionando la categoría correcta para tu campaña

### Stripe no procesa el pago
- En el demo, Stripe requiere API keys reales en `.env.local`
- Sin las keys configuradas, el modal de Stripe muestra un placeholder
- La campaña se crea igualmente en el estado local

## Problemas de ELIANA (Chat)

### ELIANA no responde
- Si `GEMINI_API_KEY` no está configurada, ELIANA usa respuestas predeterminadas
- Las respuestas predeterminadas cubren temas de gemología
- Verifica la conexión a internet para el modo Gemini

### Respuestas genéricas
- Sin Gemini activo, ELIANA responde con frases predeterminadas
- Configura `GEMINI_API_KEY` en `.env.local` para respuestas con IA real
