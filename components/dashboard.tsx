"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useMemo } from "react"
import Link from "next/link"
import Script from "next/script"
import { formatDate, formatDateTime } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

interface DashboardStats {
  totalQuizzes: number
  totalSessions: number
}

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
    quiz_start_rate: number
    completion_rate: number
    advanced_funnel?: Array<{
      name: string
      count: number
      percentage: number
    }>
  }
  abandonment: Array<{
    question_id: string
    question_number: number
    views: number
    abandons: number
    abandon_rate: number
    top_reason: string
    reasons: Record<string, number>
    avg_time: number
    risk_score: number
    risk_level: string
    progression_score: number
    most_common_previous: string | null
    stopped_count: number
    stopped_percentage: number
  }>
  top_abandonment_questions: Array<{
    question_order: string
    abandon_rate: number
  }>
  where_stopped: Array<{
    question_number: number
    question_id: string
    count: number
    percentage: number
  }>
  abandonment_reasons: Record<string, number>
  suggestions: string[]
  stats: {
    started_count: number
    completed_count: number
    incomplete_count: number
  }
  recent_events?: Array<{
    id: string
    event_type: string
    question_number: number | null
    created_at: string
    quiz_id: string
  }>
  quiz_rankings?: Array<{
    quiz_id: string
    title: string
    visits: number
    conversion: number
    last_execution: string | null
  }>
  device_breakdown?: Array<{
    device: string
    visits: number
    starts: number
    completions: number
    start_rate: number
    completion_rate: number
    abandonment_rate: number
  }>
}

export default function Dashboard() {
  const { t } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalQuizzes: 0,
    totalSessions: 0,
  })
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)
  const [chartLoaded, setChartLoaded] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Advanced filters
  const [filters, setFilters] = useState({
    quiz_id: "",
    device: "",
    start_date: "",
    end_date: "",
  })

  // Funnel table sorting
  const [funnelSortBy, setFunnelSortBy] = useState<"original" | "drop" | "time">("original")

  // Helper function to remove duplicates by id
  const removeDuplicates = (quizzesList: Quiz[]): Quiz[] => {
    const seen = new Set<string>()
    return quizzesList.filter((quiz) => {
      if (seen.has(quiz.id)) {
        return false
      }
      seen.add(quiz.id)
      return true
    })
  }

  const funnelChartRef = useRef<HTMLCanvasElement>(null)
  const abandonmentChartRef = useRef<HTMLCanvasElement>(null)
  const deviceChartRef = useRef<HTMLCanvasElement>(null)
  const performanceChartRef = useRef<HTMLCanvasElement>(null)
  const funnelChartInstance = useRef<any>(null)
  const abandonmentChartInstance = useRef<any>(null)
  const deviceChartInstance = useRef<any>(null)
  const performanceChartInstance = useRef<any>(null)

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.start_date) params.append("start_date", filters.start_date)
      if (filters.end_date) params.append("end_date", filters.end_date)
      
      const url = `/api/dashboard/analytics${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
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
  }

  const updateCharts = (data: Analytics) => {
    if (typeof window === "undefined" || !(window as any).Chart) return

    const Chart = (window as any).Chart

    // Advanced Funnel Chart
    if (funnelChartRef.current && data.funnel.advanced_funnel) {
      if (funnelChartInstance.current) {
      funnelChartInstance.current.destroy()
    }
      const ctx = funnelChartRef.current.getContext("2d")
      const funnelData = data.funnel.advanced_funnel
      
      funnelChartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: funnelData.map((step) => step.name),
          datasets: [
            {
              label: "Count",
              data: funnelData.map((step) => step.count),
              backgroundColor: funnelData.map((_, idx) => {
                const colors = ["#3b82f6", "#2563eb", "#1e40af", "#1e3a8a", "#1e293b"]
                return colors[idx % colors.length]
              }),
              borderColor: "#1e40af",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { text: "Funil de Conversão Avançado", color: "#e2e8f0", display: true },
            tooltip: {
              callbacks: {
                afterLabel: (context: any) => {
                  const index = context.dataIndex
                  const step = funnelData[index]
                  const prevStep = index > 0 ? funnelData[index - 1] : null
                  const dropRate = prevStep 
                    ? `${((prevStep.count - step.count) / prevStep.count * 100).toFixed(1)}% queda`
                    : ""
                  return [`${step.percentage.toFixed(1)}%`, dropRate].filter(Boolean)
                },
              },
            },
          },
          scales: {
            y: { 
              ticks: { color: "#94a3b8" }, 
              grid: { color: "#334155" },
              beginAtZero: true,
            },
            x: { 
              ticks: { color: "#94a3b8" }, 
              grid: { color: "#334155" },
            },
          },
        },
      })
    }

    // Abandonment Chart (Horizontal Bar)
    if (abandonmentChartRef.current && data.abandonment.length > 0) {
      if (abandonmentChartInstance.current) {
        abandonmentChartInstance.current.destroy()
      }
        const ctx = abandonmentChartRef.current.getContext("2d")
      const topAbandonment = data.abandonment.slice(0, 10).reverse()
      
        abandonmentChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
          labels: topAbandonment.map((item) => item.question_id),
            datasets: [
              {
              label: "Taxa de Abandono (%)",
              data: topAbandonment.map((item) => item.abandon_rate),
              backgroundColor: topAbandonment.map((item) => {
                if (item.abandon_rate > 30) return "#dc2626"
                if (item.abandon_rate > 15) return "#f97316"
                if (item.abandon_rate > 5) return "#eab308"
                return "#22c55e"
              }),
              borderColor: "#334155",
                borderWidth: 1,
              },
            ],
          },
          options: {
          indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
            legend: { display: false },
            title: { text: "Abandono por Pergunta", color: "#e2e8f0", display: true },
            },
            scales: {
            x: {
                ticks: { color: "#94a3b8" },
                grid: { color: "#334155" },
                max: 100,
              },
            y: { 
              ticks: { color: "#94a3b8" }, 
              grid: { color: "#334155" },
            },
            },
          },
        })
      }

    // Device Chart (Doughnut)
    if (deviceChartRef.current && data.device_breakdown && data.device_breakdown.length > 0) {
      if (deviceChartInstance.current) {
        deviceChartInstance.current.destroy()
      }
      const ctx = deviceChartRef.current.getContext("2d")
      
      deviceChartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: data.device_breakdown.map((item) => {
            if (item.device === "mobile") return "Mobile"
            if (item.device === "desktop") return "Desktop"
            if (item.device === "tablet") return "Tablet"
            return item.device
          }),
          datasets: [
            {
              label: "Visitas",
              data: data.device_breakdown.map((item) => item.visits),
              backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
              borderColor: "#0f172a",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              position: "bottom",
              labels: { color: "#94a3b8" },
            },
            title: { text: "Distribuição por Dispositivo", color: "#e2e8f0", display: true },
          },
        },
      })
    }


    // Performance Chart (Line chart showing drop rate through funnel)
    if (performanceChartRef.current) {
      if (performanceChartInstance.current) {
        performanceChartInstance.current.destroy()
      }
      const ctx = performanceChartRef.current.getContext("2d")
      
      // Check if we have data
      const hasData = data.funnel.advanced_funnel && data.funnel.advanced_funnel.length > 0
      const funnelData = hasData && data.funnel.advanced_funnel ? data.funnel.advanced_funnel : []
      
      // Calculate drop rates or use empty array
      const dropRates = hasData && funnelData.length > 0
        ? funnelData.map((step, index) => {
            if (index === 0) return 0
            const prevStep = funnelData[index - 1]
            if (prevStep.count === 0) return 0
            return ((prevStep.count - step.count) / prevStep.count) * 100
          })
        : []

      // Create placeholder labels if no data - always show structure
      const labels = hasData && funnelData.length > 0
        ? funnelData.map((step) => step.name === "Completed" ? "Resultados" : step.name)
        : ["Visitors", "Started", "Q1", "Q2", "Q3", "Resultados"]
      
      // Always create chart, even without data, to show structure

      performanceChartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Taxa de Queda (%)",
              data: hasData ? dropRates : new Array(labels.length).fill(null), // Use null instead of empty array to show structure
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderWidth: hasData ? 3 : 1, // Thinner line when no data, but still visible
              fill: hasData,
              tension: 0.4,
              pointRadius: hasData ? 5 : 0,
              pointHoverRadius: hasData ? 7 : 0,
              pointBackgroundColor: hasData
                ? dropRates.map((rate) => {
                    if (rate >= 15) return "#dc2626"
                    if (rate >= 8) return "#f59e0b"
                    return "#22c55e"
                  })
                : [],
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Quantidade",
              data: hasData && funnelData.length > 0 ? funnelData.map((step) => step.count) : new Array(labels.length).fill(null), // Use null instead of empty array to show structure
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: hasData ? 2 : 1, // Thinner line when no data, but still visible
              fill: false,
              tension: 0.4,
              yAxisID: "y1",
              pointRadius: hasData ? 4 : 0,
              pointHoverRadius: hasData ? 6 : 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: { 
              display: true,
              position: "top",
              labels: { color: "#94a3b8", usePointStyle: true },
            },
            title: { 
              text: hasData 
                ? "Performance do Funil - Queda e Quantidade"
                : "Performance do Funil - Aguardando Dados", 
              color: "#e2e8f0", 
              display: true,
              font: { size: 16, weight: "bold" },
            },
            tooltip: {
              enabled: hasData,
              callbacks: {
                label: (context: any) => {
                  if (!hasData) return "Sem dados"
                  if (context.datasetIndex === 0) {
                    return `Queda: ${context.parsed.y.toFixed(1)}%`
                  } else {
                    return `Quantidade: ${context.parsed.y}`
                  }
                },
              },
            },
          },
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Taxa de Queda (%)",
                color: "#94a3b8",
              },
              ticks: { color: "#94a3b8" },
              grid: { color: "#334155" },
              beginAtZero: true,
              max: hasData && dropRates.length > 0 ? Math.max(...dropRates, 50) : 50,
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Quantidade",
                color: "#94a3b8",
              },
              ticks: { color: "#94a3b8" },
              grid: {
                drawOnChartArea: false,
              },
              beginAtZero: true,
            },
            x: {
              ticks: { color: "#94a3b8" },
              grid: { color: "#334155" },
            },
          },
        },
      })
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

      setUser(user)

      // Check if user is admin
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile && profile.role === "admin") {
        router.push("/admin/users")
        return
      }

      // Load dashboard stats
      try {
        const { count: quizzesCount } = await supabase
          .from("quizzes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id")
          .eq("user_id", user.id)

        const quizIds = quizzes?.map((q) => q.id) || []

        let sessionsCount = 0

        if (quizIds.length > 0) {
          const { count: sessions } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .in("quiz_id", quizIds)

          sessionsCount = sessions || 0
        }

        setStats({
          totalQuizzes: quizzesCount || 0,
          totalSessions: sessionsCount,
        })

        // Load recent quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from("quizzes")
          .select("id, title, url, tracking_code, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (quizzesError) {
          console.error("Error loading quizzes:", quizzesError)
        }

        const quizzesMap = new Map<string, Quiz>()
        if (quizzesData) {
          for (const quiz of quizzesData) {
            if (!quizzesMap.has(quiz.id)) {
              quizzesMap.set(quiz.id, quiz)
            }
          }
        }

        const uniqueQuizzes = removeDuplicates(
          Array.from(quizzesMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        ).slice(0, 5)

        setQuizzes(uniqueQuizzes)

        // Load analytics
        await loadAnalytics()
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (filters.start_date || filters.end_date) {
        loadAnalytics()
    }
  }, [filters.start_date, filters.end_date])

  useEffect(() => {
    if (chartLoaded && analytics) {
      updateCharts(analytics)
    }
  }, [chartLoaded, analytics, funnelSortBy])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Tem certeza que deseja deletar o quiz "${quizTitle}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeletingQuizId(quizId)
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Erro ao deletar quiz")
        return
      }

      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
      await loadAnalytics()
      alert("Quiz deletado com sucesso!")
    } catch (error) {
      console.error("Error deleting quiz:", error)
      alert("Erro ao deletar quiz. Tente novamente.")
    } finally {
      setDeletingQuizId(null)
    }
  }

  const exportMetrics = async () => {
    try {
      if (!analytics) return

      const metrics = {
        [t("dashboard.kpi.visitors")]: analytics.funnel.total_visits,
        [t("dashboard.kpi.started")]: analytics.funnel.quiz_starts,
        [t("dashboard.kpi.completed")]: analytics.funnel.quiz_completions,
        [t("dashboard.kpi.startRate")]: analytics.funnel.quiz_start_rate.toFixed(2),
        [t("dashboard.kpi.completionRate")]: analytics.funnel.completion_rate.toFixed(2),
      }

      const csv = [
        [t("dashboard.export.metric"), t("dashboard.export.value")].join(","),
        ...Object.entries(metrics).map(([key, value]) => `"${key}","${value}"`),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `metrics_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting metrics:", error)
      alert("Erro ao exportar métricas")
    }
  }

  // Process funnel data for complete table - memoized to prevent hydration issues
  const funnelTableData = useMemo(() => {
    if (!mounted) return []

    // If no data, return empty array (no rows, including final ones)
    if (!analytics?.funnel.advanced_funnel || !analytics.abandonment || analytics.funnel.advanced_funnel.length === 0) {
      return []
    }

    const funnelSteps = analytics.funnel.advanced_funnel
    const abandonmentMap = new Map(
      analytics.abandonment.map((item) => [item.question_number, item])
    )

    // Get completion count from analytics
    const completionCount = analytics.funnel.quiz_completions || 0

    const tableData = funnelSteps.map((step, index) => {
      const prevStep = index > 0 ? funnelSteps[index - 1] : null
      const entered = step.count
      const exited = prevStep ? prevStep.count - step.count : 0
      const dropRate = prevStep && prevStep.count > 0
        ? ((prevStep.count - step.count) / prevStep.count) * 100
        : 0

      // Extract question number from step name (e.g., "Q1" -> 1)
      const questionMatch = step.name.match(/^Q(\d+)$/)
      const questionNum = questionMatch ? parseInt(questionMatch[1]) : null
      const abandonmentData = questionNum ? abandonmentMap.get(questionNum) : null
      const avgTime = abandonmentData?.avg_time || 0

      // Determine status
      let status: "ok" | "warning" | "critical" = "ok"
      let statusIcon = "✅"
      if (dropRate >= 15) {
        status = "critical"
        statusIcon = "🚨"
      } else if (dropRate >= 8) {
        status = "warning"
        statusIcon = "⚠️"
      }

      // Check if this is the final step (Completed/Resultados)
      const isFinal = step.name === "Completed" || step.name === "Resultados"

      return {
        name: step.name,
        entered,
        exited: isFinal ? 0 : exited,
        dropRate: isFinal ? null : dropRate,
        avgTime,
        status,
        statusIcon: isFinal ? "🎯" : statusIcon,
        isFinal,
        originalIndex: index,
        id: `${step.name}-${index}`, // Stable ID for key
      }
    })

    // Separate final step (Completed/Resultados) from regular steps
    const finalStep = tableData.find((row) => row.isFinal && (row.name === "Completed" || row.name === "Resultados"))
    const regularSteps = tableData.filter((row) => !row.isFinal || (row.name !== "Completed" && row.name !== "Resultados"))

    // Sort regular steps based on selected criteria
    let sortedRegularSteps = [...regularSteps]
    if (funnelSortBy === "drop") {
      sortedRegularSteps.sort((a, b) => (b.dropRate || 0) - (a.dropRate || 0))
    } else if (funnelSortBy === "time") {
      sortedRegularSteps.sort((a, b) => b.avgTime - a.avgTime)
    }
    // If "original", keep original order

    // Build final array: regular steps + final step (if exists) + "Última Página" + "Concluíram"
    // These two final rows will always appear at the end, after all other data
    const sortedData = [
      ...sortedRegularSteps,
      ...(finalStep ? [finalStep] : []),
      {
        name: t("dashboard.funnel.table.lastPage"),
        entered: completionCount,
        exited: 0,
        dropRate: null,
        avgTime: 0,
        status: "ok" as const,
        statusIcon: "🎯",
        isFinal: true,
        originalIndex: tableData.length + 1000, // High index to ensure it stays at end
        id: "ultima-pagina",
      },
      {
        name: t("dashboard.funnel.table.completed"),
        entered: completionCount,
        exited: 0,
        dropRate: null,
        avgTime: 0,
        status: "ok" as const,
        statusIcon: "🎯",
        isFinal: true,
        originalIndex: tableData.length + 1001, // High index to ensure it stays at end
        id: "concluiram",
      },
    ]

    return sortedData
  }, [mounted, analytics?.funnel.advanced_funnel, analytics?.abandonment, analytics?.funnel.quiz_completions, funnelSortBy])

  const exportFunnelTablePDF = () => {
    if (!analytics || !mounted) return

    const tableData = funnelTableData
    if (tableData.length === 0) {
      alert("Nenhum dado disponível para exportar")
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20

    // Title
    doc.setFontSize(18)
    doc.setTextColor(59, 130, 246)
    doc.text("Funil Completo por Pergunta", pageWidth / 2, yPos, { align: "center" })
    yPos += 10

    // Quiz name (if available)
    const selectedQuiz = quizzes.find((q) => q.id === filters.quiz_id)
    if (selectedQuiz) {
      doc.setFontSize(14)
      doc.setTextColor(100, 100, 100)
      doc.text(`Quiz: ${selectedQuiz.title}`, pageWidth / 2, yPos, { align: "center" })
      yPos += 8
    }

    // Date and period
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const dateRange = filters.start_date && filters.end_date
      ? `${formatDate(filters.start_date)} - ${formatDate(filters.end_date)}`
      : "Todos os períodos"
    doc.text(`Período: ${dateRange}`, pageWidth / 2, yPos, { align: "center" })
    yPos += 8

    // Active filters
    const activeFilters: string[] = []
    if (filters.device) activeFilters.push(`Dispositivo: ${filters.device}`)
    if (activeFilters.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(`Filtros: ${activeFilters.join(", ")}`, pageWidth / 2, yPos, { align: "center" })
      yPos += 6
    }

    yPos += 5

    // Table data
    const tableRows = tableData.map((row) => [
      row.name === "Completed" ? "Resultados" : row.name,
      row.entered.toString(),
      row.exited.toString(),
      row.dropRate !== null ? `${row.dropRate.toFixed(1)}%` : "-",
      row.avgTime > 0 ? `${row.avgTime}s` : "-",
      row.statusIcon,
    ])

    autoTable(doc, {
      head: [["Etapa/Pergunta", "Início", "Desistência", "Queda (%)", "Tempo médio", "Status"]],
      body: tableRows,
      startY: yPos,
      theme: "striped",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [226, 232, 240],
        fillColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { halign: "right", cellWidth: 25 },
        2: { halign: "right", cellWidth: 30 },
        3: { halign: "right", cellWidth: 25 },
        4: { halign: "right", cellWidth: 30 },
        5: { halign: "center", cellWidth: 20 },
      },
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      didParseCell: (data: any) => {
        // Color rows based on status
        if (data.row.index < tableData.length) {
          const rowData = tableData[data.row.index]
          if (rowData.status === "critical") {
            data.cell.styles.fillColor = [220, 38, 38]
            data.cell.styles.textColor = [255, 255, 255]
          } else if (rowData.status === "warning") {
            data.cell.styles.fillColor = [245, 158, 11]
            data.cell.styles.textColor = [255, 255, 255]
          } else if (rowData.status === "ok" && !rowData.isFinal) {
            data.cell.styles.fillColor = [34, 197, 94]
            data.cell.styles.textColor = [255, 255, 255]
          }
        }
      },
    })

    // Save PDF
    const fileName = `funil_completo_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
  }

  if (!mounted || loading) {
    return (
      <div
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        suppressHydrationWarning
      >
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>
          {t("common.loading")}
        </div>
      </div>
    )
  }

  const funnel = analytics?.funnel || {
    total_visits: stats.totalSessions,
    quiz_starts: 0,
    quiz_completions: 0,
    quiz_start_rate: 0,
    completion_rate: 0,
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
          background: "#ffffff",
          color: "#111827",
          minHeight: "100vh",
        }}
        suppressHydrationWarning
        onClick={(e) => {
          // Fechar menu ao clicar fora
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
                    border: "1px solid #e5e7eb",
                    padding: "0.625rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.875rem",
                    fontWeight: 500,
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
          {/* Header */}
          <header style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem", color: "#111827", fontWeight: 600 }} suppressHydrationWarning>
                  {t("dashboard.title")}
                </h1>
                <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }} suppressHydrationWarning>
                  {t("dashboard.subtitle")}
                </p>
              </div>
              <div>
                <button
                  onClick={exportMetrics}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#111827",
                    border: "none",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "0.875rem",
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
                  {t("dashboard.exportCSV")}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
                {t("dashboard.filters.title")}
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
                    {t("dashboard.filters.quiz")}
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
                    <option value="">{t("dashboard.filters.allQuizzes")}</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 500 }} suppressHydrationWarning>
                    {t("dashboard.filters.device")}
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
                    <option value="">{t("dashboard.filters.allDevices")}</option>
                    <option value="mobile">Mobile</option>
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 500 }} suppressHydrationWarning>
                    {t("dashboard.filters.startDate")}
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
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: 500 }} suppressHydrationWarning>
                    {t("dashboard.filters.endDate")}
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
              {(filters.quiz_id || filters.device || filters.start_date || filters.end_date) && (
                  <button
                    onClick={() => setFilters({ quiz_id: "", device: "", start_date: "", end_date: "" })}
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
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.borderColor = "#d1d5db"
                    }}
                  >
                  {t("common.clearFilters")}
                  </button>
                )}
            </div>
          </header>

          {/* Main KPIs - Foco no Funil */}
            <div
              style={{
                display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {/* Total Visitors */}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
                  {t("dashboard.kpi.visitors")}
              </div>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }} suppressHydrationWarning>
                {funnel.total_visits}
              </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                {t("dashboard.kpi.visitors")}
            </div>
            </div>

            {/* Quiz Started */}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
                  {t("dashboard.kpi.started")}
              </div>
                </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }} suppressHydrationWarning>
                {funnel.quiz_starts}
              </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                {funnel.quiz_start_rate.toFixed(1)}% {t("dashboard.kpi.ofVisitors")}
              </div>
            </div>

            {/* Quiz Completed */}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
                  {t("dashboard.kpi.completed")}
              </div>
                </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }} suppressHydrationWarning>
                {funnel.quiz_completions}
              </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                {funnel.completion_rate.toFixed(1)}% {t("dashboard.kpi.ofStarted")}
              </div>
            </div>

            {/* Taxa de Início */}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
                  {t("dashboard.kpi.startRate")}
                </div>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }} suppressHydrationWarning>
                {funnel.quiz_start_rate.toFixed(1)}%
            </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                {t("dashboard.kpi.visitors")} → {t("dashboard.kpi.started")}
              </div>
            </div>

            {/* Taxa de Conclusão */}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
                  {t("dashboard.kpi.completionRate")}
              </div>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }} suppressHydrationWarning>
                {funnel.completion_rate.toFixed(1)}%
              </div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                {t("dashboard.kpi.started")} → {t("dashboard.kpi.completed")}
              </div>
            </div>
          </div>

          {/* Advanced Funnel */}
          {analytics?.funnel.advanced_funnel && analytics.funnel.advanced_funnel.length > 0 && (
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
                {t("dashboard.funnel.title")}
          </h2>
              <div style={{ marginBottom: "2rem", height: "400px" }}>
                <canvas ref={funnelChartRef}></canvas>
              </div>
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
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    gap: "1rem",
                    padding: "1rem",
                    background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontWeight: 600,
                  color: "#6b7280",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  <div>Etapa</div>
                  <div>Quantidade</div>
                  <div>Porcentagem</div>
                  <div>Taxa de Queda</div>
                  <div>Progresso</div>
                </div>
                {analytics.funnel.advanced_funnel.map((step, index) => {
                  const prevStep = index > 0 ? analytics.funnel.advanced_funnel![index - 1] : null
                  const dropRate = prevStep && prevStep.count > 0
                    ? `${((prevStep.count - step.count) / prevStep.count * 100).toFixed(1)}%`
                    : "-"
                  
                  return (
                    <div
                      key={step.name}
                  style={{
                    display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    gap: "1rem",
                        padding: "1.25rem 1rem",
                        borderBottom: index < analytics.funnel.advanced_funnel!.length - 1 ? "1px solid #e5e7eb" : "none",
                    alignItems: "center",
                  }}
                >
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "1rem" }}>{step.name}</div>
                      <div style={{ color: "#374151", fontSize: "0.875rem" }} suppressHydrationWarning>{step.count}</div>
                      <div style={{ color: "#374151", fontSize: "0.875rem" }} suppressHydrationWarning>{step.percentage.toFixed(1)}%</div>
                      <div style={{ color: dropRate !== "-" && parseFloat(dropRate) > 20 ? "#ef4444" : "#94a3b8", fontSize: "0.875rem" }}>
                        {dropRate}
              </div>
              <div>
                <div
                  style={{
                      background: "#e5e7eb",
                    borderRadius: "4px",
                    height: "8px",
                    overflow: "hidden",
                              width: "100%",
                  }}
                >
                  <div
                    style={{
                        background: "#111827",
                      height: "100%",
                              width: `${Math.min(step.percentage, 100)}%`,
                              transition: "width 0.3s",
                    }}
                  ></div>
                </div>
              </div>
            </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Complete Funnel Table */}
          {mounted && (
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
                 <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
                   {t("dashboard.funnel.table.title")}
                 </h2>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <select
                    value={funnelSortBy}
                    onChange={(e) => setFunnelSortBy(e.target.value as "original" | "drop" | "time")}
                  style={{
                      padding: "0.5rem 1rem",
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      color: "#111827",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="original">{t("dashboard.funnel.table.sort.original")}</option>
                    <option value="drop">{t("dashboard.funnel.table.sort.drop")}</option>
                    <option value="time">{t("dashboard.funnel.table.sort.time")}</option>
                  </select>
                  <button
                    onClick={exportFunnelTablePDF}
                    style={{
                      background: "#111827",
                      color: "white",
                      padding: "0.5rem 1rem",
                      border: "none",
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
                    {t("dashboard.funnel.table.exportPDF")}
                  </button>
                </div>
              </div>

              {/* Table Container with Fixed Height and Scroll */}
            <div
              style={{
                  background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                    overflow: "hidden",
                  height: "400px",
                  display: "flex",
                  flexDirection: "column",
              }}
            >
                {/* Sticky Header */}
            <div
              style={{
                display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                gap: "1rem",
                    padding: "1rem",
                    background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontWeight: 600,
                  color: "#6b7280",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <div suppressHydrationWarning>{t("dashboard.funnel.table.step")}</div>
                  <div style={{ textAlign: "right" }} suppressHydrationWarning>{t("dashboard.funnel.table.start")}</div>
                  <div style={{ textAlign: "right" }} suppressHydrationWarning>{t("dashboard.funnel.table.drop")}</div>
                  <div style={{ textAlign: "right" }} suppressHydrationWarning>{t("dashboard.funnel.table.dropRate")}</div>
                  <div style={{ textAlign: "right" }} suppressHydrationWarning>{t("dashboard.funnel.table.avgTime")}</div>
                  <div style={{ textAlign: "center" }} suppressHydrationWarning>{t("dashboard.funnel.table.status")}</div>
              </div>

                {/* Scrollable Body */}
                <div
                  style={{
                    overflowY: "auto",
                    overflowX: "auto",
                    flex: 1,
                  }}
                >
                  {funnelTableData.length > 0 ? (
                    funnelTableData.map((row, index) => {
                    const bgColor = index % 2 === 0 ? "#f9fafb" : "transparent"
                    const borderColor = "#e5e7eb"

                    return (
                      <div
                        key={row.id}
                    style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                          gap: "1rem",
                padding: "1rem",
                          borderBottom: index < funnelTableData.length - 1 ? `1px solid ${borderColor}` : "none",
                          alignItems: "center",
                          background: index % 2 === 0 ? bgColor : "transparent",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }} suppressHydrationWarning>
                          {row.name === "Completed" ? t("dashboard.funnel.table.completed") : row.name}
          </div>
                        <div style={{ color: "#374151", fontSize: "0.875rem", textAlign: "right" }} suppressHydrationWarning>
                          {row.entered}
          </div>
                        <div style={{ color: "#374151", fontSize: "0.875rem", textAlign: "right" }} suppressHydrationWarning>
                          {row.exited}
          </div>
          <div
            style={{
                            color:
                              row.dropRate !== null && row.dropRate >= 15
                                ? "#dc2626"
                                : row.dropRate !== null && row.dropRate >= 8
                                  ? "#d97706"
                                  : "#6b7280",
                            fontSize: "0.875rem",
                            textAlign: "right",
                            fontWeight: row.dropRate !== null && row.dropRate >= 8 ? 600 : 400,
                          }}
                          suppressHydrationWarning
                        >
                          {row.dropRate !== null ? `${row.dropRate.toFixed(1)}%` : "-"}
            </div>
                        <div style={{ color: "#6b7280", fontSize: "0.875rem", textAlign: "right" }} suppressHydrationWarning>
                          {row.avgTime > 0 ? `${row.avgTime}s` : "-"}
              </div>
                        <div style={{ textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>{row.statusIcon}</div>
                      </div>
                    )
                  })
                  ) : (
              <div
                style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      {t("dashboard.noData")}
              </div>
            )}
          </div>
          </div>

              {/* Performance Chart */}
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }} suppressHydrationWarning>
                  {t("dashboard.funnel.performance.title")}
                </h3>
                <div style={{ height: "400px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem" }}>
                  <canvas ref={performanceChartRef}></canvas>
            </div>
          </div>
            </div>
          )}

          {/* Abandono por Pergunta */}
          {analytics && analytics.abandonment && analytics.abandonment.length > 0 && (
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
                {t("dashboard.abandonment.title")}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                <div style={{ height: "400px" }}>
                  <canvas ref={abandonmentChartRef}></canvas>
                </div>
              <div
                style={{
                    background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                    <div
                      style={{
                        display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        background: "#0f172a",
                        borderBottom: "1px solid #334155",
                        fontWeight: 600,
                        color: "#94a3b8",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                  }}
                >
                    <div>Pergunta</div>
                    <div>Iniciaram</div>
                    <div>Concluíram</div>
                    <div>Abandono</div>
                    <div>Tempo Médio</div>
                    </div>
                  {analytics.abandonment.slice(0, 10).map((item) => {
                    const completed = item.views - item.abandons
                      return (
                        <div
                        key={item.question_number}
                          style={{
                            display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                            gap: "0.75rem",
                            padding: "0.875rem 1rem",
                            borderBottom: "1px solid #334155",
                            alignItems: "center",
                  }}
                >
                        <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.875rem" }}>{item.question_id}</div>
                        <div style={{ color: "#e2e8f0", fontSize: "0.875rem" }} suppressHydrationWarning>{item.views}</div>
                        <div style={{ color: "#22c55e", fontSize: "0.875rem" }} suppressHydrationWarning>{completed}</div>
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                              padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background:
                                item.abandon_rate > 30
                                    ? "#7c2d12"
                                  : item.abandon_rate > 15
                                      ? "#78350f"
                                      : "#143c1c",
                                color:
                                item.abandon_rate > 30
                                    ? "#fed7aa"
                                  : item.abandon_rate > 15
                                      ? "#fef3c7"
                                      : "#86efac",
                              }}
                            >
                              {item.abandon_rate.toFixed(1)}%
                            </span>
                          </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.875rem" }} suppressHydrationWarning>
                          {item.avg_time > 0 ? `${item.avg_time}s` : "-"}
                                </div>
                                </div>
                    )
                  })}
                              </div>
                          </div>
                          </div>
          )}

          {/* Ranking de Quizzes */}
          {analytics?.quiz_rankings && analytics.quiz_rankings.length > 0 && (
            <div
                              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1.5rem" }}>
                Ranking de Quizzes
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
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
                      padding: "1rem",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                                fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    Top 3 Quizzes da Semana
                          </div>
                  {analytics.quiz_rankings.slice(0, 3).map((quiz, index) => (
            <div
                      key={quiz.quiz_id}
              style={{
                        padding: "1rem",
                        borderBottom: index < 2 ? "1px solid #e5e7eb" : "none",
                        display: "flex",
                alignItems: "center",
                        gap: "1rem",
              }}
            >
                <div
                  style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#111827",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        {index + 1}
                              </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                          {quiz.title}
                          </div>
                        <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                          {quiz.visits} visitas • {quiz.conversion.toFixed(1)}% conclusão
                        </div>
                      </div>
                    </div>
                  ))}
        </div>
                  <div
                    style={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                <div
                  style={{
              display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: "1rem",
                      padding: "0.875rem 1rem",
                      background: "#0f172a",
                      borderBottom: "1px solid #334155",
                                fontWeight: 600,
                      color: "#94a3b8",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    <div suppressHydrationWarning>{t("dashboard.rankings.table.quiz")}</div>
                    <div suppressHydrationWarning>{t("dashboard.rankings.table.visits")}</div>
                    <div suppressHydrationWarning>{t("dashboard.rankings.table.conversion")}</div>
                    <div suppressHydrationWarning>{t("dashboard.rankings.table.lastExecution")}</div>
                          </div>
                  {analytics.quiz_rankings.map((quiz) => (
                    <div
                      key={quiz.quiz_id}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: "1rem",
                        padding: "0.875rem 1rem",
                        borderBottom: "1px solid #334155",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.875rem" }}>{quiz.title}</div>
                      <div style={{ color: "#e2e8f0", fontSize: "0.875rem" }} suppressHydrationWarning>
                        {quiz.visits}
                              </div>
                      <div style={{ color: "#e2e8f0", fontSize: "0.875rem" }} suppressHydrationWarning>
                        {quiz.conversion.toFixed(1)}%
                          </div>
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }} suppressHydrationWarning>
                        {quiz.last_execution && mounted ? formatDate(quiz.last_execution) : "-"}
                        </div>
        </div>
                  ))}
                </div>
              </div>
                  </div>
                )}

          {/* Feed de Eventos Recentes */}
          {analytics?.recent_events && analytics.recent_events.length > 0 && (
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
                        {t("dashboard.events.title")}
            </h2>
          <div
            style={{
                  background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "1.5rem",
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                {analytics.recent_events.map((event, index) => {
                  const getEventLabel = (type: string) => {
                    const labels: Record<string, string> = {
                      quiz_visited: "Usuário visitou quiz",
                      quiz_started: "Usuário iniciou quiz",
                      question_viewed: `Usuário chegou na Q${event.question_number || "?"}`,
                      answer_submitted: `Usuário respondeu Q${event.question_number || "?"}`,
                      quiz_completed: "Usuário completou quiz",
                      quiz_abandoned: `Usuário abandonou na Q${event.question_number || "?"}`,
                      cta_clicked: "Usuário clicou no CTA final",
                    }
                    return labels[type] || type
                  }

                  return (
                    <div
                      key={event.id}
                style={{
                        display: "flex",
                        gap: "1rem",
                        padding: "1rem",
                        borderBottom: index < analytics.recent_events!.length - 1 ? "1px solid #e5e7eb" : "none",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>•</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#111827", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                          {getEventLabel(event.event_type)}
              </div>
                        <div style={{ color: "#9ca3af", fontSize: "0.75rem" }} suppressHydrationWarning>
                          {mounted ? formatDateTime(event.created_at) : ""}
              </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}


          {/* Dispositivo Breakdown */}
          {analytics && analytics.device_breakdown && analytics.device_breakdown.length > 0 && (
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
                {t("dashboard.device.title")}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                <div style={{ height: "300px" }}>
                  <canvas ref={deviceChartRef}></canvas>
                          </div>
              <div
                style={{
                    background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                    overflow: "hidden",
                }}
              >
                  <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        background: "#0f172a",
                        borderBottom: "1px solid #334155",
                        fontWeight: 600,
                      color: "#94a3b8",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                      }}
                    >
                      <div suppressHydrationWarning>{t("dashboard.device.table.device")}</div>
                      <div suppressHydrationWarning>{t("dashboard.device.table.visits")}</div>
                      <div suppressHydrationWarning>{t("dashboard.device.table.startRate")}</div>
                      <div suppressHydrationWarning>{t("dashboard.device.table.completionRate")}</div>
                      <div suppressHydrationWarning>{t("dashboard.device.table.abandonmentRate")}</div>
                  </div>
                    {analytics.device_breakdown.map((item) => (
                      <div
                        key={item.device}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
                          gap: "0.75rem",
                          padding: "0.875rem 1rem",
                          borderBottom: "1px solid #334155",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.875rem", textTransform: "capitalize" }}>
                          {item.device === "mobile" ? "📱 Mobile" : item.device === "desktop" ? "💻 Desktop" : item.device === "tablet" ? "📱 Tablet" : item.device}
              </div>
                        <div style={{ color: "#e2e8f0", fontSize: "0.875rem" }} suppressHydrationWarning>{item.visits}</div>
                        <div style={{ color: "#10b981", fontSize: "0.875rem" }} suppressHydrationWarning>
                          {item.start_rate.toFixed(1)}%
                        </div>
                        <div style={{ color: "#8b5cf6", fontSize: "0.875rem" }} suppressHydrationWarning>
                          {item.completion_rate.toFixed(1)}%
                        </div>
                        <div style={{ color: "#ef4444", fontSize: "0.875rem" }} suppressHydrationWarning>
                          {item.abandonment_rate.toFixed(1)}%
                        </div>
                      </div>
                    ))}
              </div>
              </div>
            </div>
          )}

          {/* Análise de Tempo do Quiz */}
          {analytics && analytics.abandonment && analytics.abandonment.length > 0 && (
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
                {t("dashboard.time.title")}
          </h2>
            <div
              style={{
                  background: "#0f172a",
                border: "1px solid #334155",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    gap: "1rem",
                    padding: "0.875rem 1rem",
                        background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  fontWeight: 600,
                    color: "#6b7280",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                  }}
                >
                  <div suppressHydrationWarning>{t("dashboard.time.table.question")}</div>
                  <div suppressHydrationWarning>{t("dashboard.time.table.avgTime")}</div>
                  <div suppressHydrationWarning>{t("dashboard.time.avgToAbandon")}</div>
                  <div suppressHydrationWarning>{t("dashboard.time.avgToComplete")}</div>
            </div>
                {analytics.abandonment.map((item) => {
                  const avgTimeToAbandon = item.abandons > 0 ? item.avg_time : 0
                  const avgTimeToComplete = item.views > item.abandons ? item.avg_time : 0

                  return (
                    <div
                      key={item.question_number}
              style={{
                display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: "1rem",
                        padding: "0.875rem 1rem",
                        borderBottom: "1px solid #e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{item.question_id}</div>
                      <div style={{ color: "#374151", fontSize: "0.875rem" }} suppressHydrationWarning>
                        {item.avg_time > 0 ? `${item.avg_time}s` : "-"}
                      </div>
                      <div style={{ color: "#dc2626", fontSize: "0.875rem" }} suppressHydrationWarning>
                        {avgTimeToAbandon > 0 ? `${avgTimeToAbandon}s` : "-"}
                      </div>
                      <div style={{ color: "#059669", fontSize: "0.875rem" }} suppressHydrationWarning>
                        {avgTimeToComplete > 0 ? `${avgTimeToComplete}s` : "-"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}


          {/* Quizzes Recentes */}
          {quizzes.length > 0 && (
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.5rem" }}>
                📝 Quizzes Recentes
              </h2>
            <div
              style={{
                display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
                {removeDuplicates(quizzes).map((quiz) => (
                  <div
                  key={quiz.id}
                  style={{
                      background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>{quiz.title}</h3>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                        disabled={deletingQuizId === quiz.id}
                        style={{
                          background: deletingQuizId === quiz.id ? "#334155" : "#7c2d12",
                          border: "none",
                          color: "#fed7aa",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          cursor: deletingQuizId === quiz.id ? "not-allowed" : "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {deletingQuizId === quiz.id ? "Deletando..." : "🗑️"}
                      </button>
                  </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.75rem" }} suppressHydrationWarning>
                      Criado em {mounted ? formatDate(quiz.created_at) : ""}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link
                        href={`/quizzes/${quiz.id}`}
                        style={{
                          background: "#334155",
                          color: "#e2e8f0",
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      >
                        Ver Detalhes
                </Link>
                    </div>
                  </div>
              ))}
              </div>
            </div>
          )}

        {/* Ações Rápidas */}
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ffffff", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
              {t("dashboard.quickActions.title")}
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/quizzes/new"
                style={{
                  background: "#ffffff",
                  color: "#111827",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff"
                }}
              >
                {t("dashboard.quickActions.createQuiz")}
              </Link>
                <Link
                href="/quizzes"
                style={{
                  background: "transparent",
                  color: "#9ca3af",
                  border: "1px solid #374151",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1f2937"
                  e.currentTarget.style.borderColor = "#4b5563"
                  e.currentTarget.style.color = "#e5e7eb"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.borderColor = "#374151"
                  e.currentTarget.style.color = "#9ca3af"
                }}
              >
                {t("dashboard.quickActions.viewAll")}
                </Link>
            </div>
          </div>
        </div>
    </div>
    </>
  )
}

