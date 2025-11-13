import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip middleware
  if (!url || !key) {
    console.warn(
      "[v0] Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.",
    )
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Allow access to public API routes and tracker (early return to avoid getUser)
  const pathname = request.nextUrl.pathname
  if (
    pathname === "/tracker" ||
    pathname.startsWith("/tracker/") ||
    pathname.startsWith("/api/tracker/") ||
    pathname.startsWith("/api/lead-form-widget") ||
    pathname.startsWith("/api/event") ||
    pathname.startsWith("/api/lead") ||
    pathname === "/" ||
    pathname.startsWith("/auth")
  ) {
    return supabaseResponse
  }

  // Only check user for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login only for protected routes
  if (!user && !pathname.startsWith("/auth") && !pathname.startsWith("/login")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Check if user is admin for admin routes (only when needed)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Check if user is admin (cache this in cookie to avoid repeated queries)
    const cachedRole = request.cookies.get("user_role")?.value
    if (cachedRole === "admin") {
      return supabaseResponse
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.warn("[Middleware] Perfil não encontrado para usuário:", user.id)
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // Cache role in cookie for 5 minutes to reduce database queries
    if (profile.role) {
      supabaseResponse.cookies.set("user_role", profile.role, {
        maxAge: 300, // 5 minutes
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    }

    if (profile.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
