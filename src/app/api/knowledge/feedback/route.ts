import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const feedbackSchema = z.object({
  answer_id: z.string().min(1).max(200),
  feedback_type: z.enum(["helpful", "not_helpful", "outdated", "incorrect", "incomplete"]),
  comment: z.string().max(3000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "knowledge-feedback" })
    if (limited) return limited

    const body = await request.json()
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de feedback inválidos" }, { status: 400 })
    }
    const { answer_id, feedback_type, comment, metadata } = parsed.data

    const feedback = await knowledgeRepo.addFeedback({
      answer_id,
      feedback_type,
      comment,
      metadata: metadata || {},
    })

    if (!feedback) {
      return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 })
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const answer_id = searchParams.get("answer_id")

    if (answer_id) {
      const { getSupabaseClient, isSupabaseAvailable } = await import("@/lib/supabase")
      if (!isSupabaseAvailable()) {
        return NextResponse.json({ feedback: [] })
      }

      const { data, error } = await getSupabaseClient()
        .from("knowledge_feedback")
        .select("*")
        .eq("answer_id", answer_id)
        .order("created_at", { ascending: false })

      if (error) return NextResponse.json({ feedback: [] })
      return NextResponse.json({ feedback: data || [] })
    }

    const stats = await knowledgeRepo.getFeedbackStats()
    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
