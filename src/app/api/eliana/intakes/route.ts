import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const intakePostSchema = z.object({
  conversation_id: z.string().uuid(),
  intake_type: z.string().min(1).max(100),
  data: z.record(z.string(), z.unknown()).optional(),
  completed: z.boolean().optional(),
})

const intakePutSchema = z.object({
  id: z.string().uuid(),
  intake_type: z.string().min(1).max(100).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  completed: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-intakes" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ intakes: [] })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ intakes: [] })
    const { data: convs } = await supabase
      .from("eliana_conversations")
      .select("id")
      .contains("metadata", JSON.stringify({ user_id: user.id }))
    const convIds = (convs || []).map(c => c.id)
    if (convIds.length === 0) return NextResponse.json({ intakes: [] })
    const { data: intakes } = await supabase
      .from("eliana_intakes")
      .select("*, eliana_conversations!inner(summary, created_at)")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(50)
    return NextResponse.json({ intakes: intakes || [] })
  } catch { return NextResponse.json({ intakes: [] }) }
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-intakes" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => null)
    const parsed = intakePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de intake inválidos", issues: parsed.error.issues }, { status: 400 })
    }
    const { data: intake, error } = await supabase
      .from("eliana_intakes")
      .insert({ conversation_id: parsed.data.conversation_id, user_id: user.id, intake_type: parsed.data.intake_type, data: parsed.data.data ?? {}, completed: parsed.data.completed ?? false })
      .select("*")
      .single()
    if (error) throw error
    return NextResponse.json({ intake })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear intake"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-intakes" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => null)
    const parsed = intakePutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de intake inválidos", issues: parsed.error.issues }, { status: 400 })
    }
    const { id, ...fields } = parsed.data
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (fields.intake_type !== undefined) update.intake_type = fields.intake_type
    if (fields.data !== undefined) update.data = fields.data
    if (fields.completed !== undefined) update.completed = fields.completed
    const { data: intake, error } = await supabase
      .from("eliana_intakes")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return NextResponse.json({ intake })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar intake"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
