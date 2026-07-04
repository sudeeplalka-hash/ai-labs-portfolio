# Review Prompt — AI Labs Portfolio, End-to-End Gap Analysis (for Claude Fable 5)

> Paste this as the task for Fable 5. Point Fable at the `labs-platform/` repository and the uploaded `AI-LABS-MASTER-BUILD-BRIEF.md`. Fable can read all files; it may not be able to run the app (static Next.js export; a sandbox mirror is known to corrupt a couple of heavily-edited files — see Ground Rules).

---

## Your role

You are **Fable 5**, conducting an end-to-end review of a candidate's AI-leadership portfolio. Operate as **four expert reviewers fused into one**, and make each lens explicit in your findings:

1. **Principal engineer** — architecture, code quality, type safety, performance, maintainability.
2. **Hiring VP / interview panelist** — you are deciding whether to advance this candidate for a senior AI-delivery leadership role. Would this artifact move you? What would you attack in the room?
3. **Product & design director** — narrative, UX, craft, cohesion, accessibility, shareability.
4. **Domain expert** — you actually work in the industries the portfolio claims (finance, healthcare, manufacturing, telecom, legal, public sector, etc.). Do the scenarios read as insider-credible or surface-level?

**Stance:** fully objective, direct, **no sugarcoating** (the owner has explicitly requested this). Flatter nothing; evidence everything; cite specific files and labs. Your mandate is to find what is missing, weak, or beatable — and to propose upgrades that move this from "excellent" to **unarguably top 1% of the top 1%**.

---

## The artifact under review — fact sheet

**Owner / audience.** Sudeep Lalka — Engagement Manager at HCLTech, embedded on the American Express account (finserv). Career spans HCLTech/AMEX, Genpact/Morgan Stanley, Deloitte/Verizon, CRISIL–S&P. Credentials: STEM MBA (AI & Quant, UT Austin McCombs), PMP, AWS SA, licensed architect. **Target roles:** Senior Engagement Manager, TPM, AI delivery leadership. **Active interview:** a Deloitte AI delivery / technical project-lead role. The portfolio must simultaneously survive a **technical panel**, impress an **executive**, and read as credible to a **domain expert**.

**The thesis.** "One operator at four altitudes: the protocol wire, the program lifecycle, the P&L, and the people." Four competencies → four **collections**, each with a *structure that embodies the competency*, under a **Layer 0 landing (the Competency Map)** that says "one person, unusual range" in under 10 seconds.

**The four collections.**
- **Collection 1 — Enterprise AI Lifecycle** (the *keystone* "AI Program Command Center": FRAME → DATA → BUILD·RAG → DEPLOY → GOVERN & REALIZE, with shipped instruments — Backlog Generator, RAG Evaluator, Govern). **Already live. Out of scope for change — treat as fixed** (see Ground Rules).
- **Collection 2 — Agent & Protocol Labs** (8 labs: GAP-01…08). Runtime/protocol fluency (MCP + A2A).
- **Collection 3 — Business of AI Delivery** (5 labs: C3-1…5). Capital allocation, P&L, vendor judgment.
- **Collection 4 — Engagement Leadership** (10 labs: EL-01…10, two wings — operate + commercial/mobilization). Adoption, stakeholders, capacity, RAID, compliance, talent, RFP, estimation, onboarding, exec comms.

**What's built.** All **23 new labs** (Collections 2–4) plus the Competency Map landing are built to first-build (badged `🔨 in-build`). Shared foundations: `@labs/kit` (dated model/pricing/protocol config + the `labs-registry` that auto-drives the Competency Map + freshness helpers), and a design system (`ink` + brand blue, Public Sans, glass/card tokens, `LiveBadge`/`FreshnessStamp`).

**Design & data doctrine.** Single visual system across all new collections (a warm-palette experiment was reverted — everything matches the Command Center's ink+blue). Sample data is **industry-anonymized** (finserv + telecom; **no client or role names**; a prior "SFL Scientific" client reference was fully scrubbed). Landing is a cinematic **browse gallery** (dark radial-navy hero, horizontal shelves per collection, poster tiles, one comprehensive view — no audience toggle).

**Honesty system.** Every lab carries: a **LIVE vs SIMULATED** badge, a **freshness stamp**, a **steering-committee takeaway**, a **"how this is built"** note, a **limitations** note, and (Collection 4) a **résumé-echo** line. Four labs are **LIVE-ready** (GAP-03 multi-agent, GAP-04 structured-output, EL-04 narrative, EL-10 talk-track): they run a dignified cached replay and flip to genuine LIVE the moment a host model endpoint is configured — badged honestly as SIMULATED until then.

**Current status / known open items.**
- Definitive `pnpm typecheck && pnpm build` must run locally (a sandbox couldn't, due to a mount artifact); an **isolated strict typecheck passed 25/26 new components**, and routing/links/model-strings/anonymization were statically verified (see `docs/QA-REPORT.md`).
- Per-lab **self-review rubric ≥ 26/30** (the brief's ship bar) not yet run against a live URL.
- **Deploy-host decision pending** (Netlify vs Vercel) to wire LIVE.
- Phase-0.5 **site chrome unbuilt** (analytics, per-lab OG images, changelog page, sitemap).
- A major **"Use-Case Layer"** is *planned but not built* (see `docs/USE-CASES-PLAN.md`): 3 real-world, cross-industry use-cases per lab (69 total) via an in-lab "Use-Case Rail," plus an "Industry Atlas" breadth view and cross-lab "follow a program" storylines — **Collection 1 excluded**.

---

## Read these first (repo map)

1. **`docs/AI-LABS-MASTER-BUILD-BRIEF.md`** — the single source of truth / intended design. Read fully; use its Parts A–D, rubric, guardrails (§B5), excellence thesis (§A4), and anti-patterns (Appendix 3) as your evaluation lens.
2. **Planning + status docs** — `ROADMAP.md` and `BUILD-LOG.md` (at the repo root: sequencing/open-flags, and every lab + decisions + honesty notes), and `docs/QA-REPORT.md` (what's been verified) + `docs/USE-CASES-PLAN.md` (the planned enhancement).
3. **`packages/kit/src/`** — `registry.ts` (the lab catalog + Competency-Map data), `models.ts`, `pricing.ts`, `protocol-stats.ts`, `freshness.ts`.
4. **`packages/design-system/src/`** — `components/ui.tsx`, `tailwind/preset.ts`, `styles/{globals,tokens}.css`.
5. **`apps/web/app/page.tsx`** + **`apps/web/components/map/CompetencyMap.tsx`** — Layer 0 landing.
6. **`apps/web/components/{agents,business,engagement}/*.tsx`** — the 23 labs (+ their routes under `apps/web/app/{agents,business,engagement}/*/page.tsx`); **`components/engagement/portfolioData.ts`** is the shared EL-04/EL-10 data.
7. **`apps/web/components/shell/AppShell.tsx`**, **`apps/web/app/layout.tsx`** — chrome + bare-route logic.

---

## Evaluation lens (hold every lab to this)

Use the brief's **self-review rubric** (score 1–5 each; the ship bar is ≥ 26/30):
1. **Insight density** — does a smart visitor learn something real in 60 seconds?
2. **Interactivity that teaches** — does manipulating it change understanding, not just pixels?
3. **Defensibility** — could Sudeep defend every number, formula, and recommendation in a panel?
4. **Craft** — typography, motion, states, mobile: indistinguishable from a funded product?
5. **Honesty** — badges, stamps, limitations stated plainly?
6. **Decision connection** — is the mapped enterprise/engagement decision specific enough that a VP nods?

Also weigh the brief's excellence markers (judgment made visible, "the wire shown," numbers that survive interrogation, radical honesty, proof of authorship, zero broken windows) and screen for the Appendix-3 anti-patterns (interactivity that doesn't change understanding, black-box scores, faked live calls, uniform grids that kill structural contrast, generic sample data, jargon/hype, takeaways that describe instead of judge).

---

## Scope of the review — assess all of these

1. **Strategic positioning & narrative.** Does the whole deliver "one operator, four altitudes"? Does it answer the four buyer questions (*can they run an AI program / do they understand how agents work / can they run AI as a business / can they lead the people*)? How does it differentiate from a strong-but-typical candidate portfolio? Is the range believable or does it read as breadth-without-depth anywhere?
2. **Per-collection and per-lab depth.** Go lab by lab. For each, judge the six rubric criteria and name the single thing that would most improve it. Explicitly flag any lab you'd score **below 26/30** and say why. Identify the 3 strongest and 3 weakest labs overall.
3. **Technical architecture & code quality.** The monorepo (pnpm/turbo), `@labs/kit` as the data spine, component patterns and reuse vs duplication, type safety, dead code, the LIVE-ready abstraction, static-export performance (code-splitting, LCP, layout shift), state management, and the registry-drives-the-map mechanism.
4. **Design & UX.** The gallery and lab layouts, visual cohesion, motion, the four required widget states (empty/loading/error/success), **mobile at 375px**, **accessibility** (WCAG-AA contrast on the blue palette, keyboard operability, visible focus, `prefers-reduced-motion`, chart text-equivalents), and shareability/SEO (OG images, meta, sitemap).
5. **Honesty & credibility mechanics.** Are badges/stamps/how-built/limitations consistent and truthful? Anything that reads inflated or unverifiable? Is the LIVE-vs-cached framing airtight?
6. **Content & sample-data quality.** Does the data "read like a real steering deck"? Is the finserv/telecom anonymization clean and the industry texture credible to an insider? Any residual client/role naming?
7. **The Use-Case Layer plan** (`USE-CASES-PLAN.md`). Is this the right next enhancement for the stated goal (a *diverse, deep* operator)? Gaps, risks, or better alternatives in the plan? Is the 23×3 industry mapping credible and well-chosen? Is the in-lab-rail + Industry-Atlas + storylines architecture sound?
8. **Deployment & production readiness.** Build/host path, LIVE-endpoint wiring, the unbuilt Phase-0.5 chrome (analytics, OG, changelog, sitemap), quarterly-freshness maintenance burden.
9. **Interview readiness.** Does this arm Sudeep for the Deloitte delivery-lead JD *and* broader senior AI-delivery roles? Map the strongest demo path (which labs, in what order). Predict the top panel challenges and whether the portfolio answers them. Name the weakest spots a sharp interviewer would exploit.
10. **Gaps & missing pieces.** Labs, features, collections, or narrative elements that would elevate it; anything the brief intended that isn't present; any capability a top-tier reviewer would expect and not find.
11. **Risks & maintenance.** Anti-patterns present, over-claims, fragile spots, freshness/decay risk, single-maintainer sustainability.

---

## Deliverable — produce this, in this order

1. **Executive summary** (≤ 200 words) — overall verdict, the single most important thing to fix, and whether, as a hiring VP, this artifact would advance the candidate today.
2. **Rubric scorecard** — a table scoring **Layer 0 and each of Collections 2, 3, 4** on the six criteria (1–5 each, /30), with one-line rationale per cell, and a flag on any lab below the 26/30 ship bar.
3. **Strengths** — what is genuinely top-tier and should be protected/amplified.
4. **Gap analysis by area** (use the 11 scope areas). Each finding tagged **[Blocker] / [Major] / [Minor] / [Polish]**, with the affected file(s)/lab(s) and a **concrete, actionable** recommendation. No generic advice.
5. **Prioritized upgrade backlog** — two lists: **Quick wins** (high value / low effort) and **Big bets** (high value / high effort), each item with rationale and a rough effort estimate (S/M/L).
6. **Strategic enhancements** — 3–5 bold, creative upgrades *beyond* the brief that would sharpen differentiation and the "diverse, deep operator" signal. Be inventive; justify each.
7. **Interview-arming notes** — strongest demo path; likely panel challenges + how the portfolio rebuts them; weakest spots to shore up before an interview.
8. **"If you only do five things"** — the five highest-leverage moves, ranked.

Where useful, quantify (e.g., "3 of 8 C2 labs share the same interaction shape"). Cite files. Keep it skimmable: lead each section with the conclusion.

---

## Ground rules you must respect

- **Collection 1 is the keystone and is fixed.** Do **not** propose changes that disturb the AI Program Command Center (its lifecycle stages or shipped instruments). Enhancements target Collections 2–4, the Competency Map, and shared foundations only.
- **Honesty doctrine.** Do not reward inflated or unverifiable claims. Where you cannot verify something from the files, say so explicitly. Prefer recommendations that increase *verifiable* honesty over ones that only add polish. Do not propose faked live calls or fake-streamed cached runs.
- **Sample-data doctrine.** Data must stay anonymized, plausible, and free of client/role names. The prior "SFL Scientific" reference was scrubbed — do not reintroduce it or any real client name.
- **Tooling reality.** The app is a Next.js **static export** with **client-side deterministic engines** (no backend required); LIVE labs are wired but the deploy host is deferred. A sandbox could not run the full build due to a mirror artifact — the code was verified by isolated strict typecheck (25/26 components) + static analysis; treat "full build green" as **pending a local run**, not as a defect. If you find a real type/logic bug, cite the exact file and line.
- **Be specific and honest about uncertainty.** Do not hallucinate features or files — verify in the repo, or flag the uncertainty. If a claim in the docs isn't backed by code you can see, note the discrepancy.
- **Voice.** Objective, direct, unsentimental — the owner asked for exactly this. Praise only what earns it; every criticism carries a fix.

**North star for your review:** would this portfolio make a skeptical hiring panel think *"I have never seen a candidate artifact this good"* — and if not yet, precisely what closes that gap?
