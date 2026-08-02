import { getSupabaseAdminClient } from "@/lib/supabase-admin"

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const db = await getSupabaseAdminClient()
  if (!db) return false

  const { data } = await db
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle()

  return !!data
}

export async function markEventProcessed(eventId: string, eventType?: string): Promise<void> {
  const db = await getSupabaseAdminClient()
  if (!db) return

  await db.from("stripe_events").upsert({
    id: eventId,
    type: eventType ?? "unknown",
  }, { onConflict: "id", ignoreDuplicates: true })
}

export async function getProcessedEventCount(): Promise<number> {
  const db = await getSupabaseAdminClient()
  if (!db) return 0

  const { count } = await db
    .from("stripe_events")
    .select("id", { count: "exact", head: true })

  return count ?? 0
}
