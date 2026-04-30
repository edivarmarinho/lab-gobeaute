import { createClient } from '@supabase/supabase-js'

// Usar apenas em Server Components, API Routes e Server Actions
// Nunca importar em Client Components
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
