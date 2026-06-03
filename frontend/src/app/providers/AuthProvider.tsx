import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'
import { mockUser } from '@/lib/mock/data'
import { supabase } from '@/lib/supabase'
import { USE_MOCKS } from '@/lib/env'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  /** True when running on the local stub (mock mode or no Supabase configured). */
  isMock: boolean
  /** Email/password sign-in. In mock mode the password is ignored. */
  login: (email?: string, password?: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
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

/**
 * Auth provider. Uses **Supabase Auth** when a project is configured; otherwise
 * falls back to a local stub session (mock mode) so the app still runs.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    useStub && window.localStorage.getItem(STORAGE_KEY) === 'true' ? mockUser : null,
  )
  const [isLoading, setIsLoading] = useState(!useStub)

  useEffect(() => {
    if (useStub || !supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session ? mapUser(data.session.user) : null)
      setIsLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? mapUser(session.user) : null)
      setIsLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
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
      return
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [login])

  const loginWithGitHub = useCallback(async () => {
    if (useStub || !supabase) {
      await login()
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
  }, [login])

  const logout = useCallback(async () => {
    if (!useStub && supabase) await supabase.auth.signOut()
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
