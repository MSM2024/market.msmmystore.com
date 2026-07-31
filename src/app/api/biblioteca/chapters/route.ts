import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"

export async function POST(request: Request) {
  const body = await request.json()
  const chapter = await bibliotecaRepo.createChapter(body)
  if (!chapter) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(chapter, { status: 201 })
}

export async function PUT(request: Request) {
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const chapter = await bibliotecaRepo.updateChapter(body.id, body)
  if (!chapter) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(chapter)
}
