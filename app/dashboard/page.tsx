"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Dashboard from "@/components/dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Verificar se perfil existe, se não, criar automaticamente
      let { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile && (!profileError || profileError.code === "PGRST116")) {
        // Perfil não existe, criar via API
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
          if (result.success) {
            profile = result.profile
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
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
        <div className="text-lg" suppressHydrationWarning>Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
        <div className="text-lg" suppressHydrationWarning>Redirecionando...</div>
      </div>
    )
  }

  return <Dashboard />
}

