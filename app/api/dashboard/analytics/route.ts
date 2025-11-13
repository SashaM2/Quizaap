import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get date filters from query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    
    // Helper function to build query with date filter
    const buildQuery = (query: any) => {
      if (startDate) {
        query = query.gte("created_at", startDate)
      }
      if (endDate) {
        query = query.lte("created_at", `${endDate} 23:59:59`)
      }
      return query
    }

    // Get all quizzes for user
    const { data: quizzes } = await supabase.from("quizzes").select("id").eq("user_id", user.id)

    const quizIds = quizzes?.map((q) => q.id) || []

    if (quizIds.length === 0) {
      return NextResponse.json({
        funnel: {
          total_visits: 0,
          quiz_starts: 0,
          quiz_completions: 0,
          quiz_start_rate: 0,
          completion_rate: 0,
        },
        abandonment: [],
        top_abandonment_questions: [],
        where_stopped: [],
        abandonment_reasons: {},
        suggestions: [],
      })
    }

    // Get total visits (sessions)
    let sessionsQuery = supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .in("quiz_id", quizIds)
    sessionsQuery = buildQuery(sessionsQuery)
    const { count: totalVisits } = await sessionsQuery

    // Get session IDs
    let sessionsDataQuery = supabase.from("sessions").select("id, completed_at").in("quiz_id", quizIds)
    sessionsDataQuery = buildQuery(sessionsDataQuery)
    const { data: sessions } = await sessionsDataQuery
    const sessionIds = sessions?.map((s) => s.id) || []

    // Get quiz starts
    let quizStartsQuery = sessionIds.length > 0
      ? supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .in("session_id", sessionIds)
          .eq("event_type", "quiz_started")
      : null
    if (quizStartsQuery) {
      quizStartsQuery = buildQuery(quizStartsQuery)
    }
    const { count: quizStarts } = quizStartsQuery ? await quizStartsQuery : { count: 0 }

    // Get quiz completions
    let completionsQuery = supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .in("quiz_id", quizIds)
      .not("completed_at", "is", null)
    completionsQuery = buildQuery(completionsQuery)
    const { count: quizCompletions } = await completionsQuery


    // Calculate rates
    const quizStartRate = totalVisits && totalVisits > 0 ? ((quizStarts || 0) / totalVisits) * 100 : 0
    const completionRate = quizStarts && quizStarts > 0 ? ((quizCompletions || 0) / quizStarts) * 100 : 0

    // Get sessions that started but didn't complete
    let incompleteSessionsQuery = supabase
      .from("sessions")
      .select("id")
      .in("quiz_id", quizIds)
      .is("completed_at", null)
    incompleteSessionsQuery = buildQuery(incompleteSessionsQuery)
    const { data: incompleteSessions } = await incompleteSessionsQuery

    const incompleteSessionIds = incompleteSessions?.map((s) => s.id) || []

    // Get ALL events for incomplete sessions to determine where they stopped
    let allIncompleteEventsQuery = incompleteSessionIds.length > 0
      ? supabase
          .from("events")
          .select("session_id, question_number, event_type, created_at")
          .in("session_id", incompleteSessionIds)
          .order("created_at", { ascending: false })
      : null
    if (allIncompleteEventsQuery) {
      allIncompleteEventsQuery = buildQuery(allIncompleteEventsQuery)
    }
    const { data: allIncompleteEvents } = allIncompleteEventsQuery ? await allIncompleteEventsQuery : { data: [] }

    // Process where users stopped - use the last question viewed for each session
    const stopPointsMap = new Map<number, number>()
    const processedSessions = new Set<string>()

    // Group events by session and get the last question viewed
    const sessionLastQuestion = new Map<string, number>()

    allIncompleteEvents?.forEach((event) => {
      if (!processedSessions.has(event.session_id) && event.question_number) {
        // Prefer quiz_abandoned events, but fall back to question_viewed
        if (event.event_type === "quiz_abandoned" || !sessionLastQuestion.has(event.session_id)) {
          sessionLastQuestion.set(event.session_id, event.question_number)
        }
        if (event.event_type === "quiz_abandoned") {
          processedSessions.add(event.session_id)
        }
      }
    })

    // For sessions without abandonment event, use the last question_viewed
    allIncompleteEvents?.forEach((event) => {
      if (
        event.event_type === "question_viewed" &&
        event.question_number &&
        !processedSessions.has(event.session_id)
      ) {
        const currentLast = sessionLastQuestion.get(event.session_id) || 0
        if (event.question_number > currentLast) {
          sessionLastQuestion.set(event.session_id, event.question_number)
        }
      }
    })

    // Count stop points
    sessionLastQuestion.forEach((questionNum) => {
      stopPointsMap.set(questionNum, (stopPointsMap.get(questionNum) || 0) + 1)
    })

    const totalIncomplete = incompleteSessionIds.length
    const whereStoppedMap = new Map<number, { count: number; percentage: number }>()
    Array.from(stopPointsMap.entries()).forEach(([question_number, count]) => {
      whereStoppedMap.set(question_number, {
        count,
        percentage: totalIncomplete > 0 ? (count / totalIncomplete) * 100 : 0,
      })
    })
    
    const whereStopped = Array.from(whereStoppedMap.entries())
      .map(([question_number, data]) => ({
        question_number,
        question_id: `Questão ${question_number}`,
        count: data.count,
        percentage: data.percentage,
      }))
      .sort((a, b) => b.count - a.count)

    // Get abandonment data with reasons - from explicit abandonment events
    let abandonmentEventsQuery = sessionIds.length > 0
      ? supabase
          .from("events")
          .select("question_number, answer, session_id")
          .in("session_id", sessionIds)
          .eq("event_type", "quiz_abandoned")
          .not("answer", "is", null)
      : null
    if (abandonmentEventsQuery) {
      abandonmentEventsQuery = buildQuery(abandonmentEventsQuery)
    }
    const { data: abandonmentEventsWithReasons } = abandonmentEventsQuery
      ? await abandonmentEventsQuery
      : { data: [] }

    // Also infer reasons from incomplete sessions without explicit abandonment
    // If a session started but didn't complete and has no abandonment event,
    // we can infer reasons based on patterns
    let incompleteSessionsForReasonsQuery = supabase
      .from("sessions")
      .select("id, started_at")
      .in("quiz_id", quizIds)
      .is("completed_at", null)
    incompleteSessionsForReasonsQuery = buildQuery(incompleteSessionsForReasonsQuery)
    const { data: incompleteSessionsForReasons } = await incompleteSessionsForReasonsQuery

    // Get question views with timestamps for time analysis
    let questionViewsQuery = sessionIds.length > 0
      ? supabase
          .from("events")
          .select("question_number, session_id, created_at")
          .in("session_id", sessionIds)
          .eq("event_type", "question_viewed")
          .not("question_number", "is", null)
      : null
    if (questionViewsQuery) {
      questionViewsQuery = buildQuery(questionViewsQuery)
    }
    const { data: questionViews } = questionViewsQuery ? await questionViewsQuery : { data: [] }

    // Get answer submissions to calculate time spent per question
    let answerSubmissionsQuery = sessionIds.length > 0
      ? supabase
          .from("events")
          .select("question_number, session_id, created_at")
          .in("session_id", sessionIds)
          .eq("event_type", "answer_submitted")
          .not("question_number", "is", null)
      : null
    if (answerSubmissionsQuery) {
      answerSubmissionsQuery = buildQuery(answerSubmissionsQuery)
    }
    const { data: answerSubmissions } = answerSubmissionsQuery ? await answerSubmissionsQuery : { data: [] }

    // Process abandonment data with intelligent analysis
    const abandonmentMap = new Map<
      number,
      {
        views: number
        abandons: number
        reasons: Map<string, number>
        avg_time: number
        time_samples: number[]
        previous_question_pattern: Map<number, number> // question_number -> count
        progression_score: number // Higher = more likely to abandon as quiz progresses
      }
    >()
    const viewsMap = new Map<number, number>()
    const reasonsMap = new Map<string, number>()
    const questionTimeMap = new Map<string, number>() // "session_id-question_number" -> time in seconds

    // Calculate time spent per question
    questionViews?.forEach((view) => {
      const key = `${view.session_id}-${view.question_number}`
      const viewTime = new Date(view.created_at).getTime()

      // Find corresponding answer submission
      const answer = answerSubmissions?.find(
        (a) => a.session_id === view.session_id && a.question_number === view.question_number
      )

      if (answer) {
        const answerTime = new Date(answer.created_at).getTime()
        const timeSpent = Math.round((answerTime - viewTime) / 1000) // seconds
        questionTimeMap.set(key, timeSpent)
      }
    })

    // Count views by question number
    questionViews?.forEach((event) => {
      const questionNum = event.question_number || 0
      viewsMap.set(questionNum, (viewsMap.get(questionNum) || 0) + 1)
    })

    // Get all question views to analyze patterns (which question was viewed before abandonment)
    let allQuestionViewsQuery = sessionIds.length > 0
      ? supabase
          .from("events")
          .select("session_id, question_number, created_at")
          .in("session_id", sessionIds)
          .eq("event_type", "question_viewed")
          .not("question_number", "is", null)
          .order("created_at", { ascending: true })
      : null
    if (allQuestionViewsQuery) {
      allQuestionViewsQuery = buildQuery(allQuestionViewsQuery)
    }
    const { data: allQuestionViews } = allQuestionViewsQuery ? await allQuestionViewsQuery : { data: [] }

    // Count abandons by question and reason from explicit events
    abandonmentEventsWithReasons?.forEach((event) => {
      const questionNum = event.question_number || 0
      let reason = event.answer || "Sem motivo especificado"

      // Normalize common reasons
      if (reason === "unknown" || reason === "page_unload") {
        reason = "Navegador fechado ou página recarregada"
      } else if (reason.toLowerCase().includes("timeout") || reason.toLowerCase().includes("tempo")) {
        reason = "Tempo esgotado ou inatividade"
      } else if (reason.toLowerCase().includes("difficult") || reason.toLowerCase().includes("difícil")) {
        reason = "Questão muito difícil"
      }

      // Count reason globally
      reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1)

      // Find previous question for this session
      const sessionViews = allQuestionViews?.filter((v) => v.session_id === event.session_id) || []
      const currentIndex = sessionViews.findIndex((v) => v.question_number === questionNum)
      const previousQuestion = currentIndex > 0 ? sessionViews[currentIndex - 1]?.question_number : null

      // Count by question with intelligent data
      const current = abandonmentMap.get(questionNum) || {
        views: 0,
        abandons: 0,
        reasons: new Map<string, number>(),
        avg_time: 0,
        time_samples: [],
        previous_question_pattern: new Map<number, number>(),
        progression_score: 0,
      }
      current.abandons++
      current.reasons.set(reason, (current.reasons.get(reason) || 0) + 1)

      // Track previous question pattern
      if (previousQuestion) {
        current.previous_question_pattern.set(
          previousQuestion,
          (current.previous_question_pattern.get(previousQuestion) || 0) + 1
        )
      }

      abandonmentMap.set(questionNum, current)
    })

    // Infer reasons for incomplete sessions without explicit abandonment events
    if (incompleteSessionsForReasons && incompleteSessionsForReasons.length > 0) {
      const now = new Date()
      incompleteSessionsForReasons.forEach((session) => {
        const sessionStart = new Date(session.started_at)
        const timeSinceStart = (now.getTime() - sessionStart.getTime()) / 1000 / 60 // minutes

        // Infer reason based on time patterns
        let inferredReason = "Sessão não finalizada"
        if (timeSinceStart < 1) {
          inferredReason = "Abandono imediato (menos de 1 minuto)"
        } else if (timeSinceStart < 5) {
          inferredReason = "Abandono rápido (1-5 minutos)"
        } else {
          inferredReason = "Sessão abandonada após início"
        }

        reasonsMap.set(inferredReason, (reasonsMap.get(inferredReason) || 0) + 1)
      })
    }

    // Set views and calculate intelligent metrics for abandoned questions
    abandonmentMap.forEach((data, questionNum) => {
      data.views = viewsMap.get(questionNum) || 0

      // Calculate average time spent on this question (from all views, not just abandons)
      const questionTimes: number[] = []
      questionViews?.forEach((view) => {
        if (view.question_number === questionNum) {
          const key = `${view.session_id}-${view.question_number}`
          const time = questionTimeMap.get(key)
          if (time !== undefined) {
            questionTimes.push(time)
            data.time_samples.push(time)
          }
        }
      })

      if (questionTimes.length > 0) {
        data.avg_time = Math.round(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length)
      }

      // Calculate progression score: higher question number = higher risk if abandonment increases
      // This helps identify if abandonment gets worse as quiz progresses
      const allQuestionNumbers = Array.from(abandonmentMap.keys()).sort((a, b) => a - b)
      const positionInQuiz = allQuestionNumbers.indexOf(questionNum) + 1
      const totalQuestions = allQuestionNumbers.length
      data.progression_score = totalQuestions > 0 ? (positionInQuiz / totalQuestions) * 100 : 0
    })

    // Build abandonment list with intelligent insights
    const abandonment = Array.from(abandonmentMap.entries())
      .map(([question_number, data]) => {
        const views = data.views
        const abandons = data.abandons
        const abandonRate = views > 0 ? (abandons / views) * 100 : 0
        const topReason = Array.from(data.reasons.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "Sem motivo especificado"

        // Find most common previous question (pattern analysis)
        const topPreviousQuestion = Array.from(data.previous_question_pattern.entries())
          .sort((a, b) => b[1] - a[1])[0]

        // Calculate risk score (0-100): combines abandon rate, progression, and time factors
        const timeFactor = data.avg_time > 0 ? Math.min(100, (data.avg_time / 60) * 20) : 0 // More time = higher risk
        const progressionFactor = data.progression_score * 0.3 // Later in quiz = higher risk
        const abandonFactor = abandonRate * 0.5 // Higher abandon rate = higher risk
        const riskScore = Math.min(100, Math.round(abandonFactor + progressionFactor + timeFactor))

        // Determine risk level
        let riskLevel = "low"
        if (riskScore > 70) riskLevel = "critical"
        else if (riskScore > 50) riskLevel = "high"
        else if (riskScore > 30) riskLevel = "medium"

        // Get where stopped data for this question
        const whereStoppedData = whereStoppedMap.get(question_number)

        return {
          question_id: `Q${question_number}`,
          question_number,
          views,
          abandons,
          abandon_rate: abandonRate,
          top_reason: topReason,
          reasons: Object.fromEntries(data.reasons),
          avg_time: data.avg_time,
          risk_score: riskScore,
          risk_level: riskLevel,
          progression_score: Math.round(data.progression_score),
          most_common_previous: topPreviousQuestion
            ? `Q${topPreviousQuestion[0]} (${topPreviousQuestion[1]}x)`
            : null,
          stopped_count: whereStoppedData?.count || 0,
          stopped_percentage: whereStoppedData?.percentage || 0,
        }
      })
      .sort((a, b) => b.abandon_rate - a.abandon_rate)

    // Get top 3 abandonment questions
    const topAbandonmentQuestions = abandonment.slice(0, 3).map((item) => ({
      question_order: item.question_number.toString(),
      abandon_rate: item.abandon_rate,
    }))

    // Convert reasons map to object
    const abandonmentReasons = Object.fromEntries(reasonsMap)

    // Generate improvement suggestions
    const suggestions: string[] = []

    if (quizStartRate < 50 && totalVisits && totalVisits > 10) {
      suggestions.push(
        "Taxa de início baixa: Considere melhorar o título ou a primeira impressão do quiz para aumentar o engajamento inicial."
      )
    }

    if (completionRate < 30 && quizStarts && quizStarts > 5) {
      suggestions.push(
        "Taxa de conclusão baixa: O quiz pode estar muito longo ou difícil. Considere reduzir o número de questões ou simplificar o conteúdo."
      )
    }

    if (abandonment.length > 0) {
      const topAbandon = abandonment[0]
      if (topAbandon.abandon_rate > 30) {
        suggestions.push(
          `Alta taxa de abandono na ${topAbandon.question_id}: Esta questão pode ser muito difícil ou confusa. Considere reformulá-la ou movê-la para o final do quiz. Motivo principal: "${topAbandon.top_reason}"`
        )
      }
    }

    if (whereStopped.length > 0) {
      const mostStopped = whereStopped[0]
      if (mostStopped.percentage > 40 && incompleteSessionIds.length > 5) {
        suggestions.push(
          `Muitos usuários param na ${mostStopped.question_id} (${mostStopped.percentage.toFixed(1)}%): Esta pode ser uma questão crítica. Considere adicionar incentivos ou simplificar o conteúdo nesta etapa.`
        )
      }
    }


    // Check for common abandonment reasons
    const topReason = Array.from(reasonsMap.entries())
      .sort((a, b) => b[1] - a[1])[0]

    if (topReason && topReason[1] > 3) {
      suggestions.push(
        `Motivo de abandono mais comum: "${topReason[0]}" (${topReason[1]} ocorrências). Considere abordar este problema especificamente.`
      )
    }

    if (suggestions.length === 0 && totalVisits && totalVisits > 0) {
      suggestions.push("Seus quizzes estão performando bem! Continue monitorando as métricas para identificar oportunidades de melhoria.")
    }

    // Get detailed sessions data for device, UTM, etc.
    let sessionsDetailedQuery = supabase
      .from("sessions")
      .select("id, quiz_id, started_at, completed_at, device, browser, os, referrer, utm_source, utm_campaign")
      .in("quiz_id", quizIds)
    sessionsDetailedQuery = buildQuery(sessionsDetailedQuery)
    const { data: sessionsDetailed } = await sessionsDetailedQuery

    // Aggregate device data
    const deviceMap = new Map<string, { visits: number; starts: number; completions: number }>()
    const utmSourceMap = new Map<string, { visits: number; starts: number; completions: number }>()
    const utmCampaignMap = new Map<string, { visits: number; starts: number; completions: number }>()
    
    if (sessionsDetailed) {
      for (const session of sessionsDetailed) {
        const device = session.device || "unknown"
        const utmSource = session.utm_source || "direct"
        const utmCampaign = session.utm_campaign || "none"
        
        // Device stats
        const deviceStats = deviceMap.get(device) || { visits: 0, starts: 0, completions: 0 }
        deviceStats.visits++
        if (session.completed_at) deviceStats.completions++
        deviceMap.set(device, deviceStats)
        
        // UTM Source stats
        const utmSourceStats = utmSourceMap.get(utmSource) || { visits: 0, starts: 0, completions: 0 }
        utmSourceStats.visits++
        if (session.completed_at) utmSourceStats.completions++
        utmSourceMap.set(utmSource, utmSourceStats)
        
        // UTM Campaign stats
        const utmCampaignStats = utmCampaignMap.get(utmCampaign) || { visits: 0, starts: 0, completions: 0 }
        utmCampaignStats.visits++
        if (session.completed_at) utmCampaignStats.completions++
        utmCampaignMap.set(utmCampaign, utmCampaignStats)
      }
    }
    
    // Get quiz starts by device/UTM
    if (sessionIds.length > 0) {
      const { data: startEvents } = await supabase
        .from("events")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("event_type", "quiz_started")
      
      if (startEvents && sessionsDetailed) {
        const startSessionIds = new Set(startEvents.map(e => e.session_id))
        const sessionIdToData = new Map(sessionsDetailed.map(s => [s.id, s]))
        
        for (const startEvent of startEvents) {
          const sessionData = sessionIdToData.get(startEvent.session_id)
          if (sessionData) {
            const device = sessionData.device || "unknown"
            const deviceStats = deviceMap.get(device)
            if (deviceStats) deviceStats.starts++
            
            const utmSource = sessionData.utm_source || "direct"
            const utmSourceStats = utmSourceMap.get(utmSource)
            if (utmSourceStats) utmSourceStats.starts++
            
            const utmCampaign = sessionData.utm_campaign || "none"
            const utmCampaignStats = utmCampaignMap.get(utmCampaign)
            if (utmCampaignStats) utmCampaignStats.starts++
          }
        }
      }
    }
    
    // Format device breakdown
    const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, stats]) => ({
      device,
      visits: stats.visits,
      starts: stats.starts,
      completions: stats.completions,
      start_rate: stats.visits > 0 ? (stats.starts / stats.visits) * 100 : 0,
      completion_rate: stats.starts > 0 ? (stats.completions / stats.starts) * 100 : 0,
      abandonment_rate: stats.starts > 0 ? ((stats.starts - stats.completions) / stats.starts) * 100 : 0,
    }))
    
    // Format UTM source breakdown
    const utmSourceBreakdown = Array.from(utmSourceMap.entries()).map(([source, stats]) => ({
      source: source === "direct" ? "Tráfego Direto" : source,
      visits: stats.visits,
      starts: stats.starts,
      completions: stats.completions,
      start_rate: stats.visits > 0 ? (stats.starts / stats.visits) * 100 : 0,
      completion_rate: stats.starts > 0 ? (stats.completions / stats.starts) * 100 : 0,
      ctr: stats.visits > 0 ? (stats.starts / stats.visits) * 100 : 0,
    })).sort((a, b) => b.visits - a.visits)
    
    // Format UTM campaign breakdown
    const utmCampaignBreakdown = Array.from(utmCampaignMap.entries())
      .filter(([campaign]) => campaign !== "none")
      .map(([campaign, stats]) => ({
        campaign,
        visits: stats.visits,
        starts: stats.starts,
        completions: stats.completions,
        start_rate: stats.visits > 0 ? (stats.starts / stats.visits) * 100 : 0,
        completion_rate: stats.starts > 0 ? (stats.completions / stats.starts) * 100 : 0,
        ctr: stats.visits > 0 ? (stats.starts / stats.visits) * 100 : 0,
      })).sort((a, b) => b.visits - a.visits)

    // Get question progression data for advanced funnel
    const questionProgressionMap = new Map<number, number>() // question_number -> count
    if (sessionIds.length > 0) {
      let questionProgressionQuery = supabase
        .from("events")
        .select("question_number, session_id")
        .in("session_id", sessionIds)
        .eq("event_type", "question_viewed")
        .not("question_number", "is", null)
      questionProgressionQuery = buildQuery(questionProgressionQuery)
      const { data: questionProgression } = await questionProgressionQuery
      
      questionProgression?.forEach((event) => {
        const qNum = event.question_number || 0
        questionProgressionMap.set(qNum, (questionProgressionMap.get(qNum) || 0) + 1)
      })
    }

    // Build advanced funnel with question steps
    const questionNumbers = Array.from(questionProgressionMap.keys()).sort((a, b) => a - b)
    const funnelSteps = [
      { name: "Visitors", count: totalVisits || 0, percentage: 100 },
      { name: "Started", count: quizStarts || 0, percentage: quizStartRate },
      ...questionNumbers.map((qNum) => ({
        name: `Q${qNum}`,
        count: questionProgressionMap.get(qNum) || 0,
        percentage: (quizStarts || 0) > 0 ? ((questionProgressionMap.get(qNum) || 0) / (quizStarts || 1)) * 100 : 0,
      })),
      { name: "Completed", count: quizCompletions || 0, percentage: completionRate },
    ]

    // Get recent events for timeline
    let recentEventsQuery = sessionIds.length > 0
      ? supabase
          .from("events")
          .select("id, session_id, quiz_id, event_type, question_number, created_at")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : null
    if (recentEventsQuery) {
      recentEventsQuery = buildQuery(recentEventsQuery)
    }
    const { data: recentEvents } = recentEventsQuery ? await recentEventsQuery : { data: [] }

    // Get quiz rankings
    const quizRankings = await Promise.all(
      quizIds.map(async (qId) => {
        const { count: qVisits } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", qId)
        
        const { count: qCompletions } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", qId)
          .not("completed_at", "is", null)

        const { data: qData } = await supabase
          .from("quizzes")
          .select("title, created_at")
          .eq("id", qId)
          .single()

        const qConversion = (qVisits || 0) > 0 ? ((qCompletions || 0) / (qVisits || 1)) * 100 : 0

        return {
          quiz_id: qId,
          title: qData?.title || "Unknown",
          visits: qVisits || 0,
          conversion: qConversion,
          last_execution: qData?.created_at || null,
        }
      })
    )

    // Sort by conversion rate
    quizRankings.sort((a, b) => b.conversion - a.conversion)

    return NextResponse.json({
      funnel: {
        total_visits: totalVisits || 0,
        quiz_starts: quizStarts || 0,
        quiz_completions: quizCompletions || 0,
        quiz_start_rate: quizStartRate,
        completion_rate: completionRate,
        advanced_funnel: funnelSteps,
      },
      abandonment: abandonment || [],
      top_abandonment_questions: topAbandonmentQuestions || [],
      where_stopped: whereStopped || [],
      abandonment_reasons: abandonmentReasons || {},
      suggestions: suggestions || [],
      stats: {
        started_count: quizStarts || 0,
        completed_count: quizCompletions || 0,
        incomplete_count: incompleteSessionIds.length,
      },
      recent_events: (recentEvents || []).slice(0, 20).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        question_number: e.question_number,
        created_at: e.created_at,
        quiz_id: e.quiz_id,
      })),
      quiz_rankings: quizRankings,
      device_breakdown: deviceBreakdown,
      utm_source_breakdown: utmSourceBreakdown,
      utm_campaign_breakdown: utmCampaignBreakdown,
    })
  } catch (error) {
    console.error("Error in dashboard analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
