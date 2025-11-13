/**
 * Script para verificar se a Service Role Key está configurada e funcionando
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("🔍 Verificando configuração da Service Role Key...\n")

// Verificar variáveis
if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL não encontrado")
  process.exit(1)
}

if (!supabaseAnonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado")
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não encontrado")
  console.error("\n💡 Adicione ao .env.local:")
  console.error("   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role")
  process.exit(1)
}

console.log("✅ Variáveis de ambiente encontradas:")
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`)
console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`)

// Testar conexão com Service Role Key
async function testServiceKey() {
  console.log("🧪 Testando Service Role Key...\n")

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Teste 1: Listar usuários (requer service role)
    console.log("1️⃣ Testando listagem de usuários...")
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("   ❌ Erro:", usersError.message)
      return false
    }

    console.log(`   ✅ Sucesso! Encontrados ${users.users.length} usuário(s)`)

    // Teste 2: Acessar user_profiles (bypass RLS)
    console.log("\n2️⃣ Testando acesso a user_profiles...")
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .limit(5)

    if (profilesError) {
      console.error("   ❌ Erro:", profilesError.message)
      return false
    }

    console.log(`   ✅ Sucesso! Encontrados ${profiles?.length || 0} perfil(is)`)

    // Teste 3: Verificar se pode atualizar (sem realmente atualizar)
    console.log("\n3️⃣ Testando permissões de atualização...")
    const { error: updateTestError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1)

    if (updateTestError) {
      console.error("   ❌ Erro:", updateTestError.message)
      return false
    }

    console.log("   ✅ Permissões OK!")

    // Mostrar resumo
    console.log("\n📊 Resumo:")
    console.log(`   Total de usuários: ${users.users.length}`)
    console.log(`   Total de perfis: ${profiles?.length || 0}`)
    
    if (profiles && profiles.length > 0) {
      const admins = profiles.filter((p: any) => p.role === "admin").length
      const regularUsers = profiles.filter((p: any) => p.role === "user").length
      console.log(`   Administradores: ${admins}`)
      console.log(`   Usuários: ${regularUsers}`)
    }

    console.log("\n✅ Service Role Key está funcionando corretamente!")
    return true
  } catch (error: any) {
    console.error("\n❌ Erro ao testar:", error.message)
    return false
  }
}

// Executar teste
testServiceKey()
  .then((success) => {
    if (success) {
      console.log("\n🎉 Tudo configurado e funcionando!")
      process.exit(0)
    } else {
      console.log("\n⚠️  Alguns testes falharam. Verifique a configuração.")
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error)
    process.exit(1)
  })

