# AI Labs Portfolio — Build Roadmap

**Owner:** Sudeep Lalka · **Host:** `portfolio.sudeeplalka.com` (proposed; supersedes `ai-labs.sudeeplalka.com`) · **Track:** Interview Sprint (Deloitte AI delivery / technical project-lead role)
**Derived from:** `AI-LABS-MASTER-BUILD-BRIEF.md` (rev 5) — the single source of truth. This roadmap *sequences* the brief; it does not override it. Where this file and the brief's Part D disagree on intent, the brief wins.
**Status:** Sprint 0 in progress · Last updated 2026-07-02

> ⚠️ **Open input needed:** the actual interview date. It doesn't change *order* (Sprint 0 → 1 → 2 are fixed), only how far into Sprint 3 we get. Give me the date and I'll draw the must-ship line precisely.

---

## Why this order (the override)

Part D's normal order front-loads MVP-7 (a breadth play across all four buyer questions). The brief's **Interview Sprint override** says: when an interview is scheduled, temporarily re-prioritize to the subset that best evidences *that* JD, shippable before the date — "a live URL in an interview beats ten backlogged labs."

For the target Deloitte AI delivery-lead role, the highest-resonance pair is explicitly **EL-04 (RAID Radar) + EL-10 (Exec Communication Studio)**, backed by GAP-06 if time allows. So the sprint is: get the foundation and the landing page right, ship that pair to rubric standard, then extend down the JD-resonance list until the interview date runs out. Normal Part D resumes afterward.

**Minimum Viable Interview (MVI) asset** = Sprint 0 + Sprint 1 + Sprint 2. Everything in Sprint 3 is upside.

---

## The sprints

### Sprint 0 — Foundations & hygiene *(blocking; = brief Phase 0)*

Nothing new ships until the plumbing every later lab imports exists.

| # | Deliverable | Brief ref |
|---|---|---|
| 0.1 | `ROADMAP.md` + `BUILD-LOG.md` scaffold | §Instructions |
| 0.2 | `@labs/kit` shared config: `LIVE_MODEL`, dated `MODEL_CATALOG`, dated pricing, dated protocol-stats, `labs-registry` | B2, B5.6, C0 |
| 0.3 | Migrate all hardcoded model strings → `@labs/kit`; freshness-stamp existing labs | B2, Phase 0.2 |
| 0.4 | `FreshnessStamp` component + audit/extract shared primitives (card, badge, drawer, chart wrappers) | Phase 0.3 |
| 0.5 | Site chrome: analytics, per-lab OG images, changelog page, contact CTA, sitemap | B6, Phase 0.4 |
| 0.6 | **Verification gate** | Phase 0 exit |

**Exit:** Collection 1 visually unchanged · zero hardcoded model strings · primitives importable · Lighthouse ≥95 on existing pages.

### Sprint 1 — Layer 0: Competency Map landing *(= brief Phase 1)*

The Command Center landing. Four-altitude hero (wire → lifecycle → P&L → people), five domain panels in miniaturized structural metaphors, credential strip, honest ✅/🔨 badges wired to `labs-registry`, audience lenses (Recruiter / Technical / Executive) persisted in `localStorage`.

**Exit:** "one person, four altitudes" lands in <10s to a cold viewer · every claim carries an evidence badge · lenses rewrite emphasis · mobile excellent.

### Sprint 2 — The JD-resonant pair *(must-ship; the interview asset)*

| Lab | What it proves | JD requirement it answers |
|---|---|---|
| **EL-04 · Delivery Health & RAID Radar** | RAID with trajectory, reported-vs-actual gap | "Proactively manage RAID, change control, and release planning" |
| **EL-10 · Executive Communication Studio** | Steering/QBR production, decision-forcing framing (LIVE talk track) | "Weekly leadership updates… steering committees, QBRs, milestone reviews (talk tracks, visuals, pre-reads)" |

These pair by design: EL-04 *detects*, EL-10 *communicates*. EL-10 consumes EL-04's RAID states as input, so building EL-04 first is a hard dependency.

**Exit:** both ≥26/30 · EL-10's talk track runs genuinely LIVE with dignified fallback · both wired into the map · takeaway + how-built + limitations + resume-echo present.

### Sprint 3 — Backing labs *(time-permitting, JD-priority order)*

Extend down the Appendix-2 resonance list only as the interview date allows. Cut from the bottom, never below rubric.

| Order | Lab | JD requirement |
|---|---|---|
| 1 | **GAP-06 · Prompt Cost & Token Simulator** | AI/ML + GenAI unit-economics fluency; builds momentum (S-size) |
| 2 | **C3 #1 · Portfolio Dashboard** (Financials + Stage-Gate) | "Delivery governance, KPI reporting and/or budgets" |
| 3 | **EL-01 · Adoption & Change Readiness** | "Change management and AI solution rollout/adoption" (preferred) |
| 4 | **EL-08 · Estimation & Scoping Studio** (+ change control) | "Drive and evaluate estimates by deliverable… critical path"; pre-sales |
| 5 | **EL-07 · RFP/RFI War Room** | "Pre-sales: estimating, scoping, workplans, RAID, delivery approach" |
| 6 | **EL-05 · Compliance Readiness Navigator** | "Data and AI governance frameworks" |

**Sample-data note:** each flagship lab (C3 #1, EL-01, EL-04) carries a second industry preset drawn from Sudeep's actual exposure — a telecom care portfolio alongside the finserv one — so the portfolio doesn't read finserv-only. No client names; industries only.

### Post-interview — resume normal Part D

Return to Part D order: finish Phase 2 MVP-7 remainder → Phase 3/4 expansion waves → Phase 5 compounding (per-lab write-ups, quarterly freshness sweep, analytics-driven cuts).

---

## Definition of Done (every lab, from brief Part D)

Card anatomy (§B3) complete · guardrails (§B5) pass · craft standards (§B6) pass · self-review rubric ≥26/30 · `labs-registry` entry flips 🔨 → ✅ (auto-updates the Competency Map). **Kill criterion:** a lab that can't reach 26 after two iterations is cut, not shipped weak.

---

## Open flags for Sudeep (raised, not silently resolved)

1. ~~Design-system palette mismatch~~ **RESOLVED (D-006):** all collections use the Command Center palette exactly (ink + brand blue, Public Sans). The brief's §B1 warm palette is dropped per Sudeep's direction; one visual system across everything.
2. **Interview date** (see top banner) — sets the Sprint 3 cut line.
3. **LIVE call key/host.** EL-10's LIVE talk track needs the host-provided key path (B2: "API key handled by host; never in code"). Confirm the deployment target (Netlify/Vercel both present in repo) so I wire the function correctly.
4. **Subdomain** `portfolio.sudeeplalka.com` (D-008) — confirm and I'll wire deploy/DNS + canonical URLs.
