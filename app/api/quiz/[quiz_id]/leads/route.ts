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

    // Get leads
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching leads:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format leads to match template expectations
    const formattedLeads = (leads || []).map((lead) => ({
      lead_id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      quiz_result: lead.quiz_result || null,
      timestamp: lead.created_at,
    }))

    return NextResponse.json(formattedLeads)
  } catch (error) {
    console.error("Error in get leads:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

