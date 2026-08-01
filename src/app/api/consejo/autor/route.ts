import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(300),
  subtitle: z.string().trim().max(300).optional(),
  purpose: z.string().trim().max(2000).optional(),
  target_reader: z.string().trim().max(500).optional(),
  outline: z.string().max(20000).optional(),
  voice: z.string().trim().max(200).optional(),
  style_guide: z.string().max(5000).optional(),
  visibility: z.enum(["private", "trusted_circle", "family", "team", "members", "public"]).optional(),
})

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const repo = new AutorIaRepository(admin)
  const books = await repo.listBooks()
  return NextResponse.json({ books })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const rate = rateLimitByIp(request, { keyPrefix: "autor-ia", max: 10 })
  if (rate) return rate

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const repo = new AutorIaRepository(admin)
  const book = await repo.createBook({
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    purpose: parsed.data.purpose,
    target_reader: parsed.data.target_reader,
    outline: parsed.data.outline,
    voice: parsed.data.voice,
    style_guide: parsed.data.style_guide,
    visibility: parsed.data.visibility,
  })
  if (!book) return NextResponse.json({ error: "No se pudo crear el libro" }, { status: 500 })

  return NextResponse.json({ book }, { status: 201 })
}
