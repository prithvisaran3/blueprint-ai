import { useEffect } from 'react'
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { debugError } from '@/lib/debug'

export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    debugError('router', 'Route error boundary caught', error)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
  }, [error])

  const message = isRouteErrorResponse(error)
    ? error.statusText || error.data?.message
    : error instanceof Error
      ? error.message
      : 'Unexpected error'

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="glass max-w-md rounded-xl p-8 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
