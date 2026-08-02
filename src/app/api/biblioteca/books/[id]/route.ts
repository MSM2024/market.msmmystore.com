import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getFallbackBookWithJoins, isSupabaseAvailable } from "@/lib/biblioteca/fallback"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!isSupabaseAvailable()) {
    const data = getFallbackBookWithJoins(id)
    if (!data) return NextResponse.json({ error: "Book not found" }, { status: 404 })
    return NextResponse.json(data)
  }

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    const data = getFallbackBookWithJoins(id)
    if (!data) return NextResponse.json({ error: "Book not found" }, { status: 404 })
    return NextResponse.json(data)
  }

  try {
    const repo = new BibliotecaRepository(supabase)
    const book = await repo.getBook(id)
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 })

    const [chapters, versions, people, places, topics, relationships, chunks, accessLogs] = await Promise.all([
      repo.getChapters(id),
      repo.getVersions(id),
      repo.getPeople(),
      repo.getPlaces(),
      repo.getTopics(),
      repo.getRelationships(id),
      repo.getChunks(id),
      repo.getAccessLogs(id),
    ])

    return NextResponse.json({ book, chapters, versions, people, places, topics, relationships, chunks, accessLogs })
  } catch {
    const data = getFallbackBookWithJoins(id)
    if (!data) return NextResponse.json({ error: "Book not found" }, { status: 404 })
    return NextResponse.json(data)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

    const { id } = await params
    const body = await request.json()
    const repo = new BibliotecaRepository(supabase)
    const updated = await repo.updateBook(id, body)
    if (!updated) return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

    const { id } = await params
    const repo = new BibliotecaRepository(supabase)
    const ok = await repo.deleteBook(id)
    if (!ok) return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}
