'use client'

import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

// ================================================================
// ADMIN DATA LAYER — Fetches real data from Supabase
// Gracefully returns empty/null when Supabase is not connected
// ================================================================

function getClient() {
  return getSupabaseClient()
}

function hasDb(): boolean {
  return isSupabaseAvailable() && !!getClient()
}

const emptyStats: PlatformStats = {
  totalUsers: 0, totalQuestions: 0, totalCommunities: 0,
  ptsCirculating: 0, pendingReports: 0, pendingStoreApprovals: 0,
  pendingProductApprovals: 0, totalOrders: 0, totalRevenue: 0,
}

// --- Platform Stats ---
export interface PlatformStats {
  totalUsers: number
  totalQuestions: number
  totalCommunities: number
  ptsCirculating: number
  pendingReports: number
  pendingStoreApprovals: number
  pendingProductApprovals: number
  totalOrders: number
  totalRevenue: number
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  if (!hasDb()) return emptyStats

  const db = getClient()!
  interface QueryBuilder {
    eq: (col: string, val: string) => QueryBuilder
    order: (col: string, o: { ascending: boolean }) => QueryBuilder
  }
  interface CountResult { count: number | null }
  type CountQuery = QueryBuilder & PromiseLike<CountResult>

  const safeCount = async (table: string, query?: (q: QueryBuilder) => QueryBuilder) => {
    try {
      const base = db.from(table).select("id", { count: "exact", head: true }) as unknown as CountQuery
      const final = (query ? query(base) : base) as CountQuery
      const res = await final
      return res.count || 0
    } catch { return 0 }
  }

  interface OrderRow { id: string; status: string; total_amount: number | null }
  interface ReportRow extends AdminReport { reporter_id: string }

  const [totalUsers, totalQuestions, totalCommunities, pendingReports, pendingStoreApprovals, pendingProductApprovals, orders] = await Promise.all([
    safeCount("profiles"),
    safeCount("questions"),
    safeCount("communities"),
    safeCount("reports", (q: QueryBuilder) => q.eq("status", "pending")),
    safeCount("marketplace_stores", (q: QueryBuilder) => q.eq("status", "pending_review")),
    safeCount("marketplace_products", (q: QueryBuilder) => q.eq("status", "pending_review")),
    (async () => {
      try {
        const res = await db.from("marketplace_orders").select("id,status,total_amount")
        return res.data || []
      } catch { return [] as OrderRow[] }
    })(),
  ])

  const completedRevenue = orders
    .filter((o: OrderRow) => ["paid", "completed", "delivered"].includes(o.status))
    .reduce((sum: number, o: OrderRow) => sum + (o.total_amount || 0), 0)

  return {
    totalUsers, totalQuestions, totalCommunities,
    ptsCirculating: 0,
    pendingReports, pendingStoreApprovals, pendingProductApprovals,
    totalOrders: orders.length,
    totalRevenue: completedRevenue,
  }
}

// --- Recent Reports ---
export interface AdminReport {
  id: string
  user: string
  reason: string
  status: string
  created_at: string
}

export async function fetchRecentReports(limit = 20): Promise<AdminReport[]> {
  if (!hasDb()) return []
  try {
    const db = getClient()!
    const { data, error } = await db
      .from("reports")
      .select("id, reason, status, created_at, reporter_id")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) return []

    const userIds = [...new Set(data.map((r: { reporter_id: string }) => r.reporter_id).filter(Boolean))]
    if (userIds.length === 0) return data.map((r: AdminReport) => ({ ...r, user: "unknown" }))

    const { data: profiles } = await db
      .from("profiles")
      .select("id, username")
      .in("id", userIds)

    const profileMap = new Map((profiles || []).map((p: { id: string; username: string }) => [p.id, p.username]))

    return data.map((r: AdminReport & { reporter_id: string }) => ({
      ...r,
      user: profileMap.get(r.reporter_id) || "unknown",
    }))
  } catch { return [] }
}

// --- Audit Logs ---
export interface AuditLogEntry {
  id: string
  action: string
  target_type: string
  target_id: string
  created_at: string
  actor_id?: string
}

export async function fetchAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as AuditLogEntry[]
}

// --- Unified Audit (sistema + marketplace + eliana) ---
export type AuditSource = "sistema" | "marketplace" | "eliana"

export interface UnifiedAuditEntry {
  id: string
  source: AuditSource
  action: string
  actor_email?: string
  actor_id?: string
  resource_type?: string
  resource_id?: string
  details?: string
  created_at: string
}

export interface AuditStats {
  sistema: number
  marketplace: number
  eliana: number
}

export async function fetchAuditStats(): Promise<AuditStats> {
  const empty: AuditStats = { sistema: 0, marketplace: 0, eliana: 0 }
  if (!hasDb()) return empty
  const db = getClient()!

  const count = async (table: string): Promise<number> => {
    try {
      const res = await db.from(table).select("id", { count: "exact", head: true }) as unknown as { count: number | null }
      return res.count || 0
    } catch { return 0 }
  }

  const [sistema, marketplace, eliana] = await Promise.all([
    count("audit_logs"),
    count("marketplace_audit_logs"),
    count("eliana_audit_logs"),
  ])
  return { sistema, marketplace, eliana }
}

type AuditRow = Record<string, unknown>

export async function fetchUnifiedAuditLogs(opts: { source?: AuditSource | "all"; limit?: number; offset?: number } = {}): Promise<UnifiedAuditEntry[]> {
  if (!hasDb()) return []
  const db = getClient()!
  const source = opts.source || "all"
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const rows: UnifiedAuditEntry[] = []

  const take = async (table: string, columns: string, map: (r: AuditRow) => UnifiedAuditEntry) => {
    try {
      const { data } = await db
        .from(table)
        .select(columns)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)
      for (const r of (data || []) as AuditRow[]) rows.push(map(r))
    } catch { /* tabla no disponible */ }
  }

  const jobs: Promise<void>[] = []

  if (source === "all" || source === "sistema") {
    jobs.push(take(
      "audit_logs",
      "id, action, resource, resource_type, resource_id, actor_email, user_id, details, created_at",
      (r) => ({
        id: String(r.id || ""),
        source: "sistema" as const,
        action: String(r.action || ""),
        actor_email: (r.actor_email as string) || undefined,
        actor_id: (r.user_id as string) || undefined,
        resource_type: (r.resource_type as string) || (r.resource as string) || undefined,
        resource_id: (r.resource_id as string) || undefined,
        details: r.details ? JSON.stringify(r.details) : undefined,
        created_at: String(r.created_at || ""),
      })
    ))
  }

  if (source === "all" || source === "marketplace") {
    jobs.push(take(
      "marketplace_audit_logs",
      "id, action, entity_type, entity_id, user_id, new_values, created_at",
      (r) => ({
        id: String(r.id || ""),
        source: "marketplace" as const,
        action: String(r.action || ""),
        actor_id: (r.user_id as string) || undefined,
        resource_type: (r.entity_type as string) || undefined,
        resource_id: (r.entity_id as string) || undefined,
        details: r.new_values ? JSON.stringify(r.new_values) : undefined,
        created_at: String(r.created_at || ""),
      })
    ))
  }

  if (source === "all" || source === "eliana") {
    jobs.push(take(
      "eliana_audit_logs",
      "id, event_type, resource_type, resource_id, actor_id, metadata, created_at",
      (r) => ({
        id: String(r.id || ""),
        source: "eliana" as const,
        action: String(r.event_type || ""),
        actor_id: (r.actor_id as string) || undefined,
        resource_type: (r.resource_type as string) || undefined,
        resource_id: (r.resource_id as string) || undefined,
        details: r.metadata && Object.keys(r.metadata as object).length ? JSON.stringify(r.metadata) : undefined,
        created_at: String(r.created_at || ""),
      })
    ))
  }

  await Promise.all(jobs)

  const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean) as string[])]
  if (actorIds.length > 0) {
    try {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, email")
        .in("id", actorIds)
      const emailMap = new Map<string, string>()
      for (const p of (profiles || [])) {
        if (p?.id && p?.email) emailMap.set(String(p.id), String(p.email))
      }
      for (const row of rows) {
        if (row.actor_id && !row.actor_email) row.actor_email = emailMap.get(row.actor_id)
      }
    } catch { /* sin resolución de emails */ }
  }

  rows.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
  return rows.slice(0, limit)
}

// --- Pending Store Approvals ---
export async function fetchPendingStores() {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_stores")
    .select("id,name,slug,description,country,city,owner_id,created_at")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data
}

// --- Pending Product Approvals ---
export async function fetchPendingProducts() {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_products")
    .select("id,name,slug,description,base_price,status,created_at, store:marketplace_stores(id,name)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data
}

// --- User List (Admin) ---
export interface AdminUser {
  id: string
  username: string
  role: string
  created_at: string
}

export async function fetchUsers(limit = 50, offset = 0): Promise<AdminUser[]> {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("profiles")
    .select("id,username,role,created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) return []
  return data as AdminUser[]
}

// --- Report Actions ---
export async function resolveReport(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("resolveReport:", error); return false }
  return true
}

export async function dismissReport(id: string): Promise<boolean> {
  if (!hasDb()) return false
  const { error } = await getClient()!
    .from("reports")
    .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
    .eq("id", id)
  if (error) { console.error("dismissReport:", error); return false }
  return true
}

// --- Marketplace Orders (Admin) ---
export async function fetchAllOrders(limit = 50) {
  if (!hasDb()) return []
  const { data, error } = await getClient()!
    .from("marketplace_orders")
    .select("id,status,total_amount,currency,buyer_id,store_id,created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}
