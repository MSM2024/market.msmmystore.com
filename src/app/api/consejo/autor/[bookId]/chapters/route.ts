import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { z } from "zod"

const schema = z.object({
  title: z.string().trim().min(1).max(300),
  summary: z.string().max(5000).optional(),
  content: z.string().max(200000).optional(),
  chapter_number: z.number().int().positive().optional(),
})

type Params = { params: Promise<{ bookId: string }> }

export async function POST(request: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { bookId } = await params
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const repo = new AutorIaRepository(admin)
  const book = await repo.getBook(bookId)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const chapter = await repo.createChapter(bookId, {
    title: parsed.data.title,
    summary: parsed.data.summary,
    content: parsed.data.content,
    chapter_number: parsed.data.chapter_number,
  })
  if (!chapter) return NextResponse.json({ error: "No se pudo crear el capítulo" }, { status: 500 })

  if (book.status === "idea") await repo.updateBook(bookId, { status: "draft" })

  return NextResponse.json({ chapter }, { status: 201 })
}
