/**
 * Centralized environment configuration.
 *
 * The app can run in two modes, toggled by `VITE_USE_MOCKS`:
 *  - `true`  → the mock data layer is used; no network calls, no Supabase.
 *  - `false` → the real API client + Supabase Auth are used.
 *
 * Mocks default to ON only when Supabase is not configured, so a fresh checkout
 * "just works", while a configured deployment talks to the real backend.
 */

const rawUseMocks = import.meta.env.VITE_USE_MOCKS

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).replace(/\/$/, '')

export const SSE_BASE_URL = (import.meta.env.VITE_SSE_BASE_URL ?? API_BASE_URL).replace(/\/$/, '')

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** Whether a usable Supabase project is configured (URL + anon key, not the placeholder). */
export const HAS_SUPABASE =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-')

/**
 * Use mocks when explicitly requested, or by default when Supabase isn't set up.
 * Set `VITE_USE_MOCKS=false` (with a configured backend) to force real mode.
 */
export const USE_MOCKS = rawUseMocks != null ? rawUseMocks === 'true' : !HAS_SUPABASE
