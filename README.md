# AI Labs Portfolio

**One operator at four altitudes: the agent-protocol wire, the enterprise AI program lifecycle, the P&L, and the people.**

Live → **[portfolio.sudeeplalka.com](https://portfolio.sudeeplalka.com)**
Built by **Sudeep Lalka** — AI delivery leadership (Engagement Manager, TPM).

[![CI](https://github.com/sudeeplalka-hash/ai-labs-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/sudeeplalka-hash/ai-labs-portfolio/actions/workflows/ci.yml) — the decision engines (`@labs/engines`) and the honesty system (`@labs/kit`) are unit-tested on every push.

This is an interactive portfolio, not a slide deck. It's a single static web app: a
Layer 0 **Competency Map** landing (a gallery of every capability) that opens into 23
hands-on labs across four collections. Every lab runs entirely in the browser — you can
move the sliders, run the scenarios, and read exactly how each one is built and where it
stops.

> **Honesty first.** Nothing here fakes a live model call or streams a cached run as if
> it were real. Each lab carries a truthful `SIMULATED` / `LIVE` badge, a freshness
> stamp, a "how this is built" disclosure, and a limitations note. Sample data is
> synthetic and scrubbed of any client-identifying detail; employer names referenced are
> public résumé facts.

## The four altitudes

| # | Collection | Altitude | What it proves |
|---|------------|----------|----------------|
| 1 | **Enterprise AI Lifecycle** (keystone) | The program lifecycle | Six contract-driven stages — Strategy → Data → Build/RAG → Operate → Govern → Realize — each emitting a structured contract the next one consumes. How an AI initiative goes from a vague idea to governed, measurable value. |
| 2 | **Agent & Protocol Lab** | The protocol wire | MCP, A2A-style orchestration, tool-use & structured output, agent loops & failure modes, context/memory engineering, human-in-the-loop approvals, protocol selection. The wire-level mechanics of agentic systems. |
| 3 | **AI Business & Portfolio** | The P&L | Initiative portfolio dashboard, build-vs-buy-vs-fine-tune, inference-cost forecasting, vendor evaluation & risk, ROI / business-case modeling. The economics of AI delivery. |
| 4 | **Engagement Leadership** | The people | Adoption & change readiness, stakeholder & sponsor alignment, capacity & resourcing, RAID & delivery health, compliance readiness, upskilling pathways, RFP war room, estimation, onboarding/KT, executive communication. The reality of running programs and teams. |

Collections 2–4 hold the **23 catalog labs**; Collection 1 is the keystone lifecycle
(the enterprise "command center") that anchors the whole story.

## Architecture

A **pnpm workspaces + Turborepo monorepo**. One Next.js app (`apps/web`, static export)
composes every lab. Two shared packages keep the labs consistent and honest — no lab
copies another's code:

- **`@labs/design-system`** — design tokens, Tailwind preset, and the shared UI
  primitives every lab is built from (`Panel`, `Badge`, `KpiCard`, `InsightCard`,
  `LiveBadge`, `FreshnessStamp`, `TrendIndicator`).
- **`@labs/kit`** — the data spine: the model catalog + pricing, protocol statistics,
  freshness metadata, and the **labs registry**. The registry is the single source of
  truth that *generates* the Competency Map — add a lab there and it appears in the
  gallery, wired to its route, status, and résumé echo.

Collection 1 additionally uses `@labs/program-core` (the deterministic engine spine) and
a set of `@labs/lab-*` packages. Everything runs client-side — there is no backend
service anywhere in the stack.

```
ai-labs-portfolio/
├── apps/
│   └── web/                 ← the one app: shell, routing, composes every collection
│       ├── app/             ← routes: / (Map), /agents, /business, /engagement,
│       │                       /frame /data /build /deploy /govern /realize (Collection 1)
│       └── components/      ← map/ · agents/ · business/ · engagement/ (the labs' UI)
├── packages/
│   ├── design-system/       ← tokens, Tailwind preset, shared UI primitives
│   ├── kit/                 ← data spine: model catalog, pricing, protocol stats, registry
│   ├── program-core/        ← Collection 1 engines (contracts, operate, govern, realize)
│   └── lab-*/               ← Collection 1 lab packages (framing, data, rag, deploy, …)
└── docs/                    ← build brief, QA report, review notes, roadmap
```

## Design principles

- **Static, client-side, deterministic.** `output: "export"` — the whole site
  pre-renders to `apps/web/out/`. No backend, no secrets, hostable anywhere.
- **The registry drives the gallery.** The Competency Map is generated from
  `@labs/kit`'s labs registry, so the landing page can never drift from what actually
  ships.
- **Model strings live in one place.** Every lab reads the live model from `@labs/kit`
  (`LIVE_MODEL`, `LIVE_MODEL_CHEAP`) rather than hardcoding — one edit updates the whole
  portfolio when a model version changes.
- **Truthful honesty layer.** `SIMULATED`/`LIVE` badges, freshness stamps, "how it's
  built," and limitations on every lab — the portfolio holds itself to the same
  transparency it argues enterprise AI needs.

## Run locally

```bash
pnpm install
pnpm dev          # turbo dev server → http://localhost:3000
pnpm typecheck    # the gate — the monorepo typechecks clean
pnpm build        # static export → apps/web/out/
```

Requires **Node 18+** and **pnpm 9.7** (`corepack enable && corepack prepare pnpm@9.7.0 --activate`).

## Deploy

Static export served on Vercel at `portfolio.sudeeplalka.com`. `vercel.json` installs
with pnpm, builds `@labs/web` via Turbo, and serves `apps/web/out/`. See
[`GO-LIVE.md`](./GO-LIVE.md) for the full step-by-step, and [`DEPLOY.md`](./DEPLOY.md)
for alternate hosts.

---

*A portfolio of AI delivery mechanics. It demonstrates how AI programs are shipped,
governed, and paid for — it is not a production ML platform and uses no confidential
data, live telemetry, or real model training.*
