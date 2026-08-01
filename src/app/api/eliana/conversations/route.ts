import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { z } from "zod"

const conversationPostSchema = z.object({
  title: z.string().max(500).optional(),
  channel: z.string().max(50).optional(),
  source_app: z.string().max(100).optional(),
})

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: conversations, error } = await supabase
      .from("eliana_conversations")
      .select("*")
      .eq("channel", "web")
      .contains("metadata", JSON.stringify({ user_id: user.id }))
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    const enriched = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from("eliana_messages")
          .select("id, role, content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true })
          .limit(100)

        return { ...conv, messages: messages || [] }
      })
    )

    return NextResponse.json({ conversations: enriched })
  } catch {
    return NextResponse.json({ conversations: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = conversationPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de conversación inválidos", issues: parsed.error.issues }, { status: 400 })
    }

    const { data: conv, error } = await supabase
      .from("eliana_conversations")
      .insert({
        user_id: user.id,
        channel: parsed.data.channel || "web",
        status: "active",
        metadata: {
          user_id: user.id,
          user_name: user.user_metadata?.name || user.email,
          source_app: parsed.data.source_app || "eliana",
        },
        summary: parsed.data.title || null,
      })
      .select("id")
      .single()

    if (error) throw error

    return NextResponse.json({ conversation_id: conv.id })
  } catch {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { error } = await supabase
      .from("eliana_conversations")
      .delete()
      .eq("id", id)
      .contains("metadata", JSON.stringify({ user_id: user.id }))

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
