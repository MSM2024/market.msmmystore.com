import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

type ProfileRow = {
  id?: string
  user_id?: string
  email?: string
  name?: string | null
  full_name?: string | null
  username?: string | null
  role?: string | null
  plan?: string | null
  phone?: string | null
  avatar?: string | null
  avatar_url?: string | null
  bio?: string | null
  bio_short?: string | null
  bio_long?: string | null
  created_at?: string | null
  points?: number | null
  streak?: number | null
  followers?: number | null
  following?: number | null
  title?: string | null
  company?: string | null
  location?: string | null
  website?: string | null
  linktree?: string | null
  cover_image?: string | null
  country?: string | null
  province?: string | null
  municipality?: string | null
  social_links?: unknown
  custom_projects?: unknown
  badges?: unknown
}

function normalizeProfile(row: ProfileRow | null, fallbackEmail?: string): Record<string, unknown> | null {
  if (!row) return null
  const email = row.email || fallbackEmail || ""
  const emailPrefix = email.split("@")[0] || ""
  const name = row.name || row.full_name || emailPrefix || "Usuario"
  const location = [row.country, row.province, row.municipality].filter(Boolean).join(", ") || row.location || ""

  return {
    userId: row.id || row.user_id || "",
    name,
    publicName: name,
    username: row.username || emailPrefix,
    title: row.title || row.role || "",
    company: row.company || "",
    location,
    website: row.website || "",
    linktree: row.linktree || "",
    roles: row.role ? [row.role] : [],
    bioShort: row.bio_short || row.bio || "",
    bioLong: row.bio_long || row.bio || "",
    avatar: row.avatar || row.avatar_url || "",
    coverImage: row.cover_image || "",
    email,
    joinedAt: row.created_at || new Date().toISOString(),
    points: row.points ?? 0,
    streak: row.streak ?? 0,
    level: row.plan || "free",
    followers: row.followers ?? 0,
    following: row.following ?? 0,
    questions: 0,
    answers: 0,
    communities: 0,
    achievements: 0,
    sponsors: 0,
    projects: 0,
    visits: 0,
    customProjects: Array.isArray(row.custom_projects) ? row.custom_projects : [],
    socialLinks: Array.isArray(row.social_links) ? row.social_links : [],
    badges: Array.isArray(row.badges) ? row.badges : [],
  }
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ profile: null })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ profile: null })

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    return NextResponse.json({ profile: normalizeProfile(data as ProfileRow | null, user.email) })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

export async function PUT(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "user-profile" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const profileSchema = z.object({
      name: z.string().min(1).max(120).optional(),
      username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
      phone: z.string().max(30).optional(),
      avatar: z.string().max(500).optional(),
    })
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de perfil inválidos" }, { status: 400 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.name !== undefined) update.full_name = parsed.data.name
    if (parsed.data.phone !== undefined) update.phone = parsed.data.phone
    if (parsed.data.avatar !== undefined) update.avatar_url = parsed.data.avatar

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id)
      .select("*")
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ profile: normalizeProfile(data as ProfileRow | null, user.email) })
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "user-profile-delete" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id)

    if (deleteError) throw deleteError

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
