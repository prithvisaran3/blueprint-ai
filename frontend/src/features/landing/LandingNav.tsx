import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared'

export function LandingNav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-2xl glass px-4 py-2.5">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pipeline" className="transition-colors hover:text-foreground">
            Pipeline
          </a>
          <Link to="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitBranch className="size-4.5" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
