import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderKanban, Activity, Sparkles, Settings } from 'lucide-react'
import { Logo } from '@/components/shared'
import { cn } from '@/lib/utils'
import { PRIMARY_PROJECT_ID, PRIMARY_RUN_ID } from '@/lib/mock/data'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: `/projects/${PRIMARY_PROJECT_ID}`, label: 'Projects', icon: FolderKanban },
  { to: `/executions/${PRIMARY_RUN_ID}`, label: 'Executions', icon: Activity },
  { to: `/workspace/${PRIMARY_RUN_ID}`, label: 'Workspace', icon: Sparkles },
]

export function Sidebar() {
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
            42 of 100 generations used this month.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[42%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </aside>
  )
}
