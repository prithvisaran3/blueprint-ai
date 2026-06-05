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
            // Retry aggressively on network errors (Render free-tier cold start can take
            // up to ~90s). For all other errors (auth, 404, validation), don't retry.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.code === 'network_error') {
                return failureCount < 8 // up to 8 retries, spanning ~2 min
              }
              return false
            },
            // 2s, 4s, 8s, 12s, 12s, 12s … → ~90s+ of coverage through cold start
            retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 12_000),
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
