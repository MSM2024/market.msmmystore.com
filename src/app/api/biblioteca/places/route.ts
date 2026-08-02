import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"
import { z } from "zod"

const placeSchema = z.object({
  name: z.string().min(1).max(300),
  location_type: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  description: z.string().max(10_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const places = await repo.getPlaces()
  return NextResponse.json({ places })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = placeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de lugar inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new BibliotecaRepository(supabase)
  const place = await repo.createPlace(parsed.data)
  if (!place) return NextResponse.json({ error: "Failed" }, { status: 500 })

  await writeAuditLog({
    action: "biblioteca.place.create",
    resource: "library_places",
    resource_type: "place",
    resource_id: place.id,
    new_value: { name: place.name },
    request,
    app_name: "zafiro",
  })

  return NextResponse.json(place, { status: 201 })
}
