# Operate Stage — Build Handoff (Fable → Opus)
**Date:** 2026-07-04 · **Spec:** `SPEC-OPERATE-STAGE-V2.md` (binding) · **Status:** core build COMPLETE by Fable 5; verification + 5 small follow-ups remain.

## What Fable built (done, awaiting local gate)

**Engine — `packages/program-core/src/operate-day2.ts` (new):**
`deriveOpsSeries` (seeded 12-week deterministic history; canary baseline traces to Build's `rag.contract.faithfulness`; SLOs engineered green while canary decays; week-7 incident onset) · `detectSignals` (silent-drift / staleness-breach [tier-tightened] / cost-creep / agent-anomaly, each with detection rationale) · `valueAtRisk` (reads `outcomes.riskAdjustedValue` + `outcomes.adoption`, honest defaults) · `deriveDay2Incident` (4 options: reindex→build, retrain→build, rollback→deploy, rescope→frame) · `buildOperateFeedback` (typed loop-back contract) · `buildWeeklyOpsReview` + `buildIncidentReport` (markdown artifacts with provenance footers).

**Tests — `packages/program-core/src/operate-day2.test.ts` (new):** determinism, bounds, the engineered silent-drift trap, staleness jump at INCIDENT_WEEK, detector evidence, tier-tightening, VaR defaults/bounds, option→loop-target routing (never crossed), artifact content incl. SIMULATED footer. ~30 assertions.

**UI — `apps/web/components/stages/OperateStage.tsx` + `apps/web/app/operate/page.tsx` (new):** three views (Health board with the SLO-vs-canary trap chart · Incident arc with the four-option decision + downloadable incident report · The Loop rendering the feedback contract with links into Frame/Build/Deploy/Realize/Govern) · weekly-ops-review download · full credibility block · **gate: locked until `progress.deploy === "done"` or `seededSample`** (placed after Realize, scoped from Deploy).

**Wiring (edited):**
- `types.ts` — `StageKey` + `"operate"`.
- `store.ts` — both `progress` literals gained `operate: "active"`.
- `stages.ts` — 7th STAGES entry (`n:"07"`, `/operate`, sub "loop"); **stage 04 relabeled "AI Ops"→"Deploy"** with day-0/1 `will` (boundary rule §2); Realize's `raises` now hands to Operate.
- `ProgramRail.tsx` — SHORT_LABEL: `deploy:"Deploy"` (was mislabeled "Operate"), `operate:"Operate"` added.
- `Sidebar.tsx` / `Home.tsx` / `StorylineView.tsx` — ICONS gained `operate: RefreshCcw`.
- `AppShell.tsx` — StoryThread guarded for `stage !== "operate"` (no story beat yet).
- `program-core/index.ts` — exports the new engine.
- `kit/registry.ts` — `C1-operate` LabEntry (in-build, SIMULATED, `/operate`) + Domain 2 labIds/claim.
- `kit/labs.ts` — `LAB_ROUTES["C1-operate"]`.
- `kit/storylines.ts` — Storyline 1 gains the closing "…then run it" step (labId `C1-operate`).
- `app/sitemap.ts` — `/operate`.

## Opus: verify first (the gate)
1. `pnpm typecheck && pnpm test && pnpm build` locally — the authoritative gate (sandbox couldn't run it). Likeliest issues: (a) `Initiative.name` nullability in `deriveOpsSeries`/`deriveDay2Incident` (uses `s.initiative?.name ?? …` — if `name: string | null`, `??` handles null fine); (b) any archetype variant in `store.ts` that overrides `progress` beyond the two literals I patched (grep `progress:` — I found exactly two); (c) unknown `Record<StageKey,…>` initializers outside the five files patched (grep `Record<StageKey`).
2. Visual pass at 375px on the three views; the trap chart scrolls horizontally by design.

## Opus: remaining work (in order)
1. **Story beat** — author the `operate` StoryBeat in `story.ts` STORY_SPINE (pattern-match Realize's), then remove the AppShell guard. Keep the voice: "the running system teaches the next Frame."
2. **Sidebar SUBNAV** *(optional)* — add an Operate group (Health / Incident / Loop as hash links) if you convert views to hash-routing like Deploy/Realize; otherwise skip.
3. **Selectors** — add an `operate` headline in `selectStageHeadlines` (e.g., value = open-signal count, detail = "N signals · $Xk value at risk"). Currently absent = rail chip renders without a number (graceful, but the chip's tooltip falls back to the stage question).
4. **Changelog entry** — dated: "Operate — the 7th stage: day-2 observability + the loop back to Frame."
5. **Persist the loop-back** *(the one real feature left)* — on decision, write `buildOperateFeedback` output into ProgramState: `iteration.recommendedNextAction` (Frame re-scope), a Build task surface, and Govern's evidence pack via the existing `govern.ts` "operate" evidence section. The typed contract is ready; wiring is deliberately left to you because it touches `store.update` semantics.
6. **Do NOT** (spec §10): more views, alert-config UI, more incidents, a use-case rail on this stage.

## Notes for the reviewer-facing story
The relabel of stage 04 to "Deploy" + this stage's arrival resolves the old Deploy/"Operate" naming conflation flagged in review. The two downloads here are the portfolio's first real artifact-engine implementations — reuse the `downloadMd` pattern for EL-10/C3-5 next (gap-analysis §6 wave 1).
