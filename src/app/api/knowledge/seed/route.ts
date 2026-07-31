import { NextResponse } from "next/server"
import { seedKnowledgeBase, getSeedStats } from "@/lib/knowledge/seed"
import { requireAdmin } from "@/lib/api-auth"

export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const result = await seedKnowledgeBase()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const stats = await getSeedStats()
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
