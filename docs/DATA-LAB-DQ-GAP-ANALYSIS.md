# Data Lab · Corpus Intelligence Roadmap
### Benchmarked against enterprise DQ tooling, built to our own DNA

**Date:** 2026-07-07 (rev 2) · **Subject:** the Data stage (`/data`, `packages/lab-data`)
**Benchmark:** AI4DQ Unstructured (QuantumBlack Labs / McKinsey), Jan 2025 article + product exhibits — used as a *market reference for the decision surface enterprise DQ tools cover*, not as a design template.
**Rev 2 corrections:** rev 1 understated our own corpus layer. `analyzeCorpus()` already computes cross-document similarity (Jaccard over token sets), classifies pairs as duplicate / stale-version / near-duplicate (with version-marker detection), and plots a computed 2D similarity projection (the Corpus Star Map) with typed edges. What's missing is the *resolution* workflow and richer axes — not detection. Rev 1's "no cross-document dedup" row was wrong; corrected below.

---

## 1. Design DNA — the rules every feature below obeys

These are the properties that make our labs *ours*. Any feature that can't satisfy them doesn't ship, however good it looks in someone else's product:

1. **Every view ends in a decision.** Not a dashboard — a verdict, a gate, or an action that mutates the program state. (AI4DQ's public material ends at assessment; our assessment changes what Build is allowed to retrieve.)
2. **Live math on the visitor's own file.** Scores must be recomputable in-browser from a real uploaded document, deterministically. No black-box numbers; formulas expandable.
3. **Contracts, not screenshots.** Anything worth measuring lands in the Data Readiness Handoff and is consumed downstream (Build exclusions, Govern findings, Realize risk discount).
4. **Honesty badges.** LIVE only when computation is real; heuristics labeled as heuristics; an explicit "unsure" state where confidence is low.
5. **Our vocabulary.** Readiness, gate, handoff, remediation backlog, star map/atlas — never borrowed product nouns ("DQ Scores", "Issue Log") or a cloned menu taxonomy.
6. **Our visual language.** Light canvas, ink+blue tokens, SVG/canvas primitives from the design system — visually nothing like a dark Vizro console.

**Originality guardrails:** no AI4DQ naming, layout, copy, or exhibit recreation anywhere in the product. The article may be cited in `/architecture` or interview talk tracks as market context ("enterprise tools like McKinsey's AI4DQ cover this surface") — flattering to reference, fatal to imitate. Where we adopt an idea from the category (e.g., an explicit "unsure" bucket in labeling), we adopt the *principle* (honesty under uncertainty), which was already our doctrine.

## 2. Where we stand (corrected inventory)

**Already strong, keep and showcase:**
- **Corpus Star Map** — computed 2D similarity projection (normalized TF vectors → seeded projection), gate-colored nodes, typed edges for duplicate / stale-version / near-duplicate pairs. *This is our native answer to cluster-scatter views in enterprise DQ demos — it predates this analysis and descends from our own Build-stage projector lineage, not from anyone's product.*
- **Live scoring engine** — 8-category rulebook (admissibility, format, dedup, freshness, privacy, provenance, taxonomy, chunk), per-file checks with fix-deltas (`scoreWithFixes`), gate verdict, PII detect/redact, chunk preview, consequence simulator, before/after diff, export report.
- **Contract wiring** — readiness score, approved/conditional/blocked sources, sensitivity restrictions, and a `remediationBacklog` field already flow to Build/Govern.
- **Coverage the benchmark lacks:** privacy and provenance as scored categories; purpose-fit readiness (RAG vs eval vs training vs telemetry); quantified fix-deltas; downstream enforcement.

**Genuinely missing (the professional-grade gap):**
- Resolution actions on detected duplicate/version pairs (nothing mutates the handoff yet).
- A corpus-level readiness board: per-dimension scores with plain-language definitions + per-file matrix.
- A materialized, corpus-wide remediation ledger (the handoff *names* a remediation backlog; no working view exists).
- Parsability/component, language, and content-concentration signals.
- Topic grouping and metadata suggestion.
- Depth axes on the Star Map (current projection axes are seeded-random, not variance-maximizing; no 3D; no overlays beyond gate color).

## 3. Feature plan (native names, native mechanics)

### P0 — changes the reviewer's verdict

**F-1 · Corpus Readiness Board** (S/M)
Extend the existing 8 rulebook categories with two new computed ones — *content concentration* (n-gram repetition / boilerplate density) and *topical cohesion* (distance from corpus centroid) — and render: corpus-level score per category with a one-line plain-language definition, a per-file × per-category matrix (click a cell → that file's findings and fixes), and the existing gate verdict as the headline. Mechanically this is re-presentation: the engine already computes nearly all of it per file.
*DNA check: decision-first (feeds the gate), live math, our category names.*

**F-2 · Version & Duplicate Resolution** (M)
Build ON the existing DupPair detection: group pairs into duplicate sets via connected components; recommend an action per set (keep latest, archive stale versions, merge near-duplicates) using the version-marker + recency signals we already extract; user accepts/overrides; accepted exclusions write to `blockedSources` + `remediationBacklog` on the handoff, and the corpus re-scores. Star Map edges become *actionable* (click an edge → resolve the set).
*DNA check: the loop closes — a resolution decision visibly changes Build's retrieval pool.*

**F-3 · Remediation Backlog (materialized)** (S)
Promote the existing handoff field into a working ledger: every finding across the session's files in one sortable view — severity, category, file, recommended fix, fix-delta, status (open / fixed / accepted-risk). Fixing re-scores live via the existing engine; the ledger IS the handoff field, so Govern's open-findings view stays consistent for free.
*DNA check: we're not adding a concept, we're making an existing contract field tangible.*

**F-4 · Corpus Atlas — the Star Map grows up** (M)
The answer to "should we have a 3D view like Build's projector": yes, and it should be an *evolution of our own Star Map*, reusing our own machinery:
- **Real axes:** upgrade the projection from seeded-random axes to the `pca3` power-iteration PCA already shipped in `lab-rag` (import or lift into a shared lib). Distance then genuinely means content similarity — an honesty upgrade we can disclose in "how this is built."
- **2D by default, 3D on toggle:** reuse the Build projector's canvas approach for a rotatable 3D mode. 2D stays default — the Atlas is a working surface, not a demo moment; 3D is there for corpus-shape intuition and continuity with Build's projector (one product, one projection language).
- **Decision overlays, not decoration:** gate color (exists), duplicate-set edges (exists → clickable per F-2), PII ring, recency dimming, size = tokens, and topic-group hulls once F-7 lands. Legend + reduced-motion fallback.
- **Divergence from the benchmark:** enterprise demos use cluster scatters to *show* structure; the Atlas is where you *act* — select a stale cluster, exclude it, watch the readiness score and the handoff change. That interaction exists nowhere in their public material.
*DNA check: our lineage (Star Map + our PCA + our canvas), our palette, ends in decisions.*

### P1 — depth that reads as senior judgment

**F-5 · Parsability profile** (M) — we already parse real PDF/Word: count tables, images, extraction failures, replacement chars, boilerplate share; per-file parsability signal into the Board; "hard for an LLM" flags with the *why*. Genuinely LIVE on the visitor's own upload.
**F-6 · Language profile** (S) — deterministic script/stopword heuristics; corpus language mix; non-primary-language share flagged against the target model. Labeled heuristic.
**F-7 · Topic groups & metadata suggestions** (M/L) — cluster the existing TF vectors (k-means, deterministic seed); suggest group labels from top terms with an explicit *unsure* state; user confirms/renames (the human stays the labeler — honesty doctrine); confirmed labels enrich handoff metadata and draw Atlas hulls; powers the topical-cohesion score.

### P2 — story-closers

**F-8 · Cleaning-to-quality proof** (M) — run Build's evaluator on the same corpus raw vs cleaned/tagged and show the measured golden-set delta in-browser. The category's headline claim ("metadata lifts RAG accuracy") — except ours is reproducible by the visitor, on their own file, with the formula visible. Flagship-grade.
**F-9 · Guided corpus pass** (S) — a three-beat guided sequence (profile → resolve → hand off) stitching F-1→F-4 into the lab's guided mode, consistent with other stages' orientation patterns.
**F-10 · Readiness dossier export** (S) — extend ExportReport with the Board, Atlas summary, resolution decisions, and backlog; provenance-footed like every other artifact.

### Explicitly not building
LLM-labeled clusters presented as model output; "trained embeddings" claims; enterprise connectors; multi-GB ingestion theater. If genuine LIVE model calls ship later, F-7 label *suggestions* are the first candidate — badged LIVE only then.

## 4. Sequencing

F-1+F-3 share the findings model → one session. F-2 → one session (edges already exist). F-4 → one session (PCA lift + overlays; 3D toggle piggybacks on Build's renderer). F-5/6 → one session. F-7 → 1–2. F-8 → 1 (both engines exist). Every new score ships with engine tests; registry, changelog, and guide updates per house rules.

## 5. The interview line

"Enterprise DQ products — McKinsey sells one — cover assessment: corpus scores, dedup, clustering, an issue ledger. My Data lab covers that same decision surface deterministically in the browser, on your own uploaded file. The difference is what happens next: here, resolving a duplicate set or failing a readiness gate visibly changes what the Build stage is allowed to retrieve, and you can watch answer quality move when the corpus gets cleaned. Assessment is table stakes; consequence is the product."

---
*Reference: QuantumBlack's AI4DQ Unstructured article (medium.com/quantumblack/solving-data-quality-for-gen-ai-applications-11cbec4cbe72), used as market context. Inventory verified against `packages/lab-data` (engine.ts, rulebook.ts, corpus.ts, live components) and `packages/lab-rag` (pca3, projector) at HEAD, 2026-07-07.*
