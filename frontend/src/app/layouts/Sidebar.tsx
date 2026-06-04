import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderKanban, Activity, Sparkles, Settings } from 'lucide-react'
import { Logo } from '@/components/shared'
import { useProjects, useRuns } from '@/hooks/queries'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { data: projects } = useProjects()
  const { data: runs } = useRuns()

  const latestRunId = runs?.[0]?.id
  const executionsTo = latestRunId ? `/executions/${latestRunId}` : '/dashboard'
  const workspaceTo = latestRunId ? `/workspace/${latestRunId}` : '/dashboard'

  const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: executionsTo, label: 'Executions', icon: Activity },
    { to: workspaceTo, label: 'Workspace', icon: Sparkles },
  ]

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/30 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-5">
        <NavLink to="/">
          <Logo />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {NAV.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-primary/12 ring-1 ring-inset ring-primary/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className={cn('relative size-4.5', isActive && 'text-primary')} />
                <span className="relative">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
          <Settings className="size-4.5" />
          <span>Settings</span>
        </div>
        <div className="mt-3 rounded-xl bg-gradient-to-br from-primary/15 to-fuchsia-500/10 p-3 ring-1 ring-inset ring-primary/15">
          <p className="text-xs font-medium text-foreground">Free tier</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {projects?.length ?? 0} project{(projects?.length ?? 0) === 1 ? '' : 's'} · {runs?.length ?? 0} run
            {(runs?.length ?? 0) === 1 ? '' : 's'}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, ((runs?.length ?? 0) / 100) * 100) || 0}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
