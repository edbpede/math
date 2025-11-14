# Vercel Migration Guide

Complete guide for migrating from GitHub Pages to Vercel.

---

## Overview

This guide walks you through migrating the Matematik Øvelses Portal from GitHub Pages to Vercel for production and preview deployments.

**What's Changing:**
- **Before:** GitHub Actions → GitHub Pages (production) + Netlify (previews)
- **After:** Vercel handles everything (production + previews)
- **CI:** GitHub Actions continues to run tests/type checking

**Benefits:**
- Single platform for all deployments
- Automatic preview URLs for every branch/PR
- Better global performance (Edge Network)
- Simplified deployment management
- Future SSR support ready

---

## Migration Steps

### Step 1: Import Repository to Vercel

1. **Sign in to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Repository:**
   - Click "Add New..." → "Project"
   - Select the `edbpede/math` repository
   - Click "Import"

3. **Configure Project Settings:**

   Vercel should auto-detect the following from your `vercel.json`:

   ```
   Framework Preset: Astro
   Root Directory: ./
   Build Command: bun run build
   Output Directory: dist
   Install Command: bun install
   ```

   **✅ Leave all settings as detected** (your `vercel.json` already configures everything)

4. **Add Environment Variables:**

   In the "Environment Variables" section, add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` | All |
   | `PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key-here` | All |

   > **Note:** Get these values from your Supabase project settings or existing `.env` file

   Select "Production", "Preview", and "Development" for both variables.

5. **Deploy:**
   - Click "Deploy"
   - Wait ~2-3 minutes for the build to complete
   - You'll get a preview URL: `https://math-{random}.vercel.app`

6. **Verify Deployment:**
   - Visit the preview URL
   - Test the PWA functionality
   - Verify Supabase connection works
   - Check that the service worker loads correctly

---

### Step 2: Configure Custom Domain

1. **Add Domain in Vercel:**
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter: `math.edbpede.net`
   - Click "Add"

2. **Update DNS Records:**

   **Current DNS (GitHub Pages):**
   ```
   TYPE: CNAME
   NAME: math.edbpede.net
   CONTENT: edbpede.github.io
   ```

   **New DNS (Vercel):**

   Vercel will provide one of these configurations:

   **Option A - CNAME (Recommended):**
   ```
   TYPE: CNAME
   NAME: math.edbpede.net
   CONTENT: cname.vercel-dns.com
   ```

   **Option B - A Records:**
   ```
   TYPE: A
   NAME: math.edbpede.net
   CONTENT: 76.76.21.21
   ```

   > **Important:** Use the **exact DNS configuration** shown in your Vercel dashboard

3. **Make DNS Changes:**
   - Log in to your DNS provider (wherever `edbpede.net` is registered)
   - Delete the old CNAME record pointing to `edbpede.github.io`
   - Add the new record(s) from Vercel
   - Save changes

4. **Wait for DNS Propagation:**
   - DNS changes can take 5 minutes to 48 hours
   - Vercel will automatically verify when propagation completes
   - Check status in Vercel dashboard: Domains → `math.edbpede.net`

5. **SSL Certificate:**
   - Vercel automatically provisions SSL (Let's Encrypt)
   - This happens within minutes of DNS verification
   - Your site will be accessible at `https://math.edbpede.net`

---

### Step 3: Configure Automatic Deployments

Vercel is now configured to deploy automatically:

**Production Deployments:**
- Trigger: Push to `main` branch
- URL: `https://math.edbpede.net`
- Automatic after GitHub Actions CI passes

**Preview Deployments:**
- Trigger: Any push to any branch
- Trigger: Every commit on a pull request
- URL: `https://math-git-{branch}-{project}.vercel.app`
- Unique URL per PR: `https://math-{pr-number}-{project}.vercel.app`

**CI Integration:**
- GitHub Actions continues to run tests
- Vercel deploys regardless of CI status
- Recommended: Configure Vercel to wait for CI (see Step 4)

---

### Step 4: Optional - CI Integration

To prevent Vercel from deploying if tests fail:

1. **Go to Project Settings:**
   - Vercel Dashboard → Project → Settings
   - Navigate to "Git" section

2. **Configure Ignored Build Step:**
   - Find "Ignored Build Step" setting
   - Enable "Cancel deployment if checks fail"
   - OR add a custom script:

   ```bash
   # Only deploy if CI passed
   if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
     curl -s "https://api.github.com/repos/edbpede/math/commits/$VERCEL_GIT_COMMIT_SHA/check-runs" | \
       jq -e '.check_runs | map(select(.name == "Test & Type Check")) | .[].conclusion == "success"'
   else
     exit 1 # Always build for branches/PRs
   fi
   ```

3. **GitHub Integration:**
   - Install Vercel GitHub App (if not already installed)
   - Grant access to `edbpede/math` repository
   - Vercel will now comment on PRs with preview URLs

---

### Step 5: Clean Up GitHub Pages

Once Vercel is working and DNS has migrated:

1. **Disable GitHub Pages:**
   - Go to GitHub repository → Settings → Pages
   - Under "Source", select "None"
   - Click "Save"

2. **Optional - Delete `gh-pages` Branch:**
   ```bash
   git push origin --delete gh-pages
   ```

3. **Remove Netlify Secrets (if desired):**
   - GitHub repository → Settings → Secrets and variables → Actions
   - Delete: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

   > **Note:** Netlify secrets are already unused in the updated workflow

4. **Verify GitHub Actions:**
   - The updated workflow (`.github/workflows/deploy.yml`) now only runs CI
   - It validates tests, type checking, and builds
   - No deployment steps remain

---

### Step 6: Verify Everything Works

**Checklist:**

- [ ] Production site accessible at `https://math.edbpede.net`
- [ ] SSL certificate working (green padlock in browser)
- [ ] PWA install prompt works
- [ ] Service worker registers correctly
- [ ] Offline mode works (try Chrome DevTools → Network → Offline)
- [ ] Supabase connection works (test UUID login)
- [ ] Create a test PR and verify preview deployment
- [ ] Verify preview URL is posted as PR comment
- [ ] Check that GitHub Actions CI runs on PRs
- [ ] Test rollback feature in Vercel dashboard

---

## Deployment Architecture (After Migration)

```
┌─────────────────────────────────────────────────────────────┐
│                     Developer Workflow                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    Push to GitHub
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
         GitHub Actions            Vercel Deploy
         (CI Only)                 (Automatic)
                │                       │
                ▼                       │
         • Run Tests                    │
         • Type Check                   │
         • Build Validation             │
                │                       │
                └───────────┬───────────┘
                            ▼
                    ┌───────────────┐
                    │ Production    │──→ https://math.edbpede.net
                    │ (main branch) │
                    └───────────────┘
                            │
                    ┌───────┴────────┐
                    │ Previews       │──→ https://math-pr-N-{project}.vercel.app
                    │ (all branches) │
                    └────────────────┘
```

---

## Configuration Files

Your project already includes optimized configuration for Vercel:

### `vercel.json`
Already configured with:
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Caching strategies (31536000s for assets, 0s for SW)
- ✅ Service Worker support
- ✅ Function runtime settings (ready for future SSR)

### `astro.config.mjs`
Currently set to:
- ✅ `output: 'static'` - Works perfectly with Vercel
- ✅ Code splitting configured
- ✅ Build optimizations enabled

### `.github/workflows/deploy.yml`
Updated to:
- ✅ CI-only workflow (tests, type check, build validation)
- ✅ No deployment steps
- ✅ Runs on all branches and PRs

---

## Environment Variables Reference

Required environment variables in Vercel:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to Update:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Edit the variable
3. Select which environments to update (Production/Preview/Development)
4. Redeploy for changes to take effect

---

## Common Tasks

### Trigger a Manual Deployment
1. Go to Vercel Dashboard → Deployments
2. Click "..." on any deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache" or force rebuild

### Rollback a Deployment
1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

### View Deployment Logs
1. Go to Vercel Dashboard → Deployments
2. Click on a deployment
3. View real-time build logs and runtime logs

### Delete Preview Deployments
- Previews are automatically cleaned up after 30 days
- Manual cleanup: Deployments → "..." → "Delete"

---

## Future: Migrating to SSR

When ready to enable server-side rendering:

1. **Install Vercel Adapter:**
   ```bash
   bun add @astrojs/vercel
   ```

2. **Update `astro.config.mjs`:**
   ```javascript
   import vercel from '@astrojs/vercel/serverless'

   export default defineConfig({
     output: 'server', // or 'hybrid'
     adapter: vercel(),
     // ... rest of config
   })
   ```

3. **Redeploy:**
   - Commit changes
   - Push to GitHub
   - Vercel automatically detects SSR mode
   - API routes in `src/pages/api/` will now work

4. **Benefits of SSR:**
   - Server-side session validation
   - Secure API routes with httpOnly cookies
   - Server-side rate limiting
   - Dynamic content generation

---

## Troubleshooting

### Build Fails in Vercel

**Check:**
1. Environment variables are set correctly
2. Build works locally: `bun run build`
3. View build logs in Vercel dashboard
4. Common issues:
   - Missing environment variables
   - Bun lock file conflicts (delete and regenerate)

**Solution:**
```bash
# Test build locally first
bun install --frozen-lockfile
bun run build

# If successful, commit and push
git add .
git commit -m "fix: resolve build issues"
git push
```

### DNS Not Propagating

**Check:**
1. Correct DNS records in your DNS provider
2. TTL settings (lower TTL speeds up propagation)
3. Use DNS checker: `dig math.edbpede.net` or [dnschecker.org](https://dnschecker.org)

**Timeline:**
- Fastest: 5-10 minutes
- Average: 1-4 hours
- Maximum: 48 hours (rare)

### Preview Deployments Not Working

**Check:**
1. Vercel GitHub App is installed
2. Repository permissions are correct
3. Branch protection rules aren't blocking

**Solution:**
- Vercel Dashboard → Settings → Git → Reinstall GitHub App

### Service Worker Issues

**Check:**
1. Service worker cache headers are correct (in `vercel.json`)
2. Clear browser cache: DevTools → Application → Clear storage
3. Check: DevTools → Application → Service Workers

**Force Update:**
```bash
# Unregister service worker
bun run sw:clear

# Or manually in DevTools console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})
```

---

## Support & Resources

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Astro on Vercel:** [docs.astro.build/en/guides/deploy/vercel](https://docs.astro.build/en/guides/deploy/vercel/)
- **Vercel Status:** [vercel-status.com](https://vercel-status.com)
- **Project Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)

---

## Migration Checklist

Use this checklist to track your progress:

- [ ] **Step 1:** Import repository to Vercel
- [ ] **Step 1:** Add environment variables
- [ ] **Step 1:** Verify initial deployment works
- [ ] **Step 2:** Add custom domain in Vercel
- [ ] **Step 2:** Update DNS records
- [ ] **Step 2:** Verify DNS propagation
- [ ] **Step 2:** Confirm SSL certificate issued
- [ ] **Step 3:** Test automatic deployments (push to branch)
- [ ] **Step 3:** Test PR preview deployments
- [ ] **Step 4:** Configure CI integration (optional)
- [ ] **Step 5:** Disable GitHub Pages
- [ ] **Step 5:** Delete `gh-pages` branch (optional)
- [ ] **Step 5:** Clean up Netlify secrets (optional)
- [ ] **Step 6:** Run full verification checklist
- [ ] **Step 6:** Test rollback functionality
- [ ] **Done:** Migration complete!

---

**Last Updated:** 2025-11-14
**Vercel Configuration:** Optimized for Astro Static Site
