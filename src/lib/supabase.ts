'use client'

import { createBrowserClient } from "@supabase/ssr"

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const rawPub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

function isInvalid(val: string | undefined): boolean {
  if (!val) return true
  if (val.startsWith("[") && val.endsWith("]")) return true
  if (val === "your-anon-key-here" || val === "https://your-project.supabase.co") return true
  return false
}

function getSupabaseUrl(): string | undefined {
  return isInvalid(rawUrl) ? undefined : rawUrl
}

function getSupabaseKey(): string | undefined {
  if (!isInvalid(rawAnon)) return rawAnon
  if (!isInvalid(rawPub)) return rawPub
  return undefined
}

function isConfigured(): boolean {
  return !!(getSupabaseUrl() && getSupabaseKey())
}

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!isConfigured()) return null
  const url = getSupabaseUrl()!
  const key = getSupabaseKey()!
  if (!client) {
    client = createBrowserClient(url, key)
  }
  return client
}

export function isSupabaseAvailable(): boolean {
  return isConfigured()
}
