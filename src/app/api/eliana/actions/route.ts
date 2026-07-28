import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
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
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { conversation_id, action_type, parameters, status } = await request.json()
    const { data: action, error } = await supabase
      .from("eliana_actions")
      .insert({
        conversation_id,
        action_type,
        parameters: parameters || {},
        status: status || "pending_confirmation",
      })
      .select("*")
      .single()
    if (error) throw error
    return NextResponse.json({ action })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}

export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id, status, result, action_type, parameters } = await request.json()
    const update: Record<string, unknown> = {}
    if (status !== undefined) {
      update.status = status
      if (status === "executed") update.executed_at = new Date().toISOString()
    }
    if (result !== undefined) update.result = result
    if (action_type !== undefined) update.action_type = action_type
    if (parameters !== undefined) update.parameters = parameters
    const { data: action, error } = await supabase
      .from("eliana_actions")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return NextResponse.json({ action })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
