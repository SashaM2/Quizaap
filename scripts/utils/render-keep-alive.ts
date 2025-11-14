/**
 * Script standalone para manter o Render ativo
 * Faz requisições periódicas ao aplicativo para evitar que o servidor seja desligado
 * após 15 minutos de inatividade
 * 
 * Uso:
 *   tsx scripts/utils/render-keep-alive.ts
 * 
 * Ou adicione ao cron/task scheduler para executar automaticamente
 */

import * as dotenv from "dotenv"
import * as path from "path"

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({ path: path.join(process.cwd(), ".env.local") })
dotenv.config({ path: path.join(process.cwd(), ".env") })

// URL do aplicativo (pode ser local ou produção)
const APP_URL = process.env.RENDER_KEEP_ALIVE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://quizaap.onrender.com"

// Intervalo: 10 minutos (menos de 15 para garantir que não desliga)
const INTERVAL_MINUTES = 10
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000

/**
 * Faz uma requisição HTTP simples ao aplicativo para mantê-lo ativo
 */
async function keepRenderAlive() {
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[${timestamp}] 🔄 Fazendo ping ao aplicativo...`)

    // Faz requisição GET à página inicial (mais leve)
    const response = await fetch(`${APP_URL}/`, {
      method: "GET",
      headers: {
        "User-Agent": "Render-Keep-Alive/1.0",
      },
      // Timeout de 30 segundos
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      console.log(`[${timestamp}] ✅ Aplicativo ativo! Status: ${response.status}`)
      return true
    } else {
      console.warn(`[${timestamp}] ⚠️  Resposta não OK: ${response.status}`)
      return false
    }
  } catch (error: any) {
    console.error(`[${timestamp}] ❌ Erro ao fazer ping:`, error.message)
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
    console.log("🚀 Script Keep-Alive Render iniciado")
    console.log(`   URL: ${APP_URL}`)
    console.log(`   Intervalo: ${INTERVAL_MINUTES} minutos (${INTERVAL_MS}ms)`)
    console.log("=".repeat(60))
    console.log()
  }

  // Executa imediatamente
  const success = await keepRenderAlive()

  if (isScheduled) {
    // Se executado via tarefa agendada, apenas executa uma vez e sai
    process.exit(success ? 0 : 1)
  }

  // Se executado manualmente, agenda execução a cada 10 minutos
  setInterval(async () => {
    await keepRenderAlive()
  }, INTERVAL_MS)

  console.log()
  console.log(`✅ Script agendado para executar a cada ${INTERVAL_MINUTES} minutos`)
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

