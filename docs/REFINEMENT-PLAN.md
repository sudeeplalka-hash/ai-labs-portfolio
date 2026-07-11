# Command Center Refinement — QA findings & execution plan

_2026-07-11. Evidence: live browser sweep of all seven stages at build `c6aa6e1`, plus code-level
inspection. Scope per direction: refine EXISTING labs only — UI/UX, information flow, page structure,
presentation. No new labs (CLAUDE.md Redundancy Gate applies)._

## A. Findings

### P0 — Coherence breakers (the "built on the fly" tells)

1. **Demo-state contradictions across stages.** Govern shows a "No live initiative loaded" banner
   directly beneath a sidebar that names the current initiative ("Support operations agent") and a
   stepper reading "Govern Approved". Deploy's release blockers claim "Data lab not run" and "No eval
   run recorded" while the same screen's stepper shows Data 74 and Build 91. Each widget seeds or
   checks its own idea of demo state. → ONE seeded program fixture, all banners/blockers/steppers
   DERIVED from it; a contradiction becomes impossible by construction.
2. **Stage 04 identity crisis.** Sidebar/route say "Deploy"; the hero says "STAGE 04 · OPERATE,
   AI OPS · MLOPS · LLMOPS"; the browser title says "AI Ops"; stage 07 is ALSO "Operate". A past
   rename stopped halfway. → Settle vocabulary: 04 = "Deploy · AI Ops" (make it run), 07 =
   "Operate · Day Two" (keep it running); apply in sidebar, stepper, PageIntro, titles, handoffs.
3. **Misrouted blocker actions.** All four release blockers link "fix in Deploy →" even when the
   blocker originates in Data or Build. → Each blocker routes to its source stage, labeled honestly.
4. **Realize verdict defects.** "paying for itself in 1 months" (pluralization); handoff strip says
   "$2.4M/yr" while the verdict banner says "$2,545k/yr" — two formats AND two numbers for one fact.
   → shared `formatMoney`/`formatDuration` utils + both components reading one computed source.

### P1 — Structure & navigation

5. **Triple-header stack on every stage.** Page header ("Build · RAG — Prove the engine…") + handoff
   card ("03 · BUILD · RAG — Which engine, and does it actually work?") + hero ("STAGE 03 · BUILD —
   Does the engine actually work?") ask the same question three ways and push real content below the
   fold. → Merge the handoff strip into PageIntro: one stage question, in/out chips, one metric line.
6. **Three subnav generations, two sources of truth.** Data renders flat chips; Build renders a flat
   10-item row; Govern renders grouped rows; Deploy/Realize render nothing. The sidebar's SUBNAV
   config and the per-stage *Subnav components already disagree (Build's groups exist only in the
   sidebar). → One nav config exported from @labs/kit, consumed by BOTH the sidebar and a single
   shared StageSubnav component (Govern's grouped pattern as the standard); Deploy/Realize get their
   section entries.
7. **Cryptic stepper values.** "75 · 74 · 91 · 69 · Approved · 180% · 4" — mixed units, no labels,
   no tooltips. → Unit-aware labels + hover tooltips ("Data readiness 74/100", "ROI 180%",
   "4 open signals").
8. **Sidebar truncations.** "Strategy…", "Build · R…" truncate at default width. → Shorten display
   labels or widen the rail column.

### P2 — Polish

9. **Unexplained top-right controls.** "Live lab | Demo" pill and "Knowledge assistant" dropdown
   carry no affordance for first-time visitors, and "Demo" overlaps confusingly with the
   LIVE/SIMULATED badge vocabulary. → tooltip + one-line explainer; align naming.
10. **Operate's step duplication.** Watch/Decide/Loop-back appears as three cards AND three buttons
    in the same viewport. → one interactive stepper.
11. **Copy + number-style pass.** Money ("$24k/month" vs "$2,545k/yr" vs "$2.4M/yr"), percent,
    latency ("p95 1.40s") formats unified via the shared formatters; em-dash policy per the owner's
    earlier cleanup; sentence-case consistency.
12. **Unverified lanes, listed honestly:** mobile/responsive behavior, empty states for a fresh
    visitor (no localStorage), keyboard/a11y on the interactive labs. Each needs its own pass.

### What already reads as refined (do not touch)
Operate's narrative frame ("Govern asked allowed; Realize asked worth it; this asks still working"),
the Corpus lab end-to-end, LB-03's eval bench, Frame's hero + dual CTA, the gated-spine story.

## B. Root causes
- Stage pages built in waves, each wave with its own idioms (three subnav generations visible).
- Demo state seeded per-component rather than one program fixture.
- No shared formatting utilities; each component formats money/time/percent ad hoc.

## C. Execution plan — three shippable phases

**Phase R1 · Coherence (P0.1–4).** One demo fixture in @labs/program-core; banners, blockers,
steppers, handoff strips all derive from it; stage-04 naming settled everywhere; shared formatters +
pluralization; Realize verdict single-sourced. Engine-level, test-backed (fixture invariants:
"no widget may contradict the fixture"). ~Largest risk reduction per line changed.

**Phase R2 · Structure (P1.5–8).** PageIntro absorbs handoff strips (one header per stage); kit nav
config feeding sidebar + shared StageSubnav; stepper labels/tooltips; rail label fixes. Pure
presentation, no engine changes.

**Phase R3 · Polish (P2.9–12).** Control affordances, Operate stepper merge, copy/number pass, then
the mobile + empty-state + a11y audits as their own verified lanes.

Every phase ships alone: gates (tsc, eslint, vitest) → push → stamp verify → before/after
screenshots in the browser.

## D. Out of scope
New labs, new collections, new deps, backend anything. Refinement only.
