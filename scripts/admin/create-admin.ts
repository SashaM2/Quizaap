/**
 * Script para criar usuário admin diretamente no Supabase
 * Cria o usuário e o perfil com role 'admin' automaticamente
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import * as readline from "readline"

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

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local")
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local")
  console.error("\n💡 Para criar admin automaticamente, você precisa da service_role key:")
  console.error("   1. Acesse: Supabase Dashboard > Settings > API")
  console.error("   2. Copie a chave 'service_role' (secreta!)")
  console.error("   3. Adicione ao .env.local: SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui")
  console.error("\n⚠️  Alternativa: Crie a conta manualmente e execute o SQL para tornar admin")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Interface para ler input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createAdmin() {
  console.log("🚀 Criando usuário admin no Supabase...\n")

  // Solicitar dados do admin
  const email = await question("📧 Email do admin: ")
  const password = await question("🔒 Senha (mínimo 6 caracteres): ")

  if (!email || !password) {
    console.error("❌ Email e senha são obrigatórios!")
    rl.close()
    process.exit(1)
  }

  if (password.length < 6) {
    console.error("❌ A senha deve ter pelo menos 6 caracteres!")
    rl.close()
    process.exit(1)
  }

  try {
    console.log("\n📝 Criando usuário...")

    // Criar usuário via Auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    })

    if (authError) {
      console.error("❌ Erro ao criar usuário:", authError.message)
      rl.close()
      process.exit(1)
    }

    if (!authData.user) {
      console.error("❌ Usuário não foi criado")
      rl.close()
      process.exit(1)
    }

    console.log("✅ Usuário criado com sucesso!")
    console.log(`   ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)

    // Criar perfil com role admin
    console.log("\n👑 Criando perfil admin...")

    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: "admin",
      })
      .select()
      .single()

    if (profileError) {
      // Se já existe, atualizar para admin
      if (profileError.code === "23505") {
        console.log("⚠️  Perfil já existe, atualizando para admin...")
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ role: "admin" })
          .eq("id", authData.user.id)

        if (updateError) {
          console.error("❌ Erro ao atualizar perfil:", updateError.message)
          rl.close()
          process.exit(1)
        }
        console.log("✅ Perfil atualizado para admin!")
      } else {
        console.error("❌ Erro ao criar perfil:", profileError.message)
        rl.close()
        process.exit(1)
      }
    } else {
      console.log("✅ Perfil admin criado com sucesso!")
    }

    console.log("\n🎉 Admin criado com sucesso!")
    console.log("\n📋 Credenciais:")
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log("\n💡 Agora você pode fazer login em: http://localhost:3000/auth/login")

    rl.close()
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message)
    rl.close()
    process.exit(1)
  }
}

// Executar
createAdmin()

