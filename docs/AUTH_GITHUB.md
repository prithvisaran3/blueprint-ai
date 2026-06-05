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

## Duplicate email / linking error

If sign-in fails with:

```text
Multiple accounts with the same email address in the same linking domain detected: default
```

Supabase already has **more than one user** with your email (common after trying email/password and GitHub separately, or repeated OAuth attempts).

### Fix (Supabase Dashboard)

1. **Authentication → Users**
2. Search for your email — you will see **two (or more) users** with the same address.
3. **Delete** the extra account(s). Keep the one you want to use going forward (or delete all and sign in fresh with GitHub only).
4. On `/login`, click **Continue with GitHub** again.

### Prevent it

- Pick **one** sign-in method per email (GitHub **or** email/password), not both during testing.
- After wiping app data, also clear duplicate users in Supabase if you re-register with the same email.

This is a Supabase Auth data issue; URL Configuration (Site URL / Redirect URLs) does not fix it.

## Different users / different GitHub accounts

Blueprint already creates **one Supabase user per GitHub account**. Projects and data are scoped to that user’s `user_id`.

If **Continue with GitHub** always signs you in as the same person (e.g. `prithvisaran.s@gmail.com`) without asking:

1. **GitHub is reusing your browser session** — you stay logged into github.com as one user, so OAuth completes instantly.
2. The app opens GitHub in the **same tab**. Complete authorization there — do not copy the callback URL into another browser.
3. To test as another person: **Sign out** from Blueprint (top bar), then GitHub login again, or use an **incognito/private** window with a different GitHub login.
4. Do not use **demo/mock mode** (`VITE_USE_MOCKS=true`) for real multi-user tests — that always uses a fake demo user.

**Sign out** (Blueprint top bar) only clears this app’s session. Switching GitHub users still requires choosing a different account on GitHub’s screen (or signing out of github.com).

## PKCE code verifier missing

If the browser console shows:

```text
AuthPKCECodeVerifierMissingError: PKCE code verifier not found in storage
```

The OAuth round-trip lost the temporary PKCE secret (stale tab, cleared storage, or opening the callback in a different browser).

### Fix

1. Close other Blueprint tabs.
2. Go to `/login` and click **Continue with GitHub** again.
3. Finish GitHub authorization in the **same tab** — do not paste `/auth/callback?code=...` elsewhere.

The app stores the PKCE verifier in **localStorage** for this Vite SPA. Do not block storage for the site.

## Dashboard API / CORS errors

If the console shows `blocked by CORS policy` for `blueprint-ai-backend-*.onrender.com`:

1. Render → your backend service → **Environment** → set `CORS_ORIGINS` to a JSON array including your Vercel URL, e.g.:

   ```json
   ["https://blueprint-ai-rust.vercel.app","http://localhost:5173"]
   ```

2. Redeploy the backend (Render free tier may take ~30s to wake up on first request).

Without this, GitHub login can succeed but the dashboard cannot load projects/history from the API.
