# Deploy — AI Labs Portfolio

The product is a **single static-export Next.js app** (`apps/web`) composing every lab,
plus an **optional** FastAPI service (`services/governance-api`). The live demo runs
entirely client-side — no backend required — so it can sit on any static host.

Target: **portfolio.sudeeplalka.com**. For the primary step-by-step (fresh repo → Vercel →
subdomain), see [`GO-LIVE.md`](./GO-LIVE.md); this file covers alternate hosts.

## Build output

```bash
pnpm install
pnpm turbo run build --filter=@labs/web     # → apps/web/out/  (static)
pnpm turbo run test                          # engine vitest suites
```

`apps/web/out/` is a fully static site (every route pre-rendered, incl. the dynamic
`/govern/use-cases/[id]` via `generateStaticParams`).

## Option A — Vercel (recommended)

`vercel.json` is configured. In the Vercel project:
- Connect the repo; leave Root Directory at the repo root (the config handles the monorepo).
- It installs with pnpm (from `packageManager`), builds `@labs/web` via Turbo, serves `apps/web/out`.
- Add the custom domain **portfolio.sudeeplalka.com** in Project → Settings → Domains.

## Option B — Netlify

`netlify.toml` is configured (build → `apps/web/out`). Connect the repo, add the domain.

## Option C — Cloudflare Pages / GitHub Pages / S3+CloudFront

Build locally or in CI, then publish `apps/web/out/`:
- Cloudflare Pages: build command `pnpm install && pnpm turbo run build --filter=@labs/web`, output `apps/web/out`.
- GitHub Pages / S3: upload `apps/web/out/` contents; point the subdomain via CNAME.

## Environment

Copy `apps/web/.env.example`. Default `NEXT_PUBLIC_STATIC_DEMO=1` (client-side governance).
To use the real backend, set `NEXT_PUBLIC_STATIC_DEMO=0` and `NEXT_PUBLIC_API_URL` to the
deployed service.

## Optional — governance FastAPI service

Not needed for the demo. To run/host it:

```bash
cd services/governance-api
pip install -r requirements.txt
python -m app.core.seed        # seed the local SQLite demo data
uvicorn app.main:app --reload  # http://localhost:8000
```

Host it (Render/Fly/Railway/Docker — see `services/governance-api/Dockerfile`), then
point `NEXT_PUBLIC_API_URL` at it and set `NEXT_PUBLIC_STATIC_DEMO=0`.

## Same-origin note

Everything lives under one origin (one app), so the shared `ProgramState`
(`localStorage`) flows across all stages automatically — no cross-zone setup needed.
