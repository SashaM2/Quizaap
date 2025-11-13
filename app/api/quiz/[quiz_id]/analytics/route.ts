import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quiz_id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { quiz_id } = await params
    const quizId = quiz_id

    // Verify quiz belongs to user
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .eq("user_id", user.id)
      .single()

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Get sessions count
    const { count: totalVisits } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)

    // Get quiz starts - need to join with sessions to get quiz_id
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("quiz_id", quizId)

    const sessionIds = sessions?.map((s) => s.id) || []

    const { count: quizStarts } = sessionIds.length > 0
      ? await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .in("session_id", sessionIds)
          .eq("event_type", "quiz_started")
      : { count: 0 }

    // Get quiz completions
    const { count: quizCompletions } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .not("completed_at", "is", null)

    // Get leads count
    const { count: totalLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)

    // Calculate rates
    const quizStartRate = totalVisits && totalVisits > 0 ? ((quizStarts || 0) / totalVisits) * 100 : 0
    const completionRate = quizStarts && quizStarts > 0 ? ((quizCompletions || 0) / quizStarts) * 100 : 0
    const conversionRate = totalVisits && totalVisits > 0 ? ((totalLeads || 0) / totalVisits) * 100 : 0

    // Get abandonment data by question
    const { data: questionViews } = await supabase
      .from("events")
      .select("question_number, created_at")
      .in("session_id", sessionIds)
      .eq("event_type", "question_viewed")
      .not("question_number", "is", null)

    const { data: abandonments } = await supabase
      .from("events")
      .select("question_number, created_at")
      .in("session_id", sessionIds)
      .eq("event_type", "quiz_abandoned")
      .not("question_number", "is", null)

    // Process abandonment data
    const abandonmentMap = new Map<number, { views: number; abandons: number; totalTime: number; count: number }>()
    
    questionViews?.forEach((event) => {
      const questionNum = event.question_number || 0
      const current = abandonmentMap.get(questionNum) || { views: 0, abandons: 0, totalTime: 0, count: 0 }
      current.views++
      abandonmentMap.set(questionNum, current)
    })

    abandonments?.forEach((event) => {
      const questionNum = event.question_number || 0
      const current = abandonmentMap.get(questionNum) || { views: 0, abandons: 0, totalTime: 0, count: 0 }
      current.abandons++
      abandonmentMap.set(questionNum, current)
    })

    const abandonment = Array.from(abandonmentMap.entries())
      .map(([question_number, data]) => ({
        question_id: `Q${question_number}`,
        views: data.views,
        abandons: data.abandons,
        abandon_rate: data.views > 0 ? (data.abandons / data.views) * 100 : 0,
        avg_time: 0, // Would need to calculate from question timings
      }))
      .sort((a, b) => b.abandon_rate - a.abandon_rate)

    // Get top 3 abandonment questions
    const topAbandonmentQuestions = abandonment.slice(0, 3).map((item) => ({
      question_order: item.question_id,
      abandon_rate: item.abandon_rate,
    }))

    return NextResponse.json({
      funnel: {
        total_visits: totalVisits || 0,
        quiz_starts: quizStarts || 0,
        quiz_completions: quizCompletions || 0,
        total_leads: totalLeads || 0,
        quiz_start_rate: Math.round(quizStartRate * 100) / 100,
        completion_rate: Math.round(completionRate * 100) / 100,
        conversion_rate: Math.round(conversionRate * 100) / 100,
      },
      abandonment,
      top_abandonment_questions: topAbandonmentQuestions,
    })
  } catch (error) {
    console.error("Error in get analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

