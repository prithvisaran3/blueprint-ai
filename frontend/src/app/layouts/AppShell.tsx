import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PageTransition } from '@/components/shared'

/** Authenticated app layout: sidebar + topbar with animated page content. */
export function AppShell() {
  const location = useLocation()
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
