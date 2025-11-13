/**
 * Script para aplicar schema no Supabase automaticamente
 * Usa a API REST do Supabase para executar SQL
 */

require("dotenv").config({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Erro: Variáveis de ambiente não encontradas!")
  console.error("Certifique-se de que .env.local contém:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=...")
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=...")
  console.error("\n💡 Para execução automática, adicione também:")
  console.error("  SUPABASE_SERVICE_ROLE_KEY=... (encontre em Settings > API > service_role)")
  process.exit(1)
}

const fs = require("fs")
const path = require("path")

async function executeSQL(sql) {
  try {
    // Usar a API REST do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (response.ok) {
      return { success: true, data: await response.json() }
    } else {
      const error = await response.text()
      return { success: false, error }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function setupDatabase() {
  console.log("🚀 Conectando ao Supabase...")
  console.log(`📍 URL: ${SUPABASE_URL}`)

  // Ler arquivos SQL
  const sqlFiles = [
    "scripts/sql/SCHEMA_COMPLETO.sql",
  ]

  for (const file of sqlFiles) {
    const filePath = path.join(process.cwd(), file)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${file}`)
      continue
    }

    console.log(`\n📄 Lendo ${file}...`)
    const sql = fs.readFileSync(filePath, "utf-8")

    console.log(`📝 Executando SQL de ${file}...`)
    const result = await executeSQL(sql)

    if (result.success) {
      console.log(`✅ ${file} executado com sucesso!`)
    } else {
      console.error(`❌ Erro ao executar ${file}:`, result.error)
      console.log("\n💡 O Supabase não permite execução de SQL via API por segurança.")
      console.log("   Execute manualmente no SQL Editor do Dashboard.")
    }
  }

  console.log("\n✅ Processo concluído!")
  console.log("\n📌 Verifique as tabelas em: Supabase Dashboard > Table Editor")
}

setupDatabase().catch(console.error)

