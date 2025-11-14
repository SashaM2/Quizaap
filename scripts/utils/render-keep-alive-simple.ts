/**
 * Script simplificado para manter o Render ativo
 * Versão otimizada para ser executada por serviços de cron job online
 * 
 * Uso com cron-job.org ou similar:
 *   npx tsx scripts/utils/render-keep-alive-simple.ts
 */

const APP_URL = "https://quizaap.onrender.com"

async function keepRenderAlive() {
  try {
    const response = await fetch(`${APP_URL}/`, {
      method: "GET",
      headers: {
        "User-Agent": "Render-Keep-Alive/1.0",
      },
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      console.log(`✅ Render ativo! Status: ${response.status}`)
      return true
    } else {
      console.warn(`⚠️  Status: ${response.status}`)
      return false
    }
  } catch (error: any) {
    console.error(`❌ Erro: ${error.message}`)
    return false
  }
}

keepRenderAlive()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error("Erro fatal:", error)
    process.exit(1)
  })

