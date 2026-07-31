import { createClient } from "@supabase/supabase-js"

const isInvalid = (v?: string) => !v || (v.startsWith("[") && v.endsWith("]")) || v === "your-anon-key-here" || v === "https://your-project.supabase.co" || v === "PENDIENTE"

function getSupabaseUrl(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL
  return isInvalid(v) ? undefined : v
}

export function getSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === "PENDIENTE") return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}