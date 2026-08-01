import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { z } from "zod"

const updateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  subtitle: z.string().trim().max(300).optional(),
  purpose: z.string().trim().max(2000).optional(),
  target_reader: z.string().trim().max(500).optional(),
  outline: z.string().max(20000).optional(),
  voice: z.string().trim().max(200).optional(),
  style_guide: z.string().max(5000).optional(),
  visibility: z.enum(["private", "trusted_circle", "family", "team", "members", "public"]).optional(),
  status: z.enum(["idea", "outline", "draft", "review", "approved", "published", "archived"]).optional(),
})

type Params = { params: Promise<{ bookId: string }> }

export async function GET(_: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { bookId } = await params
  const repo = new AutorIaRepository(admin)
  const book = await repo.getBook(bookId)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const chapters = await repo.listChapters(bookId)
  const withSections = []
  for (const chapter of chapters) {
    const sections = await repo.listSections(chapter.id)
    withSections.push({ ...chapter, sections })
  }

  return NextResponse.json({ book, chapters: withSections })
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { bookId } = await params
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const repo = new AutorIaRepository(admin)
  const book = await repo.updateBook(bookId, parsed.data)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
  return NextResponse.json({ book })
}

export async function DELETE(_: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { bookId } = await params
  const repo = new AutorIaRepository(admin)
  const ok = await repo.softDeleteBook(bookId)
  if (!ok) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
