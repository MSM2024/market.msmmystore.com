import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const isInvalid = (v?: string) => !v || (v.startsWith("[") && v.endsWith("]")) || v === "your-anon-key-here" || v === "https://your-project.supabase.co"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = isInvalid(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? (isInvalid(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ? undefined : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let supabase = "not_configured"
  if (supabaseUrl && key) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      })
      supabase = res.ok ? "ok" : `error:${res.status}`
    } catch (e) {
      supabase = `error:${e instanceof Error ? e.message : "unknown"}`
    }
  }

  return NextResponse.json({
    ok: true,
    app: "ok",
    supabase,
    time: new Date().toISOString(),
  })
}
