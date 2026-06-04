# Debug GitHub sign-in (localhost:3000 redirect)

## Symptom

After clicking **Continue with GitHub** and approving on GitHub, the browser opens:

`http://localhost:3000` → **ERR_CONNECTION_REFUSED**

Nothing listens on port **3000**. The Vite dev server runs on **5173**.

## Root cause

**Supabase Dashboard → Authentication → URL Configuration → Site URL** is set to `http://localhost:3000`.

After OAuth, Supabase redirects to **Site URL** unless your `redirectTo` URL is on the allow list and matches.

## Fix (required — in Supabase, not in code)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **iqwrslgwvubkoudcrynq** → **Authentication** → **URL Configuration**

2. Set **Site URL** to where you are actually testing:

   | Where you test | Site URL |
   |----------------|----------|
   | Local dev | `http://localhost:5173` |
   | Production (Vercel) | `https://blueprint-ai-rust.vercel.app` |

   Remove `http://localhost:3000` entirely.

3. Under **Redirect URLs**, add **both** (one per line):

   ```
   http://localhost:5173/auth/callback
   https://blueprint-ai-rust.vercel.app/auth/callback
   ```

4. **Save**.

5. **Authentication → Providers → GitHub** — Client ID must be a GitHub OAuth App ID (`Ov23…`), not your email. See [AUTH_GITHUB.md](./AUTH_GITHUB.md).

## Debug locally

```bash
# Terminal 1 — backend (optional if using Render API)
cd backend && source .venv/bin/activate
AUTH_DEV_BYPASS=true uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

1. Open **http://localhost:5173/login** (not :3000).
2. Open **DevTools → Console** (F12).
3. Click **Continue with GitHub**.
4. Look for logs:
   - `[Blueprint:auth] GitHub OAuth starting` with `redirectTo: "http://localhost:5173/auth/callback"`
   - `[Blueprint:auth] Navigating to OAuth provider` with the full URL — check `redirect_to` in the query string.
5. After GitHub, you should land on **http://localhost:5173/auth/callback**, then `/dashboard`.

`frontend/.env` should include:

```
VITE_SITE_URL=http://localhost:5173
```

## Duplicate email error (not a redirect issue)

```text
Multiple accounts with the same email address in the same linking domain detected: default
```

**Cause:** Two `auth.users` rows share the same email (e.g. signed up with password, then GitHub).

**Fix:** Supabase → **Authentication → Users** → delete duplicate(s) → sign in with GitHub again.

See [AUTH_GITHUB.md](./AUTH_GITHUB.md#duplicate-email--linking-error).

## Deploy to Vercel (after local works)

1. Vercel → Environment Variables → `VITE_SITE_URL` = `https://blueprint-ai-rust.vercel.app`
2. Supabase Site URL = same production URL
3. Push to GitHub and redeploy
