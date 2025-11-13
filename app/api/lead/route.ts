import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { session_id, quiz_id, name, email, phone } = body

    if (!session_id || !quiz_id || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get session ID
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_session_id", session_id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Insert lead
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        quiz_id,
        session_id: session.id,
        name,
        email,
        phone: phone || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating lead:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead_id: lead.id }, { status: 201 })
  } catch (error) {
    console.error("Error in submit lead:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

