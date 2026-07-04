# Fable 5 — End-to-End Review: AI Labs Portfolio
**Reviewer:** Claude Fable 5 (four lenses: principal engineer · hiring VP · product/design director · domain expert)
**Date:** 2026-07-02 · **Scope:** 23 new labs (C2/C3/C4) + Layer 0 + shared foundations. Collection 1 treated as fixed.
**Method:** full read of all 23 lab components, registry, kit, design system, landing, shell, docs; static sweeps (model strings, anonymization, routing, metadata, a11y markers). Files the sandbox mirror corrupts (`registry.ts`, `RaidRadar.tsx`, `page.tsx`) were verified against authoritative host copies — all clean.

---

## 1. Executive summary

This is already a better artifact than 99% of candidate portfolios: 23 working instruments, one disciplined design system, a registry that drives the map, visible formulas everywhere, and a credibility block (badge · stamp · takeaway · how-built · limitations) executed with remarkable consistency. Collections 3 and 4 are the strongest work — C3-5's tornado-plus-exec-slide and the EL-04→EL-10 shared-data pipeline are the kind of thing panels remember.

**The single most important thing to fix:** the honesty system has two cracks at its most visible point. GAP-03 and GAP-04 claim to replay "a real recorded run" with "metrics measured from those runs" — but the outputs are authored constants, and the LIVE badge flips on an env var **with no live execution path in the code**. On a site whose footer says "honest by design," one unverifiable claim costs more than ten missing features. Fix before anything else (it's a relabeling exercise if you don't want to record real runs yet).

**Would this advance the candidate today?** Yes — as a hiring VP I would advance on this artifact, with the two honesty items fixed first, because the panel *will* click GAP-03. It is not yet "never seen anything this good"; the gap to that is: truthful LIVE mechanics, the unbuilt collection pages (the structural-contrast thesis currently exists only as shelf labels), and the use-case breadth layer.

## 2. Rubric scorecard

Scores are 1–5 per criterion (insight · interactivity · defensibility · craft · honesty · decision), /30, ship bar ≥26.

| Unit | I | X | D | C | H | Dec | /30 | One-line rationale |
|---|---|---|---|---|---|---|---|---|
| **Layer 0 (Competency Map)** | 4 | 3 | 5 | 4 | 5 | 5 | **26** | Cinematic, honest, decision-forward; interactivity is CSS-hover only (invisible on touch), no exploration affordance |
| **C2 average** | | | | | | | **~25.6** | Range 20–29; two labs below bar (see flags) |
| GAP-01 MCP Playground | 5 | 4 | 5 | 4 | 5 | 5 | 28 | Real JSON-RPC + typed −32602 rejection + N×M crossover; covers resources & prompts, not just tools |
| GAP-02 Loop & Failure | 5 | 4 | 4 | 4 | 5 | 4 | 26 | Failure→detection→recovery triads are the right lesson; traces honestly labeled illustrative |
| **GAP-03 Orchestration** ⚠ | 4 | 3 | 2 | 4 | 2 | 5 | **20 — BELOW BAR** | Unwired LIVE flip + "real recorded run"/"measured metrics" claims that the code cannot substantiate |
| **GAP-04 Structured Output** ⚠ | 4 | 3 | 4 | 4 | 3 | 5 | **23 — BELOW BAR** | Same badge flip; "custom text extracts live" is false in the current build |
| **GAP-05 Context & Memory** ⚠ | 4 | 4 | 3 | 4 | 5 | 4 | **24 — BELOW BAR** | Fidelity/risk curves are modeled guesses (honestly labeled) — thinnest defensibility in C2 |
| GAP-06 Cost Simulator | 5 | 5 | 5 | 4 | 5 | 5 | 29 | Best C2 lab: dated pricing, visible math, visceral caching toggle, honest limitations |
| GAP-07 Protocol Selection | 4 | 4 | 4 | 4 | 5 | 5 | 26 | Runner-up + flip condition = judgment; weights disclosed as heuristic |
| GAP-08 HITL Simulator | 5 | 5 | 4 | 4 | 5 | 5 | 28 | The engineered slip one level past balance is excellent teaching |
| **C3 average** | | | | | | | **~27.8** | The strongest collection |
| C3-1 Portfolio Dashboard | 5 | 4 | 5 | 4 | 5 | 5 | 28 | Stage-prob math + per-initiative "how this number is computed" drawer — exactly the brief |
| C3-2 Build/Buy/Fine-tune | 4 | 5 | 4 | 4 | 5 | 5 | 27 | Volume slider trading API↔fine-tune places is the decision made tactile |
| C3-3 Inference Forecaster | 5 | 5 | 4 | 4 | 5 | 5 | 28 | The utilization→cliff-slides-right move is the insight; SVG has role/aria ✓ |
| C3-4 Vendor Monitor | 4 | 5 | 4 | 4 | 5 | 5 | 27 | Ranking fragility under weights is the honest lesson most scorecards hide |
| C3-5 ROI Builder | 5 | 5 | 5 | 4 | 5 | 5 | 29 | IRR by bisection, tornado, fundability verdict, steering-slide render — flagship quality |
| **C4 average** | | | | | | | **~26.9** | Most differentiated collection; no lab below bar |
| EL-01 Adoption Readiness | 5 | 4 | 4 | 4 | 5 | 5 | 27 | Gate verdict + rewriting plan; weights visible, threshold defended |
| EL-02 Stakeholder Cockpit | 4 | 4 | 4 | 4 | 5 | 5 | 26 | Sentiment-drift flag → pre-steering briefing is real EM craft |
| EL-03 Capacity Planner | 5 | 4 | 4 | 4 | 5 | 5 | 27 | "30 people ≠ 30 people" lands; hire/contract/upskill trade live |
| EL-04 RAID Radar | 5 | 4 | 5 | 4 | 5 | 5 | 28 | Reported-vs-actual quadrant + auto-narrative ending in an Ask — interview gold |
| EL-05 Compliance Navigator | 4 | 4 | 4 | 4 | 5 | 5 | 26 | Dated, disclaimed, tier→controls; regulatory logic needs owner-level verification (below) |
| EL-06 Talent Planner | 4 | 4 | 4 | 4 | 5 | 4 | 25 | Solid but thinnest C4 lab; borderline — one more insight layer would clear it |
| EL-07 RFP War Room | 5 | 4 | 4 | 4 | 5 | 5 | 27 | The deliberate no-bid sample is senior judgment made visible |
| EL-08 Estimation Studio | 5 | 4 | 4 | 4 | 5 | 5 | 27 | Three-methods-disagree + change-control margin ripple — exactly right |
| EL-09 Onboarding/KT | 4 | 4 | 4 | 4 | 5 | 5 | 26 | Access-as-critical-path + bus-factor is a genuinely uncommon insight |
| EL-10 Exec Comm Studio | 5 | 4 | 5 | 4 | 5 | 5 | 28 | Genuinely consumes EL-04's data; audience reordering; every artifact ends in an ask |

**Strongest three:** EL-10, C3-5, EL-04 (with GAP-06 and C3-1 just behind). **Weakest three:** GAP-03 (as-is), GAP-04 (as-is), GAP-05/EL-06.

## 3. Strengths — protect these

1. **The credibility block, executed 23/23.** Badge + stamp + takeaway + how-built + limitations on every lab, with limitations that are *actually limiting* ("it frames the decision, not a procurement quote"). This is the portfolio's moat; nobody else does this.
2. **Visible math everywhere.** Stage probabilities, IRR bisection, ⌈tokens ÷ cluster×util⌉, weighted normalization — every scored output expands to its formula. §A4.3 fully honored.
3. **The EL-04 → EL-10 pipeline.** One authored data source (`portfolioData.ts`), two instruments — detection then communication. The "Data in →" strip proving consumption is a top-1% touch. The sample data itself (golden-set pass-rate 91→77 after new categories; engineers bypassing a copilot) reads insider-credible.
4. **Registry-drives-everything.** `labs-registry` with invariant tests; flipping a status updates the map. Clean, typed, exactly the brief's mechanism.
5. **Deterministic engines over fake AI.** The choice to make C3/C4 defensible arithmetic instead of model calls is correct per the brief, and the code is consistently clean, typed, and idiomatic (no dead imports in the new surface except noted; components ~150–280 lines, readable).
6. **Sample-data doctrine held.** Finserv + telecom scenarios with plausible shapes; the SFL scrub verified; no client names in any component copy.

## 4. Gap analysis (by scope area)

### 4.1 Honesty & credibility mechanics
- **[BLOCKER] F-1 — LIVE badge flips without a live path.** `OrchestrationBoard.tsx:80` and `StructuredOutput.tsx:65` read `NEXT_PUBLIC_AGENT_ENDPOINT` and set the badge to LIVE — but there is **no fetch/network code anywhere in the new labs**. If that env var is ever set, both labs display LIVE while replaying scripted content: precisely Appendix-3's "faked live call." *Fix:* remove the badge flip until a real call path exists; keep the "LIVE-ready" note as roadmap language only.
- **[BLOCKER] F-2 — Unverifiable provenance claims.** GAP-03: "this replays a real recorded run… metrics are measured from those runs"; GAP-04: "cached extraction of a real run"; GAP-03's quality figures (62 vs 81, "eval-set score") have no recorded artifact behind them in the repo. Unless these runs actually happened and were transcribed, the copy claims provenance the artifact doesn't have — on a site whose footer says "honest by design." *Fix (pick one):* (a) actually run each preset once via the API, store the transcript JSON + run date in the repo, cite it; or (b) relabel to "authored illustrative run" and change "measured" to "illustrative." Option (a) converts a blocker into an asset.
- **[MAJOR] F-3 — QA report contains a false PASS.** `docs/QA-REPORT.md` claims "zero hardcoded model strings"; `CostSimulator.tsx:23,54` hardcodes `"claude-haiku-4-5"`. Trivial code fix (`LIVE_MODEL_CHEAP` from kit) — but correct the QA doc too; an internal QA doc with a false claim undermines the audit trail you'll show a panel.
- **[MINOR] F-4 — "A2A message log" labeling.** GAP-03's log shows generic handoffs; a protocol-literate reviewer will ask where the task lifecycle states and agent cards are. Either render A2A task states (submitted/working/completed exists — surface it per-message) or label "A2A-style coordination."

### 4.2 Strategic positioning & narrative
- **[MAJOR] F-5 — The collection pages don't exist.** `/agents`, `/business`, `/engagement` have no index routes. The brief's §B4 — layered-map hero (C2), gallery (C3), control room with status strip (C4) — is unbuilt; the structural-contrast thesis ("toolkit vs gallery vs control room") currently exists only as shelf *labels* on the landing. This is the biggest gap between the brief's positioning and the built artifact. The C4 control room with its live status strip is the highest-value one to build first.
- **[MINOR] F-6 —** "Changelog — coming soon" on the landing is a broken-window promise on the most-seen page. Ship a minimal changelog (the BUILD-LOG is already written) or remove the line.

### 4.3 Technical architecture & code quality
- **Verdict: strong.** Clean monorepo boundaries; kit as data spine; consistent component pattern; no state-management overreach; static-export-appropriate (no server deps in new labs). Confirmed the mirror-corruption story: host copies of all three affected files are complete and correct.
- **[MINOR] F-7 —** `registry.progress()` counts C1 instruments in its catalog totals (26, not 23). Currently unused outside tests — a latent trap for whoever renders "X of 23." Exclude collection-1 rows or rename.
- **[MINOR] F-8 —** Stale artifacts flagged for local deletion still present: `apps/governance/` (contains old model strings), `LabArt.tsx` (parked), `warm.css` (dormant), stale "warm theme" comment in `AppShell.tsx`. All known (m2–m4); finish the sweep.

### 4.4 Design & UX
- **[MAJOR] F-9 — Accessibility gaps.** Zero `aria-label`s across all 23 lab components; `<label>` elements aren't `htmlFor`-bound to their sliders/inputs; the landing's hover quick-look is mouse-only (touch/keyboard users never see it); RAID quadrant dots are `title`-only. The foundations are good (focus-visible outlines, `prefers-reduced-motion`, C3-3's SVG has `role="img"` + aria-label) — but WCAG-AA cannot be claimed yet. One labeling pass fixes most of it.
- **[MINOR] F-10 —** Dense tables (C3-1 Financials, EL-05 controls, EL-07 matrix) need the planned 375px spot-check; horizontal-scroll wrappers exist, so likely pass, but verify on device.
- **Craft otherwise:** cohesive, calm, information-dense in the right way. The ink+blue single-theme decision (D-006) was correct — the landing and labs read as one product.

### 4.5 Content & sample data
- **Verdict: the quietly excellent part.** Scenario data consistently reads like real steering material. Domain-expert lens: the disputes/eval-regression story, the NOC-bypass story, and the rural-GIS dispatch story all pass an insider sniff test.
- **[MAJOR] F-11 — Anonymization policy is inconsistent.** Component copy anonymizes resume echoes ("across multiple delivery portfolios") but `registry.ts:152–278` ships AMEX / Morgan Stanley / Verizon / Deloitte / HCLTech strings in `resumeEcho`/`engagementEvidence`/`PROOF_POINTS` (bundled into the site even if unrendered). Employer names are public resume facts — different from client-confidential data — but pick ONE policy. Recommendation: employers stay (they're on LinkedIn and the hero already says "HCLTech @ American Express"); make component echoes match the registry rather than diverge.

### 4.6 Freshness & maintenance
- **[MAJOR] F-12 — The model catalog undercuts its own freshness system.** `kit/models.ts` (dated 2026-07-02) lists Gemini 1.5 Pro/Flash and GPT-4o as current-generation — 2024-era entries presented under a July-2026 stamp. A technical panelist will spot this in seconds. Refresh competitor entries (or trim the catalog to Anthropic models + a generic "other-provider" row) and re-verify `pricing.ts` numbers against current published lists.
- **[MINOR] F-13 —** EL-05's regulatory mapping is dated and disclaimed (good) but should get an owner-level verification pass (Sudeep or counsel-adjacent) before an interviewer from a regulated industry pokes it.

### 4.7 Deployment & production readiness
- **[MAJOR] F-14 —** Phase-0.5 chrome absent: no OG images (links unfurl blank on LinkedIn — a stated B6 requirement and the cheapest distribution lever), no sitemap/robots, no analytics, and `layout.tsx` metadata still describes only the C1 Command Center. Per-route metadata exists 23/23 (good). The deploy-host decision (F-003) gates real LIVE — decide it; the honesty fix (F-1/F-2) matters more than which host.

### 4.8 The Use-Case Layer plan
Right enhancement, right architecture (rail + payload + Atlas). Two corrections before build, already documented in `USE-CASES-PLAN-REVIEW-ADDENDUM.md` (binding, per master brief rev 6): the §6 coverage claim is factually wrong as mapped (telecom/wealth/travel/real-estate/cyber are one-offs, Education is zero, healthcare ~10×) — coverage must be computed from the registry, with First-hand domains ≥3 appearances; and every `studied` use-case needs a required `sources` field + `lastVerified` date + owner sign-off on all First-hand badges. Fold the addendum in; then Phase A is a go.

## 5. Prioritized upgrade backlog

**Quick wins (high value / low effort):**
1. Fix F-1 + F-2 by relabeling (honesty restored in an hour) — S
2. `CostSimulator` → `LIVE_MODEL_CHEAP`; correct QA-REPORT — S
3. Refresh `MODEL_CATALOG`/`pricing.ts` entries — S
4. Unify anonymization policy (registry vs components) — S
5. Ship the changelog page from BUILD-LOG; kill "coming soon" — S
6. `progress()` catalog-only fix + delete m2–m4 dead artifacts — S
7. Root metadata rewrite to the four-altitudes narrative — S

**Big bets (high value / higher effort):**
1. **Record real runs** for GAP-03/GAP-04 (one API session, store transcripts + date) — turns the weakest labs into the strongest proof — M
2. **Build the three collection index pages**, C4 control room first (status strip fed by EL-01/03/04/05 values) — this is the brief's structural thesis — L
3. **Wire genuine LIVE** on the chosen host (one serverless function, shared by GAP-03/04, EL-04 narrative, EL-10 talk track) — M/L
4. **A11y pass** (aria-labels, htmlFor, touch-visible quick-look) + OG image generation + sitemap + analytics — M
5. **Use-Case Layer Phase A** per amended plan — L

## 6. Strategic enhancements (beyond the brief)

1. **"Verify this yourself" panel.** A `/how-its-made` page: the BUILD-LOG, QA report, rubric scores per lab, and the recorded-run transcripts. No candidate shows their QA trail; it converts the honesty system from claim to evidence.
2. **The 90-second guided tour.** A "Reviewer in a hurry?" button on the hero that walks Landing → EL-04 (find the sinking green) → EL-10 (watch it become a steering ask) → C3-1 (kill two initiatives). Panels are time-boxed; curate their path.
3. **Interviewer mode.** A URL param (`?panel=deloitte`) that pins the four JD-resonant labs to the Featured shelf. Cheap, registry-driven, devastatingly effective in a screen-share.
4. **Live health strip on the landing** fed by the registry: "23 instruments · 4 LIVE-ready · last verified Jul 2026" — computed, never asserted (same doctrine as the Atlas stat).
5. **One recorded failure.** Publish a lab you killed or a metric that went the wrong way (the brief's kill-criterion, exercised in public). Nothing signals senior judgment like a visible, well-handled negative result.

## 7. Interview-arming notes

**Strongest demo path (12–15 min):** Landing hero (four altitudes, 30s) → EL-04 (select disputes: reported-green-trending-amber, 3 min) → EL-10 (same data becomes a steering pre-read; flip audience CIO→procurement, 3 min) → C3-1 (kill/scale/hold + open the "how this number is computed" drawer, 3 min) → GAP-01 (send a malformed call, read the −32602, 2 min) → GAP-06 (toggle caching, watch $ collapse, 1 min). This sequence hits every JD requirement in order: RAID → exec comms → governance/KPIs → technical fluency → unit economics.

**Predicted panel attacks and current answers:**
- *"Is any of this real, or all simulated?"* — Current answer is honest badges, but weak until F-1/F-2 are fixed and one lab runs genuinely LIVE. Highest-priority pre-interview fix.
- *"Where did your quality/cost numbers come from?"* — C3/C4 answer perfectly (visible formulas, editable assumptions). GAP-03's 62-vs-81 cannot currently be defended. Fix per F-2.
- *"Did AI build this?"* — The how-built notes + BUILD-LOG + your ability to explain the health-index math ARE the answer. Rehearse the EL-04 formula and C3-1 stage probabilities cold.
- *"You're finserv/telecom only?"* — Current true weakness; the Use-Case Layer is the fix, and until then the answer is the industry-agnostic mechanics ("the instrument is the same; the readiness factors reweight").
- *"What would you kill on this site?"* — Have an answer (GAP-05 is the honest candidate). Saying it first is a power move.

**Weakest spots to shore up pre-interview:** F-1/F-2 (they will click GAP-03), F-12 (they will see Gemini 1.5), and the missing OG images if you send links in advance.

## 8. If you only do five things

1. **Fix the two honesty blockers (F-1, F-2)** — relabel today, record real runs this week. Everything else on the site is credible; don't let its two weakest claims be the ones a panel clicks first.
2. **Build the C4 control-room index page** (then C2/C3) — the structural-contrast thesis is the portfolio's central argument and it is currently unbuilt.
3. **Wire one genuinely LIVE lab end-to-end** on the chosen host — one real call, honestly badged, beats four "LIVE-ready" notes.
4. **Run the freshness sweep on your own config** (models, pricing, QA-report correction, CostSimulator constant) — the freshness system must not be the stale thing.
5. **A11y + shareability pass** (aria/htmlFor, OG images, sitemap, analytics) — the difference between excellent-in-person and excellent-when-a-recruiter-opens-the-link-on-a-phone.

---
*Everything cited above was verified in the repo; where I could not verify (GAP-03/04's claimed recorded runs), that inability is itself the finding. Scores for EL-01/02/03/05/06/07/08/09 are based on full credibility-block verification + BUILD-LOG mechanics + header/logic reads; a live-URL rubric pass remains the definitive gate per the brief.*
