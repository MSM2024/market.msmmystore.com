import { NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"

export async function GET() {
  try {
    const stats = await knowledgeRepo.getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
