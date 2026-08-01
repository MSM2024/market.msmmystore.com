import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

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
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "user-settings" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const settingsSchema = z.object({
      theme: z.string().min(1).max(100).optional(),
      accent: z.string().min(1).max(100).optional(),
      language: z.string().min(1).max(100).optional(),
      timezone: z.string().min(1).max(100).optional(),
      notifications: z.record(z.string(), z.boolean()).optional(),
      privacy: z.record(z.string(), z.boolean()).optional(),
      accessibility: z.record(z.string(), z.boolean()).optional(),
      audio: z.record(z.string(), z.boolean()).optional(),
    })
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de configuración inválidos" }, { status: 400 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) update[key] = value
    }

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
