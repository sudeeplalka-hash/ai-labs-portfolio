# SPEC — Data Lab · Corpus Intelligence Program
### Phased build plan + cross-lab wiring for the roadmap in DATA-LAB-DQ-GAP-ANALYSIS.md

**Date:** 2026-07-07 · **Status:** ALL PHASES COMPLETE (0–5, 2026-07-07). The Corpus Intelligence program shipped: readiness board, remediation backlog, duplicate/version resolution, PCA corpus atlas (2D/3D), parsability/language/topic signals, cleaning-to-quality proof, readiness dossier, registry + changelog + guide closure. Production build verified in CI/Vercel per push (sandbox window constraint documented in Phase 1). Note: Phase 1 sandbox gate ran tests + typecheck; the full production build gate runs in CI/Vercel on push (sandbox call-window too short for a cold compile).
**Scope:** F-1…F-10 (rev 2 roadmap) delivered in **six phases (0–5)**, est. 6–8 working sessions.
**Doctrine:** every phase ends green (typecheck · tests · lint · build · link audit), every new score ships with engine tests, every state write follows the signature pattern and extends `writer-chain.test.ts`, honesty badges throughout.

---

## 1. Verified wiring baseline (what exists today — the plan builds on these, not around them)

| Producer → Consumer | Mechanism (verified in code) | Status |
|---|---|---|
| Data → Build | `handoff.blockedSources` excluded by hybrid re-rank (`RetrievalModes.tsx:23`, live mode); `knownDataRisks` → Build failure modes (`contracts.ts:95`) | ● Existing |
| Data → Govern | Each blocked source becomes a **High-severity open finding** with owner + due stage (`deriveOpenFindings`, `contracts.ts:364`) | ● Existing |
| Govern → Realize | Findings/tier feed the risk discount (existing chain) — Data changes reach Realize **through** Govern; no new plumbing needed | ● Existing |
| Live session → ProgramState | `DataSliceWriter` bridges lab-data sessions into `d.data.*`; `DataHandoffCard` derives the contract | ● Existing |
| Corpus math | `analyzeCorpus()`: TF vectors, Jaccard pairs (duplicate/stale-version/near-duplicate), computed 2D projection | ● Existing |
| Projection math | `pca3` power-iteration PCA + canvas 3D renderer in `lab-rag` | ● Existing (Build only) |

The program's biggest wins are *free consequences* of writing into contracts that downstream stages already read.

## 2. Phases

### Phase 0 — Shared math + findings spine *(foundation, no UI)*
- Lift `pca3` + vector helpers out of `lab-rag` into **`@labs/kit`** (single source of truth for projection math); `lab-rag` re-imports; port its tests + add parity test (same input → same components) so the Build projector provably doesn't change.
- Define the unified findings model in `lab-data` engine: `CorpusFinding` (file, category, severity, recommendation, fixId, status) + per-category corpus rollups derived from existing checks.
- Add two new pure engine scores with tests: **content concentration** (n-gram repetition/boilerplate density) and **topical cohesion** (centroid distance over existing TF vectors).
- Gate: all suites green; no visual or contract change anywhere.

### Phase 1 — Corpus Readiness Board + Remediation Backlog *(F-1 + F-3)*
- Board UI on `/data`: per-category corpus scores (8 existing + 2 new) with one-line definitions, per-file × category matrix, cell → file findings drawer; gate verdict stays the headline.
- Backlog ledger: all `CorpusFinding`s across the session — sortable, fix/accept-risk actions re-score live via `scoreWithFixes`.
- **Wiring:** `remediationBacklog` on the handoff graduates from strings to structured entries (additive optional fields — shallow-merge safe, **no STATE_VERSION bump**); extend `deriveOpenFindings` to surface top open backlog items in Govern alongside blocked sources; audit evidence pack picks them up automatically.
- Writers touched: `DataHandoffCard` derivation (sig unchanged — inputs only). Extend fixed-point test.
- Demo-mode parity: authored Board/Backlog equivalents added to the six demo archetypes so Demo stays curated.

### Phase 2 — Version & Duplicate Resolution *(F-2)*
- Engine: duplicate **sets** via connected components over existing pairs; per-set recommendation (keep-latest / archive / merge) from recency + version markers; tests incl. chain convergence.
- UI: resolution drawer (from Star Map edge click or Board), accept/override per set.
- **Wiring payoff (zero new downstream code):** accepted exclusions write `blockedSources` + backlog entries → Build re-rank excludes them; Govern raises High findings; Realize feels it via the Govern chain. QA step: demonstrate the full ripple on one resolution.

### Phase 3 — Corpus Atlas *(F-4 — the projection answer)*
- Swap Star Map axes: seeded-random projection → `pca3` from kit (2 components). Disclose the upgrade in "how this is built" (distance now genuinely = similarity).
- Overlays: gate color (exists), duplicate-set edges → open Phase-2 drawer (exists+), PII ring, recency dimming, size = tokens; legend; `prefers-reduced-motion` respected.
- **3D toggle:** reuse the Build renderer approach (canvas, no new deps) for corpus-shape intuition; 2D remains default. One projection language across Build and Data — continuity, not novelty.
- Topic hulls stubbed (land in Phase 4).

### Phase 4 — Deep signals *(F-5 parsability · F-6 language · F-7 topics)*
- Parsability: real extraction stats from uploads (tables, images, failures, replacement chars, boilerplate share) → Board category + file flags. LIVE badge (real computation on the visitor's file).
- Language: script/stopword heuristics, corpus mix, non-primary share — labeled heuristic.
- Topic groups: deterministic k-means on TF vectors; label *suggestions* from top terms with an explicit **unsure** state; user confirms/renames (human stays the labeler); confirmed labels → `metadataRequirements` enrichment on the handoff + Atlas hulls + cohesion inputs.
- **Wiring:** Build's re-rank description already cites metadata/freshness — confirmed tags surface in retrieval lineage note; **Operate** gains a one-line provenance link (staleness baseline traces to Data freshness category) — contextual only, no new state, no new writer.

### Phase 5 — Consequence + closure *(F-8 · F-9 · F-10 + program QA)*
- **Cleaning-to-quality proof (F-8):** define a `CorpusSnapshot` interface (raw vs cleaned/tagged) consumed by Build's evaluator; run the golden set against both in-browser; show the measured delta with formula visible. This is the flagship moment — the category's headline claim, reproducible by the visitor.
- Guided corpus pass (F-9): profile → resolve → hand off, consistent with other stages' orientation patterns.
- Readiness dossier export (F-10): Board + Atlas summary + resolutions + backlog in `ExportReport`, provenance-footed.
- Program closure: registry entries + changelog + `/data/guide` update + a11y pass (labels, roles, reduced motion) + full gate run + live-URL verification.

## 3. Cross-lab wiring map (target state)

```
                        ┌────────────────────────────────────────────┐
                        │                 DATA LAB                    │
                        │  Board · Backlog · Resolution · Atlas       │
                        └──────┬──────────────┬──────────────┬───────┘
        blockedSources +       │              │              │ freshness category
        structured backlog     │  confirmed   │  CorpusSnapshot (raw|cleaned)
        (Ph1–2)                │  topic tags  │  (Ph5)       │ (Ph4, contextual)
               ┌───────────────▼──┐   (Ph4)   │              ▼
               │      BUILD       │◄──────────┘        ┌──────────┐
               │ re-rank excludes │— eval delta ————▶  │ OPERATE  │
               │ eval on snapshot │                    │ staleness │
               └────────┬─────────┘                    │ provenance│
                        │ contract (quality, risks)    └──────────┘
               ┌────────▼─────────┐
               │      GOVERN      │  blocked sources → High findings (existing)
               │ findings + audit │  backlog items → open findings (Ph1)
               └────────┬─────────┘
                        │ decision + tier
               ┌────────▼─────────┐
               │     REALIZE      │  risk discount via Govern chain (existing)
               └──────────────────┘
```

Principles: **write only into contracts that already have readers** (no speculative fields); **one writer per slice** (all Data writes stay in `DataHandoffCard`/`DataSliceWriter`, sig-guarded); **Demo mode never persists** (archetypes get authored equivalents each phase).

## 4. Risks & guards

| Risk | Guard |
|---|---|
| Update loops from new writes | No new writers; existing sigs unchanged (inputs-only derivations); fixed-point test extended every phase that touches a derivation |
| Returning-visitor state breakage | Additive optional fields only; if any nested shape must change → STATE_VERSION bump per store.ts doctrine |
| PCA perf on large uploads | Session corpora are ≤ dozens of docs; cap vocab dim (existing pattern); compute on demand, memoized |
| Projector regression in Build | Phase-0 parity test before any import swap |
| Overclaiming | Heuristics labeled; topics carry "unsure"; SIMULATED/LIVE per artifact; no "trained embeddings" language |
| Scope creep | Each phase independently shippable; program can stop after any phase with the product consistent |

## 5. Session estimate

Phase 0: 0.5–1 · Phase 1: 1 · Phase 2: 1 · Phase 3: 1 · Phase 4: 1.5–2 · Phase 5: 1–1.5 → **6–8 sessions**, each ending deploy-green.
