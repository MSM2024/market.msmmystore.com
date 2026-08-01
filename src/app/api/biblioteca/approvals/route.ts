import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import { z } from "zod"

const APPROVAL_STATUSES = ["approved", "rejected", "revision_needed"] as const

const postSchema = z.object({
  book_id: z.string().uuid(),
  version_number: z.number().int().positive().optional(),
  review_notes: z.string().max(2000).optional(),
})

const putSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(APPROVAL_STATUSES),
  review_notes: z.string().max(2000).optional(),
})

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const approvals = await repo.listApprovals()
  return NextResponse.json({
    approvals,
    total: approvals.length,
    pending: approvals.filter(a => a.status === "pending").length,
  })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de aprobación inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new BibliotecaRepository(supabase)
  const book = await repo.getBook(parsed.data.book_id)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const approval = await repo.createApproval({
    book_id: parsed.data.book_id,
    version_number: parsed.data.version_number ?? book.version ?? 1,
    status: "pending",
    requested_by: auth.auth.userId,
    review_notes: parsed.data.review_notes,
    requested_at: new Date().toISOString(),
  })
  if (!approval) return NextResponse.json({ error: "No se pudo crear la solicitud" }, { status: 500 })

  await repo.updateBook(book.id, { status: "pendiente_revision" })
  await repo.logAccess({
    book_id: book.id,
    actor_id: auth.auth.userId,
    actor_email: auth.auth.email,
    action: "request_approval",
    resource_type: "book",
    resource_id: book.id,
    resource_title: book.title,
    new_value: { status: "pendiente_revision" },
  })

  return NextResponse.json({ approval }, { status: 201 })
}

export async function PUT(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de aprobación inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new BibliotecaRepository(supabase)
  const approval = await repo.updateApproval(parsed.data.id, {
    status: parsed.data.status,
    review_notes: parsed.data.review_notes,
    reviewed_by: auth.auth.userId,
    reviewed_at: new Date().toISOString(),
  })
  if (!approval) return NextResponse.json({ error: "No se pudo actualizar la solicitud" }, { status: 500 })

  const book = await repo.getBook(approval.book_id)
  if (book) {
    const bookStatus =
      parsed.data.status === "approved" ? "aprobado"
      : parsed.data.status === "rejected" ? "excluido"
      : "pendiente_revision"
    await repo.updateBook(book.id, { status: bookStatus, updated_at: new Date().toISOString() })
    await repo.logAccess({
      book_id: book.id,
      actor_id: auth.auth.userId,
      actor_email: auth.auth.email,
      action: `approval_${parsed.data.status}`,
      resource_type: "book",
      resource_id: book.id,
      resource_title: book.title,
      new_value: { status: bookStatus, review_notes: parsed.data.review_notes ?? null },
    })
  }

  return NextResponse.json({ approval })
}
