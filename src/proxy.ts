import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/recover", "/auth/verify", "/auth/update-password", "/eliana", "/eliana/chat", "/eliana/conversaciones", "/eliana/memoria", "/eliana/tareas", "/eliana/configuracion"]
const marketplacePublicRoutes = ["/marketplace", "/marketplace/productos", "/marketplace/tiendas"]
const sellerRoutes = ["/marketplace/vender", "/marketplace/crear-tienda", "/dashboard"]
const adminRoutes = ["/admin"]
const authRequiredRoutes = ["/marketplace/pedidos", "/marketplace/proveedores", "/settings", "/messages", "/profile-page", "/rewards", "/referidos"]

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  if (marketplacePublicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))) return true
  if (pathname.startsWith("/api/")) return true
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase()

  // market.msmmystore.com → rewrite to /marketplace routes
  if (host === "market.msmmystore.com") {
    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
      return NextResponse.next()
    }

    const marketplaceMap: Record<string, string> = {
      "/": "/marketplace",
      "/productos": "/marketplace/productos",
      "/tiendas": "/marketplace/tiendas",
      "/pedidos": "/marketplace/pedidos",
      "/vender": "/marketplace/vender",
      "/crear-tienda": "/marketplace/crear-tienda",
      "/proveedores": "/marketplace/proveedores",
    }

    if (marketplaceMap[pathname]) {
      const url = request.nextUrl.clone()
      url.pathname = marketplaceMap[pathname]
      return NextResponse.rewrite(url)
    }

    if (pathname === "/marketplace" || pathname.startsWith("/marketplace/")) {
      return NextResponse.next()
    }

    // Allow /eliana routes within marketplace domain (don't rewrite to /marketplace/eliana)
    if (pathname === "/eliana" || pathname.startsWith("/eliana/")) {
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

  // eliana.msmmystore.com → serve /eliana page
  if (host === "eliana.msmmystore.com") {
    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
      return NextResponse.next()
    }

    // Redirect marketplace-related paths to marketplace.msmmystore.com (308 permanent)
    const marketplacePaths = ["/marketplace", "/tienda", "/mi-tienda", "/catalogo", "/inventario", "/pedidos", "/productos"]
    const isMarketplacePath = marketplacePaths.some(p => pathname === p || pathname.startsWith(p + "/"))
    if (isMarketplacePath) {
      const targetUrl = `https://marketplace.msmmystore.com${pathname}${search}`
      return NextResponse.redirect(targetUrl, 308)
    }

    // Rewrite / to /eliana
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/eliana"
      return NextResponse.rewrite(url)
    }
    // Pass through /eliana/* paths
    if (pathname === "/eliana" || pathname.startsWith("/eliana/")) {
      return NextResponse.next()
    }
    // Everything else on eliana domain goes to /eliana
    const url = request.nextUrl.clone()
    url.pathname = "/eliana"
    return NextResponse.rewrite(url)
  }

  if (isPublicRoute(pathname)) return NextResponse.next()

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

  const isAuthRequired = authRequiredRoutes.some(r => pathname.startsWith(r))
  const isSellerRoute = sellerRoutes.some(r => pathname.startsWith(r))
  const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r))

  if (!session && (isAuthRequired || isSellerRoute || isAdminRoute)) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (session && (isSellerRoute || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    const userRole = profile?.role || "customer"

    if (isAdminRoute && userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (isSellerRoute && !["seller", "admin", "superadmin"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/chat|eliana-diamond.svg|manifest.json).*)"],
}
