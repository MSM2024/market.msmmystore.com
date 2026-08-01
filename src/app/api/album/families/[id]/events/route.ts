import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { AlbumRepository } from "@/lib/album/repository"
import { albumEventSchema } from "@/lib/album/validation"
import { rateLimitByIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-events", max: 30 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  const repo = new AlbumRepository(supabase)
  if (!(await repo.familyOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "No tienes permiso sobre esta familia" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = albumEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  if (parsed.data.family_id !== id) {
    return NextResponse.json({ error: "La familia no coincide con la ruta" }, { status: 400 })
  }

  const event = await repo.createEvent({ ...parsed.data, created_by: user.id })
  if (!event) return NextResponse.json({ error: "No se pudo crear el evento" }, { status: 500 })

  await writeAuditLog({
    action: "album.event.created",
    resource_type: "album_timeline_event",
    resource_id: event.id,
    new_value: event,
    request,
    app_name: "album",
  })
  return NextResponse.json({ event }, { status: 201 })
}
