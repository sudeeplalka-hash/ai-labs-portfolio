# Deploy — AI Labs Portfolio

The product is a **single static-export Next.js app** (`apps/web`) composing every lab.
Everything runs client-side — no backend, no API keys — so it can sit on any static host.

**One codebase powers two deploys** via the build-time `NEXT_PUBLIC_SITE` flag
(see `apps/web/lib/site.ts`):

| Site | Domain | `NEXT_PUBLIC_SITE` |
|---|---|---|
| Portfolio (Competency Map landing) | portfolio.sudeeplalka.com | `portfolio` (or unset) |
| AI Program Command Center | ai-labs.sudeeplalka.com | `command-center` |

One `git push` redeploys both. For the primary step-by-step (fresh repo → Vercel →
subdomain), see [`GO-LIVE.md`](./GO-LIVE.md); this file covers the build and alternate hosts.

## Build output

```bash
pnpm install
pnpm turbo run build --filter=@labs/web     # → apps/web/out/  (static)
pnpm turbo run test                          # engine vitest suites
```

`apps/web/out/` is a fully static site (every route pre-rendered, incl. the dynamic
routes via `generateStaticParams`).

## Option A — Vercel (recommended)

`vercel.json` is configured. Two Vercel projects point at the same repo:
- Both: leave Root Directory at the repo root (the config handles the monorepo);
  installs with pnpm (from `packageManager`), builds `@labs/web` via Turbo, serves `apps/web/out`.
- Portfolio project: add domain **portfolio.sudeeplalka.com**; leave `NEXT_PUBLIC_SITE` unset.
- Command-center project: add domain **ai-labs.sudeeplalka.com**; set env `NEXT_PUBLIC_SITE=command-center`.

## Option B — Netlify

`netlify.toml` is configured (build → `apps/web/out`). Connect the repo, add the domain,
and set `NEXT_PUBLIC_SITE` per site as above.

## Option C — Cloudflare Pages / GitHub Pages / S3+CloudFront

Build locally or in CI, then publish `apps/web/out/`:
- Cloudflare Pages: build command `pnpm install && pnpm turbo run build --filter=@labs/web`, output `apps/web/out`.
- GitHub Pages / S3: upload `apps/web/out/` contents; point the subdomain via CNAME.

## Same-origin note

Everything lives under one origin per deploy (one app), so the shared `ProgramState`
(`localStorage`) flows across all stages automatically — no cross-zone setup needed.
