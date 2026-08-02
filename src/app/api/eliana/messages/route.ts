import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const messageSchema = z.object({
  conversation_id: z.string().min(1).max(200),
  role: z.enum(["user", "eliana", "human_agent"]),
  content: z.string().min(1).max(12000),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

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
    const limited = rateLimitByIp(request, { max: 60, windowMs: 60_000, keyPrefix: "eliana-messages" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = messageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "conversation_id, role, and content required" }, { status: 400 })
    }
    const { conversation_id, role, content, metadata } = parsed.data

    const { data: msg, error } = await supabase
      .from("eliana_messages")
      .insert({
        conversation_id,
        user_id: user.id,
        role,
        content,
        channel: "web",
        metadata: metadata ? { ...metadata, user_id: user.id } : { user_id: user.id },
      })
      .select("id, role, content, created_at")
      .single()

    if (error) throw error
    return NextResponse.json({ message: msg })
  } catch {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
  }
}
