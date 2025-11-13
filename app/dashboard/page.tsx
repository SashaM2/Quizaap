"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, Suspense, lazy } from "react"

// Lazy load Dashboard component to improve initial load time
const Dashboard = lazy(() => import("@/components/dashboard"))

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    async function checkAuth() {
      try {
        const supabase = createClient()
        
        // Use Promise.all to check user and profile in parallel when possible
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        // Check profile (middleware already checks this, but we need it for redirect)
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profile && (!profileError || profileError.code === "PGRST116")) {
          // Perfil não existe, criar via API (only if really needed)
          try {
            const response = await fetch("/api/auth/create-profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.id,
                email: user.email!,
              }),
            })

            const result = await response.json()
            if (result.success && result.profile?.role === "admin") {
              router.push("/admin/users")
              return
            }
          } catch (error) {
            console.error("Erro ao criar perfil:", error)
          }
        }

        // Se for admin, redirecionar para gestão de usuários
        if (profile && profile.role === "admin") {
          router.push("/admin/users")
          return
        }

        setUser(user)
      } catch (error) {
        console.error("Erro na autenticação:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  // Render Dashboard immediately - let it handle its own loading state
  if (!mounted) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  )
}

