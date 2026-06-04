import { SITE_URL } from './env'

/**
 * Canonical app origin for OAuth redirects.
 * Set VITE_SITE_URL in .env (local) or Vercel (prod) so `redirectTo` always matches
 * Supabase URL Configuration — otherwise Supabase falls back to Site URL (often :3000).
 */
export function getAppOrigin(): string {
  if (SITE_URL) return SITE_URL
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function authCallbackUrl(): string {
  const origin = getAppOrigin()
  return origin ? `${origin}/auth/callback` : '/auth/callback'
}
