---
id: moderation-03-seguridad-privacidad
title: Seguridad y Privacidad
description: Medidas de seguridad, protección de datos y buenas prácticas en ZAFIRO
category: moderation
tags: [seguridad, privacidad, datos, proteccion]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Seguridad y Privacidad

## Medidas de Seguridad

### Protección de Datos
- Cifrado en reposo para datos almacenados en servidores
- Cifrado en tránsito (HTTPS/TLS) para todas las comunicaciones
- Implementación de AES-256 para datos sensibles
- Autenticación segura (planeado: Supabase Auth con JWT)

### Seguridad de Cuenta
- Contraseñas con mínimo 8 caracteres (incluyendo mayúscula y número)
- Sesión con timeout (planeado para producción)
- Opción de cerrar sesión desde configuración
- Botón de eliminar cuenta disponible

### Seguridad de la Plataforma
- Validación de entrada en formularios
- Protección contra XSS (React lo maneja por defecto)
- API routes con validación de payload
- Variables de entorno para secrets (no expuestas al cliente)

## Privacidad del Usuario

### Datos Recopilados
- Información de registro: nombre, correo, nombre de usuario
- Contenido generado: preguntas, respuestas, comentarios
- Datos de uso: páginas visitadas, interacciones, tiempo de sesión
- Datos de dispositivo: navegador, sistema operativo

### Derechos del Usuario
- Acceso a datos personales
- Corrección de datos inexactos
- Eliminación de datos
- Exportación de datos en formato portable
- Oposición al procesamiento

### Retención de Datos
- Datos conservados mientras la cuenta esté activa
- Tras eliminación: datos anonimizados o eliminados en 30 días
- Los datos en localStorage del demo se eliminan al borrar datos del navegador

## Buenas Prácticas para Sintonizadores

### Recomendado
- Usar contraseñas fuertes y únicas
- Mantener la sesión cerrada en dispositivos compartidos
- Reportar contenido sospechoso o violaciones de privacidad
- Verificar información crítica con fuentes adicionales
- Revisar la configuración de privacidad periódicamente

### No Recomendado
- Compartir credenciales de acceso
- Publicar información personal propia o de terceros
- Hacer clic en enlaces sospechosos
- Compartir datos sensibles en preguntas o respuestas
- Usar la misma contraseña que en otros servicios
