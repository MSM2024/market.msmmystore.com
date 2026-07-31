import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversation_id")
    if (!conversationId) return NextResponse.json({ error: "conversation_id required" }, { status: 400 })

    const { data: messages, error } = await supabase
      .from("eliana_messages")
      .select("id, role, content, metadata, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return NextResponse.json({ messages: messages || [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { conversation_id, role, content } = body

    if (!conversation_id || !role || !content) {
      return NextResponse.json({ error: "conversation_id, role, and content required" }, { status: 400 })
    }

    if (!["user", "eliana", "human_agent"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const { data: msg, error } = await supabase
      .from("eliana_messages")
      .insert({
        conversation_id,
        user_id: user.id,
        role,
        content,
        channel: "web",
        metadata: { user_id: user.id },
      })
      .select("id, role, content, created_at")
      .single()

    if (error) throw error
    return NextResponse.json({ message: msg })
  } catch {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
  }
}
