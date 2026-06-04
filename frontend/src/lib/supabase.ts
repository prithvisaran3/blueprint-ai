/**
 * Supabase browser client with **cookie-backed session persistence**.
 *
 * Uses `@supabase/ssr` so auth tokens are stored in secure cookies (SameSite=Lax,
 * Secure on HTTPS, long-lived) instead of only localStorage. Sessions survive
 * tab close and revisits; tokens auto-refresh while the cookie is valid.
 *
 * Note: In a pure SPA, cookies are not HttpOnly (that requires a server setter).
 * The anon key remains public; security relies on Supabase RLS + short-lived JWTs.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

const isHttps =
  typeof window !== 'undefined' && window.location.protocol === 'https:'

export const supabase: SupabaseClient | null = HAS_SUPABASE
  ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      isSingleton: true,
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        // Secure on production (Vercel); omitted on http://localhost for dev.
        ...(isHttps ? { secure: true } : {}),
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // PKCE is configured by createBrowserClient for OAuth safety.
      },
    })
  : null

/** Return the current Supabase access token (JWT), or null if unauthenticated. */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
