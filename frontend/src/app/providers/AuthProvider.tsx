import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'
import { mockUser } from '@/lib/mock/data'
import { supabase } from '@/lib/supabase'
import { USE_MOCKS } from '@/lib/env'
import { debugLog, debugWarn } from '@/lib/debug'
import { authCallbackUrl } from '@/lib/site'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  /** True when running on the local stub (mock mode or no Supabase configured). */
  isMock: boolean
  /** Email/password sign-in. In mock mode the password is ignored. */
  login: (email?: string, password?: string) => Promise<void>
  /**
   * Email/password sign-up. Resolves with `needsEmailConfirmation: true` when
   * Supabase created the user but did not return a session (email confirmation
   * is enabled) — the caller should prompt the user to check their inbox.
   */
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  loginWithGitHub: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'blueprint-auth'

/** Whether we should use the local stub session instead of Supabase Auth. */
const useStub = USE_MOCKS || !supabase

function mapUser(u: SupabaseUser): User {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    u.email ||
    'User'
  return {
    id: u.id,
    email: u.email ?? '',
    displayName,
    avatarUrl:
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      null,
    createdAt: u.created_at ?? new Date().toISOString(),
  }
}

/** Events that change who is signed in (or finish the initial cookie restore). */
const SESSION_EVENTS = new Set<AuthChangeEvent>([
  'INITIAL_SESSION',
  'SIGNED_IN',
  'SIGNED_OUT',
  'TOKEN_REFRESHED',
  'USER_UPDATED',
])

/**
 * Auth provider. Uses **Supabase Auth** with cookie persistence when configured;
 * otherwise falls back to a local stub session (mock mode).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (useStub && typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'true') {
      return mockUser
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(!useStub)

  useEffect(() => {
    if (useStub || !supabase) return

    let active = true

    // Restore session from cookies on every visit (before rendering protected routes).
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setUser(session ? mapUser(session.user) : null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !SESSION_EVENTS.has(event)) return
      setUser(session ? mapUser(session.user) : null)
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email?: string, password?: string) => {
    if (useStub || !supabase) {
      await new Promise((r) => setTimeout(r, 400))
      setUser(email ? { ...mockUser, email } : mockUser)
      window.localStorage.setItem(STORAGE_KEY, 'true')
      return
    }
    if (!email || !password) throw new Error('Email and password are required')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (useStub || !supabase) {
      await login(email)
      return { needsEmailConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // When email confirmation is enabled, Supabase returns a user but no session.
    // The user must click the confirmation link before they can sign in.
    return { needsEmailConfirmation: !data.session }
  }, [login])

  const loginWithGitHub = useCallback(async () => {
    if (useStub || !supabase) {
      await login()
      return
    }

    const redirectTo = authCallbackUrl()
    debugLog('auth', 'GitHub OAuth starting', { redirectTo })

    if (redirectTo.includes('localhost:3000')) {
      debugWarn(
        'auth',
        'redirectTo uses port 3000 — set VITE_SITE_URL=http://localhost:5173 and fix Supabase Site URL',
      )
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
        // In dev Vite opens a manual window; in prod the SDK redirects automatically.
        skipBrowserRedirect: import.meta.env.DEV,
      },
    })
    if (error) throw error
    // In dev skipBrowserRedirect=true so we must navigate manually.
    if (data?.url && import.meta.env.DEV) {
      window.location.assign(data.url)
    }
  }, [login])

  const logout = useCallback(async () => {
    if (!useStub && supabase) {
      await supabase.auth.signOut({ scope: 'local' })
    }
    window.localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isMock: useStub,
        login,
        signUp,
        loginWithGitHub,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
