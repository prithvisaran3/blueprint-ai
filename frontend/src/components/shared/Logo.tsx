import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showWordmark?: boolean
  size?: number
}

/** Blueprint AI logo mark + optional wordmark. */
export function Logo({ className, showWordmark = true, size = 32 }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className="grid place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-fuchsia-500/20 ring-1 ring-inset ring-white/10"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} fill="none" aria-hidden>
          <defs>
            <linearGradient id="logo-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7DD3FC" />
              <stop offset="0.5" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <path
            d="M8 23V9h6.5a4 4 0 0 1 0 8H8m0 0h7.5a4 4 0 0 1 0 6H8"
            stroke="url(#logo-g)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22.5" cy="11" r="2.2" fill="url(#logo-g)" />
          <circle cx="22.5" cy="21" r="2.2" fill="url(#logo-g)" />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight">
          Blueprint<span className="text-primary"> AI</span>
        </span>
      )}
    </div>
  )
}
