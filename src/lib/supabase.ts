import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Warn (instead of throwing at import time) so a missing env var doesn't
// white-screen the entire app. Auth-dependent features will surface a clear
// error, while public flows keep working.
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — ' +
      'authentication and direct database features will be unavailable.'
  )
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

// Fall back to harmless placeholders so createClient never throws. Any real
// call will fail gracefully and be caught by the calling code.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)
