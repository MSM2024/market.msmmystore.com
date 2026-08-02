import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=")
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"))
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "auth-sessions" })
  if (limited) return limited

  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const currentSessionId = sessionData?.session?.access_token
    ? (decodeJwtPayload(sessionData.session.access_token)?.session_id as string | undefined)
    : undefined

  const { data, error } = await supabase.rpc("list_my_sessions")
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data || []) as Array<{
    session_id: string
    user_agent: string | null
    ip: string | null
    created_at: string
    updated_at: string
    factor_id: string | null
    aal: string | null
  }>

  const sessions = rows.map((s) => ({
    id: s.session_id,
    user_agent: s.user_agent || null,
    ip: s.ip || null,
    created_at: s.created_at,
    updated_at: s.updated_at,
    aal: s.aal || null,
    factor_id: s.factor_id || null,
    is_current: s.session_id === currentSessionId,
  }))

  return NextResponse.json({ sessions })
}

export async function DELETE(req: NextRequest) {
  const limited = rateLimitByIp(req, { max: 30, windowMs: 60_000, keyPrefix: "auth-sessions" })
  if (limited) return limited

  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })
  }

  const body = (await req.json().catch(() => null)) as { jti?: string; all?: boolean } | null

  if (body?.all) {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentSessionId = sessionData?.session?.access_token
      ? (decodeJwtPayload(sessionData.session.access_token)?.session_id as string | undefined)
      : undefined
    if (!currentSessionId) {
      return NextResponse.json({ error: "No se pudo identificar la sesión actual" }, { status: 400 })
    }
    const { error } = await supabase.rpc("revoke_other_sessions", { p_current_session: currentSessionId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const jti = body?.jti
  if (!jti || typeof jti !== "string") {
    return NextResponse.json({ error: "Falta el identificador de sesión" }, { status: 400 })
  }

  const { error } = await supabase.rpc("revoke_my_session", { p_session_id: jti })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
