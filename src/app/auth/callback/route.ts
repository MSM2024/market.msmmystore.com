import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseKey()

    if (supabaseUrl && supabaseAnonKey) {
      const response = NextResponse.redirect(`${origin}${next}`)

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return response
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
