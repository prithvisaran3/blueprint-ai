/**
 * Canonical app origin for OAuth redirects.
 * Set VITE_SITE_URL on Vercel to your production domain so redirects never
 * fall back to a wrong Supabase Site URL (e.g. localhost:3000).
 */
export function getAppOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function authCallbackUrl(): string {
  const origin = getAppOrigin()
  return origin ? `${origin}/auth/callback` : '/auth/callback'
}
