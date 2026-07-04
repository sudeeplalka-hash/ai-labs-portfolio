# GO-LIVE — publishing AI Labs Portfolio

Target: a **fresh public repo** `sudeeplalka-hash/ai-labs-portfolio` (clean history),
deployed on **Vercel**, live at **portfolio.sudeeplalka.com**.

Run these on **your** machine (PowerShell) — the sandbox can't push git or touch your
accounts. Commands assume the project is at `C:\Users\sudee\Claude\Projects\labs-platform`.

> Your existing `sudeeplalka-hash/labs-platform` repo is left **untouched** (frozen at its
> last Command-Center commit) as the archive. This process starts a new repo.

---

## Step 1 — Remove the dead files

These three are unused (confirmed: no importers; `apps/governance` is excluded from the
workspace). Removing them keeps the first commit clean:

```powershell
cd C:\Users\sudee\Claude\Projects\labs-platform
Remove-Item -Force apps\web\components\map\LabArt.tsx
Remove-Item -Force packages\design-system\src\styles\warm.css
Remove-Item -Recurse -Force apps\governance
```

## Step 2 — Verify the build (the gate)

Do **not** publish until both of these pass clean:

```powershell
corepack enable
pnpm install
pnpm typecheck
pnpm build
```

`pnpm build` should produce `apps/web/out/`. If typecheck or build errors, stop and fix
first — a broken build will fail on Vercel too.

## Step 3 — Create the empty GitHub repo

In the browser: **https://github.com/new**

- **Owner:** `sudeeplalka-hash`
- **Repository name:** `ai-labs-portfolio`
- **Visibility:** Public (so it can be shared with employers)
- **Do NOT** add a README, .gitignore, or license — this repo already has its own
- Click **Create repository**, then leave the page open

## Step 4 — Push with clean history

This drops the old git history and starts fresh, then pushes to the new repo:

```powershell
cd C:\Users\sudee\Claude\Projects\labs-platform
Remove-Item -Recurse -Force .git
git init
git branch -M main
git add -A
git commit -m "AI Labs Portfolio — initial public release"
git remote add origin https://github.com/sudeeplalka-hash/ai-labs-portfolio.git
git push -u origin main
```

Refresh the GitHub page — all files should now be there, one clean commit.

## Step 5 — Import into Vercel

In the browser: **https://vercel.com/new**

1. **Import Git Repository** → pick `sudeeplalka-hash/ai-labs-portfolio`
   (authorize Vercel for GitHub on first use; grant access to this repo).
2. Vercel auto-reads `vercel.json`, so the settings are already correct:
   - Framework Preset: **Other**
   - Root Directory: **`./`** (repo root — the config handles the monorepo)
   - Install: `pnpm install` · Build: `pnpm turbo run build --filter=@labs/web` · Output: `apps/web/out`
   - No environment variables needed (the demo is fully client-side).
3. Click **Deploy**. First build is ~2–4 minutes and lands on a `*.vercel.app` URL —
   open it to confirm the Competency Map loads.

## Step 6 — Add the subdomain

In the Vercel project: **Settings → Domains → Add**

- Enter `portfolio.sudeeplalka.com` → **Add**
- Vercel shows the DNS record to create — typically a **CNAME**:
  - **Name / Host:** `portfolio`
  - **Value / Target:** `cname.vercel-dns.com` *(use the exact value Vercel displays)*
- Leave this page open; it will flip to **Valid Configuration** once DNS resolves.

## Step 7 — Create the DNS record

At whoever hosts DNS for **sudeeplalka.com** (your registrar / Cloudflare / etc.):

- Add a **CNAME** record:
  - **Host / Name:** `portfolio`
  - **Target / Value:** `cname.vercel-dns.com` *(exactly what Vercel gave in Step 6)*
  - **TTL:** default/auto
  - If on Cloudflare, set the record to **DNS only** (grey cloud), not proxied, so
    Vercel can issue the certificate.
- Save.

## Step 8 — Confirm

- Back on Vercel's **Domains** page: wait for **Valid Configuration** ✓ (usually minutes,
  up to ~an hour). Vercel auto-provisions the HTTPS certificate.
- Visit **https://portfolio.sudeeplalka.com** — the Competency Map should load over HTTPS.

Done. Because `vercel.json` has `git.deploymentEnabled.main = true`, every future
`git push` to `main` auto-deploys.

---

### Notes

- **Cleaner handle later?** The repo URL will read `github.com/sudeeplalka-hash/…`. If you
  want a tidier handle for employers, you can rename the GitHub account or transfer the
  repo later without breaking Vercel (reconnect the repo in Vercel after a transfer).
- **`.env.example`** is now tracked (the `.gitignore` keeps `.env*` out but makes an
  exception for the example) — no secrets are committed.
