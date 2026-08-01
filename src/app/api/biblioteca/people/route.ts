import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"
import { z } from "zod"

const personSchema = z.object({
  name: z.string().min(1).max(300),
  biography: z.string().max(10_000).optional(),
  relationship_to_author: z.string().max(300).optional(),
  birth_date: z.string().max(50).optional(),
  death_date: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const people = await repo.getPeople()
  return NextResponse.json({ people })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = personSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de persona inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new BibliotecaRepository(supabase)
  const person = await repo.createPerson(parsed.data)
  if (!person) return NextResponse.json({ error: "Failed" }, { status: 500 })

  await writeAuditLog({
    action: "biblioteca.person.create",
    resource: "library_people",
    resource_type: "person",
    resource_id: person.id,
    new_value: { name: person.name },
    request,
    app_name: "zafiro",
  })

  return NextResponse.json(person, { status: 201 })
}
