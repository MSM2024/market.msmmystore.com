import { NextResponse } from "next/server"
import { seedKnowledgeBase, getSeedStats } from "@/lib/knowledge/seed"
import { requireAdmin } from "@/lib/api-auth"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "knowledge-seed" })
  if (limited) return limited

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const result = await seedKnowledgeBase()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "knowledge-seed" })
  if (limited) return limited

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const stats = await getSeedStats()
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
