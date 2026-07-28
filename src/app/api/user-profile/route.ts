import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

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
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { name, username, phone, avatar } = body

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) update.name = name
    if (username !== undefined) update.username = username
    if (phone !== undefined) update.phone = phone
    if (avatar !== undefined) update.avatar = avatar

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
