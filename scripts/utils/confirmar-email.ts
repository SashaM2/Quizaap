/**
 * Script para confirmar email de um usuário
 * Uso: pnpm run confirm:email <email>
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

async function confirmarEmail(email: string) {
  console.log(`🔍 Confirmando email para: ${email}\n`)

  try {
    // Buscar usuário pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error("❌ Erro ao buscar usuários:", listError.message)
      process.exit(1)
    }

    const user = users?.users.find((u) => u.email === email)

    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`)
      process.exit(1)
    }

    console.log(`✅ Usuário encontrado: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email confirmado: ${user.email_confirmed_at ? "Sim" : "Não"}\n`)

    if (user.email_confirmed_at) {
      console.log("ℹ️  Email já está confirmado!")
      return
    }

    // Confirmar email
    console.log("📧 Confirmando email...")
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (error) {
      console.error("❌ Erro ao confirmar email:", error.message)
      process.exit(1)
    }

    console.log("✅ Email confirmado com sucesso!")
    console.log(`\n📋 Usuário atualizado:`)
    console.log(`   Email: ${data.user.email}`)
    console.log(`   Email confirmado: ${data.user.email_confirmed_at ? "Sim" : "Não"}`)
    console.log("\n💡 Agora o usuário pode fazer login!")

  } catch (error: any) {
    console.error("\n❌ Erro:", error.message)
    process.exit(1)
  }
}

// Obter email do argumento da linha de comando
const email = process.argv[2]

if (!email) {
  console.error("❌ Uso: pnpm run confirm:email <email>")
  console.error("Exemplo: pnpm run confirm:email teste1@gmail.com")
  process.exit(1)
}

confirmarEmail(email)


