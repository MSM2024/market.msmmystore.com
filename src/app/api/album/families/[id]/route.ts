import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { AlbumRepository } from "@/lib/album/repository"
import { albumFamilySchema } from "@/lib/album/validation"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const repo = new AlbumRepository(supabase)
  const family = await repo.getFamily(id)
  if (!family) return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 })
  return NextResponse.json({ family })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-families", max: 20 })
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

  const parsed = albumFamilySchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const family = await repo.updateFamily(id, parsed.data)
  if (!family) return NextResponse.json({ error: "No se pudo actualizar la familia" }, { status: 500 })
  return NextResponse.json({ family })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rate = rateLimitByIp(request, { keyPrefix: "album-families", max: 20 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  const repo = new AlbumRepository(supabase)
  if (!(await repo.familyOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "No tienes permiso sobre esta familia" }, { status: 403 })
  }

  const ok = await repo.deleteFamily(id)
  if (!ok) return NextResponse.json({ error: "No se pudo eliminar la familia" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
