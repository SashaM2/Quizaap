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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to public API routes and tracker
  if (
    request.nextUrl.pathname === "/tracker" ||
    request.nextUrl.pathname.startsWith("/tracker/") ||
    request.nextUrl.pathname.startsWith("/api/tracker/") ||
    request.nextUrl.pathname.startsWith("/api/lead-form-widget") ||
    request.nextUrl.pathname.startsWith("/api/event") ||
    request.nextUrl.pathname.startsWith("/api/lead")
  ) {
    return supabaseResponse
  }

  // Allow access to public routes without authentication
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/auth")) {
    return supabaseResponse
  }

  // Redirect to login only for protected routes
  if (!user && !request.nextUrl.pathname.startsWith("/auth") && !request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Check if user is admin for admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Log para debug
    if (profileError) {
      console.error("[Middleware] Erro ao buscar perfil:", profileError)
    }

    if (!profile) {
      console.warn("[Middleware] Perfil não encontrado para usuário:", user.id)
      // Tentar criar perfil automaticamente via API
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    if (profile.role !== "admin") {
      console.warn("[Middleware] Usuário não é admin. Role:", profile.role)
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
