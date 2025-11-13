"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import Link from "next/link"
import { formatDate, formatDateTime } from "@/lib/utils"

interface Lead {
  lead_id: string
  name: string
  email: string
  phone: string | null
  quiz_result: string | null
  timestamp: string
  user_journey?: Array<{
    type: string
    question?: string
    time?: number
  }>
}

export default function QuizLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    week: 0,
    month: 0,
    responseRate: "0%",
  })

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

      await loadLeads()
    }

    loadData()
  }, [router, id])

  useEffect(() => {
    if (allLeads.length > 0) {
      searchLeads()
    }
  }, [searchQuery, allLeads])

  useEffect(() => {
    if (allLeads.length > 0) {
      const interval = setInterval(() => {
        loadLeads()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [id])

  const loadLeads = async () => {
    try {
      const response = await fetch(`/api/quiz/${id}/leads`)
        if (response.ok) {
        const leads = await response.json()
        setAllLeads(leads)

        // Calculate stats
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const weekLeads = leads.filter((l: Lead) => new Date(l.timestamp) > weekAgo).length
        const monthLeads = leads.filter((l: Lead) => new Date(l.timestamp) > monthAgo).length

        setStats({
          total: leads.length,
          week: weekLeads,
          month: monthLeads,
          responseRate: "0%",
        })
        }
      } catch (error) {
        console.error("Error loading leads:", error)
    }
  }

  const searchLeads = () => {
    if (!searchQuery.trim()) {
      setFilteredLeads(allLeads)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allLeads.filter(
    (lead) =>
        (lead.name && lead.name.toLowerCase().includes(query)) ||
        (lead.email && lead.email.toLowerCase().includes(query)) ||
        (lead.phone && lead.phone.includes(query))
    )
    setFilteredLeads(filtered)
  }

  const openLeadDetails = async (leadId: string) => {
    try {
      const response = await fetch(`/api/lead/${leadId}`)
      if (response.ok) {
        const lead = await response.json()
        setSelectedLead(lead)
        setShowModal(true)
      }
    } catch (error) {
      console.error("Error loading lead details:", error)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedLead(null)
  }

  const exportLeads = () => {
    const headers = ["Name", "Email", "Phone", "Quiz Result", "Date"]
    const rows = filteredLeads.map((lead) => [
      lead.name || "N/A",
      lead.email || "N/A",
      lead.phone || "-",
      lead.quiz_result || "Pending",
      new Date(lead.timestamp).toLocaleDateString("pt-BR"),
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `leads-${Date.now()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "#0f172a",
        color: "#e2e8f0",
        minHeight: "100vh",
      }}
      suppressHydrationWarning
    >
      {/* Navbar */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        suppressHydrationWarning
      >
        <h1 style={{ fontSize: "1.5rem", color: "white" }}>Quiz Tracker</h1>
        <div style={{ display: "flex", gap: "2rem" }}>
          <Link href="/dashboard" style={{ color: "white", textDecoration: "none" }}>
            Home
              </Link>
          <Link href={`/quizzes/${id}/analytics`} style={{ color: "white", textDecoration: "none" }}>
            Analytics
                </Link>
          <Link href={`/quizzes/${id}/leads`} style={{ color: "white", textDecoration: "none" }}>
            Leads
                </Link>
              </div>
            </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#f1f5f9" }}>Lead Management</h1>
          <p style={{ color: "#94a3b8", fontSize: "1rem", marginBottom: "1.5rem" }}>
            View and manage all leads generated from your quizzes
          </p>
        </header>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Total Leads
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9" }} suppressHydrationWarning>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              This Week
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9" }} suppressHydrationWarning>
              {stats.week}
          </div>
        </div>
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              This Month
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9" }} suppressHydrationWarning>
              {stats.month}
            </div>
          </div>
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Avg Response Rate
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9" }} suppressHydrationWarning>
              {stats.responseRate}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: "250px" }}>
          <input
            type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #475569",
                borderRadius: "6px",
                background: "#1e293b",
                color: "#e2e8f0",
                fontSize: "1rem",
              }}
            />
          </div>
          <button
            onClick={exportLeads}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => loadLeads()}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {/* Leads Table */}
        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr",
              gap: "1rem",
              padding: "1.5rem",
              background: "#0f172a",
              borderBottom: "1px solid #334155",
              fontWeight: 600,
              color: "#94a3b8",
              fontSize: "0.875rem",
              textTransform: "uppercase",
            }}
          >
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Quiz Result</div>
            <div>Date</div>
          </div>
        {filteredLeads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
              No leads found. Start adding tracking to your quizzes to generate leads.
          </div>
        ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.lead_id}
                onClick={() => openLeadDetails(lead.lead_id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr",
                  gap: "1rem",
                  padding: "1.5rem",
                  borderBottom: "1px solid #334155",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0f172a"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <div style={{ fontWeight: 600, color: "#f1f5f9" }}>{lead.name || "N/A"}</div>
                <div style={{ color: "#94a3b8" }}>{lead.email || "N/A"}</div>
                <div>{lead.phone || "-"}</div>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      background: "#1e40af",
                      color: "#bfdbfe",
                    }}
                  >
                    {lead.quiz_result || "Pending"}
                  </span>
                </div>
                <div>
                  {mounted ? formatDate(lead.timestamp) : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lead Details Modal */}
      {showModal && selectedLead && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <h2 style={{ marginBottom: "1.5rem", color: "#f1f5f9" }}>Lead Details</h2>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Name
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "1rem" }}>{selectedLead.name || "N/A"}</div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    Email
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "1rem" }}>{selectedLead.email || "N/A"}</div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Phone
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "1rem" }}>{selectedLead.phone || "N/A"}</div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Quiz Result
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "1rem" }}>{selectedLead.quiz_result || "Pending"}</div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Submitted
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "1rem" }}>
                {mounted ? formatDateTime(selectedLead.timestamp) : ""}
              </div>
            </div>

            {selectedLead.user_journey && selectedLead.user_journey.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  User Journey
                </div>
                <div
                  style={{
                    borderLeft: "2px solid #334155",
                    paddingLeft: "1.5rem",
                    marginTop: "1rem",
                  }}
                >
                  {selectedLead.user_journey.map((event, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        marginBottom: "1rem",
                        paddingBottom: "1rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {event.type.replace("_", " ").toUpperCase()}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                        {event.question ? `Question: ${event.question}` : ""}
                        {event.time ? ` • Time: ${event.time}s` : ""}
                      </div>
                    </div>
                  ))}
                </div>
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  )
}
