import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import {
  getAppForDomain,
  isElianaRoute,
  isPublicRoute as checkPublicRoute,
  isProtectedRoute,
  isAdminRoute,
  isSellerRoute,
  getRedirect,
  getPrefixRedirect,
  MARKETPLACE_SHORT_MAP,
  APPS,
  type AppId,
} from "@/config/apps-registry"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase()
  const appId = getAppForDomain(host)
  const app = APPS[appId]

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  if (appId === "marketplace") {
    const shortPath = MARKETPLACE_SHORT_MAP[pathname]
    if (shortPath) {
      const url = request.nextUrl.clone()
      url.pathname = shortPath
      return NextResponse.rewrite(url)
    }

    if (pathname === "/marketplace" || pathname.startsWith("/marketplace/")) {
      if (isElianaRoute(pathname)) {
        return NextResponse.next()
      }
      return NextResponse.next()
    }

    if (isElianaRoute(pathname)) {
      return NextResponse.next()
    }

    if (pathname.startsWith("/auth/") || pathname.startsWith("/settings") || pathname.startsWith("/profile-page")) {
      return NextResponse.next()
    }

    if (pathname.startsWith("/api/stripe/")) {
      return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = "/marketplace" + pathname
    return NextResponse.rewrite(url)
  }

  if (appId === "eliana") {
    if (isElianaRoute(pathname)) {
      return NextResponse.next()
    }

    const exactRedirect = getRedirect(pathname, appId)
    if (exactRedirect) {
      const qs = request.nextUrl.search.toString()
      return NextResponse.redirect(exactRedirect + qs)
    }

    const prefixRedirect = getPrefixRedirect(pathname, appId)
    if (prefixRedirect) {
      const qs = request.nextUrl.search.toString()
      return NextResponse.redirect(prefixRedirect + qs)
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/eliana"
      return NextResponse.rewrite(url)
    }
  }

  if (appId === "zafiro" || appId === "admin") {
    if (checkPublicRoute(pathname, appId)) {
      return NextResponse.next()
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabase = supabaseUrl && supabaseUrl !== "https://your-project.supabase.co" && supabaseAnonKey && supabaseAnonKey !== "your-anon-key-here"

  if (!hasSupabase) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()

  const needsAuth = isProtectedRoute(pathname, appId) || isSellerRoute(pathname, appId) || isAdminRoute(pathname, appId)

  if (!session && needsAuth) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (session && (isSellerRoute(pathname, appId) || isAdminRoute(pathname, appId))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    const userRole = profile?.role || "customer"

    if (isAdminRoute(pathname, appId) && userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (isSellerRoute(pathname, appId) && !["seller", "admin", "superadmin"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/chat|eliana-diamond.svg|manifest.json).*)"],
}
