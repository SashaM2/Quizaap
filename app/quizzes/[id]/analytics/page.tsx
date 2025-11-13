"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, use, useCallback } from "react"
import Script from "next/script"

interface AbandonmentItem {
  question_id: string
  views: number
  abandons: number
  abandon_rate: number
  avg_time: number
}

interface TopAbandonmentQuestion {
  question_order: string
  abandon_rate: number
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
  abandonment: AbandonmentItem[]
  top_abandonment_questions: TopAbandonmentQuestion[]
}

export default function QuizAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoaded, setChartLoaded] = useState(false)
  const funnelChartRef = useRef<HTMLCanvasElement>(null)
  const abandonmentChartRef = useRef<HTMLCanvasElement>(null)
  const funnelChartInstance = useRef<any>(null)
  const abandonmentChartInstance = useRef<any>(null)

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/quiz/${id}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        if (chartLoaded && data) {
          updateCharts(data)
        }
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }, [id, chartLoaded])

  const updateCharts = (data: Analytics) => {
    if (typeof window === "undefined" || !(window as any).Chart) return

    const Chart = (window as any).Chart
    const funnel = data.funnel

    // Funnel chart
    if (funnelChartRef.current && funnelChartInstance.current) {
      funnelChartInstance.current.destroy()
    }
    if (funnelChartRef.current) {
      const ctx = funnelChartRef.current.getContext("2d")
      funnelChartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Visitors", "Started", "Completed", "Leads"],
          datasets: [
            {
              label: "Count",
              data: [funnel.total_visits, funnel.quiz_starts, funnel.quiz_completions, funnel.total_leads],
              backgroundColor: ["#3b82f6", "#2563eb", "#1e40af", "#1e3a8a"],
              borderColor: "#1e40af",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#e2e8f0" } },
            title: { text: "Conversion Funnel", color: "#e2e8f0", display: true },
          },
          scales: {
            y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
            x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
          },
        },
      })
    }

    // Abandonment chart
    if (data.top_abandonment_questions.length > 0) {
      if (abandonmentChartRef.current && abandonmentChartInstance.current) {
        abandonmentChartInstance.current.destroy()
      }
      if (abandonmentChartRef.current) {
        const ctx = abandonmentChartRef.current.getContext("2d")
        abandonmentChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: data.top_abandonment_questions.map((q) => `Q${q.question_order}`),
            datasets: [
              {
                label: "Abandonment Rate (%)",
                data: data.top_abandonment_questions.map((q) => q.abandon_rate),
                backgroundColor: ["#dc2626", "#f97316", "#eab308"],
                borderColor: "#dc2626",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: "#e2e8f0" } },
              title: { text: "Top 3 Abandonment Questions", color: "#e2e8f0", display: true },
            },
            scales: {
              y: {
                ticks: { color: "#94a3b8" },
                grid: { color: "#334155" },
                max: 100,
              },
              x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
            },
          },
        })
      }
    }
  }

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

      // Load quiz
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (!quizData) {
        router.push("/quizzes")
        return
      }

      await loadAnalytics()
      setLoading(false)
    }

    loadData()
  }, [router, id, loadAnalytics])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        loadAnalytics()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [loading, loadAnalytics])

  useEffect(() => {
    if (chartLoaded && analytics) {
      updateCharts(analytics)
    }
  }, [chartLoaded, analytics])

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
        <div className="text-lg" suppressHydrationWarning>Carregando...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
        <div className="text-lg" suppressHydrationWarning>Dados não encontrados</div>
      </div>
    )
  }

  const funnel = analytics.funnel

  const getBadgeClass = (rate: number) => {
    if (rate > 25) return "badge-high"
    if (rate > 10) return "badge-medium"
    return "badge-low"
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        onLoad={() => setChartLoaded(true)}
        strategy="lazyOnload"
      />
      <div
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
          minHeight: "100vh",
        }}
        suppressHydrationWarning
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "2rem",
          }}
        >
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#f1f5f9" }}>Quiz Analytics Dashboard</h1>
            <p style={{ color: "#94a3b8", fontSize: "1rem" }}>
              Track visitor behavior, abandonment, and lead conversion in real-time
            </p>
          </header>

          {/* Conversion Funnel Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
                border: "1px solid #3b82f6",
                borderRadius: "8px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Total Visitors
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {funnel.total_visits}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Unique sessions</div>
            </div>
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Quiz Started
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {funnel.quiz_starts}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }} suppressHydrationWarning>
                {funnel.quiz_start_rate.toFixed(1)}%
              </div>
            </div>
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Quiz Completed
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {funnel.quiz_completions}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }} suppressHydrationWarning>
                {funnel.completion_rate.toFixed(1)}%
          </div>
        </div>
            <div
              style={{
                background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
                border: "1px solid #3b82f6",
                borderRadius: "8px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Total Leads
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem" }} suppressHydrationWarning>
                {funnel.total_leads}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }} suppressHydrationWarning>
                {funnel.conversion_rate.toFixed(1)}%
              </div>
            </div>
        </div>

          {/* Conversion Funnel Table */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "2rem 0 1rem 0",
              color: "#f1f5f9",
            }}
          >
            Conversion Funnel
          </h2>
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
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
              <div>Stage</div>
              <div>Count</div>
              <div>Rate (%)</div>
              <div>Progress</div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "1rem",
                padding: "1.5rem",
                borderBottom: "1px solid #334155",
                alignItems: "center",
              }}
            >
              <div>Visitors</div>
              <div suppressHydrationWarning>{funnel.total_visits}</div>
              <div>100%</div>
            <div>
                <div
                  style={{
                    background: "#334155",
                    borderRadius: "4px",
                    height: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                      height: "100%",
                      width: "100%",
                    }}
                ></div>
              </div>
            </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "1rem",
                padding: "1.5rem",
                borderBottom: "1px solid #334155",
                alignItems: "center",
              }}
            >
              <div>Quiz Started</div>
              <div suppressHydrationWarning>{funnel.quiz_starts}</div>
              <div suppressHydrationWarning>{funnel.quiz_start_rate.toFixed(1)}%</div>
            <div>
                <div
                  style={{
                    background: "#334155",
                    borderRadius: "4px",
                    height: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                      height: "100%",
                      width: `${funnel.quiz_start_rate}%`,
                    }}
                ></div>
              </div>
            </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "1rem",
                padding: "1.5rem",
                borderBottom: "1px solid #334155",
                alignItems: "center",
              }}
            >
              <div>Quiz Completed</div>
              <div suppressHydrationWarning>{funnel.quiz_completions}</div>
              <div suppressHydrationWarning>{funnel.completion_rate.toFixed(1)}%</div>
            <div>
                <div
                  style={{
                    background: "#334155",
                    borderRadius: "4px",
                    height: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                  style={{
                      background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                      height: "100%",
                      width: `${Math.min(funnel.completion_rate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "1rem",
                padding: "1.5rem",
                alignItems: "center",
              }}
            >
              <div>Leads Generated</div>
              <div suppressHydrationWarning>{funnel.total_leads}</div>
              <div suppressHydrationWarning>{funnel.conversion_rate.toFixed(1)}%</div>
            <div>
                <div
                  style={{
                    background: "#334155",
                    borderRadius: "4px",
                    height: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                      height: "100%",
                      width: `${funnel.conversion_rate}%`,
                    }}
                ></div>
              </div>
            </div>
          </div>
        </div>

          {/* Charts */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "2rem 0 1rem 0",
              color: "#f1f5f9",
            }}
          >
            Performance Metrics
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "1.5rem",
                position: "relative",
                height: "400px",
              }}
            >
              <canvas id="funnel-chart" ref={funnelChartRef} style={{ maxHeight: "350px" }}></canvas>
            </div>
            {analytics.top_abandonment_questions.length > 0 && (
              <div
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  position: "relative",
                  height: "400px",
                }}
              >
                <canvas id="abandonment-chart" ref={abandonmentChartRef} style={{ maxHeight: "350px" }}></canvas>
              </div>
            )}
          </div>

          {/* Abandonment Details */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "2rem 0 1rem 0",
              color: "#f1f5f9",
            }}
          >
            Abandonment by Question
          </h2>
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
                gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr",
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
              <div>Question ID</div>
              <div>Views</div>
              <div>Abandonments</div>
              <div>Abandon Rate</div>
              <div>Avg Time (s)</div>
            </div>
            {analytics.abandonment.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr",
                  gap: "1rem",
                  padding: "1.5rem",
                  borderBottom: "1px solid #334155",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0f172a"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <div>
                  <strong>{item.question_id || "Unknown"}</strong>
          </div>
                <div suppressHydrationWarning>{item.views}</div>
                <div suppressHydrationWarning>{item.abandons}</div>
                <div>
                  <span
                    className={getBadgeClass(item.abandon_rate)}
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      background:
                        item.abandon_rate > 25
                          ? "#7c2d12"
                          : item.abandon_rate > 10
                            ? "#78350f"
                            : "#143c1c",
                      color:
                        item.abandon_rate > 25
                          ? "#fed7aa"
                          : item.abandon_rate > 10
                            ? "#fef3c7"
                            : "#86efac",
                    }}
                  >
                    {item.abandon_rate.toFixed(1)}%
                  </span>
            </div>
                <div suppressHydrationWarning>{item.avg_time}s</div>
          </div>
            ))}
            </div>
          </div>
        </div>
    </>
  )
}
