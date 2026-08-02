import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { AlbumRepository } from "@/lib/album/repository"
import { albumEventPatchSchema } from "@/lib/album/validation"
import { rateLimitByIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-events", max: 30 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  const repo = new AlbumRepository(supabase)
  const event = await repo.getEvent(id)
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
  if (!(await repo.familyOwnedBy(event.family_id, user.id))) {
    return NextResponse.json({ error: "No tienes permiso sobre esta familia" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = albumEventPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updated = await repo.updateEvent(id, parsed.data)
  if (!updated) return NextResponse.json({ error: "No se pudo actualizar el evento" }, { status: 500 })

  await writeAuditLog({
    action: "album.event.updated",
    resource_type: "album_timeline_event",
    resource_id: id,
    previous_value: event,
    new_value: updated,
    request,
    app_name: "album",
  })
  return NextResponse.json({ event: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-events", max: 30 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  const repo = new AlbumRepository(supabase)
  const event = await repo.getEvent(id)
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
  if (!(await repo.familyOwnedBy(event.family_id, user.id))) {
    return NextResponse.json({ error: "No tienes permiso sobre esta familia" }, { status: 403 })
  }

  const ok = await repo.deleteEvent(id)
  if (!ok) return NextResponse.json({ error: "No se pudo eliminar el evento" }, { status: 500 })

  await writeAuditLog({
    action: "album.event.deleted",
    resource_type: "album_timeline_event",
    resource_id: id,
    request,
    app_name: "album",
  })
  return NextResponse.json({ ok: true })
}
