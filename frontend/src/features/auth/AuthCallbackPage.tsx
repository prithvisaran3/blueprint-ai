import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { debugError, debugLog } from '@/lib/debug'

/**
 * OAuth return URL — Supabase appends tokens to the hash on redirect.
 * A dedicated public route avoids ProtectedRoute sending users to /login
 * before the session is parsed.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    let cancelled = false

    async function finish() {
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error_description') ?? params.get('error')
      if (oauthError) {
        if (!cancelled) setError(oauthError)
        return
      }

      try {
        const code = params.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        const { data, error: err } = await supabase.auth.getSession()
        if (err) throw err
        if (!data.session) {
          throw new Error('No session after sign-in. Check Supabase redirect URLs and GitHub OAuth settings.')
        }

        debugLog('auth', 'OAuth callback session established', { userId: data.session.user.id })
        if (!cancelled) navigate('/dashboard', { replace: true })
      } catch (e) {
        debugError('auth', 'OAuth callback failed', e)
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Sign-in failed')
        }
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            GitHub sign-in uses Supabase Auth. In Supabase → Authentication → Providers → GitHub,
            the Client ID must be your GitHub OAuth App ID (looks like Ov23…), not your email.
          </p>
          <a href="/login" className="text-sm text-primary underline">
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Completing sign-in…</p>
      </div>
    </div>
  )
}
