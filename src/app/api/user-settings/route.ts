import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

const DEFAULTS = {
  theme: "dark",
  accent: "#00D9FF",
  language: "es",
  timezone: "America/Mexico_City",
  notifications: { email: true, push: true, sms: false },
  privacy: { showProfile: true, showActivity: false },
  accessibility: { reducedMotion: false, largeText: false, highContrast: false },
  audio: { voiceEnabled: false, autoPlay: true, volume: 80 },
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json(DEFAULTS)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(DEFAULTS)

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json(data || DEFAULTS)
  } catch {
    return NextResponse.json(DEFAULTS)
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { theme, accent, language, timezone, notifications, privacy, accessibility, audio } = body

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (theme !== undefined) update.theme = theme
    if (accent !== undefined) update.accent = accent
    if (language !== undefined) update.language = language
    if (timezone !== undefined) update.timezone = timezone
    if (notifications !== undefined) update.notifications = notifications
    if (privacy !== undefined) update.privacy = privacy
    if (accessibility !== undefined) update.accessibility = accessibility
    if (audio !== undefined) update.audio = audio

    const { data, error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" })
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
