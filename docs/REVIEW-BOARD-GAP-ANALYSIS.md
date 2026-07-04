# Senior Review Board — Portfolio Gap Analysis
**Reviewer:** Claude Fable 5, acting as a six-persona board (Senior AI Engineer · CEO · COO · CFO · Senior PM · Senior QE)
**Date:** 2026-07-04 · **Subject:** `ai-labs-portfolio` — evaluated as **standalone portfolio projects**, per the owner's new framing. Prior integrated-site reviews (`FABLE-REVIEW.md`) remain valid for the site; this review deliberately applies a different lens: *does each project stand alone on GitHub, in a live demo, and in an interview walkthrough?*
**Evidence base:** full prior read of all 23 new labs + foundations; fresh verification of the Phase C/D layer; sampled reads of the Collection-1 engines (lab-rag retrieval/evaluation, governance lib, framing/deploy/realize engines); the `AI-Labs-Portfolio-Review-for-Fable5.md` brief.

---

## PREFACE — Deploy gate: the seven §14 asks, verified

Before the board review: the brief asked for pre-deploy verification. All seven pass.

1. **Static-export dynamic route** — `app/industries/uc/[id]/page.tsx` uses the correct Next 14.2 pattern (`dynamicParams = false` + sync `generateStaticParams` + sync `params`). 69 pages will pre-render under `output: "export"`. The `notFound()` branch is unreachable and harmless. ✅
2. **Payload → `Scenario` assignability** — `El04Payload` fields match `portfolioData` types structurally; assignments type-check. ✅
3. **Deep-link forward reference** — the hook is unconditional, top-level, ref-stabilized (`cb.current`), runs once post-mount; the arrow-closure forward reference is legal TS and satisfies Rules of Hooks. Wired in exactly 23 labs (grep-verified). ✅
4. **EL-08 name shadow** — the component imports only `EL08_USE_CASES` (data), never the kit `UseCase` type; the local `interface UseCase` wins resolution with no collision. ✅
5. **`export *` collisions** — `labs.ts` (LabRoute/LAB_ROUTES/labHref), `storylines.ts` (StoryStep/Storyline/STORYLINES), `industries.ts` exports are all disjoint from `registry.ts` names. ✅
6. **First-hand depth** — confirmed light: capital-markets and telecom are thin in the use-case layer. Advisory; folded into §2/§11 below.
7. **Content/voice** — `el09-fintech`'s first-hand framing is the one label I'd soften to `studied` (a founding-engineer bus-factor story at a fintech is adjacent to, not identical with, AMEX delivery). One label change; everything else reads defensible.

**Verdict: cleared to run `pnpm typecheck && pnpm build` and push.** Nothing in Phases C/D should trip the build.

---

# SECTION 1 — Executive Summary

**Blunt assessment.** This portfolio is in the top few percent of candidate work: 23 deterministic, decision-framed instruments; a type-system-enforced honesty doctrine; computed (never asserted) coverage claims; a use-case layer with 69 sourced analyst briefs; and cross-lab storylines that prove sequencing judgment. The writing voice is senior. The sample data survives an insider sniff test. Nobody the panel has interviewed this year walks in with this.

And yet — judged by the standard you set ("prove a senior operator beyond buzzwords, standalone, on GitHub"), it has one architectural contradiction and four systematic depth gaps:

**The contradiction:** everything is engineered as ONE integrated site (single private monorepo, one registry, shared design system, cross-links everywhere), while your new goal is projects that each stand alone on GitHub and in a demo. Today, a reviewer sent to the repo sees one project, not seven; a reviewer sent to a lab URL sees a page, not a project. The integration is a strength for the live site and a liability for the GitHub/portfolio story. This is fixable without re-architecture (see §13) — but it is the frame for everything below.

**The four systematic gaps:**
1. **No real AI executes anywhere a reviewer can reach.** Every lab is deterministic. The one genuine model path (the Live RAG lab's BYO-key provider) is buried inside Collection 1 and not showcased. For a portfolio whose title says "AI," a senior AI engineer will notice within two minutes that no model is ever actually called. This is the single biggest credibility ceiling.
2. **Nothing comes out.** No lab produces a downloadable artifact (EL-05's print-to-export is the lone gesture). Enterprise tools produce memos, registers, reports; dashboards that keep everything on screen read as demos. You built the *content* of a dozen artifacts (exec slides, change orders, audit checklists, briefings) and then left them trapped in the DOM.
3. **The new labs have zero tests.** Collection 1's packages carry 19 test files; the 23 labs that now define the portfolio carry none, and there is no CI. A senior QE — or any engineering interviewer who opens the repo — will check this first. The engines are pure functions begging for tests; this is days of work for a categorical signal change.
4. **Inputs are canned.** Outside the Live RAG lab (document upload) and GAP-06 (paste a prompt), no lab accepts anything of the reviewer's own. Sliders over authored data teach well but cap the "this is a real tool" perception.

**Ratings (as standalone portfolio projects, senior-reviewer lens):**

| Dimension | Score /5 | One-line justification |
|---|---|---|
| Overall maturity | **3.5** | Exceptional breadth and honesty discipline; production signals (tests, CI, artifacts, real inference) missing |
| Technical depth | **3** | Real engines with visible math, but no live AI, no persistence layer story, no observable pipeline outside C1 |
| Product depth | **4** | Decision-framing, personas-by-audience, storylines = genuine product thinking; journeys end without outputs |
| Enterprise credibility | **4** | Governance/honesty/measurement discipline is the differentiator; missing artifacts and quality gates hold it at 4 |
| Reviewer impressiveness | **3.5** | The live-site walkthrough impresses; the GitHub visit and the "show me the AI" question currently deflate it |

**Top 5 gaps holding it back:** (1) zero reachable live inference; (2) zero downloadable artifacts; (3) zero tests/CI on the 23 labs, private repo; (4) monorepo presents as one project, not a portfolio of standalone projects; (5) closed inputs — reviewers can explore but not *bring anything*.

**Top 5 highest-leverage upgrades:** (1) surface the BYO-key pattern portfolio-wide — one shared "connect a model" affordance powering GAP-03/GAP-04/EL-10 live modes; (2) a client-side artifact generator (Markdown/PDF) shipped to six flagship labs; (3) vitest suites for every lab engine + GitHub Actions badge + public repo; (4) per-project presentation layer (project pages + per-project READMEs + screenshots/GIFs) without breaking the monorepo; (5) a Reviewer Mode that turns any lab into a guided 90-second walkthrough.

---

# SECTION 2 — Project-by-Project Gap Analysis

The portfolio decomposes into seven reviewable projects. Scorecards are 1–5.

## P1 · AI Program Command Center (Collection 1 shell: lifecycle, gates, ProgramState, story thread)
**Current perceived purpose:** prove end-to-end program thinking — Frame → Data → Build → Deploy → Govern → Realize with shared state and stage gates.
**Currently proves:** systems/sequencing thinking; state handoff between stages (`ProgramState` in localStorage); an unusual amount of connective tissue (story thread, program rail, handoff banners).
**Does not yet prove:** that the *program* produces anything an executive would sign; that gates are enforced rather than displayed; who the user is at each stage (persona is implicit).
**Feels shallow where:** stage-gate logic is navigational rather than consequential — nothing meaningful is blocked or unlocked by a gate decision; the Realize stage asserts value rather than reconciling it against the Frame stage's promises.
**UI/UX:** sidebar-heavy; a first-time reviewer lands without an orientation ("what is this, what do I click first"). Needs a 30-second orientation overlay and a visible "you are here" program map.
**AI/technical depth:** the lifecycle never touches a model; Build hands to the RAG lab but the loop back (eval results → gate decision) is loose.
**Enterprise workflow:** add a real gate artifact — a stage-gate decision record (approve/conditional/reject + rationale + signatory) generated at each gate.
**Interaction:** let the reviewer *fail* a gate and see downstream stages lock with an explanation.
**Business value story:** Frame's backlog promises value; Realize should reconcile promised vs realized per initiative — the missing money loop.
**Quality/testing:** program-core has tests (good); gate logic deserves property tests (no stage reachable with prior gate failed).
**Senior reviewer criticism:** "beautiful shell — where's the enforcement, and where's the sign-off?"
**10× more credible:** gate decision records (downloadable), value reconciliation in Realize, and one simulated mid-program incident that forces a re-gate.
**Scorecard:** AI 2 · Product 4 · UI/UX 4 · Enterprise realism 4 · Interactivity 3 · Artifacts 1 · Architecture 4 · Eval/measurement 3 · Storytelling 4

## P2 · RAG Quality Evaluator Dashboard (lab-rag dashboards: golden dataset, evals, failures, gates, traces)
**Currently proves:** evaluation vocabulary fluency — golden datasets, pass-rate gates, failure taxonomies, trace exploration; the strongest measurement story in the portfolio.
**Does not yet prove:** that the metrics arise from real evaluation runs; the scoring formulas exist in code (`scoring.ts`, `evaluation.ts`) but are under-explained on screen.
**Shallow where:** dashboards render authored `data/*.ts` — a reviewer who asks "run the eval again" has no button; failure heatmap doesn't link failed cases to their traces end-to-end.
**Improvements:** "re-run evaluation" over the deterministic evaluator with visible per-case scoring; formula popovers ("faithfulness = …"); a downloadable **RAG Quality Report** (golden-set results, gate status, failure Pareto, recommendation); connect a failed gate here to a Command Center gate decision.
**Senior reviewer criticism:** "is this a dashboard OF an evaluation, or an evaluATOR?" Make it the latter visibly.
**10× more credible:** press-to-re-evaluate + per-case score breakdown + exportable report; a "regression" toggle that degrades the answer set and shows gates catching it.
**Scorecard:** AI 3 · Product 4 · UI/UX 4 · Realism 4 · Interactivity 3 · Artifacts 1 · Architecture 4 · Eval 5 · Storytelling 4

## P3 · Live RAG Evaluator Lab (lab-rag live-lab: intake → chunk → retrieve → answer → evaluate, BYO-key)
**Currently proves:** the only place a real model can run (BYO-key via `llmProvider`), with a real deterministic fallback pipeline (lexical retrieval + query expansion + boilerplate suppression + grounded evaluation). This is your hidden crown jewel.
**Does not yet prove:** its own importance — it's buried as a C1 sub-tab; retrieval is lexical (fine, but say so louder: "deterministic lexical retriever; embeddings out of scope client-side — here's the tradeoff"); chunking strategy is not user-tunable enough to teach.
**Shallow where:** evaluation criteria visible in code but not narrated per answer; no side-by-side of two retrieval modes on the same question; token/cost panel exists but isn't tied to the answer quality tradeoff.
**Senior reviewer criticism:** an AI engineer will respect the honest lexical approach *if it's framed as a deliberate tradeoff* — and will ding it if it looks like it's pretending to be semantic search.
**10× more credible:** promote to a flagship standalone project; add chunk-size/overlap sliders with visible re-chunking; retrieval A/B (lexical vs expanded-query) on one question; per-answer evaluation narrative; downloadable eval transcript (JSON) + quality report (PDF/MD). With a key connected, badge flips live — the pattern the whole portfolio needs.
**Scorecard:** AI 4 · Product 3 · UI/UX 3 · Realism 4 · Interactivity 4 · Artifacts 2 · Architecture 4 · Eval 5 · Storytelling 2 *(worst storytelling : depth ratio in the portfolio — under-sold)*

## P4 · AI Governance Guardrails (govern routes + lab-governance: policies, risk, review queue, evidence, audit logs, RBAC/lens)
**Currently proves:** governance surface breadth — policies, risk tiers, review queues, audit evidence, maturity; rare in portfolios.
**Does not yet prove:** enforcement semantics. A guardrails demo should *block something*: show a use-case intake flowing to a tier, controls attaching, an approval gate, and a denied case with an appeal path.
**Shallow where:** the demo reads as a governance *catalog*; the review queue doesn't consume outputs of other projects (e.g., a failed RAG gate arriving as a review item).
**Senior reviewer criticism:** "governance theater vs governance function" — the difference is one enforced deny path.
**10× more credible:** an end-to-end case: intake → auto-tier (visible rubric) → controls checklist → human approval (with role switch via the existing RBAC/lens) → audit log entry appended → downloadable **audit evidence packet**. One case, fully traced, beats fifteen screens.
**Scorecard:** AI 2 · Product 3 · UI/UX 4 · Realism 4 · Interactivity 3 · Artifacts 2 · Architecture 3 · Eval 3 · Storytelling 3

## P5 · Agent & Protocol Labs (GAP-01…08 as one standalone project)
**Currently proves:** wire-level fluency (real JSON-RPC frames, typed −32602 errors), failure taxonomy + recovery policies, HITL autonomy economics, honest cost math. GAP-01/06/08 are excellent teaching instruments.
**Does not yet prove:** that the author has *run* agents — everything is a constructed trace. Post-remediation labeling is honest (verified), which protects integrity but concedes the point.
**Shallow where:** GAP-03's orchestration is a scripted animation (honestly labeled, still scripted); GAP-05's fidelity/risk curves are modeled guesses; no lab consumes a reviewer-supplied task.
**Senior reviewer criticism:** "you can read the wire — can you drive?" One live run answers it.
**10× more credible:** BYO-key live mode on GAP-03 + GAP-04 (reuse `llmProvider`); a downloadable orchestration transcript; GAP-01 gains a third system (read-only OT/manufacturing per the use-case layer) and an auth/negotiation frame to preempt "where's the rest of MCP."
**Scorecard:** AI 3 · Product 4 · UI/UX 4 · Realism 4 · Interactivity 4 · Artifacts 1 · Architecture 4 · Eval 3 · Storytelling 4

## P6 · Business of AI Suite (C3-1…5)
**Currently proves:** capital-allocation judgment with defensible math — stage-probability ROI, TCO flip conditions, utilization-driven crossover, tornado sensitivity, ranking fragility. The strongest collection as-built; CFO persona is well served.
**Does not yet prove:** portability to the reviewer's numbers (inputs are sliders over authored ranges, not enterable figures); no way to save/share a scenario; nothing exports.
**Senior reviewer criticism:** a CFO will ask "can I put OUR numbers in and take the one-pager to my steering?" Today: no and no.
**10× more credible:** numeric input fields alongside sliders; scenario save/share (URL-encoded state — you already have the `?uc=` pattern); **downloadable business case one-pager (C3-5), portfolio review pack (C3-1), TCO comparison (C3-2)**.
**Scorecard:** AI 3 · Product 5 · UI/UX 4 · Realism 5 · Interactivity 4 · Artifacts 1 · Architecture 4 · Eval 4 · Storytelling 5

## P7 · Engagement Leadership Suite (EL-01…10) + cross-cutting layer (use-cases, Atlas, Storylines)
**Currently proves:** the differentiator — instruments of the actual EM job (RAID trajectory, decision-forcing comms, adoption gates, no-bid discipline, bus-factor KT), grounded by résumé echoes and now by 30 EL use-cases with taught *lessons* per industry. The EL-04→EL-10 shared-data pipeline and the Storylines are the two most senior artifacts on the site.
**Does not yet prove:** artifact production (ironic — this collection *simulates* producing memos, briefings, change orders, checklists, and lets none of them leave the screen); collection-level identity (no `/engagement` index; the "control room" exists only as a landing shelf).
**Senior reviewer criticism:** "EL-10 writes a steering pre-read I can't take to steering."
**10× more credible:** downloads on EL-10 (pre-read as MD/PDF), EL-08 (change order), EL-05 (audit checklist), EL-07 (bid/no-bid memo), EL-02 (briefing); the C4 control-room index page with the live status strip; a fourth, *failure* storyline ("the program that should be stopped") — the bravest artifact a delivery leader can publish.
**Scorecard:** AI 3 · Product 5 · UI/UX 4 · Realism 5 · Interactivity 4 · Artifacts 2 · Architecture 4 · Eval 4 · Storytelling 5

---

# SECTION 3 — Senior Reviewer Red Flags

| # | Red flag | Why it's a problem | Where it appears | Severity | Fix | The better version |
|---|---|---|---|---|---|---|
| R1 | **"No model is ever called."** | The portfolio's noun is AI; its verb is never *infer*. Undermines the Senior-AI-Engineer lens entirely. | All 23 labs; BYO-key exists only in buried C1 live lab | **Critical** | Portfolio-wide "Connect a model" (BYO key, client-side, keys never stored server-side — there is no server) powering 3–4 labs' live modes | Badge flips LIVE on real runs; cached transcripts downloadable; the honesty system finally pays off with a contrast |
| R2 | **"It's a frontend."** | No tests on the labs, no CI, no API surface, private repo → reads as UI work | Repo root; `apps/web/components/*` (0 test files vs C1's 19) | **High** | Extract lab engines to `@labs/engines` (pure functions), vitest, GitHub Actions, badge in README, public repo | An engineering reviewer clones, `pnpm test`, sees 200+ green assertions over the exact formulas the UI shows |
| R3 | **"Dashboards, not tools."** | Nothing is produced; enterprise software emits artifacts | Every lab; EL-10/EL-08/EL-05 most painfully | **High** | Client-side artifact generation (MD download is one afternoon; PDF via print stylesheet already half-exists) | Every flagship ends with "Generate the memo →" and a file lands in Downloads |
| R4 | **"One site, not a portfolio."** | GitHub visit shows a monorepo; interview asks "show me A project" and everything routes home | Repo structure + navigation | **High** | Per-project landing pages + per-project READMEs + screenshots; keep the monorepo (see §13) | Seven crisp project pages, each README-ed like its own repo |
| R5 | **"Canned inputs."** | Exploration without contribution caps perceived realism | All except Live RAG lab, GAP-06 | Medium | Paste-your-own paths: GAP-04 (any text), EL-07 (paste RFP excerpt), C3 labs (numeric fields) | Reviewer feeds it their scenario in the interview and it holds up |
| R6 | **"Static metrics theater."** | KPIs that never move from real activity read as decoration to a QE | C4 status concepts; C1 dashboards | Medium | Tie displayed metrics to actual interaction state; label authored baselines explicitly (mostly done — finish it) | Every number is either computed from what the reviewer did, or labeled authored |
| R7 | **"Same-shaped labs."** | 23 labs share one interaction grammar (chips → sliders → panels → insight); pattern-fatigue by lab 6 | C2/C3/C4 | Medium | Vary the grammar on flagships: GAP-03 gets a canvas board; EL-10 gets a document editor feel; C3-1 gets a drag-to-gate table | Flagships feel like different *products*, not one component re-skinned |
| R8 | **"Private repo, no receipts."** | Claims can't be inspected; BUILD-LOG/QA culture invisible | GitHub | Medium | Public repo + surface BUILD-LOG, QA-REPORT, this review as `/how-its-made` | The audit trail becomes the differentiator it deserves to be |

---

# SECTION 4 — Feature Enhancement Backlog (grouped; the full field-set applied to the items that matter)

**1 · Must-have**
- **"Connect a model" (BYO-key live mode)** — Projects: P3/P5(GAP-03,04)/P7(EL-10). Problem: R1. User: technical reviewer. Flow: settings popover → paste key (session-only, memory) → badge flips LIVE → run executes → transcript savable. Tech: reuse `lab-rag/llmProvider.ts`; add a thin `runLive()` per lab with schema-checked outputs. Data: none stored. A11y/UX: key field masked, "keys never leave your browser" note. Acceptance: with key, GAP-04 extracts arbitrary pasted text and validation genuinely gates retries; without key, current behavior. Complexity **M** · Impact **High**.
- **Artifact engine** — Projects: EL-10, C3-5, C3-1, EL-05, EL-08, EL-07, P2. Problem: R3. Flow: "Generate →" button → client renders Markdown → download (.md) + print-to-PDF stylesheet. Tech: template literals over existing state; zero deps. Acceptance: 7 artifacts download with current scenario + assumptions + date + SIMULATED/LIVE provenance footer. Complexity **S–M** · Impact **High**.
- **Engine test suite + CI** — All labs. Problem: R2. Tech: extract pure functions (riskAdj, evaluate, cashflows/irr, cliff, readiness gate, healthIndex already exported) to `@labs/engines`; vitest; GH Action on push; badge. Acceptance: ≥150 assertions incl. edge cases (§10); CI green in README. Complexity **M** · Impact **High** (categorical, for engineering reviewers).

**2 · High-impact:** C4 control-room index with computed status strip (deferred F-5 — still the right call); numeric inputs beside sliders (C3 suite); scenario share-links (encode state in URL; `?uc=` proved the pattern); per-case eval re-run in P2.
**3 · Differentiating:** the failure storyline; "Verify this yourself" page (BUILD-LOG + QA + reviews + test badge); provenance-stamped artifact footers (every download carries its honesty labels — nobody does this).
**4 · Executive-facing:** EL-10 PDF pre-read; C3-1 "portfolio review pack"; a 90-second guided tour from the hero; board-level one-pager download on the Storylines page.
**5 · Technical-reviewer:** architecture page with data-flow diagram (registry → labs → atlas/storylines); "how the honesty system works" doc with the Provenance union inline; per-lab "view engine source" links to GitHub.
**6 · UI/UX:** orientation overlays on P1/P3; empty-state CTAs ("no key connected — run the cached demo or connect a model"); interaction-grammar variation on 3 flagships (R7).
**7 · Quality/reliability:** error boundaries per lab route; input validation on the new numeric fields; Lighthouse budget in CI.
**8 · Downloadable artifacts:** §6.
**9 · Demo storytelling:** Reviewer Mode (guided steps overlay per flagship: "1. Watch disputes… 2. Click the gap… 3. Open the pre-read"); "what changed?" toast when a use-case reconfigures the engine.
**10 · Interview walkthrough:** a `/walkthrough` route scripting the 12-minute demo path with deep-links; printable talking-points card per project (§13).

---

# SECTION 5 — Upgrade the Labs (against the ten-point lab-depth standard)

Scoring the current suite against your checklist (select inputs ✓ · configure assumptions ✓ · run analysis ✓ · intermediate steps ~ · metrics ✓ · compare scenarios ~ · risks/failure modes ✓ · decision/recommendation ✓✓ · **download artifact ✗ (0/23)** · behind-the-scenes ✓✓). The suite is already strong on 7 of 10; the systematic misses are **artifacts (all 23)**, **upload/bring-your-own (21 of 23)**, and **scenario comparison (side-by-side exists only implicitly)**.

Detailed upgrades for the five labs where depth most changes perception:

**GAP-03 Orchestration Board** — Current: scripted preset runs with honest labeling. Missing: real execution; message inspection. Upgraded experience: connect-a-model → type any goal → real decomposition with streaming statuses; click any A2A-style message to inspect its payload; failure injection mid-run (worker timeout → supervisor reassigns). New logic: `runLive()` with 4 role prompts + JSON-schema'd handoffs; transcript recorder. Artifacts: orchestration transcript (JSON) + one-page run summary. Metrics: real tokens/cost/latency vs single-agent run on same goal. Failure states: key invalid, model refusal, timeout → labeled degradation to cached. Impressive because: it converts the portfolio's weakest honesty concession into its strongest proof.

**Live RAG Evaluator (P3)** — Current: upload → pipeline → answer → evaluation, under-narrated. Missing: tunable chunking, retrieval A/B, per-criterion narrative. Upgraded: chunk-size/overlap sliders re-chunk visibly; ask once, compare two retrieval modes side-by-side with score deltas; evaluation panel explains each criterion's evidence spans. Artifacts: eval transcript JSON + RAG Quality Report MD. Failure states: unparseable file, empty retrieval, hallucination-flagged answer (show the catch!). Impressive because: a reviewer watches a hallucination get caught by the evaluator — the whole RAG-quality argument in one moment.

**EL-10 Exec Comm Studio** — Current: generates pre-read on screen. Missing: the artifact leaving the screen; live talk-track. Upgraded: Generate → downloadable pre-read (MD/PDF) with provenance footer; with key, talk track generates live per section while structure stays fixed. Failure: model unavailable → templated track, labeled. Impressive because: the interviewer leaves holding a document your tool wrote.

**C3-1 Portfolio Dashboard** — Add: edit any initiative's value/spend/stage inline (numeric), watch the kill/scale/hold call flip; save scenario to URL; download the portfolio review pack (per-initiative math appendix). Failure: nonsensical inputs (negative spend) validated with helpful errors. Impressive because: a CFO stress-tests their own book against your thresholds.

**EL-07 RFP War Room** — Add: paste-an-RFP-excerpt path → naive requirement extraction (regex/heuristic, honestly labeled; live extraction with key); bid/no-bid memo download. Impressive because: it stops being a demo about *an* RFP and becomes a tool for *their* RFP.

For the remaining labs: uniform additions only — artifact button where a document already exists in-state (EL-02 briefing, EL-05 checklist, EL-08 change order, C3-2/3/5 summaries), numeric-entry beside sliders, and a one-line "compare to default" delta strip when a use-case payload is active.

---

# SECTION 6 — Downloadable Artifact Strategy

Principle: every artifact carries a **provenance footer** (generated date · scenario · SIMULATED/LIVE · assumptions hash) — extend the honesty doctrine into the filesystem. Format default: Markdown (native to your stack, zero deps) + print-CSS PDF; JSON for machine artifacts; CSV where tabular.

| Artifact | Project | For | Contents | Populated from | Format | Trigger | Reviewer inference |
|---|---|---|---|---|---|---|---|
| Steering pre-read | EL-10 | Sponsor/CIO | Status·Decisions·Risks·Asks + talk track | live state | MD+PDF | Generate button | "Writes what leadership actually reads" |
| Business case one-pager | C3-5 | CFO | NPV range, IRR, payback, tornado, verdict | live inputs | MD+PDF | On exec-slide panel | Financial fluency, range-thinking |
| Portfolio review pack | C3-1 | Exec committee | 12 initiatives, math appendix, kill list | live state | MD+PDF | Header action | Capital allocation discipline |
| Change order | EL-08 | Client PMO | Scope delta, schedule/margin ripple, approval line | change-control state | MD | After scope change | Commercial rigor |
| Bid/no-bid memo | EL-07 | Pursuit board | Gates, fit×win×capacity×margin, decision | war-room state | MD | On verdict | Qualification discipline |
| Audit-readiness packet | EL-05 | Compliance | Tier, controls met/gap, evidence checklist | navigator state | MD+PDF | Existing print, upgraded | Governance function, not theater |
| Stakeholder briefing | EL-02 | Account lead | Who/what/whom-by-when per drifting stakeholder | cockpit state | MD | On flag click | Political craft |
| RAG quality report | P2/P3 | Eng lead | Golden-set results, gates, failure Pareto, recommendation | eval run | MD + JSON transcript | Post-eval | Measurement discipline |
| Orchestration transcript | GAP-03 | AI engineer | Full message log, tokens, cost, timings | live/cached run | JSON | Post-run | "Has actually run agents" |
| Gate decision record | P1 | Program board | Stage, evidence reviewed, decision, conditions | gate state | MD | At each gate | Program governance |
| Risk register | P1/EL-04 | PMO | RAID export with sev/owner/trend | portfolioData | CSV | Header action | Operational rigor |
| Adoption readiness memo | EL-01 | Change lead | Factor scores, gate verdict, 2-week plan | instrument state | MD | On verdict | Change management depth |
| Use-case brief | UC pages | Anyone | The analyst brief + sources | registry | MD | On UC page | Research honesty travels |
| Interview walkthrough card | site | You | 12-min path + talking points | storylines | PDF | /walkthrough | Preparedness |

Skip (over-building): DOCX anything, incident response plan, UAT summary, PRD — generate only what a lab already computes; invented paperwork reads as padding.

---

# SECTION 7 — Better Interaction Opportunities (highest-yield ten)

1. **Connect-a-model settings** (site chrome): powers R1; masked input, session-only; instantly reframes the whole portfolio.
2. **Numeric entry + sliders** (C3 suite, GAP-06): sliders demo, fields work; both bound to the same state.
3. **Scenario share-links** (all labs): serialize key state to query params (pattern proven by `?uc=`); "Copy scenario link" affordance; reviewers share configured states.
4. **Reviewer Mode** (flagships): `?tour=1` overlays 3–5 numbered callouts scripting the aha; powered by a tiny steps array per lab.
5. **Simulated incident** (P1/EL-04): one button — "week 7 happens" — disputes turns red, RAID updates, EL-10's pre-read rewrites; shows the system is alive.
6. **Approval workflow with role switch** (P4): submit → switch role to approver (existing lens/RBAC) → approve/deny with rationale → audit log appends; enforcement made tangible.
7. **"What changed?" delta strip** (all use-case labs): when a payload reconfigures the engine, a one-line diff ("volume 1M→4.2M · sensitivity High"); makes reconfiguration legible.
8. **Compare mode** (GAP-05, C3-2, P3): pin scenario A, run B, see deltas — the analyst's basic move, currently absent.
9. **Explain-this-metric popovers**: already half-built (`MetricTooltip`); ensure every computed number has one with its formula.
10. **Hallucination catch demo** (P3): a pre-staged question whose answer fails grounding; the evaluator flags it live — the single most persuasive AI-quality interaction available to you.

---

# SECTION 8 — UI/UX & Presentation

Strengths to keep: information density, semantic color discipline, credibility blocks, focus states, reduced-motion, print styles.

| Problem | Change | Why | Example copy | Notes |
|---|---|---|---|---|
| Landing assumes context | Add a 2-line orientation above shelves + "Start the 90-sec tour" | Cold reviewers act within 10s or bounce | "23 working instruments for AI delivery decisions. Every badge is honest. Start with the tour, or open any tile." | One CTA, not three |
| Labs open cold | 1-line "what to do first" hint under each lab title | Reduces time-to-aha | "Try: raise autonomy to L3 and watch item 14." | Dismissible, remembered in localStorage |
| No error boundaries | Per-route error boundary with a human message | A crashed lab = broken window | "This instrument hit an error. The rest of the portfolio is unaffected — [reload] [report]" | Next `error.tsx` per segment |
| Hover-only quick-look (tiles) | Add focus/tap equivalent | Touch + keyboard parity | — | `:focus-within` + tap-toggle |
| Slider-label association | `htmlFor`/`aria-label` pass on all inputs | WCAG claim currently unsupportable | — | Half-done (dots fixed); finish forms |
| Mobile dense tables | Card-collapse below 640px for the 4 heaviest tables | Recruiters open on phones | — | C3-1 financials, EL-05 controls, EL-07 matrix, P2 traces |
| README = internal docs | Rewrite as portfolio front door (§13) | GitHub is a primary surface | — | Screenshots > prose |
| Generated docs styling | Print stylesheet for artifact routes | PDF artifacts inherit credibility | — | Extend existing `@media print` |

---

# SECTION 9 — Technical Depth Upgrade

**Portfolio-wide:** (1) `docs/ARCHITECTURE.md` with two diagrams — build-time data flow (registry/use-cases → static pages → atlas/storylines) and runtime flow (state → engines → UI → artifacts); publish on-site at `/architecture`. (2) Extract engines to `@labs/engines` with JSDoc'd formulas — the single highest-leverage refactor: enables §10's tests, per-lab "view source" links, and a credible "engine, not UI" narrative. (3) An ADR set (5–7 records: static-export-no-backend; deterministic-over-fake-AI; honesty-as-types; monorepo-with-standalone-faces; BYO-key-client-side). ADRs are senior-engineer catnip and cost an hour each.
**P1:** document the ProgramState machine (states, transitions, gate invariants); add the gate-enforcement property tests.
**P2/P3:** document scoring formulas on-screen; expose retrieval internals (query expansion terms, boilerplate ratio per chunk) in a collapsible trace — the code already computes them.
**P4:** define the tiering rubric as data (like the registry) so the auto-tier decision is inspectable; log every state change to the visible audit log.
**P5:** the `runLive()` layer with schema-validated outputs; GAP-01 gains an auth/negotiation frame mock.
**P6/P7:** input validation layer (zod is fine even client-side) once numeric entry lands; URL state serialization.
**Security/limits (say, don't hide):** a visible `/limitations` note — no server, keys in memory only, deterministic engines are models *of* behavior not benchmarks, sample data is authored. You already write this per-lab; roll it up.

---

# SECTION 10 — Quality Engineering Review

Current state: 19 test files, all in C1 packages (rag/framing/deploy/realize/governance/program-core) — genuinely good. **The 23 labs: zero.** No CI. No e2e. A11y partially fixed (dots), forms unfinished.

**Priority test targets (highest information-per-test):**
- `riskAdj`/`recommend` (C3-1): kill iff risk-adj < 0; scale requires all three conditions; boundary at exactly 1.5× spend.
- `cashflows/npv/irr/payback` (C3-5): IRR bisection converges on known cases; payback interpolation at exact year boundaries; negative-NPV cases.
- Cliff math (C3-3): utilization ↓ ⇒ cliff month monotonically ≥; no-cliff case returns −1 → "—".
- `evaluate()` (GAP-07): each protocol dominates its designed quadrant; hybrid only when MCP∧A2A strong.
- HITL policy (GAP-08): L2 reviews all four edges; L3 slips exactly the two medium edges; exposure sum matches severities.
- `healthIndex`/gap detection (EL-04): index bounds; reported≠actual counting.
- Readiness gate (EL-01): threshold boundaries; weakest-factor plan selection.
- MCP validation (GAP-01): required-missing and type-mismatch both produce −32602 with correct `param`.
- `assertUseCases`: rejects empty sources, bad dates, unsigned first-hand (the honesty system, tested).
- Deep-link hook: valid id selects once; invalid no-ops; absent no-ops.

**Edge cases to add to engines:** zero-volume (C3-2/3, GAP-06), 100% cache share, single-workstream scenarios, all-green portfolios (EL-04 empty-gap message — exists, test it), tornado with inverted low/high.
**Quality gates:** CI = typecheck + vitest + build + Lighthouse budget (≥90 while iterating, 95 target). Release = CI green + manual 375px pass on the 4 dense tables.
**README documentation:** test philosophy ("engines are pure and tested; UI is thin"), how to run, coverage focus.
**Failure scenarios to handle in UI:** invalid BYO key, model refusal/timeout, unparseable upload (P3), nonsense numeric input, localStorage unavailable.

---

# SECTION 11 — Business & Financial Depth

Already strong: C3 is a genuine CFO story (ranges, sensitivity, flip conditions, utilization truth-telling). Gaps:
1. **The money never leaves C3.** P1's Realize stage and C4's delivery labs don't reconcile to C3's promises. Add the value-reconciliation loop (Frame promised → Realize measured → variance narrative). One shared number thread = operating-model maturity.
2. **Cost of poor quality is missing.** P2/P3 measure quality but never price failure. Add a simple CoPQ panel: hallucination rate × volume × cost-per-incident (editable) — connects eval discipline to dollars, which is exactly how a senior leader justifies eval spend.
3. **Cost of delay absent in EL-07/EL-08:** a one-line "each month of slip ≈ $X of unrealized value" derived from the case's own numbers.
4. **Assumptions want a face:** a visible assumptions drawer per financial lab (some have it; standardize) + assumptions echoed in every downloaded artifact.
5. **First-hand economics under-used:** your $4M cost-avoidance and 4.5× scale stories appear as echoes but never as worked examples — GAP-06's "portfolio preset" should explicitly say "shaped like the engagement where caching+batching avoided $4M+."
What this buys you in the room: every executive conversation lands on "what did it cost, what did it save, what would you cut" — these four additions let every project answer in its own numbers.

---

# SECTION 12 — Product Roadmap (each phase independently shippable)

| Phase | Objective | Projects | Includes | Why now | Acceptance | Difficulty | Reviewer impact | Risks/Deps |
|---|---|---|---|---|---|---|---|---|
| **1 · Credibility fixes** | Kill R2/R8 basics + finish a11y | All | Public repo, engine extraction start, vitest on 6 core engines, CI badge, error boundaries, forms a11y pass, el09 label softened | Cheapest categorical signals; gates everything | CI green public; ≥60 assertions; axe clean on 3 flagships | M | High (eng) | None |
| **2 · Interaction depth** | Kill R5 partially | C3, GAP-06, all | Numeric inputs, scenario share-links, delta strip, explain-metric completion | Builds on stable engines | Any C3 scenario reproducible from a URL | M | High (all personas) | Phase 1 refactor |
| **3 · Lab upgrades** | Kill R1 | P3, GAP-03/04, EL-10 | Connect-a-model, live modes, hallucination-catch demo, P3 promoted + narrated | The AI in the AI portfolio | With key: 3 labs run genuinely LIVE, honestly badged; without: unchanged | M/L | **Highest** | Key handling UX |
| **4 · Artifacts** | Kill R3 | 7 flagships | Artifact engine + provenance footers + §6 table rows 1–9 | Turns demos into tools | 9 artifacts download populated from live state | M | High (exec + PM) | None |
| **5 · Architecture & testing** | Complete R2 | All | Full engine test suite, ADRs, /architecture page, data-flow diagrams, Lighthouse budget | Depth story consolidated | ≥150 assertions; ADRs published; Lighthouse ≥95 | M | High (eng) | Phase 1 |
| **6 · Executive polish** | Kill R4/R6 + storytelling | Site + P7/P1 | Per-project pages/READMEs, C4 control-room index, reviewer mode, walkthrough route, failure storyline, value-reconciliation loop | Presentation last, on real substance | 7 project pages each self-explanatory in 60s | M/L | High (CEO/hiring) | Phases 3–4 content |

---

# SECTION 13 — GitHub & Portfolio Presentation

**Repo strategy (resolves the standalone contradiction without re-architecture):** keep ONE public monorepo, present SEVEN projects. (a) Root README becomes a portfolio index: one screenshot + 3 lines + live link + docs link per project. (b) Each project gets `docs/projects/<name>/README.md` (or package-level README) with the full standalone treatment. (c) Each project gets an on-site landing page (`/agents`, `/business`, `/engagement`, plus P1–P4 anchors) that works as the "live demo home." Splitting into 7 repos would cost you the shared kit and the honesty system — don't.

**Per-project README structure:** hero screenshot/GIF → what this demonstrates (3 bullets tied to decisions) → why I built it → architecture sketch → how to run → how to use the lab (3 steps) → technical decisions (link ADRs) → tradeoffs & limitations (reuse your limitation notes — they're already written) → tests (badge + what's covered) → roadmap → interview walkthrough (the 3 questions this project answers).
**Screenshots/GIFs needed (minimum):** landing hero; EL-04 gap surfacing (GIF); EL-10 audience flip (GIF); C3-1 kill-list; GAP-01 error frame; P3 pipeline run (GIF); Atlas matrix; a storyline.
**Live landing page:** current hero is right; add the tour CTA and a "seven projects" strip so the standalone frame is visible on-site too.
**LinkedIn:** post per project, not per site — one GIF + the decision it maps to + the use-case page link (those 69 SEO pages are made for this).
**Interviews:** lead with a storyline, not a lab ("let me walk you through delivering a disputes program"); name the honesty system explicitly; volunteer the weakest point before they find it ("everything deterministic is labeled — and here's the one that runs live").
**Remove/soften:** "LIVE-ready" phrasing anywhere it survives (comment residue in `OrchestrationBoard.tsx` lines 9–10); `el09-fintech` first-hand label; the governance app's breadth claims until the enforcement path ships.

---

# SECTION 14 — Prioritized Master Backlog

| P | Project | Recommendation | Category | Persona | Problem | Sr-reviewer value | Cx | Impact | Acceptance |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Cross | Connect-a-model + 3 live labs | Must-have | AI engineer | R1: no real inference | Converts the core weakness into the headline | M/L | **Critical** | Key → LIVE badge → real run → transcript download; no key → unchanged |
| 2 | Cross | Engine extraction + vitest + CI + public repo | Must-have | Eng reviewer | R2 | "This is engineering" in 30s of repo reading | M | High | CI badge green; ≥150 assertions |
| 3 | EL-10/C3-5/C3-1/EL-05 | Artifact engine wave 1 | Must-have | Exec/PM | R3 | Tools, not dashboards | M | High | 4 artifacts with provenance footers |
| 4 | P3 | Promote + narrate Live RAG lab; hallucination-catch | High | AI engineer | Buried crown jewel | Real pipeline, real catch, real eval | M | High | Standalone page; catch demo works |
| 5 | Site | Per-project pages + READMEs + screenshots | High | Hiring VP | R4 | Portfolio of projects, not one site | M | High | 7 pages, each self-sufficient |
| 6 | C4 | Control-room index + status strip | High | Hiring VP | Thesis unbuilt | Structural contrast visible | M | High | Strip computes from lab state |
| 7 | C3 suite | Numeric inputs + share-links | High | CFO | R5 | "Run OUR numbers" | S/M | Med-High | URL round-trips a scenario |
| 8 | P4 | One enforced approval path + evidence packet | High | COO | Governance theater | Function over catalog | M | Med-High | Deny path + audit log + download |
| 9 | P1 | Gate decision records + value reconciliation | Diff | COO/CFO | Money loop open | Program governance proof | M | Med | Gate record downloads; Realize vs Frame variance shown |
| 10 | Storylines | The failure storyline | Diff | All | Everything succeeds | Senior = knowing when to stop | S | Med-High | Published, honest, sourced |
| 11 | Cross | Reviewer Mode on 5 flagships | Demo | Interviewer | Unguided demos | Controlled walkthroughs | S/M | Med | `?tour=1` works on 5 labs |
| 12 | Cross | ADRs + /architecture | Tech | Eng reviewer | Invisible decisions | Senior judgment documented | S | Med | 6 ADRs + diagram live |

---

# SECTION 15 — Final Recommendation

**Fix first (this week):** ship Phases C/D (verified above — push it); then the two label fixes (el09 → studied; GAP-03 comment residue); then public repo + CI + first 60 engine assertions. These are the cheap categorical signals.

**Build next (the one big thing):** the **live-inference layer** — connect-a-model powering GAP-03, GAP-04, EL-10, and the promoted Live RAG lab. Everything else on this list improves the portfolio; this one changes its category. Your honesty system is *waiting* for this: SIMULATED labels only fully pay off when something genuinely flips to LIVE beside them.

**Remove/simplify:** the "LIVE-ready" vocabulary until live exists; the el09 first-hand label; nothing else — resist adding labs (23 is already past the attention budget; the 24th lab is worth less than the 1st test).

**Deepen:** the Live RAG lab (your most under-sold asset), P4's single enforced approval path, and the C3↔Realize money loop.

**Make downloadable:** the nine wave-1 artifacts in §6 — starting with EL-10's pre-read, because it's the artifact of the job you're interviewing for.

**Make interactive:** numeric inputs, share-links, the incident button, the hallucination catch.

**Highlight in interviews:** Storyline 1 as the spine of your walkthrough; the provenance type-union as your "how I think about integrity" answer; EL-04→EL-10 as your "systems, not screens" answer; the (new) test badge as your "and it's engineered" answer.

**Avoid overbuilding:** more labs, more use-cases beyond 69, DOCX/PPT generation, embeddings-in-browser, a backend, per-use-case OG rasterization, and any new collection. The portfolio's problem was never quantity. Make what exists execute, emit, and withstand inspection — that's the difference between "impressive candidate website" and "I want this person running our AI program."

---
*Scores and findings trace to specific files and prior verified reads; where a claim rests on sampling rather than exhaustive read (P1/P2/P4 internals), the sampling is disclosed in the header. This review supersedes no prior document; it adds the standalone-project lens requested on 2026-07-04.*
