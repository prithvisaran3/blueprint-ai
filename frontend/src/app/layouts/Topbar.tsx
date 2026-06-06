import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Plus, Search, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth, useTheme } from '@/app/providers'

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = (() => {
    const source = user?.displayName?.trim() || user?.email?.trim()
    if (!source) return 'U'
    const parts = source.split(/\s+/).filter(Boolean)
    const letters = (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)) || 'U'
    return letters.toUpperCase()
  })()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search projects, runs…" className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button onClick={() => navigate('/')} className="hidden sm:inline-flex">
          <Plus className="size-4" /> New Blueprint
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring/60">
              <Avatar>
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName ?? 'User'} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">{user?.displayName ?? 'Guest'}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? 'not signed in'}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout().finally(() => navigate('/login', { replace: true }))
              }}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
