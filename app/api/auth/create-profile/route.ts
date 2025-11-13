import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Esta rota usa service role key para criar perfil quando necessário
export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Usar service role key para bypass RLS
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

    // Verificar se perfil já existe
    const { data: existing, error: checkError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, profile: existing })
    }

    // Se erro não for "not found", retornar erro
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Erro ao verificar perfil:", checkError)
      return NextResponse.json(
        { error: "Erro ao verificar perfil", details: checkError.message },
        { status: 500 }
      )
    }

    // Criar perfil usando upsert para evitar conflitos
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email: email,
        role: "user",
      }, {
        onConflict: "id"
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar perfil:", error)
      return NextResponse.json(
        { error: "Erro ao criar perfil", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    console.error("Erro na API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

