import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"

const MEMORY_TYPES = ["short_term", "long_term", "preference", "fact"] as const
const MAX_ROWS = 500

const memoryRowSchema = z.object({
  memory_type: z.enum(MEMORY_TYPES),
  key: z.string().max(500).nullable().optional(),
  content: z.string().min(1).max(20000),
  category: z.string().max(200).optional(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const postSchema = z.object({
  mode: z.enum(["append", "replace"]).default("append"),
  rows: z.array(memoryRowSchema).max(MAX_ROWS),
})

function authError() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function unavailableError() {
  return NextResponse.json({ error: "Unavailable" }, { status: 503 })
}

export async function GET(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-memory" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ rows: [] })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ rows: [] })
    const { data: rows, error } = await supabase
      .from("eliana_memory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(MAX_ROWS)
    if (error) throw error
    return NextResponse.json({ rows: rows || [] })
  } catch {
    return NextResponse.json({ rows: [] })
  }
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-memory" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return unavailableError()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return authError()

    const body = await request.json().catch(() => null)
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de memoria inválidos", issues: parsed.error.issues }, { status: 400 })
    }
    const { mode, rows } = parsed.data
    if (rows.length === 0) return NextResponse.json({ inserted: 0 })

    if (mode === "replace") {
      const { error: delError } = await supabase
        .from("eliana_memory")
        .delete()
        .eq("user_id", user.id)
      if (delError) throw delError
    }

    const payload = rows.map(r => ({
      user_id: user.id,
      memory_type: r.memory_type,
      key: r.key ?? null,
      content: r.content,
      category: r.category ?? "general",
      confidence: r.confidence ?? 1,
      metadata: r.metadata ?? {},
    }))

    const { error } = await supabase
      .from("eliana_memory")
      .insert(payload)
    if (error) throw error
    return NextResponse.json({ inserted: payload.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar memoria"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-memory" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return unavailableError()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return authError()

    const body = await request.json().catch(() => ({}))
    const id = typeof body?.id === "string" ? body.id : undefined

    let query = supabase.from("eliana_memory").delete().eq("user_id", user.id)
    if (id) query = query.eq("id", id)
    const { error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al borrar memoria"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
