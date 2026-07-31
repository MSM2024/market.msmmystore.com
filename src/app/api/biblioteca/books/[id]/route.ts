import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"
import { findFallbackBook, getFallbackBookWithJoins, isSupabaseAvailable } from "@/lib/biblioteca/fallback"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const useDb = isSupabaseAvailable()

  if (!useDb) {
    const data = getFallbackBookWithJoins(id)
    if (!data) return NextResponse.json({ error: "Book not found" }, { status: 404 })
    return NextResponse.json(data)
  }

  try {
    const book = await bibliotecaRepo.getBook(id)
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 })

    const [chapters, versions, people, places, topics, relationships, chunks, accessLogs] = await Promise.all([
      bibliotecaRepo.getChapters(id),
      bibliotecaRepo.getVersions(id),
      bibliotecaRepo.getPeople(),
      bibliotecaRepo.getPlaces(),
      bibliotecaRepo.getTopics(),
      bibliotecaRepo.getRelationships(id),
      bibliotecaRepo.getChunks(id),
      bibliotecaRepo.getAccessLogs(id),
    ])

    return NextResponse.json({ book, chapters, versions, people, places, topics, relationships, chunks, accessLogs })
  } catch {
    const data = getFallbackBookWithJoins(id)
    if (!data) return NextResponse.json({ error: "Book not found" }, { status: 404 })
    return NextResponse.json(data)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
  try {
    const { id } = await params
    const body = await request.json()
    const updated = await bibliotecaRepo.updateBook(id, body)
    if (!updated) return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
  try {
    const { id } = await params
    const ok = await bibliotecaRepo.deleteBook(id)
    if (!ok) return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}
