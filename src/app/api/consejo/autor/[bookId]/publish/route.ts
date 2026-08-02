import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"

type Params = { params: Promise<{ bookId: string }> }

export async function POST(_: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { bookId } = await params
  const repo = new AutorIaRepository(admin)
  const book = await repo.getBook(bookId)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const chapters = await repo.listChapters(bookId)
  const withContent = chapters.filter(c => c.content.trim())
  if (withContent.length === 0) {
    return NextResponse.json({ error: "El libro aún no tiene capítulos con contenido" }, { status: 400 })
  }

  const result = await repo.publishToLibrary(bookId)
  if (!result.ok) {
    const message = result.error === "publish_create_failed"
      ? "No se pudo crear el libro en la Biblioteca Viva"
      : "No se pudo publicar el libro"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, libraryBookId: result.libraryBookId })
}
