import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
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
  const navigatedRef = useRef(false)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setError('Supabase is not configured.')
      return
    }

    let cancelled = false

    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error_description') ?? params.get('error')
    if (oauthError) {
      setError(oauthError)
      return
    }

    const goDashboard = () => {
      if (cancelled || navigatedRef.current) return
      navigatedRef.current = true
      navigate('/dashboard', { replace: true })
    }

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' && session) {
        debugLog('auth', 'OAuth SIGNED_IN via listener', { userId: session.user.id })
        goDashboard()
      }
    })

    // Do NOT call exchangeCodeForSession manually — detectSessionInUrl handles
    // PKCE when getSession() runs. A manual exchange races the SDK and can throw
    // AuthPKCECodeVerifierMissingError if the verifier was already consumed.
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return
      if (sessionError) {
        debugError('auth', 'OAuth callback failed', sessionError)
        setError(sessionError.message)
        return
      }
      if (data.session) {
        debugLog('auth', 'OAuth callback session established', { userId: data.session.user.id })
        goDashboard()
        return
      }
      const hasAuthParams =
        params.has('code') || window.location.hash.includes('access_token')
      if (!hasAuthParams) {
        setError(
          'No session after sign-in. In Supabase → URL Configuration, set Site URL to your Vercel domain (not localhost:3000) and add /auth/callback to Redirect URLs.',
        )
      }
      // If ?code= is present but session isn't ready yet, onAuthStateChange will fire.
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  if (error) {
    const duplicateEmail = /multiple accounts with the same email/i.test(error)
    const pkceMissing = /PKCE code verifier not found/i.test(error)
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          {pkceMissing ? (
            <div className="space-y-2 text-left text-xs text-muted-foreground">
              <p>
                The sign-in flow lost its PKCE verifier (usually a stale tab, cleared storage, or
                opening the GitHub link in a different browser).
              </p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Close other Blueprint tabs.</li>
                <li>Go back to <strong>/login</strong> and click <strong>Continue with GitHub</strong> again.</li>
                <li>Complete GitHub authorization in the <strong>same tab</strong> — do not copy the callback URL.</li>
              </ol>
            </div>
          ) : duplicateEmail ? (
            <div className="space-y-2 text-left text-xs text-muted-foreground">
              <p>
                Supabase found <strong>two user records</strong> with the same email (e.g. email
                sign-up and GitHub OAuth). Automatic linking cannot pick which account to use.
              </p>
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  Supabase Dashboard → <strong>Authentication → Users</strong>
                </li>
                <li>Search your email — delete the duplicate account(s); keep one.</li>
                <li>Sign in again with <strong>Continue with GitHub</strong>.</li>
              </ol>
              <p>
                After a clean sign-in, use only GitHub (or only email) for that address. See{' '}
                <code className="text-foreground">docs/AUTH_GITHUB.md</code> (duplicate accounts).
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Supabase → Authentication → URL Configuration: set <strong>Site URL</strong> to your
              app origin (e.g. <code className="text-foreground">http://localhost:5173</code> for
              local dev or your Vercel URL for prod), not localhost:3000. Add{' '}
              <code className="text-foreground">/auth/callback</code> under Redirect URLs. See
              docs/AUTH_GITHUB.md.
            </p>
          )}
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
