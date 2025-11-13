/**
 * Script para criar usuário admin automaticamente
 * Usa valores padrão ou variáveis de ambiente
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { existsSync } from "fs"
import { join } from "path"

// Carregar .env.local
const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local")
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local")
  console.error("\n💡 Adicione ao .env.local:")
  console.error("   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role")
  console.error("\n   Encontre em: Supabase Dashboard > Settings > API > service_role")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdmin() {
  // Usar valores das variáveis de ambiente ou padrão
  const email = process.env.ADMIN_EMAIL || "admin@quizapp.com"
  const password = process.env.ADMIN_PASSWORD || "Admin123!"

  console.log("🚀 Criando usuário admin no Supabase...\n")
  console.log(`📧 Email: ${email}`)
  console.log(`🔒 Senha: ${password.substring(0, 3)}***\n`)

  try {
    console.log("📝 Criando usuário...")

    // Criar usuário via Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("⚠️  Usuário já existe, atualizando perfil para admin...")
        
        // Buscar usuário existente
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users.find((u) => u.email === email)
        
        if (!existingUser) {
          console.error("❌ Usuário não encontrado")
          process.exit(1)
        }

        // Atualizar perfil para admin
        const { error: updateError } = await supabase
          .from("user_profiles")
          .upsert({
            id: existingUser.id,
            email: existingUser.email!,
            role: "admin",
          }, {
            onConflict: "id"
          })

        if (updateError) {
          console.error("❌ Erro ao atualizar perfil:", updateError.message)
          process.exit(1)
        }

        console.log("✅ Perfil atualizado para admin!")
        console.log("\n🎉 Admin configurado com sucesso!")
        console.log("\n📋 Credenciais:")
        console.log(`   Email: ${email}`)
        console.log(`   Senha: ${password}`)
        console.log("\n💡 Agora você pode fazer login em: http://localhost:3000/auth/login")
        return
      }
      
      console.error("❌ Erro ao criar usuário:", authError.message)
      process.exit(1)
    }

    if (!authData.user) {
      console.error("❌ Usuário não foi criado")
      process.exit(1)
    }

    console.log("✅ Usuário criado com sucesso!")
    console.log(`   ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)

    // Criar perfil com role admin
    console.log("\n👑 Criando perfil admin...")

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: authData.user.id,
        email: authData.user.email!,
        role: "admin",
      }, {
        onConflict: "id"
      })

    if (profileError) {
      console.error("❌ Erro ao criar perfil:", profileError.message)
      process.exit(1)
    }

    console.log("✅ Perfil admin criado com sucesso!")
    console.log("\n🎉 Admin criado com sucesso!")
    console.log("\n📋 Credenciais:")
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log("\n💡 Agora você pode fazer login em: http://localhost:3000/auth/login")
    console.log("\n💡 Para usar email/senha diferentes, adicione ao .env.local:")
    console.log("   ADMIN_EMAIL=seu-email@exemplo.com")
    console.log("   ADMIN_PASSWORD=sua-senha-aqui")

  } catch (error: any) {
    console.error("\n❌ Erro:", error.message)
    process.exit(1)
  }
}

// Executar
createAdmin()

