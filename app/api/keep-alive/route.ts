import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Simple health check query that doesn't modify any data
    const { data, error } = await supabase.from("quizzes").select("count", { count: "exact", head: true })

    if (error) {
      console.error("[Supabase Keep-Alive] Error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[Supabase Keep-Alive] Success at", new Date().toISOString())

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Supabase connection verified",
    })
  } catch (error) {
    console.error("[Supabase Keep-Alive] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
