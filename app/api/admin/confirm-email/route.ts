import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Esta rota usa service role key para confirmar emails
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
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

    // Buscar usuário pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json(
        { error: "Erro ao buscar usuário", details: listError.message },
        { status: 500 }
      )
    }

    const user = users?.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Confirmar email do usuário
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao confirmar email", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email confirmado com sucesso",
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      }
    })
  } catch (error: any) {
    console.error("Erro na API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}


