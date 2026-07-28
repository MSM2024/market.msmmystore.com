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
  if (!hasDb()) {
    return {
      totalUsers: 0, totalQuestions: 0, totalCommunities: 0,
      ptsCirculating: 0, pendingReports: 0, pendingStoreApprovals: 0,
      pendingProductApprovals: 0, totalOrders: 0, totalRevenue: 0,
    }
  }

  const db = getClient()!

  const [users, questions, communities, reports, pendingStores, pendingProducts, orders] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("questions").select("id", { count: "exact", head: true }),
    db.from("communities").select("id", { count: "exact", head: true }),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("marketplace_stores").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    db.from("marketplace_products").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    db.from("marketplace_orders").select("id,status,total_amount"),
  ])

  const orderData = orders.data || []
  const completedRevenue = orderData
    .filter((o: { status: string }) => ["paid", "completed", "delivered"].includes(o.status))
    .reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0)

  return {
    totalUsers: users.count || 0,
    totalQuestions: questions.count || 0,
    totalCommunities: communities.count || 0,
    ptsCirculating: 0,
    pendingReports: reports.count || 0,
    pendingStoreApprovals: pendingStores.count || 0,
    pendingProductApprovals: pendingProducts.count || 0,
    totalOrders: orderData.length,
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
  const db = getClient()!

  const { data, error } = await db
    .from("reports")
    .select("id, reason, status, created_at, reporter_id")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []

  // Fetch usernames for reporters
  const userIds = [...new Set(data.map((r: { reporter_id: string }) => r.reporter_id).filter(Boolean))]
  if (userIds.length === 0) return data.map((r: AdminReport) => ({ ...r, user: "unknown" }))

  const { data: profiles } = await db
    .from("profiles")
    .select("id, username")
    .in("id", userIds)

  const profileMap = new Map((profiles || []).map((p: { id: string; username: string }) => [p.id, p.username]))

  return data.map((r: any) => ({
    ...r,
    user: profileMap.get(r.reporter_id) || "unknown",
  }))
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
