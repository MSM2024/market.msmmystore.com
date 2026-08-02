import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const ACTION_STATUSES = ["pending_confirmation", "confirmed", "executed", "failed"] as const

const actionPostSchema = z.object({
  conversation_id: z.string().uuid(),
  action_type: z.string().min(1).max(100),
  parameters: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(ACTION_STATUSES).optional(),
})

const actionPutSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ACTION_STATUSES).optional(),
  result: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  action_type: z.string().min(1).max(100).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-actions" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ actions: [] })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ actions: [] })
    const { data: convs } = await supabase
      .from("eliana_conversations")
      .select("id")
      .contains("metadata", JSON.stringify({ user_id: user.id }))
    const convIds = (convs || []).map(c => c.id)
    if (convIds.length === 0) return NextResponse.json({ actions: [] })
    const { data: actions } = await supabase
      .from("eliana_actions")
      .select("*, eliana_conversations!inner(summary, created_at)")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(50)
    return NextResponse.json({ actions: actions || [] })
  } catch { return NextResponse.json({ actions: [] }) }
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-actions" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => null)
    const parsed = actionPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de acción inválidos", issues: parsed.error.issues }, { status: 400 })
    }
    const { data: action, error } = await supabase
      .from("eliana_actions")
      .insert({
        conversation_id: parsed.data.conversation_id,
        user_id: user.id,
        action_type: parsed.data.action_type,
        parameters: parsed.data.parameters ?? {},
        status: parsed.data.status ?? "pending_confirmation",
      })
      .select("*")
      .single()
    if (error) throw error
    return NextResponse.json({ action })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear acción"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-actions" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => null)
    const parsed = actionPutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de acción inválidos", issues: parsed.error.issues }, { status: 400 })
    }
    const { id, ...fields } = parsed.data
    const update: Record<string, unknown> = {}
    if (fields.status !== undefined) {
      update.status = fields.status
      if (fields.status === "executed") update.executed_at = new Date().toISOString()
    }
    if (fields.result !== undefined) update.result = fields.result
    if (fields.action_type !== undefined) update.action_type = fields.action_type
    if (fields.parameters !== undefined) update.parameters = fields.parameters
    const { data: action, error } = await supabase
      .from("eliana_actions")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return NextResponse.json({ action })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar acción"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
