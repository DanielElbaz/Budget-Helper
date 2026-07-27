import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants. Copie .env.example vers .env.local et renseigne ton projet Supabase (voir README).',
  )
}

export const supabase = createClient(supabaseUrl ?? 'https://placeholder.supabase.co', supabaseAnonKey ?? 'placeholder')

// The couple shares a single Supabase Auth account (one email + one password
// acting as a shared "access code"). See README for setup steps.
export const SHARED_ACCOUNT_EMAIL = (import.meta.env.VITE_SHARED_ACCOUNT_EMAIL as string | undefined) || 'famille@budget-helper.local'
