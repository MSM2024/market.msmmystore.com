import { NextResponse } from "next/server"
import { seedKnowledgeBase, getSeedStats } from "@/lib/knowledge/seed"

export async function POST() {
  try {
    const result = await seedKnowledgeBase()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const stats = await getSeedStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
