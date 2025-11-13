import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
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

    const body = await request.json()
    const { title, url } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("id", quizId)
      .eq("user_id", user.id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Update quiz
    const { data: updatedQuiz, error: updateError } = await supabase
      .from("quizzes")
      .update({ title, url })
      .eq("id", quizId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating quiz:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Quiz "${updatedQuiz.title}" atualizado com sucesso`,
      quiz: updatedQuiz,
    })
  } catch (error: any) {
    console.error("Error in update quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("id", quizId)
      .eq("user_id", user.id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Delete quiz (cascade will handle related data if configured)
    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)

    if (deleteError) {
      console.error("Error deleting quiz:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Quiz "${quiz.title}" deletado com sucesso`
    })
  } catch (error: any) {
    console.error("Error in delete quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

