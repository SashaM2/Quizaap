"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import Link from "next/link"
import { formatDateTime } from "@/lib/utils"

interface Quiz {
  id: string
  title: string
  url: string
  tracking_code: string
  created_at: string
}

interface Analytics {
  funnel: {
    total_visits: number
    quiz_starts: number
    quiz_completions: number
    total_leads: number
    quiz_start_rate: number
    completion_rate: number
    conversion_rate: number
  }
}

export default function QuizDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadData() {
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

      // Load quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (quizError || !quizData) {
        console.error("Error loading quiz:", quizError)
        router.push("/quizzes")
        return
      }

      setQuiz(quizData)

      // Load analytics
      try {
        const response = await fetch(`/api/quiz/${id}/analytics`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Error loading analytics:", error)
      }

      setLoading(false)
    }

    loadData()
  }, [router, id])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const copyScript = () => {
    const scriptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/tracker/${quiz?.tracking_code}.js`
    const scriptCode = `<script src="${scriptUrl}"></script>`
    navigator.clipboard.writeText(scriptCode)
    alert("Script copiado para a área de transferência!")
  }

  const handleEdit = () => {
    if (quiz) {
      setEditTitle(quiz.title)
      setEditUrl(quiz.url)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!quiz || !editTitle.trim() || !editUrl.trim()) {
      alert("Título e URL são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/quiz/${quiz.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          url: editUrl.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Erro ao atualizar quiz")
        return
      }

      // Update local state
      setQuiz({ ...quiz, title: editTitle.trim(), url: editUrl.trim() })
      setIsEditing(false)
      alert("Quiz atualizado com sucesso!")
    } catch (error) {
      console.error("Error updating quiz:", error)
      alert("Erro ao atualizar quiz. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle("")
    setEditUrl("")
  }

  const handleDuplicate = async () => {
    if (!quiz) return

    if (!confirm(`Deseja duplicar o quiz "${quiz.title}"?`)) {
      return
    }

    try {
      const response = await fetch("/api/quiz/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${quiz.title} (Cópia)`,
          url: quiz.url,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Erro ao duplicar quiz")
        return
      }

      alert("Quiz duplicado com sucesso!")
      router.push(`/quizzes/${data.quiz_id}`)
    } catch (error) {
      console.error("Error duplicating quiz:", error)
      alert("Erro ao duplicar quiz. Tente novamente.")
    }
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
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>Carregando...</div>
      </div>
    )
  }

  if (!quiz) {
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
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>Quiz não encontrado</div>
      </div>
    )
  }

  const scriptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/tracker/${quiz.tracking_code}.js`
  const scriptCode = `<script src="${scriptUrl}"></script>`

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
            Dashboard
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
                  Quizzes
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
            Leads
          </Link>
        </div>

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
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>
                  Logado como
                </div>
                <div style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 500 }}>
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
            Sair
          </button>
        </div>
          )}
      </div>
      </nav>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/quizzes"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              marginBottom: "1rem",
              display: "inline-block",
              fontSize: "0.875rem",
            }}
          >
            ← Voltar para Quizzes
          </Link>
          <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem", color: "#111827", fontWeight: 600 }}>{quiz.title}</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Detalhes e informações do quiz</p>
        </div>

        {/* Informações do Quiz */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2
            style={{
                fontSize: "1.125rem",
                color: "#111827",
                margin: 0,
                fontWeight: 600,
            }}
          >
            Informações do Quiz
          </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleEdit}
                style={{
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
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
                Editar
              </button>
              <button
                onClick={handleDuplicate}
                style={{
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
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
                Duplicar
              </button>
            </div>
          </div>
          {isEditing ? (
            <div style={{ marginBottom: "1.5rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: "1rem", color: "#111827", marginBottom: "1rem", fontWeight: 600 }}>Editar Quiz</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontWeight: 500, fontSize: "0.875rem" }}>
                    Título
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      color: "#111827",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontWeight: 500, fontSize: "0.875rem" }}>
                    URL
                  </label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      color: "#111827",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "transparent",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb"
                      e.currentTarget.style.borderColor = "#9ca3af"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.borderColor = "#d1d5db"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    style={{
                      background: "#111827",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      opacity: saving ? 0.6 : 1,
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) e.currentTarget.style.background = "#374151"
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) e.currentTarget.style.background = "#111827"
                    }}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Título
              </label>
              <p style={{ color: "#111827", fontSize: "0.875rem", wordBreak: "break-all" }}>{quiz.title}</p>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                URL
              </label>
              <p style={{ color: "#111827", fontSize: "0.875rem", wordBreak: "break-all" }}>{quiz.url}</p>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Código de Tracking
              </label>
              <code
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#374151",
                  display: "block",
                  wordBreak: "break-all",
                }}
              >
                {quiz.tracking_code}
              </code>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Criado em
              </label>
              <p style={{ color: "#111827", fontSize: "0.875rem" }}>
                {mounted ? formatDateTime(quiz.created_at) : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Script de Tracking */}
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
              marginBottom: "1rem",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            Script de Tracking
          </h2>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#374151",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Adicione este script antes do fechamento da tag &lt;/body&gt; na sua página do quiz:
          </label>
          <div
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
            {scriptCode}
          </div>
          <button
            onClick={copyScript}
            style={{
              background: "#111827",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
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
            Copiar Script
          </button>
        </div>

        {/* Analytics Resumidos */}
        {analytics && (
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
              Analytics Resumidos
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <div
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
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "1rem",
                  }}
                >
                  Total de Visitas
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }} suppressHydrationWarning>
                  {analytics.funnel.total_visits}
                </div>
              </div>
              <div
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
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "1rem",
                  }}
                >
                  Quiz Iniciados
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }} suppressHydrationWarning>
                  {analytics.funnel.quiz_starts}
                </div>
                <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                  {analytics.funnel.quiz_start_rate.toFixed(1)}%
                </div>
              </div>
              <div
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
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "1rem",
                  }}
                >
                  Quiz Completados
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }} suppressHydrationWarning>
                  {analytics.funnel.quiz_completions}
                </div>
                <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                  {analytics.funnel.completion_rate.toFixed(1)}%
                </div>
              </div>
              <div
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
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "1rem",
                  }}
                >
                  Total de Leads
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }} suppressHydrationWarning>
                  {analytics.funnel.total_leads}
                </div>
                <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                  {analytics.funnel.conversion_rate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
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
            Ações
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href={`/quizzes/${quiz.id}/analytics`}
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
              Ver Analytics Detalhados
            </Link>
            <Link
              href={`/quizzes/${quiz.id}/leads`}
              style={{
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
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
              Ver Leads ({analytics?.funnel.total_leads || 0})
            </Link>
            <a
              href={quiz.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
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
              Abrir Quiz
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
