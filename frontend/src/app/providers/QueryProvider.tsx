import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'

/** TanStack Query provider — holds the (mock) server cache. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Retry aggressively on network errors (Render free-tier cold start takes ~60s).
            // For all other errors (auth, 404, validation), don't waste time retrying.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.code === 'network_error') {
                return failureCount < 4 // up to 4 retries (~40–50s total)
              }
              return false
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000), // 2s, 4s, 8s, 15s
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
