import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"

const ORG_ROLES = ["owner", "admin", "manager", "member", "viewer"] as const

async function getMembership(admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, userId: string, orgId: string) {
  const { data } = await admin
    .from("memberships")
    .select("id, role, status")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .maybeSingle()
  return data as { id: string; role: string; status: string } | null
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const orgId = req.nextUrl.searchParams.get("org")
  if (!orgId) return NextResponse.json({ error: "Falta la organización" }, { status: 400 })

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const membership = await getMembership(admin, auth.auth.userId, orgId)
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const { data: memberships, error } = await admin
    .from("memberships")
    .select("id, user_id, role, status, invited_by, created_at")
    .eq("organization_id", orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((memberships || []).map((m) => m.user_id).filter(Boolean))]
  const profiles: Record<string, { email: string; full_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data } = await admin.from("profiles").select("id, email, full_name").in("id", userIds)
    for (const p of data || []) {
      profiles[p.id] = { email: p.email, full_name: p.full_name }
    }
  }

  const members = (memberships || []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    status: m.status,
    invited_by: m.invited_by,
    created_at: m.created_at,
    email: profiles[m.user_id]?.email || "",
    name: profiles[m.user_id]?.full_name || "",
    is_self: m.user_id === auth.auth.userId,
  }))

  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = (await req.json().catch(() => null)) as {
    organization_id?: string
    email?: string
    role?: string
  } | null

  const orgId = body?.organization_id
  const email = (body?.email || "").trim().toLowerCase()
  const role = body?.role || "member"

  if (!orgId) return NextResponse.json({ error: "Falta la organización" }, { status: 400 })
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Correo inválido" }, { status: 400 })
  if (!(ORG_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const membership = await getMembership(admin, auth.auth.userId, orgId)
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const { data: user } = await admin.from("profiles").select("id").eq("email", email).maybeSingle()
  if (!user) {
    return NextResponse.json({ error: "No existe un usuario registrado con ese correo" }, { status: 404 })
  }

  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "El usuario ya es miembro de esta organización" }, { status: 409 })
  }

  const { error } = await admin.from("memberships").insert({
    user_id: user.id,
    organization_id: orgId,
    role,
    status: "active",
    invited_by: auth.auth.userId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = (await req.json().catch(() => null)) as { membership_id?: string; role?: string } | null
  const membershipId = body?.membership_id
  const role = body?.role

  if (!membershipId || !role || !(ORG_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { data: target } = await admin
    .from("memberships")
    .select("id, user_id, role, organization_id")
    .eq("id", membershipId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })

  const membership = await getMembership(admin, auth.auth.userId, target.organization_id)
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  if (target.role === "owner" && role !== "owner" && membership.role !== "owner") {
    return NextResponse.json({ error: "Solo el propietario puede cambiar el rol de otro propietario" }, { status: 403 })
  }

  if (target.role === "owner" && role !== "owner") {
    const { data: owners } = await admin
      .from("memberships")
      .select("id")
      .eq("organization_id", target.organization_id)
      .eq("role", "owner")
    if ((owners || []).length <= 1) {
      return NextResponse.json({ error: "La organización debe tener al menos un propietario" }, { status: 400 })
    }
  }

  const { error } = await admin.from("memberships").update({ role }).eq("id", membershipId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = (await req.json().catch(() => null)) as { membership_id?: string } | null
  const membershipId = body?.membership_id
  if (!membershipId) return NextResponse.json({ error: "Falta la membresía" }, { status: 400 })

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { data: target } = await admin
    .from("memberships")
    .select("id, user_id, role, organization_id")
    .eq("id", membershipId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })

  const membership = await getMembership(admin, auth.auth.userId, target.organization_id)
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  if (target.role === "owner") {
    const { data: owners } = await admin
      .from("memberships")
      .select("id")
      .eq("organization_id", target.organization_id)
      .eq("role", "owner")
    if ((owners || []).length <= 1) {
      return NextResponse.json({ error: "La organización debe tener al menos un propietario" }, { status: 400 })
    }
  }

  const { error } = await admin.from("memberships").delete().eq("id", membershipId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
