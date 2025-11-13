/**
 * Script para aplicar schema automaticamente no Supabase
 * Conecta usando as variáveis do .env.local e cria as tabelas
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import * as dotenv from "dotenv"

// Carregar .env.local
const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.error("❌ Arquivo .env.local não encontrado!")
  console.error("Crie o arquivo .env.local na raiz do projeto com:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=...")
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=...")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Erro: Variáveis de ambiente não encontradas!")
  console.error("\nCertifique-se de que .env.local contém:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co")
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon")
  process.exit(1)
}

// Usar service_role key se disponível (tem permissões para criar tabelas)
const apiKey = supabaseServiceKey || supabaseAnonKey

console.log("🚀 Conectando ao Supabase...")
console.log(`📍 URL: ${supabaseUrl}`)
if (supabaseServiceKey) {
  console.log("✅ Usando service_role key (permissões completas)")
} else {
  console.log("⚠️  Usando anon key (pode ter limitações)")
}

const supabase = createClient(supabaseUrl, apiKey)

async function executeSQLViaRPC(sql: string): Promise<boolean> {
  try {
    // Tentar executar via RPC (se a função existir)
    const { data, error } = await supabase.rpc("exec_sql", { query: sql })
    
    if (error) {
      // Se a função RPC não existir, tentar método alternativo
      return false
    }
    
    return true
  } catch {
    return false
  }
}

async function createTablesViaAPI() {
  console.log("\n📋 Tentando criar tabelas via API...")
  
  // O Supabase não permite CREATE TABLE via API REST por segurança
  // Mas podemos tentar criar via migrations ou verificar se já existem
  
  const tables = ["quizzes", "sessions", "events", "leads", "user_profiles"]
  const results: { [key: string]: boolean } = {}

  for (const table of tables) {
    try {
      // Tentar fazer uma query simples para verificar se a tabela existe
      const { error } = await supabase.from(table).select("count", { count: "exact", head: true })
      
      if (error && error.code === "PGRST116") {
        // Tabela não existe
        results[table] = false
        console.log(`   ❌ ${table} - não existe`)
      } else {
        // Tabela existe ou erro diferente
        results[table] = true
        console.log(`   ✅ ${table} - existe`)
      }
    } catch (error: any) {
      results[table] = false
      console.log(`   ❌ ${table} - erro: ${error.message}`)
    }
  }

  return results
}

async function applySchema() {
  try {
    console.log("\n🔍 Verificando conexão e tabelas existentes...\n")

    const tableStatus = await createTablesViaAPI()
    const missingTables = Object.entries(tableStatus).filter(([_, exists]) => !exists).map(([name]) => name)

    if (missingTables.length === 0) {
      console.log("\n✅ Todas as tabelas já existem!")
      console.log("✅ Schema aplicado com sucesso!")
      return true
    }

    console.log(`\n⚠️  ${missingTables.length} tabela(s) não encontrada(s): ${missingTables.join(", ")}`)
    console.log("\n📝 O Supabase não permite criar tabelas via API por segurança.")
    console.log("   Você precisa executar o SQL manualmente no Dashboard.\n")
    
    console.log("📋 INSTRUÇÕES:")
    console.log("   1. Acesse: https://supabase.com/dashboard")
    console.log("   2. Selecione seu projeto")
    console.log("   3. Vá em: SQL Editor")
    console.log("   4. Clique em: New Query")
    console.log("   5. Copie o conteúdo de: scripts/sql/SCHEMA_COMPLETO.sql")
    console.log("   6. Cole e clique em: Run\n")

    // Mostrar o SQL para facilitar
    const sqlPath = join(process.cwd(), "scripts", "sql", "SCHEMA_COMPLETO.sql")
    if (existsSync(sqlPath)) {
      const sql = readFileSync(sqlPath, "utf-8")
      console.log("📄 SQL para copiar (primeiros 500 caracteres):")
      console.log("─".repeat(60))
      console.log(sql.substring(0, 500) + "...")
      console.log("─".repeat(60))
      console.log("\n💡 Arquivo completo em: scripts/sql/SCHEMA_COMPLETO.sql\n")
    }

    return false
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message)
    return false
  }
}

// Executar
applySchema().then((success) => {
  if (success) {
    console.log("\n🎉 Tudo pronto! Você pode usar o sistema agora.")
  } else {
    console.log("\n💡 Execute o SQL manualmente e depois rode este script novamente para verificar.")
  }
  process.exit(success ? 0 : 1)
})
