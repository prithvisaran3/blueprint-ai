/**
 * Supabase browser client (Supabase Auth).
 *
 * Created only when a real Supabase project is configured (see `HAS_SUPABASE`).
 * In mock mode it stays `null` and the auth layer uses a local stub session.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

export const supabase: SupabaseClient | null = HAS_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Return the current Supabase access token (JWT), or null if unauthenticated. */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
