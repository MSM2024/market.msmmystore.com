import { NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "knowledge-stats" })
    if (limited) return limited

    const stats = await knowledgeRepo.getDashboardStats()
    return NextResponse.json(stats)
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
