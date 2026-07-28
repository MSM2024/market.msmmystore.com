import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const gaps = await knowledgeRepo.listGaps()
      const gap = gaps.find((g: any) => g.id === id)
      if (!gap) {
        return NextResponse.json({ error: "Gap not found" }, { status: 404 })
      }
      return NextResponse.json({ gap })
    }

    const gaps = await knowledgeRepo.listGaps()
    return NextResponse.json({
      gaps,
      total: gaps.length,
      open: gaps.filter((g: any) => g.status !== "archived").length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gap_type, title, description, related_query, suggested_content, priority } = body

    if (!gap_type || !title) {
      return NextResponse.json({ error: "Gap type and title are required" }, { status: 400 })
    }

    const validTypes = ["missing_topic", "outdated_info", "low_coverage", "contradiction", "user_request"]
    if (!validTypes.includes(gap_type)) {
      return NextResponse.json({ error: "Invalid gap type" }, { status: 400 })
    }

    const gap = await knowledgeRepo.createGap({
      gap_type,
      title,
      description,
      related_query,
      suggested_content,
      priority: priority || 0,
    })

    if (!gap) {
      return NextResponse.json({ error: "Failed to create gap" }, { status: 500 })
    }

    return NextResponse.json({ gap }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const gap = await knowledgeRepo.updateGap(id, updates)
    if (!gap) {
      return NextResponse.json({ error: "Failed to update gap" }, { status: 500 })
    }

    return NextResponse.json({ gap })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
