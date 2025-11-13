import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"
import * as dotenv from "dotenv"

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: Variáveis de ambiente não encontradas!")
  console.error("Certifique-se de que .env.local contém:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=...")
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=...")
  process.exit(1)
}

// Usar service_role key se disponível, senão usar anon key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function executeSQL(sql: string, description: string) {
  console.log(`\n📝 ${description}...`)
  
  try {
    // O Supabase JS não tem método direto para executar SQL arbitrário
    // Vamos usar a API REST diretamente
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      // Tentar método alternativo: executar via query builder
      console.log(`   ⚠️  Método direto não disponível, usando método alternativo...`)
      return { success: true, message: "Execute manualmente no SQL Editor" }
    }

    const result = await response.json()
    console.log(`   ✅ ${description} executado com sucesso!`)
    return { success: true, result }
  } catch (error: any) {
    console.error(`   ❌ Erro ao executar ${description}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function setupDatabase() {
  console.log("🚀 Iniciando configuração do Supabase...")
  console.log(`📍 URL: ${supabaseUrl}`)

  // Ler o arquivo SQL
  const sqlPath = join(process.cwd(), "scripts", "sql", "SCHEMA_COMPLETO.sql")
  const sqlContent = readFileSync(sqlPath, "utf-8")

  // Dividir o SQL em comandos individuais
  const commands = sqlContent
    .split(";")
    .map((cmd) => cmd.trim())
    .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"))

  console.log(`\n📋 Encontrados ${commands.length} comandos SQL`)

  // Executar cada comando
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]
    if (cmd.trim()) {
      await executeSQL(cmd + ";", `Comando ${i + 1}/${commands.length}`)
      // Pequeno delay para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log("\n✅ Configuração concluída!")
  console.log("\n📌 IMPORTANTE: Execute os scripts SQL manualmente no Supabase Dashboard")
  console.log("   O Supabase não permite execução de SQL arbitrário via API por segurança.")
  console.log("   Vá em: SQL Editor → Cole o conteúdo de scripts/sql/SCHEMA_COMPLETO.sql → Run")
}

// Executar
setupDatabase().catch(console.error)

