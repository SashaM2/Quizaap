import { createBrowserClient } from "@supabase/ssr"

// Cache the client instance to avoid recreating it on every call
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached client if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error(
      "[v0] Missing Supabase configuration. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    )
    throw new Error(
      "Supabase configuration missing. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // Create and cache the client
  supabaseClient = createBrowserClient(url, key)
  return supabaseClient
}
