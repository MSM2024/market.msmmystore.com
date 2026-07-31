import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const people = await repo.getPeople()
  return NextResponse.json({ people })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const body = await request.json()
  const person = await repo.createPerson(body)
  if (!person) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(person, { status: 201 })
}
