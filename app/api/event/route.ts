import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      session_id, 
      quiz_id, 
      event_type, 
      question_number, 
      answer, 
      created_at,
      device,
      browser,
      os,
      referrer,
      utm_source,
      utm_campaign,
      utm_medium,
      utm_term,
      utm_content
    } = body

    if (!session_id || !quiz_id || !event_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if session exists, if not create it
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_session_id", session_id)
      .single()

    if (!existingSession) {
      // Create new session with tracking data
      const { error: sessionError } = await supabase.from("sessions").insert({
        quiz_id,
        user_session_id: session_id,
        started_at: created_at || new Date().toISOString(),
        device: device || null,
        browser: browser || null,
        os: os || null,
        referrer: referrer || null,
        utm_source: utm_source || null,
        utm_campaign: utm_campaign || null,
        utm_medium: utm_medium || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
      })

      if (sessionError) {
        console.error("Error creating session:", sessionError)
      }
    } else if (event_type === "quiz_completed") {
      // Update session completion time
      await supabase
        .from("sessions")
        .update({ completed_at: created_at || new Date().toISOString() })
        .eq("user_session_id", session_id)
    }

    // Get session ID for events table
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_session_id", session_id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        session_id: session.id,
        quiz_id,
        event_type,
        question_number,
        answer,
        created_at: created_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (eventError) {
      console.error("Error creating event:", eventError)
      return NextResponse.json({ error: eventError.message }, { status: 500 })
    }

    return NextResponse.json({ event_id: event.id }, { status: 201 })
  } catch (error) {
    console.error("Error in track event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

