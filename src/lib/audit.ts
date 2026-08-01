import { getSupabaseServerClient } from "@/lib/supabase-server"

export interface AuditLogInput {
  action: string
  resource?: string
  resource_type?: string
  resource_id?: string
  previous_value?: unknown
  new_value?: unknown
  details?: string
  reason?: string
  request?: Request | null
  app_name?: string
}

const toJson = (value: unknown): unknown => {
  if (value === undefined || value === null) return null
  try { return JSON.parse(JSON.stringify(value)) } catch { return null }
}

export async function writeAuditLog(input: AuditLogInput): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  const ip =
    input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    input.request?.headers.get("x-real-ip") ||
    ""

  const row = {
    user_id: user?.id || null,
    actor_email: user?.email || null,
    action: input.action,
    resource: input.resource ?? input.resource_type ?? null,
    resource_type: input.resource_type ?? null,
    resource_id: input.resource_id ?? null,
    previous_value: toJson(input.previous_value),
    new_value: toJson(input.new_value),
    details: toJson(input.details),
    reason: input.reason ?? null,
    user_agent: input.request?.headers.get("user-agent") ?? null,
    ip_address: ip,
    app_name: input.app_name ?? "zafiro",
  }

  const { error } = await supabase.from("audit_logs").insert(row)
  if (error) {
    console.error("AUDIT_WRITE_ERROR", error)
    return false
  }
  return true
}
