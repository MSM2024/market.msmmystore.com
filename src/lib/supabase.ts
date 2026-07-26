'use client'

import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isConfigured(): boolean {
  return !!(supabaseUrl && supabaseUrl !== "https://your-project.supabase.co" && supabaseAnonKey && supabaseAnonKey !== "your-anon-key-here")
}

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!isConfigured()) return null
  if (!client && supabaseUrl && supabaseAnonKey) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}

export function isSupabaseAvailable(): boolean {
  return isConfigured()
}
