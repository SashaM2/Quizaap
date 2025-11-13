import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, url } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Generate tracking code
    const trackingCode = crypto.randomUUID().replace(/-/g, "").substring(0, 32)

    // Insert quiz
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        title,
        url,
        tracking_code: trackingCode,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating quiz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        quiz_id: quiz.id,
        tracking_code: trackingCode,
        script_url: `/api/tracker/${trackingCode}.js`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error in register quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

