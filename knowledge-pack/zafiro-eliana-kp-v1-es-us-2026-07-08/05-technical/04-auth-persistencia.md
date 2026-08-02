---
id: technical-04-auth-persistencia
title: Autenticación y Persistencia
description: Sistema de autenticación con Supabase Auth y persistencia en la base de datos
category: technical
tags: [auth, persistencia, supabase, sesion, usuarios]
version: 1.1
date: 2026-07-08
language: es
doc_form: text_model
---

# Autenticación y Persistencia

## Sistema de Autenticación (Supabase Auth)

ZAFIRO usa **Supabase Auth** para registrar, autenticar y gestionar sesiones. El login exige un proyecto Supabase configurado: sin él, las rutas de autenticación devuelven un error honesto ("El servidor de autenticación no está configurado") en lugar de simular una sesión.

### Funciones Principales (src/lib/auth.ts)

| Función | Propósito |
|---------|-----------|
| `registerUser(name, email, password)` | Registra usuario vía `/api/auth/register` (Supabase) |
| `loginUser(email, password)` | Autentica con `supabase.auth.signInWithPassword` |
| `getSession()` | Lee la sesión activa en caché local |
| `refreshSession()` | Valida la sesión contra Supabase y repersiste |
| `logout()` | Cierra sesión en Supabase y limpia la caché |
| `getUserRoles()` / `hasRole()` | Roles de usuario (caché local sincronizada con Supabase) |

### Claves de localStorage (caché de sesión)

| Clave | Propósito | Formato |
|-------|-----------|---------|
| `zafiro_session` | Caché de la sesión activa (token/usuario) | `{ accessToken?, email, name, id }` |
| `zafiro_user_roles` | Caché de roles (admin/owner/member) | JSON array |
| `zafiro_messages` | Mensajes de chat | `Record<chatId, Message[]>` |
| `zafiro_contact_messages` | Mensajes de contacto (respaldo local) | Array de formularios |
| `zafiro_profile` | Datos de perfil editados | Objeto con campos |
| `zafiro_campaigns` | Campañas sponsor creadas | Array de campañas |

> Nota: `zafiro_session` y `zafiro_user_roles` son solo una **caché**. La fuente de verdad es Supabase; sin proyecto configurado no se puede iniciar sesión.

## Persistencia en la Base de Datos (Supabase)

El esquema (60 migraciones, ~90 tablas con RLS activo) cubre: `profiles`, `auth` (Supabase Auth), `questions`, `replies`, `communities`, `memberships`, `sponsors`, `notifications`, `referrals`, `rewards`, marketplace, biblioteca, knowledge y auditoría. Las tablas se aplican al proyecto Supabase mediante migraciones; los datos no se fabrican localmente.
