import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { targetEmail, targetId, setupToken } = await request.json()
    const identifier = targetId || targetEmail

    if (!identifier) {
      return NextResponse.json({ error: "targetEmail o targetId requerido" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const setupKey = process.env.ZAFIRO_SETUP_TOKEN
    const hasSetupToken = setupKey && setupToken === setupKey

    if (!hasSetupToken) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile || !["owner", "superadmin"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const adminClient = getSupabaseAdminClient()
    if (adminClient) {
      let targetUser
      if (targetId) {
        const { data } = await adminClient.auth.admin.getUserById(targetId)
        targetUser = data?.user
      } else if (targetEmail) {
        const { data } = await adminClient.auth.admin.listUsers()
        targetUser = data?.users.find(u => u.email === targetEmail) || null
      }

      if (!targetUser) {
        return NextResponse.json({ error: `User not found: ${identifier}` }, { status: 404 })
      }

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ role: "owner", updated_at: new Date().toISOString() })
        .eq("id", targetUser.id)

      if (profileError) throw profileError

      const { error: planError } = await adminClient
        .from("profiles")
        .update({ plan: "lifetime_unlimited" })
        .eq("id", targetUser.id)

      if (planError) {
        console.warn("Plan column not available:", planError.message)
      }

      return NextResponse.json({
        ok: true,
        user: { id: targetUser.id, email: targetUser.email, role: "owner", plan: "lifetime_unlimited" },
      })
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq(targetId ? "id" : "username", targetId || targetEmail)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: `User not found: ${identifier}` }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "owner", updated_at: new Date().toISOString() })
      .eq("id", targetProfile.id)

    if (updateError) {
      return NextResponse.json({
        error: "No se pudo asignar el rol. La clave SUPABASE_SERVICE_ROLE_KEY no está configurada y la política RLS bloquea esta operación. Para resolver: (1) Configura SUPABASE_SERVICE_ROLE_KEY en Vercel, o (2) Ve a Supabase Dashboard → SQL Editor y ejecuta: UPDATE profiles SET role = 'owner' WHERE id = '<tu-user-id>';",
      }, { status: 503 })
    }

    return NextResponse.json({
      ok: true,
      user: { id: targetProfile.id, role: "owner" },
      note: "Rol asignado. Se recomienda configurar SUPABASE_SERVICE_ROLE_KEY para operaciones administrativas completas.",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
