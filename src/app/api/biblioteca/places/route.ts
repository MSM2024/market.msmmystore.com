import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"

export async function GET() {
  const places = await bibliotecaRepo.getPlaces()
  return NextResponse.json({ places })
}

export async function POST(request: Request) {
  const body = await request.json()
  const place = await bibliotecaRepo.createPlace(body)
  if (!place) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(place, { status: 201 })
}
