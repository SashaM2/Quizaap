import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lead_id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lead_id } = await params
    const leadId = lead_id

    // Get lead info
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, quizzes!inner(user_id)")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Verify quiz belongs to user
    if (lead.quizzes.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get session events (user journey)
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("event_type, question_id, question_order, answer_value, time_spent, created_at")
      .eq("session_id", lead.session_id)
      .order("created_at", { ascending: true })

    if (eventsError) {
      console.error("Error fetching events:", eventsError)
    }

    // Format user journey
    const userJourney = (events || []).map((event) => ({
      type: event.event_type,
      question: event.question_id || undefined,
      order: event.question_order || undefined,
      answer: event.answer_value || undefined,
      time: event.time_spent || undefined,
      timestamp: event.created_at,
    }))

    return NextResponse.json({
      lead_id: lead.id,
      session_id: lead.session_id,
      quiz_id: lead.quiz_id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      quiz_result: lead.quiz_result || null,
      timestamp: lead.created_at,
      user_journey: userJourney,
    })
  } catch (error) {
    console.error("Error in get lead details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

