"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { formatDate, formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  quiz_id: string
  quiz_title?: string
  created_at: string
  metadata: any
  session_id?: string
  device?: string
  lead_score?: number
  score_category?: "hot" | "warm" | "cold"
}

interface Quiz {
  id: string
  title: string
}

export default function LeadsManagementPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Advanced filters
  const [filters, setFilters] = useState({
    quiz_id: "",
    start_date: "",
    end_date: "",
    lead_score: "",
    device: "",
  })

  useEffect(() => {
    setMounted(true)
    checkUser()
  }, [])

  useEffect(() => {
    if (mounted && user) {
      loadLeads()
      loadQuizzes()
    }
  }, [mounted, user])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, leads, filters])

  const checkUser = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUser(user)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const loadQuizzes = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("user_id", user.id)

      setQuizzes(quizzesData || [])
    } catch (error) {
      console.error("Error loading quizzes:", error)
    }
  }

  const calculateLeadScore = (lead: any, sessionData: any): number => {
    let score = 0
    
    // Score baseado na recência (mais recente = maior score)
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceCreation === 0) score += 30
    else if (daysSinceCreation <= 1) score += 20
    else if (daysSinceCreation <= 7) score += 10
    else if (daysSinceCreation <= 30) score += 5

    // Score baseado em dados completos
    if (lead.name) score += 10
    if (lead.email) score += 15
    if (lead.phone) score += 15

    // Score baseado em origem (Facebook)
    // Tráfego do Facebook já é considerado no score base

    // Score baseado em dispositivo
    if (sessionData?.device === "desktop") score += 5
    if (sessionData?.device === "mobile") score += 3

    return Math.min(score, 100)
  }

  const getScoreCategory = (score: number): "hot" | "warm" | "cold" => {
    if (score >= 70) return "hot"
    if (score >= 40) return "warm"
    return "cold"
  }

  const loadLeads = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get all quizzes for user
      const { data: quizzesData } = await supabase.from("quizzes").select("id, title").eq("user_id", user.id)
      const quizIds = quizzesData?.map((q: { id: string }) => q.id) || []

      if (quizIds.length === 0) {
        setLeads([])
        return
      }

      // Get all leads for user's quizzes
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select("*")
        .in("quiz_id", quizIds)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get session data for leads
      const sessionIds = leadsData?.map((l: { session_id?: string }) => l.session_id).filter(Boolean) || []
      let sessionsData: any[] = []
      
      if (sessionIds.length > 0) {
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, device")
          .in("id", sessionIds)
        
        sessionsData = sessions || []
      }

      const sessionMap = new Map(sessionsData.map(s => [s.id, s]))

      // Map quiz titles and calculate scores
      const leadsWithData = (leadsData || []).map((lead: any) => {
        const quiz = quizzesData?.find((q: { id: string }) => q.id === lead.quiz_id)
        const sessionData = sessionMap.get(lead.session_id)
        const score = calculateLeadScore(lead, sessionData)
        const scoreCategory = getScoreCategory(score)

        return {
          ...lead,
          quiz_title: quiz?.title || "Quiz desconhecido",
          device: sessionData?.device || "unknown",
          lead_score: score,
          score_category: scoreCategory,
        }
      })

      setLeads(leadsWithData)
    } catch (error) {
      console.error("Error loading leads:", error)
      }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (lead.phone && lead.phone.includes(searchQuery))
      )
    }

    // Quiz filter
    if (filters.quiz_id) {
      filtered = filtered.filter((lead) => lead.quiz_id === filters.quiz_id)
    }

    // Date filters
    if (filters.start_date) {
      filtered = filtered.filter((lead) => new Date(lead.created_at) >= new Date(filters.start_date))
    }
    if (filters.end_date) {
      filtered = filtered.filter((lead) => new Date(lead.created_at) <= new Date(`${filters.end_date} 23:59:59`))
    }

    // Lead score filter
    if (filters.lead_score) {
      filtered = filtered.filter((lead) => {
        if (filters.lead_score === "hot") return lead.score_category === "hot"
        if (filters.lead_score === "warm") return lead.score_category === "warm"
        if (filters.lead_score === "cold") return lead.score_category === "cold"
        return true
      })
    }


    // Device filter
    if (filters.device) {
      filtered = filtered.filter((lead) => lead.device === filters.device)
    }

    setFilteredLeads(filtered)
  }

  const exportLeads = (format: "csv" | "pdf" | "txt" = "csv") => {
    if (format === "csv") {
    const csv = [
        ["Nome", "Email", "Telefone", "Quiz", "Score", "Categoria", "Origem", "Dispositivo", "Data"].join(","),
      ...filteredLeads.map((lead) =>
        [
          lead.name || "",
          lead.email || "",
          lead.phone || "",
          lead.quiz_title || "",
            lead.lead_score?.toString() || "0",
            lead.score_category || "cold",
            "facebook",
            lead.device || "unknown",
          new Date(lead.created_at).toLocaleDateString("pt-BR"),
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `leads_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    } else if (format === "txt") {
      const txt = filteredLeads.map((lead) => {
        return `Nome: ${lead.name || "N/A"}
Email: ${lead.email || "N/A"}
Telefone: ${lead.phone || "N/A"}
Quiz: ${lead.quiz_title || "N/A"}
Score: ${lead.lead_score || 0} (${lead.score_category || "cold"})
Origem: Facebook
Dispositivo: ${lead.device || "unknown"}
Data: ${new Date(lead.created_at).toLocaleDateString("pt-BR")}
${"=".repeat(50)}`
      }).join("\n\n")

      const blob = new Blob([txt], { type: "text/plain;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `leads_${new Date().toISOString().split("T")[0]}.txt`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (format === "pdf") {
      // Simple PDF generation using window.print or a library
      alert("Exportação PDF será implementada em breve. Use CSV ou TXT por enquanto.")
    }
  }

  const stats = {
    total: leads.length,
    thisWeek: leads.filter((lead) => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(lead.created_at) > weekAgo
    }).length,
    thisMonth: leads.filter((lead) => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(lead.created_at) > monthAgo
    }).length,
    hot: leads.filter((lead) => lead.score_category === "hot").length,
    warm: leads.filter((lead) => lead.score_category === "warm").length,
    cold: leads.filter((lead) => lead.score_category === "cold").length,
    conversionRate: leads.length > 0 ? ((leads.length / (leads.length + 100)) * 100).toFixed(1) : "0", // Simplified
  }

  // Lead distribution by source
  const leadsBySource = filteredLeads.reduce((acc, lead) => {
    const source = "facebook"
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Lead distribution by device
  const leadsByDevice = filteredLeads.reduce((acc, lead) => {
    const device = lead.device || "unknown"
    acc[device] = (acc[device] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (!mounted) {
    return null
  }

  return (
    <div 
      style={{ minHeight: "100vh", background: "#ffffff", color: "#111827" }}
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
            {t("nav.quizzes")}
          </Link>
          <Link
            href="/leads"
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
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem", color: "#111827", fontWeight: 600 }} suppressHydrationWarning>
            {t("leads.title")}
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }} suppressHydrationWarning>
            {t("leads.subtitle")}
          </p>
        </header>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
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
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("leads.total")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
              {stats.total}
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
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("leads.thisWeek")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
              {stats.thisWeek}
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
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("leads.thisMonth")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
              {stats.thisMonth}
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
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("leads.conversionRate")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
              {stats.conversionRate}%
            </div>
          </div>
        </div>

        {/* Lead Scoring Distribution */}
        <div
          style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1.5rem" }} suppressHydrationWarning>
            {t("leads.scoring.title")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#fca5a5"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#fecaca"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {t("leads.hot")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#dc2626" }} suppressHydrationWarning>
                {stats.hot}
            </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.5rem" }} suppressHydrationWarning>
                {t("leads.scoring.hot")}
            </div>
          </div>
          <div
            style={{
                background: "#ffffff",
                border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#fdba74"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#fed7aa"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {t("leads.warm")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#d97706" }} suppressHydrationWarning>
                {stats.warm}
            </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.5rem" }} suppressHydrationWarning>
                {t("leads.scoring.warm")}
            </div>
          </div>
          <div
            style={{
                background: "#ffffff",
                border: "1px solid #dbeafe",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#93c5fd"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dbeafe"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {t("leads.cold")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#2563eb" }} suppressHydrationWarning>
                {stats.cold}
            </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.5rem" }} suppressHydrationWarning>
                {t("leads.scoring.cold")}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>
            Filtros Avançados
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 500 }} suppressHydrationWarning>
                {t("leads.filters.quiz")}
              </label>
              <select
                value={filters.quiz_id}
                onChange={(e) => setFilters({ ...filters, quiz_id: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              >
                <option value="">{t("leads.filters.allQuizzes")}</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 600 }} suppressHydrationWarning>
                {t("leads.filters.score")}
              </label>
              <select
                value={filters.lead_score}
                onChange={(e) => setFilters({ ...filters, lead_score: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              >
                <option value="">{t("leads.filters.allScores")}</option>
                <option value="hot">{t("leads.hot")} (≥70)</option>
                <option value="warm">{t("leads.warm")} (40-69)</option>
                <option value="cold">{t("leads.cold")} (&lt;40)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 600 }}>
                Origem
              </label>
              <input
                type="text"
                value="facebook"
                disabled
                placeholder="Ex: google, facebook"
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
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 600 }} suppressHydrationWarning>
                {t("leads.filters.device")}
              </label>
              <select
                value={filters.device}
                onChange={(e) => setFilters({ ...filters, device: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              >
                <option value="">{t("leads.filters.allDevices")}</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 600 }} suppressHydrationWarning>
                {t("leads.filters.startDate")}
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
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
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 600 }} suppressHydrationWarning>
                {t("leads.filters.endDate")}
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
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
          </div>
          {(filters.quiz_id || filters.lead_score || filters.device || filters.start_date || filters.end_date) && (
            <button
              onClick={() => setFilters({ quiz_id: "", start_date: "", end_date: "", lead_score: "", device: "" })}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
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
              {t("common.clearFilters")}
            </button>
          )}
        </div>

        {/* Analytics by Source and Device */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Leads by Source */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }} suppressHydrationWarning>
              {t("leads.bySource.title")}
            </h3>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {Object.entries(leadsBySource).length > 0 ? (
                Object.entries(leadsBySource)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([source, count]) => (
                    <div
                      key={source}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid #e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 500, color: "#374151", fontSize: "0.875rem" }}>
                        {source === "direct" ? "Tráfego Direto" : source}
                      </div>
                      <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 600 }} suppressHydrationWarning>
                        {count}
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
                  Nenhum dado de origem disponível
                </div>
              )}
            </div>
          </div>

          {/* Leads by Device */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }} suppressHydrationWarning>
              {t("leads.byDevice.title")}
            </h3>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {Object.entries(leadsByDevice).length > 0 ? (
                Object.entries(leadsByDevice)
                  .sort(([, a], [, b]) => b - a)
                  .map(([device, count]) => (
                    <div
                      key={device}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid #e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 500, color: "#374151", fontSize: "0.875rem", textTransform: "capitalize" }}>
                        {device === "mobile" ? "Mobile" : device === "desktop" ? "Desktop" : device === "tablet" ? "Tablet" : device}
                      </div>
                      <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 600 }} suppressHydrationWarning>
                        {count}
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
                  Nenhum dado de dispositivo disponível
            </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: "250px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("leads.search.placeholder")}
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
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
                onClick={() => exportLeads("csv")}
            style={{
                  background: "#111827",
              color: "white",
              border: "none",
                  padding: "0.5rem 1rem",
              borderRadius: "6px",
                  fontWeight: 500,
              cursor: "pointer",
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
                {t("common.exportCSV")}
              </button>
              <button
                onClick={() => exportLeads("txt")}
                style={{
                  background: "#111827",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
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
                {t("common.exportTXT")}
              </button>
              <button
                onClick={() => exportLeads("pdf")}
                style={{
                  background: "#111827",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
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
                {t("common.exportPDF")}
          </button>
          <button
            onClick={loadLeads}
            style={{
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  padding: "0.5rem",
              borderRadius: "6px",
                  fontWeight: 500,
              cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                title={t("common.update")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: "transform 0.2s ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "rotate(180deg)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "rotate(0deg)"
                  }}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
          </button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr",
              gap: "1rem",
              padding: "0.75rem 1rem",
              background: "#f3f4f6",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: 500,
              color: "#374151",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <div suppressHydrationWarning>{t("leads.table.name")}</div>
            <div suppressHydrationWarning>{t("leads.table.email")}</div>
            <div suppressHydrationWarning>{t("leads.table.phone")}</div>
            <div suppressHydrationWarning>{t("leads.table.quiz")}</div>
            <div suppressHydrationWarning>{t("leads.table.score")}</div>
            <div suppressHydrationWarning>{t("leads.table.source")}</div>
            <div suppressHydrationWarning>{t("leads.table.date")}</div>
          </div>
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const scoreColor = lead.score_category === "hot" ? "#dc2626" : lead.score_category === "warm" ? "#d97706" : "#2563eb"
              const scoreBg = lead.score_category === "hot" ? "#fef2f2" : lead.score_category === "warm" ? "#fffbeb" : "#eff6ff"
              
              return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                style={{
                  display: "grid",
                    gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #e5e7eb",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <div style={{ fontWeight: 500, color: "#111827", fontSize: "0.875rem" }}>{lead.name || "N/A"}</div>
                <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>{lead.email || "N/A"}</div>
                <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>{lead.phone || "-"}</div>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      background: "#f3f4f6",
                      color: "#374151",
                    }}
                  >
                    {lead.quiz_title || "N/A"}
                  </span>
                </div>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        background: scoreBg,
                        color: scoreColor,
                      }}
                    >
                      {lead.lead_score || 0}
                    </span>
                </div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    Facebook
              </div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    {mounted ? formatDate(lead.created_at) : ""}
                </div>
              </div>
              )
            })
          ) : (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              {searchQuery || filters.quiz_id || filters.lead_score || filters.device || filters.start_date || filters.end_date
                ? t("leads.noLeadsFiltered")
                : t("leads.noLeads")}
            </div>
          )}
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLead(null)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <h2 style={{ marginBottom: "1.5rem", color: "#111827", fontSize: "1.125rem", fontWeight: 600 }} suppressHydrationWarning>{t("leads.details.title")}</h2>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.table.name")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500 }}>{selectedLead.name || "N/A"}</div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.table.email")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500 }}>{selectedLead.email || "N/A"}</div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.table.phone")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500 }}>{selectedLead.phone || "N/A"}</div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.table.quiz")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500 }}>{selectedLead.quiz_title || "N/A"}</div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.table.score")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    background:
                      selectedLead.score_category === "hot"
                        ? "#fef2f2"
                        : selectedLead.score_category === "warm"
                          ? "#fffbeb"
                          : "#eff6ff",
                    color:
                      selectedLead.score_category === "hot"
                        ? "#dc2626"
                        : selectedLead.score_category === "warm"
                          ? "#d97706"
                          : "#2563eb",
                  }}
                >
                  {selectedLead.lead_score || 0} ({selectedLead.score_category || "cold"})
                </span>
              </div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.details.source")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500 }}>Facebook</div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.table.device")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500, textTransform: "capitalize" }}>
                {selectedLead.device === "mobile" ? "Mobile" : selectedLead.device === "desktop" ? "Desktop" : selectedLead.device === "tablet" ? "Tablet" : selectedLead.device || "N/A"}
              </div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }} suppressHydrationWarning>{t("leads.details.timestamp")}</div>
              <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: 500 }}>
                {mounted ? formatDateTime(selectedLead.created_at) : ""}
              </div>
            </div>
            {selectedLead.metadata && Object.keys(selectedLead.metadata).length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", fontWeight: 500 }}>Metadados</div>
                <pre
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "1rem",
                    borderRadius: "6px",
                    color: "#374151",
                    fontSize: "0.875rem",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(selectedLead.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
