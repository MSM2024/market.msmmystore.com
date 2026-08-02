import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

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
      .single()

    return NextResponse.json({ profile: data })
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
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) update[key] = value
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id)
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ profile: data })
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
