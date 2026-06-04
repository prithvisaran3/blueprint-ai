import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { debugError, debugLog } from '@/lib/debug'

/**
 * OAuth return URL — Supabase redirects here with ?code= (PKCE) or hash tokens.
 * A dedicated public route avoids ProtectedRoute sending users to /login
 * before the session is parsed.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setError('Supabase is not configured.')
      return
    }

    let cancelled = false

    async function finish(sb: SupabaseClient) {
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error_description') ?? params.get('error')
      if (oauthError) {
        if (!cancelled) setError(oauthError)
        return
      }

      try {
        const code = params.get('code')
        if (code) {
          const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        // Hash-based implicit flow: detectSessionInUrl may need a tick to parse.
        if (window.location.hash.includes('access_token')) {
          await new Promise((r) => setTimeout(r, 100))
        }

        const { data, error: err } = await sb.auth.getSession()
        if (err) throw err
        if (!data.session) {
          throw new Error(
            'No session after sign-in. In Supabase → URL Configuration, set Site URL to your Vercel domain (not localhost:3000) and add /auth/callback to Redirect URLs.',
          )
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

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' && session) {
        debugLog('auth', 'OAuth SIGNED_IN via listener', { userId: session.user.id })
        navigate('/dashboard', { replace: true })
      }
    })

    void finish(client)

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            Supabase → Authentication → URL Configuration: set <strong>Site URL</strong> to your
            live app (e.g. https://blueprint-ai-rust.vercel.app), not localhost:3000. Add{' '}
            <code className="text-foreground">/auth/callback</code> under Redirect URLs. See
            docs/AUTH_GITHUB.md.
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
