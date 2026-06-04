import { authCallbackUrl, getAppOrigin } from '@/lib/site'
import { SUPABASE_URL } from '@/lib/env'

/**
 * Dev-only checklist for GitHub OAuth. The #1 failure mode is Supabase Site URL
 * still set to http://localhost:3000 while the Vite app runs on :5173.
 */
export function AuthDebugPanel() {
  if (!import.meta.env.DEV) return null

  const origin = getAppOrigin()
  const callback = authCallbackUrl()
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'your-project-ref'

  return (
    <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left text-[11px] leading-relaxed text-amber-100/90">
      <p className="font-semibold text-amber-200">OAuth debug (dev only)</p>
      <p className="mt-1 text-muted-foreground">
        This app will send <code className="text-foreground">redirectTo={callback}</code> to Supabase.
        After GitHub, Supabase must redirect back to that URL — not Site URL.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
        <li>
          Supabase → Authentication → URL Configuration → <strong>Site URL</strong> ={' '}
          <code className="text-foreground">{origin || 'http://localhost:5173'}</code> (not :3000)
        </li>
        <li>
          <strong>Redirect URLs</strong> must include{' '}
          <code className="text-foreground">{callback}</code>
        </li>
        <li>
          GitHub OAuth callback ={' '}
          <code className="text-foreground">
            https://{projectRef}.supabase.co/auth/v1/callback
          </code>
        </li>
      </ul>
      <p className="mt-2 text-muted-foreground">
        Open DevTools → Console before clicking GitHub; look for{' '}
        <code className="text-foreground">[Blueprint:auth]</code> logs with the full OAuth URL.
      </p>
    </div>
  )
}
