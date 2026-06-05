/**
 * Supabase browser client for this Vite SPA.
 *
 * Uses `createClient` with localStorage so the PKCE code verifier survives the
 * GitHub → Supabase → /auth/callback redirect in the same tab. (@supabase/ssr
 * cookie storage is intended for SSR frameworks and can lose the verifier in a
 * client-only SPA, causing AuthPKCECodeVerifierMissingError.)
 */
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

export const supabase: SupabaseClient | null = HAS_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null

/** Return the current Supabase access token (JWT), or null if unauthenticated. */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
