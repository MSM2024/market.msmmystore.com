import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const RETURN_URL_ALLOWLIST = [
  "https://msmmystore.com",
  "https://zafiro.msmmystore.com",
  "https://market.msmmystore.com",
  "https://marketplace.msmmystore.com",
  "https://beta.msmmystore.com",
]

const SOURCE_APPS = new Set(["zafiro", "marketplace", "whatsapp", "eliana"])

interface HandoffPayload {
  source_app: string
  source_module?: string
  resource_type?: string
  resource_id?: string
  requested_action?: string
  return_url?: string
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    }
  )
}

function generateHandoffId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function isValidReturnUrl(url: string | undefined): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return RETURN_URL_ALLOWLIST.some(allowed => parsed.origin === allowed)
  } catch {
    return false
  }
}

function sanitizePayload(payload: HandoffPayload): HandoffPayload {
  return {
    source_app: SOURCE_APPS.has(String(payload.source_app || "")) ? String(payload.source_app) : "zafiro",
    source_module: payload.source_module ? String(payload.source_module).slice(0, 50) : undefined,
    resource_type: payload.resource_type ? String(payload.resource_type).slice(0, 50) : undefined,
    resource_id: payload.resource_id ? String(payload.resource_id).slice(0, 36) : undefined,
    requested_action: payload.requested_action ? String(payload.requested_action).slice(0, 50) : undefined,
    return_url: payload.return_url || undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = sanitizePayload(body)

    if (!payload.source_app) {
      return NextResponse.json({ error: "source_app is required" }, { status: 400 })
    }

    if (!isValidReturnUrl(payload.return_url)) {
      return NextResponse.json({ error: "Invalid return_url" }, { status: 400 })
    }

    const handoffId = generateHandoffId()

    try {
      const supabase = await getSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: ticket, error } = await supabase.from("eliana_tickets").insert({
        source_app: payload.source_app,
        target_app: "eliana",
        status: "active",
        payload,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_by: user?.id || null,
      })
        .select("id")
        .single()

      if (error) {
        console.error("HANDOFF_INSERT_ERROR", error)
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
      }

      return NextResponse.json({
        handoff_id: ticket?.id || handoffId,
        eliana_url: `/eliana/chat?handoff=${ticket?.id || handoffId}`,
        expires_in: 300,
      })
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const handoffId = request.nextUrl.searchParams.get("id")

  if (!handoffId) {
    return NextResponse.json({ error: "handoff id is required" }, { status: 400 })
  }

  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from("eliana_tickets")
      .select("*")
      .eq("id", handoffId)
      .eq("status", "active")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Handoff not found or expired" }, { status: 404 })
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabase.from("eliana_tickets").update({ status: "expired" }).eq("id", handoffId)
      return NextResponse.json({ error: "Handoff expired" }, { status: 410 })
    }

    await supabase.from("eliana_tickets").update({ status: "consumed", consumed_at: new Date().toISOString() }).eq("id", handoffId)

    return NextResponse.json({
      context: data.payload,
      consumed: true,
    })
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
