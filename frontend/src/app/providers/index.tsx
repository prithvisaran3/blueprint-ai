import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'

/** Composes all top-level app providers in the correct order. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { useTheme } from './ThemeProvider'
// eslint-disable-next-line react-refresh/only-export-components
export { useAuth } from './AuthProvider'
