import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { z } from "zod"

const schema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  summary: z.string().max(5000).optional(),
  content: z.string().max(200000).optional(),
  status: z.enum(["idea", "outline", "draft", "review", "approved", "published", "archived"]).optional(),
})

type Params = { params: Promise<{ chapterId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { chapterId } = await params
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })

  const repo = new AutorIaRepository(admin)
  const chapter = await repo.updateChapter(chapterId, parsed.data)
  if (!chapter) return NextResponse.json({ error: "Capítulo no encontrado" }, { status: 404 })
  return NextResponse.json({ chapter })
}

export async function DELETE(_: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { chapterId } = await params
  const repo = new AutorIaRepository(admin)
  const ok = await repo.deleteChapter(chapterId)
  if (!ok) return NextResponse.json({ error: "Capítulo no encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
