/**
 * Script standalone para manter o Supabase ativo
 * Executa uma query simples a cada 4 dias para evitar inatividade
 * 
 * Uso:
 *   tsx scripts/utils/keep-alive-standalone.ts
 * 
 * Ou adicione ao cron/task scheduler para executar automaticamente
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({ path: path.join(process.cwd(), ".env.local") })
dotenv.config({ path: path.join(process.cwd(), ".env") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Intervalo: 4 dias em milissegundos
const INTERVAL_DAYS = 4
const INTERVAL_MS = INTERVAL_DAYS * 24 * 60 * 60 * 1000

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Erro: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configurados")
  console.error("   Configure essas variáveis no arquivo .env.local ou .env")
  process.exit(1)
}

// Cria cliente Supabase standalone (não depende do servidor Next.js)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Executa uma query simples e segura que não modifica dados
 * Apenas verifica a conexão com o Supabase
 */
async function keepSupabaseAlive() {
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[${timestamp}] 🔄 Executando keep-alive do Supabase...`)

    // Query simples que apenas conta registros (não modifica nada)
    // Usa head: true para não retornar dados, apenas verificar conexão
    const { data, error, count } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error(`[${timestamp}] ❌ Erro ao verificar conexão:`, error.message)
      return false
    }

    console.log(`[${timestamp}] ✅ Supabase ativo! Conexão verificada com sucesso`)
    console.log(`   Total de quizzes: ${count ?? "N/A"}`)
    return true
  } catch (error) {
    console.error(`[${timestamp}] ❌ Erro inesperado:`, error)
    return false
  }
}

/**
 * Função principal que executa o keep-alive
 * Quando executado via tarefa agendada, executa uma vez e sai
 * Quando executado manualmente, fica rodando em loop
 */
async function main() {
  const isScheduled = process.env.RUN_AS_SCHEDULED_TASK === "true" || process.argv.includes("--scheduled")
  
  if (!isScheduled) {
    console.log("=".repeat(60))
    console.log("🚀 Script Keep-Alive Supabase iniciado")
    console.log(`   Intervalo: ${INTERVAL_DAYS} dias (${INTERVAL_MS}ms)`)
    console.log(`   URL: ${SUPABASE_URL}`)
    console.log("=".repeat(60))
    console.log()
  }

  // Executa imediatamente
  const success = await keepSupabaseAlive()

  if (isScheduled) {
    // Se executado via tarefa agendada, apenas executa uma vez e sai
    process.exit(success ? 0 : 1)
  }

  // Se executado manualmente, agenda execução a cada 4 dias
  setInterval(async () => {
    await keepSupabaseAlive()
  }, INTERVAL_MS)

  console.log()
  console.log(`✅ Script agendado para executar a cada ${INTERVAL_DAYS} dias`)
  console.log("   Pressione Ctrl+C para parar")
  console.log()
  
  // Mantém o processo vivo
  process.on("SIGINT", () => {
    console.log("\n👋 Encerrando script...")
    process.exit(0)
  })
}

// Executa o script
main().catch((error) => {
  console.error("❌ Erro fatal:", error)
  process.exit(1)
})

