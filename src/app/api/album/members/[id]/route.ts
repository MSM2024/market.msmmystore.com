import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { AlbumRepository } from "@/lib/album/repository"
import { albumMemberPatchSchema } from "@/lib/album/validation"
import { rateLimitByIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-members", max: 30 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  const repo = new AlbumRepository(supabase)
  const member = await repo.getMember(id)
  if (!member) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 })
  if (!(await repo.familyOwnedBy(member.family_id, user.id))) {
    return NextResponse.json({ error: "No tienes permiso sobre esta familia" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = albumMemberPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updated = await repo.updateMember(id, parsed.data)
  if (!updated) return NextResponse.json({ error: "No se pudo actualizar el miembro" }, { status: 500 })

  await writeAuditLog({
    action: "album.member.updated",
    resource_type: "album_member",
    resource_id: id,
    previous_value: member,
    new_value: updated,
    request,
    app_name: "album",
  })
  return NextResponse.json({ member: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-members", max: 30 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  const repo = new AlbumRepository(supabase)
  const member = await repo.getMember(id)
  if (!member) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 })
  if (!(await repo.familyOwnedBy(member.family_id, user.id))) {
    return NextResponse.json({ error: "No tienes permiso sobre esta familia" }, { status: 403 })
  }

  const ok = await repo.deleteMember(id)
  if (!ok) return NextResponse.json({ error: "No se pudo eliminar el miembro" }, { status: 500 })

  await writeAuditLog({
    action: "album.member.deleted",
    resource_type: "album_member",
    resource_id: id,
    request,
    app_name: "album",
  })
  return NextResponse.json({ ok: true })
}
