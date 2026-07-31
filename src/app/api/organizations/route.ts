import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })
  }

  const { data: memberships, error } = await admin
    .from("memberships")
    .select("id, role, status, organization:organizations!memberships_organization_id_fkey(*)")
    .eq("user_id", auth.auth.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const organizations = (memberships || [])
    .filter((m) => m.organization)
    .map((m) => {
      const org = m.organization as unknown as Record<string, unknown>
      return {
        membership_id: m.id,
        role: m.role,
        status: m.status,
        id: org.id,
        name: org.name,
        slug: org.slug,
        type: org.type,
        owner_id: org.owner_id,
        created_at: org.created_at,
      }
    })

  return NextResponse.json({ organizations })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string
    slug?: string
    type?: string
  } | null

  const name = (body?.name || "").trim()
  if (!name || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "El nombre debe tener entre 2 y 80 caracteres" }, { status: 400 })
  }

  const type = body?.type || "business"
  if (!["business", "admin", "platform"].includes(type)) {
    return NextResponse.json({ error: "Tipo de organización inválido" }, { status: 400 })
  }

  const slug = (body?.slug || "").trim() || slugify(name)

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug, type, owner_id: auth.auth.userId, status: "active", settings: {} })
    .select()
    .single()

  if (orgError) {
    const message = orgError.message.includes("duplicate") ? "Ya existe una organización con ese nombre" : orgError.message
    return NextResponse.json({ error: message }, { status: 409 })
  }

  const { error: memberError } = await admin.from("memberships").insert({
    user_id: auth.auth.userId,
    organization_id: org.id,
    role: "owner",
    status: "active",
    invited_by: auth.auth.userId,
  })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({
    organization: { id: org.id, name: org.name, slug: org.slug, type: org.type, owner_id: org.owner_id },
  })
}
