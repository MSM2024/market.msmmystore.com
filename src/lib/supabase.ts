import { createBrowserClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

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

type Client = ReturnType<typeof createBrowserClient>

let client: Client | null = null
let serverClient: Client | null = null

export function getSupabaseClient(): Client | null {
  if (!isConfigured()) return null
  const url = getSupabaseUrl()!
  const key = getSupabaseKey()!

  // Server-side (API routes, server components, libs): use a plain data client
  // so client-only code from @supabase/ssr is never invoked from the server.
  if (typeof window === "undefined") {
    if (!serverClient) {
      serverClient = createClient(url, key) as unknown as Client
    }
    return serverClient
  }

  if (!client) {
    client = createBrowserClient(url, key)
  }
  return client
}

export function isSupabaseAvailable(): boolean {
  return isConfigured()
}
