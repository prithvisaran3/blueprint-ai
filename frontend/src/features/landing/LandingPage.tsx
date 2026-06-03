import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { useGenerate } from '@/hooks/queries'
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

  async function startRun(idea?: string) {
    // Require auth before generating. In mock mode we can sign in silently.
    if (!isAuthenticated) {
      if (isMock) {
        await login()
      } else {
        navigate('/login', { state: { from: '/dashboard' } })
        return
      }
    }
    // A real backend needs an idea prompt; a bare CTA click just opens the app.
    if (!idea && !isMock) {
      navigate('/dashboard')
      return
    }

    setSubmitting(true)
    try {
      const { runId } = await generateMutation.mutateAsync({ ideaPrompt: idea })
      navigate(`/executions/${runId}`, { state: { prompt: idea, autostart: true } })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <LandingNav />
      <Hero onGenerate={(idea) => startRun(idea)} submitting={submitting} />
      <FeatureGrid />
      <div id="pipeline">
        <ArchitectureShowcase />
      </div>
      <CTA onStart={() => startRun()} />
    </div>
  )
}
