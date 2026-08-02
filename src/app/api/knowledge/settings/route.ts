import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "knowledge-settings" })
    if (limited) return limited

    const settings = await knowledgeRepo.getAllSettings()
    return NextResponse.json({ settings })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "knowledge-settings" })
  if (limited) return limited

  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    const success = await knowledgeRepo.setSetting(key, value)
    if (!success) {
      return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
    }

    return NextResponse.json({ success: true, key, value })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
