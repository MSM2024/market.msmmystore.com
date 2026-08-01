import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { AlbumRepository } from "@/lib/album/repository"
import { albumFamilySchema } from "@/lib/album/validation"
import { rateLimitByIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ families: [], error: "Unavailable" }, { status: 503 })
  const repo = new AlbumRepository(supabase)
  const families = await repo.listFamilies()
  return NextResponse.json({ families })
}

export async function POST(request: NextRequest) {
  const rate = rateLimitByIp(request, { keyPrefix: "album-families", max: 20 })
  if (rate) return rate

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = albumFamilySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const repo = new AlbumRepository(supabase)
  const family = await repo.createFamily({ owner_id: user.id, ...parsed.data })
  if (!family) return NextResponse.json({ error: "No se pudo crear la familia" }, { status: 500 })

  await writeAuditLog({
    action: "album.family.created",
    resource_type: "album_family",
    resource_id: family.id,
    new_value: family,
    request,
    app_name: "album",
  })

  return NextResponse.json({ family }, { status: 201 })
}
