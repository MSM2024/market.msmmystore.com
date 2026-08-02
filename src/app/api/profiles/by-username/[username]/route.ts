import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "profile-lookup" })
    if (limited) return limited

    const { username } = await params
    const clean = decodeURIComponent(username).trim()
    if (!clean || clean.length > 50) {
      return NextResponse.json({ profile: null })
    }

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ profile: null })

    const { data: rpcResult, error: rpcError } = await supabase.rpc("get_public_profile", { p_username: clean })
    if (!rpcError) {
      const found = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult
      if (found) return NextResponse.json({ profile: found })
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, username, role, avatar, created_at, status")
      .eq("username", clean)
      .maybeSingle()

    if (error || !data) return NextResponse.json({ profile: null })
    return NextResponse.json({ profile: data })
  } catch {
    return NextResponse.json({ profile: null })
  }
}
