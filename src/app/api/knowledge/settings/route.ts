import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"

export async function GET() {
  try {
    const settings = await knowledgeRepo.getAllSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
