// This script makes a simple health check to keep the Supabase connection active
// It NEVER modifies data, ensuring no corruption or unintended changes

const SUPABASE_API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const INTERVAL = 4 * 24 * 60 * 60 * 1000 // 4 days in milliseconds

async function keepSupabaseAlive() {
  try {
    console.log(`[${new Date().toISOString()}] Running Supabase keep-alive check...`)

    const response = await fetch("/api/keep-alive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
      }),
    })

    const result = await response.json()

    if (result.success) {
      console.log("[Supabase Keep-Alive] ✓ Connection verified successfully")
    } else {
      console.error("[Supabase Keep-Alive] ✗ Failed:", result.error)
    }
  } catch (error) {
    console.error("[Supabase Keep-Alive] ✗ Error:", error)
  }
}

// Run immediately on startup
keepSupabaseAlive()

// Schedule to run every 4 days
setInterval(keepSupabaseAlive, INTERVAL)

console.log(`[Supabase Keep-Alive] Scheduled to run every 4 days (${INTERVAL}ms)`)
