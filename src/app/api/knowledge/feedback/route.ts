import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answer_id, feedback_type, comment, metadata } = body

    if (!answer_id || !feedback_type) {
      return NextResponse.json({ error: "Answer ID and feedback type are required" }, { status: 400 })
    }

    const validTypes = ["helpful", "not_helpful", "outdated", "incorrect", "incomplete"]
    if (!validTypes.includes(feedback_type)) {
      return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 })
    }

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
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
