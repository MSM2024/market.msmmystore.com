import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"

export async function GET() {
  const people = await bibliotecaRepo.getPeople()
  return NextResponse.json({ people })
}

export async function POST(request: Request) {
  const body = await request.json()
  const person = await bibliotecaRepo.createPerson(body)
  if (!person) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(person, { status: 201 })
}
