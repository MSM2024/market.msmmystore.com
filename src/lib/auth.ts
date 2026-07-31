'use client'

import { getSupabaseClient } from "./supabase"

export type UserRole = "customer" | "seller" | "vip" | "referrer" | "supplier" | "support" | "finance" | "admin" | "superadmin" | "owner" | "kyc" | "inventory" | "auditor" | "vendor"

export interface ZafiroSession {
  email: string
  name: string
  id: string
  role?: UserRole
  roles?: UserRole[]
}

const SESSION_KEY = "zafiro_session"
const ROLES_KEY = "zafiro_user_roles"

// --- Registration (API-backed) ---
export async function registerUser(name: string, email: string, password: string, referralCode?: string, signal?: AbortSignal): Promise<{ ok: boolean; error?: string; code?: string; autoConfirmed?: boolean }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email.toLowerCase(),
        password,
        termsAccepted: true,
        referralCode: referralCode || "",
      }),
      signal,
    })

    const data = await res.json().catch(() => null)
    if (!data) {
      return { ok: false, error: "No pudimos crear tu cuenta. Inténtalo nuevamente." }
    }

    if (!res.ok) {
      return { ok: false, error: data.message || "No pudimos crear tu cuenta. Inténtalo nuevamente.", code: data.code }
    }

    if (data?.userId) {
      const session: ZafiroSession = { email, name, id: data.userId }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }

    return { ok: true, autoConfirmed: data?.auto_confirmed === true }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "La solicitud superó el tiempo máximo. Revisa tu conexión e inténtalo de nuevo." }
    }
    return { ok: false, error: "Error de conexión. Verifica tu internet e inténtalo de nuevo." }
  }
}

const LOGIN_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  "invalid_credentials": "Correo o contraseña incorrectos.",
  "email_not_confirmed": "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  "rate_limit": "Has realizado varios intentos. Espera unos minutos antes de intentar de nuevo.",
  "Too many requests": "Has realizado varios intentos. Espera unos minutos antes de intentar de nuevo.",
  "User already registered": "Este correo ya está registrado.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
}

function translateError(msg: string): string {
  for (const [key, value] of Object.entries(LOGIN_ERRORS)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value
  }
  return msg
}

// --- Server-authoritative session (roles from server, not localStorage) ---
export interface ServerMe {
  user?: { id: string; email: string; name: string; emailConfirmed: boolean }
  profile?: { role?: string; plan?: string | null; name?: string | null; username?: string | null; avatar?: string | null }
  roles: UserRole[]
  ok: boolean
}

export async function fetchServerMe(): Promise<ServerMe> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.user) return { roles: [], ok: false }

    const roles: UserRole[] = Array.isArray(data.roles) ? [...data.roles] : []
    if (data.profile?.role && !roles.includes(data.profile.role)) {
      roles.unshift(data.profile.role)
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.name || data.user.email?.split("@")[0] || "",
        emailConfirmed: !!data.user.email_confirmed_at,
      },
      profile: data.profile,
      roles,
      ok: true,
    }
  } catch {
    return { roles: [], ok: false }
  }
}

// --- Login (Supabase-only) ---
export async function loginUser(email: string, password: string): Promise<{ ok: boolean; error?: string; session?: ZafiroSession; needsEmailConfirm?: boolean }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, error: "El servidor de autenticación no está configurado." }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const translated = translateError(error.message)
    return { ok: false, error: translated, needsEmailConfirm: error.message.toLowerCase().includes("email not confirmed") }
  }
  if (!data.user) return { ok: false, error: "No se pudo autenticar" }

  const name = data.user.user_metadata?.name || email.split("@")[0]

  const me = await fetchServerMe()
  if (me.ok && me.user) {
    const roles = (me.roles.length ? me.roles : ["customer"]) as UserRole[]
    const session: ZafiroSession = {
      email: me.user.email,
      name: me.user.name,
      id: me.user.id,
      role: roles[0],
      roles,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
    return { ok: true, session }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  const role = (profile?.role || "customer") as UserRole
  const session: ZafiroSession = { email, name, id: data.user.id, role, roles: [role] }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(ROLES_KEY, JSON.stringify([role]))
  return { ok: true, session }
}

// --- Session cache (fast read from localStorage) ---
export function getSession(): ZafiroSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
    return null
  } catch { return null }
}

// --- Refresh session from Supabase (call on app mount) ---
export async function refreshSession(): Promise<ZafiroSession | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return getSession()

  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) {
    logout()
    return null
  }

  const user = data.session.user

  const me = await fetchServerMe()
  if (me.ok && me.user) {
    const roles = (me.roles.length ? me.roles : ["customer"]) as UserRole[]
    const session: ZafiroSession = {
      email: me.user.email,
      name: me.user.name,
      id: me.user.id,
      role: roles[0],
      roles,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
    return session
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = (profile?.role || "customer") as UserRole
  const session: ZafiroSession = {
    email: user.email || "",
    name: user.user_metadata?.name || user.email?.split("@")[0] || "",
    id: user.id,
    role,
    roles: [role],
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(ROLES_KEY, JSON.stringify([role]))
  return session
}

// --- Logout (Supabase + clear cache) ---
export async function logout(): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(ROLES_KEY)
}

// --- Password recovery (API-backed) ---
export async function recoverPassword(email: string, signal?: AbortSignal): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase() }),
      signal,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: data?.message || "No pudimos enviar el enlace en este momento. Inténtalo de nuevo." }
    }
    return { ok: true }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "La solicitud superó el tiempo máximo. Revisa tu conexión e inténtalo de nuevo." }
    }
    return { ok: false, error: "Error de conexión. Verifica tu internet e inténtalo de nuevo." }
  }
}

// --- Role helpers (localStorage; TODO: migrate to Supabase) ---
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 110,
  superadmin: 100,
  admin: 90,
  auditor: 72,
  finance: 70,
  kyc: 65,
  inventory: 65,
  support: 60,
  vendor: 55,
  supplier: 50,
  seller: 40,
  vip: 30,
  referrer: 20,
  customer: 10,
}

export function getUserRoles(): UserRole[] {
  if (typeof window === "undefined") return ["customer"]
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    if (raw) return JSON.parse(raw)
    return ["customer"]
  } catch {
    return ["customer"]
  }
}

export function getUserRole(): UserRole {
  const roles = getUserRoles()
  return roles.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])[0] || "customer"
}

export function hasRole(role: UserRole): boolean {
  return getUserRoles().includes(role)
}

export function requireRole(required: UserRole): boolean {
  return ROLE_HIERARCHY[getUserRole()] >= ROLE_HIERARCHY[required]
}

export function canAccess(required: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[getUserRole()]
  const requiredLevel = ROLE_HIERARCHY[required]
  return userLevel >= requiredLevel
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}
