/**
 * Script para criar admin com email admin@crivus.com
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdmin() {
  const email = "admin@crivus.com"
  const password = "Admin123!"

  console.log("🚀 Criando admin com email admin@crivus.com...\n")

  try {
    console.log("📝 Criando usuário...")

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("⚠️  Usuário já existe, atualizando perfil para admin...")
        
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users.find((u) => u.email === email)
        
        if (!existingUser) {
          console.error("❌ Usuário não encontrado")
          process.exit(1)
        }

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
        console.log("\n📋 Credenciais:")
        console.log(`   Email: ${email}`)
        console.log(`   Senha: ${password}`)
        return
      }
      
      console.error("❌ Erro:", authError.message)
      process.exit(1)
    }

    if (!authData.user) {
      console.error("❌ Usuário não foi criado")
      process.exit(1)
    }

    console.log("✅ Usuário criado!")

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

    console.log("✅ Perfil admin criado!")
    console.log("\n🎉 Admin criado com sucesso!")
    console.log("\n📋 Credenciais:")
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log("\n💡 Agora você pode fazer login!")

  } catch (error: any) {
    console.error("\n❌ Erro:", error.message)
    process.exit(1)
  }
}

createAdmin()

