"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

interface Quiz {
  id: string
  title: string
  url: string
  tracking_code: string
  created_at: string
}

export default function QuizzesPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadQuizzes() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Verificar se é admin - se for, redirecionar
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile && profile.role === "admin") {
        router.push("/admin/users")
        return
      }

      // Load quizzes
      const { data: quizzesData, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading quizzes:", error)
      } else {
        setQuizzes(quizzesData || [])
      }

      setLoading(false)
    }

    loadQuizzes()
  }, [router])

  const handleDelete = async (quizId: string) => {
    if (!confirm(t("quizzes.deleteConfirm"))) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("quizzes").delete().eq("id", quizId)

    if (error) {
      console.error("Error deleting quiz:", error)
      alert(t("common.error"))
    } else {
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (!mounted || loading) {
    return (
      <div
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#111827",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        suppressHydrationWarning
      >
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>{t("common.loading")}</div>
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "#ffffff",
        color: "#111827",
        minHeight: "100vh",
      }}
      suppressHydrationWarning
      onClick={(e) => {
        if (userMenuOpen && !(e.target as HTMLElement).closest('[data-user-menu]')) {
          setUserMenuOpen(false)
        }
      }}
    >
      {/* Minimalist Navbar */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
        suppressHydrationWarning
      >
        {/* Logo Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#1f2937",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              fontWeight: 600,
              color: "white",
            }}
          >
            Q
          </div>
          <h1 style={{ fontSize: "1.125rem", color: "#111827", fontWeight: 600, margin: 0 }}>
            Crivus QuizIQ
          </h1>
        </div>

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flex: 1, justifyContent: "center", marginLeft: "3rem" }}>
          <Link
            href="/dashboard"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb"
              e.currentTarget.style.color = "#111827"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#6b7280"
            }}
          >
            {t("nav.dashboard")}
          </Link>
          <Link
            href="/quizzes"
            style={{
              color: "#111827",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "background 0.2s ease",
              background: "#f3f4f6",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e5e7eb"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f3f4f6"
            }}
          >
            {t("nav.quizzes")}
          </Link>
          <Link
            href="/leads"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb"
              e.currentTarget.style.color = "#111827"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#6b7280"
            }}
          >
            {t("nav.leads")}
          </Link>
        </div>

        {/* Language Selector and User Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <LanguageSelector />
          
          {/* User Section with Dropdown Menu */}
          <div style={{ position: "relative" }} data-user-menu>
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.75rem",
              background: userMenuOpen ? "#f3f4f6" : "transparent",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!userMenuOpen) {
                e.currentTarget.style.background = "#f9fafb"
              }
            }}
            onMouseLeave={(e) => {
              if (!userMenuOpen) {
                e.currentTarget.style.background = "transparent"
              }
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#374151",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                transition: "transform 0.2s ease",
                transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </div>
          </div>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                right: 0,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "0.5rem",
                minWidth: "180px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid #e5e7eb",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }} suppressHydrationWarning>
                  {user?.email || "Usuário"}
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout()
                  setUserMenuOpen(false)
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "#dc2626",
                  border: "none",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                {t("common.logout")}
              </button>
            </div>
          )}
          </div>
        </div>
      </nav>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem", color: "#111827", fontWeight: 600 }} suppressHydrationWarning>{t("quizzes.title")}</h1>
          <Link
            href="/quizzes/new"
            style={{
              background: "#111827",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#374151"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#111827"
            }}
          >
            {t("quizzes.createNew")}
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "1.125rem" }} suppressHydrationWarning>
              {t("quizzes.noQuizzes")}
            </p>
            <Link
              href="/quizzes/new"
              style={{
                display: "inline-block",
                background: "#111827",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#111827"
              }}
            >
              {t("quizzes.createNew")}
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb"
                }}
              >
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem" }}>
                  {quiz.title}
                </h3>
                <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem", wordBreak: "break-all" }}>
                  {quiz.url}
                </p>

                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ color: "#374151", fontSize: "0.75rem", marginBottom: "0.5rem", fontWeight: 600 }} suppressHydrationWarning>
                    {t("quizzes.table.trackingCode")}:
                  </p>
                  <code
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      display: "block",
                      wordBreak: "break-all",
                    }}
                  >
                    {quiz.tracking_code}
                  </code>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    style={{
                      flex: 1,
                      background: "#111827",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#374151"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#111827"
                    }}
                  >
                    {t("quizzes.view")}
                  </Link>
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    style={{
                      background: "transparent",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb"
                      e.currentTarget.style.borderColor = "#9ca3af"
                      e.currentTarget.style.color = "#111827"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.borderColor = "#d1d5db"
                      e.currentTarget.style.color = "#6b7280"
                    }}
                  >
                    {t("quizzes.edit")}
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    style={{
                      background: "transparent",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fef2f2"
                      e.currentTarget.style.borderColor = "#fca5a5"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.borderColor = "#fecaca"
                    }}
                  >
                    {t("quizzes.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
