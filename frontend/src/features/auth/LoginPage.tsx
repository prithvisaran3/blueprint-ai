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

export function LoginPage() {
  const { login, signUp, loginWithGitHub, isMock } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(isMock ? 'alex@blueprint.ai' : '')
  const [password, setPassword] = useState(isMock ? 'demo' : '')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'signup' && !isMock) {
        await signUp(email, password)
      } else {
        await login(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGitHub() {
    setError(null)
    try {
      await loginWithGitHub()
      if (isMock) navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign-in failed')
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'signup' ? 'signin' : 'signup'))
                setError(null)
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
