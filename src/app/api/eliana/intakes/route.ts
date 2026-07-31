import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
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
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { conversation_id, intake_type, data, completed } = await request.json()
    const { data: intake, error } = await supabase
      .from("eliana_intakes")
      .insert({ conversation_id, user_id: user.id, intake_type, data: data || {}, completed: completed || false })
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
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id, intake_type, data, completed } = await request.json()
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (intake_type !== undefined) update.intake_type = intake_type
    if (data !== undefined) update.data = data
    if (completed !== undefined) update.completed = completed
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
