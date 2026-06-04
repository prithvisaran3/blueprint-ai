/**
 * Dev-friendly logging — the web equivalent of Flutter's `debugPrint`.
 *
 * - Frontend logs appear in the **browser DevTools Console** (F12 → Console).
 * - Set `VITE_DEBUG=true` in `.env.local` to keep logs in production builds.
 */
const enabled = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true'

export function debugLog(scope: string, message: string, data?: unknown): void {
  if (!enabled) return
  const tag = `[Blueprint:${scope}]`
  if (data !== undefined) console.log(tag, message, data)
  else console.log(tag, message)
}

export function debugWarn(scope: string, message: string, data?: unknown): void {
  if (!enabled) return
  const tag = `[Blueprint:${scope}]`
  if (data !== undefined) console.warn(tag, message, data)
  else console.warn(tag, message)
}

export function debugError(scope: string, message: string, error?: unknown): void {
  // Always surface hard failures — even in production — so RouteErrorPage /
  // mutation failures are traceable from DevTools.
  const tag = `[Blueprint:${scope}]`
  if (error !== undefined) console.error(tag, message, error)
  else console.error(tag, message)
}

/** Install global handlers once at app boot (see main.tsx). */
export function installDebugHandlers(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('unhandledrejection', (event) => {
    debugError('global', 'Unhandled promise rejection', event.reason)
  })

  window.addEventListener('error', (event) => {
    debugError('global', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
  })
}
