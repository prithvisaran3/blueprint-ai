import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { useGenerate } from '@/hooks/queries'
import { ApiError } from '@/lib/api/client'
import { debugError, debugLog } from '@/lib/debug'
import { LandingNav } from './LandingNav'
import { Hero } from './Hero'
import { FeatureGrid } from './FeatureGrid'
import { ArchitectureShowcase } from './ArchitectureShowcase'
import { CTA } from './CTA'

export function LandingPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isMock } = useAuth()
  const generateMutation = useGenerate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slowStart, setSlowStart] = useState(false)

  useEffect(() => {
    if (!submitting) {
      setSlowStart(false)
      return
    }
    const timer = window.setTimeout(() => setSlowStart(true), 4000)
    return () => window.clearTimeout(timer)
  }, [submitting])

  async function startRun(idea?: string) {
    setError(null)

    // Require auth before generating. In mock mode we can sign in silently.
    if (!isAuthenticated) {
      if (isMock) {
        await login()
      } else {
        navigate('/login', { state: { from: '/', idea } })
        return
      }
    }
    // A real backend needs an idea prompt; a bare CTA click just opens the app.
    if (!idea && !isMock) {
      navigate('/dashboard')
      return
    }

    setSubmitting(true)
    debugLog('generate', 'Starting blueprint generation', { idea, isAuthenticated, isMock })

    try {
      const { runId } = await generateMutation.mutateAsync({ ideaPrompt: idea })
      debugLog('generate', 'Generation queued', { runId })
      navigate(`/executions/${runId}`, { state: { prompt: idea, autostart: true } })
    } catch (err) {
      debugError('generate', 'Generation failed', err)

      let message = 'Could not start generation. Open DevTools (F12) → Console for details.'
      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = 'Session expired — please sign in again and retry.'
        } else if (err.status === 0) {
          message =
            'Cannot reach the backend. If this is your first request today, the free Render server may need ~60s to wake up — wait and try again.'
        } else {
          message = err.message
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <LandingNav />
      {error && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="pointer-events-auto glass max-w-lg rounded-xl border border-destructive/40 px-4 py-3 text-sm text-destructive shadow-lg">
            {error}
          </div>
        </div>
      )}
      <Hero
        onGenerate={(idea) => startRun(idea)}
        submitting={submitting}
        statusHint={
          slowStart
            ? 'Waking backend — first request on the free tier can take up to 60 seconds…'
            : undefined
        }
      />
      <FeatureGrid />
      <div id="pipeline">
        <ArchitectureShowcase />
      </div>
      <CTA onStart={() => startRun()} />
    </div>
  )
}
