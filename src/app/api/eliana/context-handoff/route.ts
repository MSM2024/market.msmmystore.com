import { NextRequest, NextResponse } from "next/server"

const RETURN_URL_ALLOWLIST = [
  "https://msmmystore.com",
  "https://zafiro.msmmystore.com",
  "https://market.msmmystore.com",
  "https://marketplace.msmmystore.com",
  "https://beta.msmmystore.com",
  "https://eliana.msmmystore.com",
]

interface HandoffPayload {
  source_app: string
  source_module?: string
  resource_type?: string
  resource_id?: string
  requested_action?: string
  return_url?: string
}

// In-memory store for demo. In production, use Supabase or Redis.
const handoffStore = new Map<string, { payload: HandoffPayload; expiresAt: number }>()

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
    source_app: String(payload.source_app || "").slice(0, 50),
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

    // Verify session (basic check - in production use Supabase)
    // For now, allow unauthenticated handoffs with limited context

    const handoffId = generateHandoffId()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    handoffStore.set(handoffId, { payload, expiresAt })

    // Cleanup expired entries periodically
    for (const [key, value] of handoffStore.entries()) {
      if (value.expiresAt < Date.now()) {
        handoffStore.delete(key)
      }
    }

    return NextResponse.json({
      handoff_id: handoffId,
      eliana_url: `https://eliana.msmmystore.com/chat?handoff=${handoffId}`,
      expires_in: 300,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

// Consume a handoff (called by ELIANA's chat page)
export async function GET(request: NextRequest) {
  const handoffId = request.nextUrl.searchParams.get("id")

  if (!handoffId) {
    return NextResponse.json({ error: "handoff id is required" }, { status: 400 })
  }

  const entry = handoffStore.get(handoffId)

  if (!entry) {
    return NextResponse.json({ error: "Handoff not found or expired" }, { status: 404 })
  }

  if (entry.expiresAt < Date.now()) {
    handoffStore.delete(handoffId)
    return NextResponse.json({ error: "Handoff expired" }, { status: 410 })
  }

  // Consume (one-time use)
  handoffStore.delete(handoffId)

  return NextResponse.json({
    context: entry.payload,
    consumed: true,
  })
}
