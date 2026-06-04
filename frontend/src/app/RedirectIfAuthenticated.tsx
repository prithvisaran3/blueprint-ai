import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/app/providers'

/**
 * For public routes (/login): skip the form when a cookie session already exists.
 */
export function RedirectIfAuthenticated({
  children,
  to = '/dashboard',
}: {
  children: ReactNode
  to?: string
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from ?? to

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
