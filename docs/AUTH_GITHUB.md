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

### 3. Redirect URLs

**Authentication** → **URL Configuration** → **Redirect URLs**, add:

```
http://localhost:5173/auth/callback
https://blueprint-ai-rust.vercel.app/auth/callback
```

(Use your real Vercel domain if different.)

**Site URL** can be `http://localhost:5173` for local dev.

### 4. Retry

Sign out, then **Continue with GitHub** on `/login`. You should land on `/auth/callback`, then `/dashboard`.
