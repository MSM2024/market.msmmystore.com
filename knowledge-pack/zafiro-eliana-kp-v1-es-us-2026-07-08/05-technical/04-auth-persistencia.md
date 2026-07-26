---
id: technical-04-auth-persistencia
title: Autenticación y Persistencia
description: Sistema de autenticación mock con localStorage y estrategia de persistencia
category: technical
tags: [auth, persistencia, localstorage, sesion, usuarios]
version: 1.0
date: 2026-07-08
language: es
doc_form: text_model
---

# Autenticación y Persistencia

## Sistema de Autenticación (Demo)

Actualmente, ZAFIRO usa un sistema de autenticación mock basado en localStorage mientras se integra Supabase Auth.

### Funciones Principales (src/lib/auth.ts)

| Función | Propósito |
|---------|-----------|
| `registerUser(name, email, password)` | Registra nuevo usuario y crea sesión |
| `loginUser(email, password)` | Autentica usuario y crea sesión |
| `getSession()` | Obtiene sesión activa desde localStorage |
| `logout()` | Elimina la sesión |
| `getUsers()` | Obtiene lista de usuarios registrados |
| `isLoggedIn()` | Verifica si hay sesión activa |

### Interfaz ZafiroUser

```typescript
interface ZafiroUser {
  name: string
  email: string
  password: string
  createdAt: string
  avatar?: string
  id: string
}
```

### Claves de localStorage

| Clave | Propósito | Formato |
|-------|-----------|---------|
| `zafiro_users` | Lista de usuarios registrados | JSON array |
| `zafiro_session` | Sesión activa | `{ email, name, id }` |
| `zafiro_messages` | Mensajes de chat | `Record<chatId, Message[]>` |
| `zafiro_contact_messages` | Mensajes de contacto | Array de formularios |
| `zafiro_profile` | Datos de perfil editados | Objeto con campos |
| `zafiro_campaigns` | Campañas sponsor creadas | Array de campañas |

## Estrategia de Transición a Supabase

1. **Fase 1 (Actual)**: Auth mock con localStorage
   - `registerUser` y `loginUser` usan `localStorage.getItem/setItem`
   - Sesión simulada con objeto JSON
   - Recuperación de contraseña validando existencia del email

2. **Fase 2 (Supabase Auth)**
   - Migrar a `supabase.auth.signUp()` y `supabase.auth.signInWithPassword()`
   - Reemplazar `getSession()` con `supabase.auth.getSession()`
   - Manejo de tokens JWT reales
   - Sesión persistente con refresh tokens

3. **Fase 3 (Supabase DB completa)**
   - Migrar perfiles a tabla `profiles`
   - Migrar preguntas a tabla `questions`
   - Migrar respuestas a tabla `replies`
   - Migrar comunidades a tabla `communities`
   - Migrar membresías a tabla `memberships`
   - Migrar sponsors a tabla `sponsors`
   - Migrar notificaciones a tabla `notifications`
   - Migrar referidos a tabla `referrals`
   - Migrar recompensas a tabla `rewards`
