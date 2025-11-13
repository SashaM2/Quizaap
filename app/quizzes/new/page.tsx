"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

interface Quiz {
  id: string
  name: string
  scriptUrl: string
}

export default function NewQuizPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [quizName, setQuizName] = useState("")
  const [quizUrl, setQuizUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingCode, setTrackingCode] = useState("")
  const [scriptUrl, setScriptUrl] = useState("")
  const [quizId, setQuizId] = useState("")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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

      loadQuizzesList()
    }

    checkAuth()
  }, [router])

  const loadQuizzesList = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("id, title, tracking_code")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (quizzesData) {
      setQuizzes(
        quizzesData.map((q) => ({
          id: q.id,
          name: q.title,
          scriptUrl: `/api/tracker/${q.tracking_code}`,
        }))
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch("/api/quiz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quizName, url: quizUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || t("common.error")
        alert(errorMessage)
        throw new Error(errorMessage)
      }

      setTrackingCode(data.tracking_code)
      setScriptUrl(data.script_url)
      setQuizId(data.quiz_id)
      setSuccess(true)
      setQuizName("")
      setQuizUrl("")
      loadQuizzesList()
    } catch (error: any) {
      // Error message already shown in alert above for API errors
      // Only show generic error for network/other errors
      if (!error.message || !error.message.includes("Erro")) {
        alert(t("common.error"))
      }
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    const text = document.getElementById("tracking-code")?.textContent || ""
    navigator.clipboard.writeText(text).then(() => {
      alert("Tracking script copied to clipboard!")
    })
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
        <div className="text-lg" suppressHydrationWarning>Carregando...</div>
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
        display: "flex",
        flexDirection: "column",
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
          flex: 1,
        }}
      >
        {/* Register Quiz Section */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              marginBottom: "1.5rem",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            {t("quizzes.new.title")}
          </h2>
            <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
                suppressHydrationWarning
              >
                {t("quizzes.new.quizName")} *
                </label>
                <input
                  type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                  required
                placeholder="ex: Marketing Quiz 2024"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
                />
              </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                {t("quizzes.new.quizUrl")} *
                </label>
                <input
                  type="url"
                value={quizUrl}
                onChange={(e) => setQuizUrl(e.target.value)}
                  required
                placeholder="https://example.com/quiz"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              />
              </div>
                <button
                  type="submit"
                  disabled={loading}
              style={{
                background: "#111827",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#374151"
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#111827"
              }}
            >
              {loading ? t("quizzes.new.creating") : t("quizzes.new.create")}
            </button>
          </form>
          {success && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "1rem",
                borderRadius: "6px",
                marginTop: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {t("quizzes.details.codeCopied")}
            </div>
          )}
          {success && (
            <div style={{ marginTop: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
                suppressHydrationWarning
              >
                {t("quizzes.details.script")}:
              </label>
              <div
                id="tracking-code"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "1rem",
                  marginTop: "0.5rem",
                  fontFamily: "'Monaco', 'Courier New', monospace",
                  fontSize: "0.875rem",
                  overflowX: "auto",
                  color: "#374151",
                }}
              >
                {typeof window !== "undefined"
                  ? `<script src="${window.location.origin}${scriptUrl}"></script>`
                  : ""}
              </div>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  marginTop: "0.5rem",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#374151"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#111827"
                }}
              >
                {t("quizzes.details.copyScript")}
                </button>
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Link
                  href={`/quizzes/${quizId}`}
                  style={{
                    color: "#111827",
                    fontWeight: 500,
                    textDecoration: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  {t("quizzes.view")}
                </Link>
              </div>
          </div>
        )}
        </div>

        {/* Lead Form Integration Section */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginTop: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              marginBottom: "1rem",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            Adicionar Formulário de Captura
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.875rem" }}>
            Adicione esta linha após o script de tracking para exibir um formulário de captura na sua página de quiz:
          </p>
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "1rem",
              fontFamily: "'Monaco', 'Courier New', monospace",
              fontSize: "0.875rem",
              color: "#374151",
            }}
          >
            {typeof window !== "undefined"
              ? `<script src="${window.location.origin}/api/lead-form-widget.js"></script>`
              : `<script src="[YOUR_API_URL]/api/lead-form-widget.js"></script>`}
          </div>
          <p style={{ color: "#6b7280", marginTop: "1rem", fontSize: "0.875rem" }}>
            Depois, acione o formulário quando o quiz for concluído:
          </p>
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "1rem",
              marginTop: "0.5rem",
              fontFamily: "'Monaco', 'Courier New', monospace",
              fontSize: "0.875rem",
              color: "#374151",
            }}
          >
            {`// Após conclusão do quiz
window.showLeadForm('Quiz Result: Excellent');`}
          </div>
        </div>
      </div>
    </div>
  )
}
