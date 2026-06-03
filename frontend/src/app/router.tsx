/* eslint-disable react-refresh/only-export-components -- route config module, not a Fast Refresh component file */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RouteErrorPage } from '@/app/RouteErrorPage'

// Code-split the heavier authenticated screens (Recharts, React Flow, Monaco).
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ProjectDetailPage = lazy(() =>
  import('@/features/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
)
const ExecutionPage = lazy(() =>
  import('@/features/execution/ExecutionPage').then((m) => ({ default: m.ExecutionPage })),
)
const WorkspacePage = lazy(() =>
  import('@/features/workspace/WorkspacePage').then((m) => ({ default: m.WorkspacePage })),
)

function RouteFallback() {
  return (
    <div className="grid h-[60vh] place-items-center">
      <div className="size-7 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/dashboard', element: <Lazy><DashboardPage /></Lazy> },
      { path: '/projects/:id', element: <Lazy><ProjectDetailPage /></Lazy> },
      { path: '/executions/:runId', element: <Lazy><ExecutionPage /></Lazy> },
      { path: '/workspace/:runId', element: <Lazy><WorkspacePage /></Lazy> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
