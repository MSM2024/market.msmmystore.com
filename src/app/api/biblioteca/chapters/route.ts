import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"
import { z } from "zod"

const postSchema = z.object({
  book_id: z.string().uuid(),
  chapter_number: z.number().int().positive(),
  title: z.string().max(500).optional(),
  summary: z.string().max(5000).optional(),
  content_original: z.string().max(1_000_000).optional(),
  word_count: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const putSchema = postSchema.extend({
  id: z.string().uuid(),
})

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de capítulo inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new BibliotecaRepository(supabase)
  const book = await repo.getBook(parsed.data.book_id)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const chapter = await repo.createChapter(parsed.data)
  if (!chapter) return NextResponse.json({ error: "Failed" }, { status: 500 })

  await repo.logAccess({
    book_id: book.id,
    actor_id: auth.auth.userId,
    actor_email: auth.auth.email,
    action: "chapter_create",
    resource_type: "chapter",
    resource_id: chapter.id,
    resource_title: chapter.title || `Capítulo ${chapter.chapter_number}`,
    new_value: { chapter_number: chapter.chapter_number, word_count: chapter.word_count ?? null },
  }, request)
  await writeAuditLog({
    action: "biblioteca.chapter.create",
    resource: "library_chapters",
    resource_type: "chapter",
    resource_id: chapter.id,
    new_value: { book_id: chapter.book_id, chapter_number: chapter.chapter_number },
    request,
    app_name: "zafiro",
  })

  return NextResponse.json(chapter, { status: 201 })
}

export async function PUT(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de capítulo inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const { id, ...updates } = parsed.data
  const repo = new BibliotecaRepository(supabase)
  const chapter = await repo.updateChapter(id, updates)
  if (!chapter) return NextResponse.json({ error: "Capítulo no encontrado" }, { status: 404 })

  await writeAuditLog({
    action: "biblioteca.chapter.update",
    resource: "library_chapters",
    resource_type: "chapter",
    resource_id: chapter.id,
    new_value: { book_id: chapter.book_id, chapter_number: chapter.chapter_number },
    request,
    app_name: "zafiro",
  })

  return NextResponse.json(chapter)
}
