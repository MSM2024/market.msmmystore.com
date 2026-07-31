import { createServerClient } from "@supabase/ssr"

const isInvalid = (v?: string) => !v || (v.startsWith("[") && v.endsWith("]")) || v === "your-anon-key-here" || v === "https://your-project.supabase.co"

function getSupabaseUrl(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL
  return isInvalid(v) ? undefined : v
}

function getSupabaseKey(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!isInvalid(anon)) return anon
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!isInvalid(pub)) return pub
  return undefined
}

export async function getSupabaseServerClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseKey()

  if (!supabaseUrl || !supabaseAnonKey) return null

  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}