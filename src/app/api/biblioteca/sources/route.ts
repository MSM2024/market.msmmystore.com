import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"

export async function GET() {
  const sources = await bibliotecaRepo.getSources()
  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  const body = await request.json()
  const source = await bibliotecaRepo.createSource(body)
  if (!source) return NextResponse.json({ error: "Failed to create source" }, { status: 500 })
  return NextResponse.json(source, { status: 201 })
}
