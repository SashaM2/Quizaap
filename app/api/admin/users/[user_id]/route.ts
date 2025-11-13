import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Esta rota usa service role key para operações administrativas
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { role } = await request.json()
    const { user_id } = await params
    const userId = user_id

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Use 'admin' ou 'user'" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase incompleta" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Atualizar role do usuário
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar usuário:", error)
      return NextResponse.json(
        { error: "Erro ao atualizar usuário", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    console.error("Erro na API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params
    const userId = user_id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase incompleta" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar se o usuário existe antes de deletar
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError) {
      console.error("Erro ao buscar usuário:", getUserError)
      return NextResponse.json(
        { error: "Usuário não encontrado", details: getUserError.message },
        { status: 404 }
      )
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Deletar usuário do auth (isso também deleta o perfil por CASCADE devido ao ON DELETE CASCADE)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Erro ao deletar usuário:", deleteError)
      return NextResponse.json(
        { error: "Erro ao deletar usuário", details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Usuário ${userData.user.email} deletado com sucesso`
    })
  } catch (error: any) {
    console.error("Erro na API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

