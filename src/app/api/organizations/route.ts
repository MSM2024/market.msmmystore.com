import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

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

  const limited = rateLimitByIp(req, { max: 10, windowMs: 60_000, keyPrefix: "organizations" })
  if (limited) return limited

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string
    slug?: string
    type?: string
  } | null

  const orgSchema = z.object({
    name: z.string().min(2).max(80),
    slug: z.string().max(60).optional(),
    type: z.enum(["business", "admin", "platform"]).optional(),
  })
  const parsed = orgSchema.safeParse({
    name: (body?.name || "").trim(),
    slug: (body?.slug || "").trim(),
    type: body?.type || "business",
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de organización inválidos" }, { status: 400 })
  }

  const name = parsed.data.name
  const type = parsed.data.type
  const slug = parsed.data.slug || slugify(name)

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
