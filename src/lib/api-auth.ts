import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const ADMIN_ROLES = ["owner", "admin", "superadmin"] as const
export const OWNER_ROLES = ["owner", "superadmin"] as const

export type AuthContext = {
  userId: string
  email: string
  role: string
}

type AuthResult =
  | { ok: true; auth: AuthContext }
  | { ok: false; response: NextResponse }

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Servicio no configurado" },
        { status: 503 }
      ),
    }
  }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      ),
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  const auth: AuthContext = {
    userId: data.user.id,
    email: data.user.email || "",
    role: (profile?.role as string) || "customer",
  }

  return { ok: true, auth }
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (!result.ok) return result

  if (!(ADMIN_ROLES as readonly string[]).includes(result.auth.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      ),
    }
  }

  return result
}

export async function requireOwner(): Promise<AuthResult> {
  const result = await requireAuth()
  if (!result.ok) return result

  if (!(OWNER_ROLES as readonly string[]).includes(result.auth.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      ),
    }
  }

  return result
}
