import { useEffect } from 'react'
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { debugError } from '@/lib/debug'

export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    debugError('router', 'Route error boundary caught', error)
    // Always log the full stack to the console, even in production.
    // With hidden source maps the browser DevTools will show original file + line.
    if (error instanceof Error) {
      console.error('[RouteErrorPage]', error.message)
      if (error.stack) console.error(error.stack)
    } else {
      console.error('[RouteErrorPage] non-Error thrown:', error)
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
        <p className="mt-1 text-xs text-muted-foreground/60">
          Open browser DevTools → Console for the full error trace.
        </p>
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
