import { NextRequest, NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

// ================================================================
// ELIANA AUDIT LOG API
// Tracks all ELIANA actions for admin dashboard and compliance
// ================================================================

function getSupabase() {
  if (!isSupabaseAvailable()) return null
  return getSupabaseClient()
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", message: "ELIANA_API_KEY not configured" },
    { status: 401 },
  )
}

// --- Validation Schemas ---

const AuditLogInsertSchema = z.object({
  event_type: z.string().min(1).max(100),
  resource_type: z.string().min(1).max(100),
  resource_id: z.string().max(100).optional(),
  channel: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

const AuditLogQuerySchema = z.object({
  event_type: z.string().max(100).optional(),
  resource_type: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
})

// --- POST: Insert audit log ---

export async function POST(request: NextRequest) {
  const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-audit" })
  if (limited) return limited

  const apiKey = process.env.ELIANA_API_KEY
  const authHeader = request.headers.get("authorization")

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return unauthorized()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request", message: "Request body must be valid JSON" },
      { status: 400 },
    )
  }

  const parsed = AuditLogInsertSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos inválidos"
    return NextResponse.json(
      { error: "Validation error", message: firstError },
      { status: 400 },
    )
  }

  const { event_type, resource_type, resource_id, channel, metadata } = parsed.data
  const ip_address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not available", message: "Cannot persist audit log" },
      { status: 503 },
    )
  }

  const { data: inserted, error } = await supabase
    .from("eliana_audit_logs")
    .insert({
      event_type,
      resource_type,
      resource_id: resource_id || null,
      channel: channel || null,
      metadata: metadata || {},
      ip_address,
    })
    .select("id, created_at")
    .single()

  if (error) {
    console.error("ELIANA audit insert failed:", error)
    return NextResponse.json(
      { error: "Insert failed", message: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    log: {
      id: inserted.id,
      event_type,
      resource_type,
      resource_id: resource_id || null,
      channel: channel || null,
      ip_address,
      created_at: inserted.created_at,
    },
  })
}

// --- GET: Query recent audit logs ---

export async function GET(request: NextRequest) {
  const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-audit" })
  if (limited) return limited

  const apiKey = process.env.ELIANA_API_KEY
  const authHeader = request.headers.get("authorization")

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const params: Record<string, unknown> = {}
  if (searchParams.get("event_type")) params.event_type = searchParams.get("event_type")
  if (searchParams.get("resource_type")) params.resource_type = searchParams.get("resource_type")
  if (searchParams.get("limit")) params.limit = Number(searchParams.get("limit"))

  const parsed = AuditLogQuerySchema.safeParse(params)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Parámetros inválidos"
    return NextResponse.json(
      { error: "Validation error", message: firstError },
      { status: 400 },
    )
  }

  const { event_type, resource_type, limit } = parsed.data

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      logs: [],
      total: 0,
      message: "Database not available",
    })
  }

  let dbQuery = supabase
    .from("eliana_audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (event_type) {
    dbQuery = dbQuery.eq("event_type", event_type)
  }
  if (resource_type) {
    dbQuery = dbQuery.eq("resource_type", resource_type)
  }

  const { data: logs, error, count } = await dbQuery

  if (error) {
    console.error("ELIANA audit query failed:", error)
    return NextResponse.json(
      { error: "Query failed", message: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    logs: logs || [],
    total: count || 0,
  })
}
