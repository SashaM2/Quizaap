/**
 * Script para criar perfis para usuários que não têm perfil
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { existsSync } from "fs"
import { join } from "path"

// Carregar .env.local
const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.error("❌ Arquivo .env.local não encontrado!")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas")
  console.error("Certifique-se de que .env.local contém:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=...")
  console.error("  SUPABASE_SERVICE_ROLE_KEY=...")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function criarPerfisFaltantes() {
  console.log("🔍 Verificando usuários sem perfil...\n")

  try {
    // Listar todos os usuários
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("❌ Erro ao listar usuários:", usersError.message)
      process.exit(1)
    }

    if (!usersData || !usersData.users) {
      console.log("ℹ️  Nenhum usuário encontrado")
      return
    }

    console.log(`📊 Total de usuários: ${usersData.users.length}`)

    // Listar todos os perfis existentes
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id")

    if (profilesError) {
      console.error("❌ Erro ao listar perfis:", profilesError.message)
      process.exit(1)
    }

    const profileIds = new Set(profiles?.map((p) => p.id) || [])
    const usuariosSemPerfil = usersData.users.filter((u) => !profileIds.has(u.id))

    console.log(`📊 Usuários com perfil: ${profileIds.size}`)
    console.log(`📊 Usuários sem perfil: ${usuariosSemPerfil.length}\n`)

    if (usuariosSemPerfil.length === 0) {
      console.log("✅ Todos os usuários já têm perfil!")
      return
    }

    // Criar perfis para usuários sem perfil
    console.log("🔨 Criando perfis faltantes...\n")

    let criados = 0
    let erros = 0

    for (const user of usuariosSemPerfil) {
      try {
        const { data: profile, error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            email: user.email || "",
            role: "user",
          })
          .select()
          .single()

        if (insertError) {
          console.error(`   ❌ Erro ao criar perfil para ${user.email}:`, insertError.message)
          erros++
        } else {
          console.log(`   ✅ Perfil criado para: ${user.email}`)
          criados++
        }
      } catch (error: any) {
        console.error(`   ❌ Erro ao criar perfil para ${user.email}:`, error.message)
        erros++
      }
    }

    console.log("\n📊 Resumo:")
    console.log(`   ✅ Perfis criados: ${criados}`)
    console.log(`   ❌ Erros: ${erros}`)

    if (criados > 0) {
      console.log("\n🎉 Perfis criados com sucesso!")
    }
  } catch (error: any) {
    console.error("\n❌ Erro fatal:", error.message)
    process.exit(1)
  }
}

// Executar
criarPerfisFaltantes()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Erro:", error)
    process.exit(1)
  })

