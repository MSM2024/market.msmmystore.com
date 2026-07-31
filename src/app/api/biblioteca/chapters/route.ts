import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const body = await request.json()
  const chapter = await repo.createChapter(body)
  if (!chapter) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(chapter, { status: 201 })
}

export async function PUT(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const chapter = await repo.updateChapter(body.id, body)
  if (!chapter) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(chapter)
}
