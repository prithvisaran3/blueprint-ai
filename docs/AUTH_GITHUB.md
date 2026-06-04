# GitHub sign-in (Supabase Auth)

If GitHub login shows a **404** and the URL contains `client_id=your.email@...`, the
GitHub provider in Supabase is misconfigured — the **Client ID** field has your email
instead of a GitHub OAuth App ID.

## Fix (one-time)

### 1. Create a GitHub OAuth App

1. Open [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. **New OAuth App**
3. **Application name:** Blueprint AI (or any name)
4. **Homepage URL:** `http://localhost:5173` (and add your Vercel URL for production)
5. **Authorization callback URL** (exactly):

   ```
   https://iqwrslgwvubkoudcrynq.supabase.co/auth/v1/callback
   ```

   Replace `iqwrslgwvubkoudcrynq` with your Supabase project ref if different.

6. Create the app and copy the **Client ID** (e.g. `Ov23liXXXXXXXX`) and generate a **Client secret**.

### 2. Configure Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers** → **GitHub**
2. Enable GitHub
3. Paste **Client ID** and **Client secret** from step 1 (not your email)
4. Save

### 3. URL Configuration (fixes localhost:3000 redirect)

**Authentication** → **URL Configuration**:

| Field | Value |
|--------|--------|
| **Site URL** | `https://blueprint-ai-rust.vercel.app` (your production Vercel URL — **not** `http://localhost:3000`) |
| **Redirect URLs** | Add every origin you use (one per line): |

```
http://localhost:5173/auth/callback
https://blueprint-ai-rust.vercel.app/auth/callback
```

If **Site URL** is `localhost:3000`, GitHub will send you there after authorize and the page will not load.

**Vercel env (recommended):** set `VITE_SITE_URL=https://blueprint-ai-rust.vercel.app` so OAuth always uses the production origin.

For local dev only, you can temporarily set Site URL to `http://localhost:5173`.

### 4. Retry

Sign out, then **Continue with GitHub** on `/login`. You should land on `/auth/callback`, then `/dashboard`.
