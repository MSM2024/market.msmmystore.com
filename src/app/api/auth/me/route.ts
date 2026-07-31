import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json({ user: null, roles: [] }, { status: 503 })
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ user: null, roles: [] }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, plan, name, username, avatar, created_at")
      .eq("id", user.id)
      .maybeSingle()

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    const roles = new Set<string>()
    if (profile?.role) roles.add(profile.role)
    for (const row of roleRows || []) {
      if (row.role) roles.add(row.role)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "",
        email_confirmed_at: user.email_confirmed_at,
      },
      profile,
      roles: Array.from(roles),
    })
  } catch {
    return NextResponse.json({ user: null, roles: [] }, { status: 500 })
  }
}
