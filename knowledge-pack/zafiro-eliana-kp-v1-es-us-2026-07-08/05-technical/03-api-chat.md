---
id: technical-03-api-chat
title: API de Chat (ELIANA)
description: Documentación de la API de chat con ELIANA, incluyendo Gemini y fallback local
category: technical
tags: [api, chat, eliana, gemini, ia]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# API de Chat (ELIANA)

## Endpoint

```
POST /api/chat
```

## Request Body

```json
{
  "message": "string (requerido)",
  "history": [
    { "role": "user" | "model", "text": "string" }
  ]
}
```

## Response

```json
{
  "text": "string"
}
```

## Errores

- `400`: Payload inválido (message no proporcionado o no es string)
- `500`: Error interno del servidor

## Comportamiento

### 1. Modo Gemini (Producción)
Si `GEMINI_API_KEY` está configurada en `.env.local`:
- Usa `gemini-1.5-flash` de Google Generative AI
- System instruction que define a ELIANA como advisor gemológico senior
- Parámetros: temperature 0.7, maxOutputTokens 800
- Responde en el mismo idioma del usuario (español o inglés)
- Si Gemini falla, hace fallback al modo local

### 2. Modo Fallback Local (Demo)
Si no hay `GEMINI_API_KEY` o Gemini falla:
- Usa respuestas predeterminadas basadas en palabras clave
- Palabras clave cubiertas: kashmir, velvet, padparadscha, synthetic, corundum, pleochroism, asterism, heat, mogok, valuation, elestial
- Respuestas genéricas para saludos, agradecimientos y consultas no reconocidas

### 3. System Instruction de ELIANA

```
You are Zafiro AI, a senior gemological advisor specializing in sapphires, 
rubies, and all corundum varieties. Respond with academic rigor, using proper 
gemological terminology (pleochroism, asterism, trichroism, rutile silk, etc.). 
Be concise but thorough. If asked about valuation, provide specific metrics. 
If asked about history, include provenance details. Maintain a tone of scholarly 
enthusiasm. Respond in the same language the user writes in (Spanish or English).
```

## Palabras Clave de Fallback

| Palabra Clave | Tema |
|---------------|------|
| kashmir | Zafiros de Cachemira (historia, características) |
| velvet | Lustre aterciopelado (seda de rutilo) |
| padparadscha | Zafiro padparadscha (color loto) |
| synthetic | Diferenciación natural vs sintético |
| corundum | Estructura cristalina del corindón |
| pleochroism | Pleocroísmo en zafiros |
| asterism | Efecto estrella (asterismo) |
| heat | Tratamiento térmico |
| mogok | Valle de Mogok (Myanmar) |
| valuation | Valoración de zafiros |
| elestial | Modelo conceptual de estrella perfecta |
