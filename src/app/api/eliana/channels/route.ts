import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { requireOwner } from "@/lib/api-auth"
import { rateLimitByIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit"
import { z } from "zod"

const EXTERNAL_CHANNELS = new Set(["whatsapp", "telegram", "email"])

const channelPatchSchema = z.object({
  channel_name: z.string().trim().min(1, "El nombre del canal es obligatorio").max(100),
  enabled: z.boolean().optional(),
  welcome_message: z.string().max(2000).optional(),
  system_prompt_addition: z.string().max(4000).optional(),
  max_context_length: z.number().int().min(500).max(32000).optional(),
  requires_auth: z.boolean().optional(),
  webhook_url: z.string().max(1000).nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export async function GET() {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ channels: [], error: "Unavailable" }, { status: 503 })

  const { data: channels, error } = await supabase
    .from("eliana_channels")
    .select("*")
    .order("channel_name", { ascending: true })

  if (error) {
    console.error("ELIANA_CHANNELS_GET_ERROR", error)
    return NextResponse.json({ channels: [], error: "Error al cargar canales" }, { status: 500 })
  }
  return NextResponse.json({ channels })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const rate = rateLimitByIp(request, { keyPrefix: "eliana-channels", max: 20 })
  if (rate) return rate

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = channelPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { channel_name, ...patch } = parsed.data

  const { data: existing } = await admin
    .from("eliana_channels")
    .select("*")
    .eq("channel_name", channel_name)
    .single()
  if (!existing) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 })
  }

  const enabling = patch.enabled === true
  const external = EXTERNAL_CHANNELS.has(channel_name) || existing.config?.requires_credentials === true
  if (enabling && !existing.enabled && external && existing.config?.credentials_configured !== true) {
    return NextResponse.json(
      { error: "No se puede activar este canal: requiere credenciales seguras aún no configuradas", reason: "requires_credentials" },
      { status: 400 }
    )
  }

  const { data: channel, error } = await admin
    .from("eliana_channels")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("channel_name", channel_name)
    .select()
    .single()

  if (error || !channel) {
    console.error("ELIANA_CHANNELS_PATCH_ERROR", error)
    return NextResponse.json({ error: "No se pudo actualizar el canal (¿existe?)" }, { status: 500 })
  }

  await writeAuditLog({
    action: "eliana.channel.updated",
    resource_type: "eliana_channel",
    resource_id: channel_name,
    previous_value: existing,
    new_value: channel,
    request,
    app_name: "eliana",
  })

  return NextResponse.json({ channel })
}
