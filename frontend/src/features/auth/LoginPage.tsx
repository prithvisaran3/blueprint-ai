import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, GitBranch, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GradientMesh, Logo } from '@/components/shared'
import { useAuth } from '@/app/providers'
import { fadeInUp, staggerContainer } from '@/lib/motion'
import { AuthDebugPanel } from './AuthDebugPanel'

/** Map raw Supabase/auth errors to clear, actionable messages. */
function friendlyAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Authentication failed'
  const msg = raw.toLowerCase()
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the confirmation link.'
  }
  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password. If you just signed up, confirm your email first.'
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts — please wait a minute and try again.'
  }
  if (msg.includes('password') && msg.includes('6')) {
    return 'Password must be at least 6 characters.'
  }
  if (msg.includes('email address') && msg.includes('invalid')) {
    return 'That email address looks invalid. Please use a real email.'
  }
  return raw
}

export function LoginPage() {
  const { login, signUp, loginWithGitHub, isMock } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(isMock ? 'alex@blueprint.ai' : '')
  const [password, setPassword] = useState(isMock ? 'demo' : '')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signup' && !isMock) {
        const { needsEmailConfirmation } = await signUp(email, password)
        if (needsEmailConfirmation) {
          setInfo(
            `We sent a confirmation link to ${email}. Click it, then sign in below.`,
          )
          setMode('signin')
          setPassword('')
          return
        }
      } else {
        await login(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGitHub() {
    setError(null)
    setInfo(null)
    try {
      await loginWithGitHub()
      if (isMock) navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <GradientMesh />

      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        <Link to="/">
          <Logo size={36} />
        </Link>
        <motion.div variants={staggerContainer()} initial="hidden" animate="visible" className="max-w-md">
          <motion.h1 variants={fadeInUp} className="text-4xl font-semibold leading-tight tracking-tight">
            From a single idea to a <span className="text-gradient">full engineering blueprint</span>.
          </motion.h1>
          <motion.p variants={fadeInUp} className="mt-4 text-muted-foreground">
            Seven specialized AI agents design the architecture, plan the work, scaffold the code,
            review quality, and sign off — in minutes.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <p className="text-2xl font-semibold text-foreground">7</p>
              <p>AI agents</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-2xl font-semibold text-foreground">~90s</p>
              <p>per blueprint</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-2xl font-semibold text-foreground">100%</p>
              <p>typed output</p>
            </div>
          </motion.div>
        </motion.div>
        <p className="text-xs text-muted-foreground">© 2026 Blueprint AI · Crafted for builders.</p>
      </div>

      {/* Right: form */}
      <div className="relative flex items-center justify-center p-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass w-full max-w-sm rounded-2xl p-8 shadow-xl"
        >
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isMock
              ? 'Demo mode — any credentials work.'
              : mode === 'signup'
                ? 'Sign up to start generating blueprints.'
                : 'Sign in to continue to your workspace.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required={!isMock}
              />
            </div>
            {info && (
              <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                {info}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Please wait…
                </>
              ) : (
                <>
                  <Mail className="size-4" /> {mode === 'signup' ? 'Create account' : 'Continue with email'}
                </>
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> or <Separator className="flex-1" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={handleGitHub} type="button">
            <GitBranch className="size-4" /> Continue with GitHub
          </Button>
          {!isMock && (
            <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
              Each GitHub account gets its own Blueprint workspace. You will be asked which GitHub
              account to use — sign out of Blueprint first, or use a private window, to test as
              someone else.
            </p>
          )}
          <AuthDebugPanel />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'signup' ? 'signin' : 'signup'))
                setError(null)
                setInfo(null)
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {mode === 'signup' ? 'Sign in' : 'Create an account'} <ArrowRight className="size-3" />
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
