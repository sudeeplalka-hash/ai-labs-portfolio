# AI Command Center — Product Inventory & Gap Analysis

*Read-only analysis. No files modified. Reflects the current working tree (`labs-platform` monorepo), which may be ahead of the live site until committed and pushed.*

Evidence base: routes under `apps/web/app`, components under each `packages/lab-*`, engine/state modules read directly (`program-core/store.ts`, `handoff.ts`, `types.ts`, `lab-deploy/src/engine/model.ts`, `lab-realize/src/engine/model.ts`, `lab-rag/src/lib/**`, `lab-governance/src/lib/**`).

---

# 1. Executive Summary

The AI Command Center is a **six-stage, client-side enterprise AI program lifecycle product** built as a Next.js 14 static export over a pnpm/Turborepo monorepo. It is **no longer governance-only** — the former governance control plane is folded in as one stage (`/govern/*`) among six (Strategy & Planning, Data, Build/RAG, AI Ops, Govern, Realize). It behaves like a narrated *operating system* for an AI initiative: a single `ProgramProvider` state object threads an initiative from framing through to risk-adjusted ROI, with an Exec/Technical depth toggle reframing every stage.

**Strongest sections (deep, real logic):**

- **Build/RAG** (`lab-rag`) — an actual client-side RAG pipeline (chunking → BM25 retrieval → answer → evaluation), a 3D embedding projector, traces, failure analysis, quality gates, and a nine-archetype model-selection engine.
- **Realize** (`lab-realize`) — a genuine deterministic ROI engine with leakage, risk-adjustment, payback, and 3-year NPV that reads upstream state.
- **AI Ops** (`lab-deploy`) — a real operating-envelope/SLO engine with drift series, incident simulation, and config comparison that is driven by the chosen model's cost/latency/capability.

**Weakest / least-connected sections:**

- **Govern** is the richest in surface area but the **most disconnected** — it runs off its own `demo-data.json` and does not consume the live initiative, deploy drift, or realize outputs.
- **Data → Build** and **AIOps → Govern → Realize** handoffs are visually continuous but **not state-connected** in the way Strategy→Data and Build→AIOps are.
- **Strategy** is strong on framing but its rich workshop output is only **partially** consumed downstream (initiative params yes; readiness sub-scores and archetype largely not).

**Coherence verdict:** It genuinely reads as an enterprise AI portfolio product, not a demo dashboard — the framing→data→build→ops→realize spine with shared state and a traceable ROI dossier is more than most portfolio pieces attempt. The coherence is **real on the left half of the lifecycle (Strategy→Data→Build→AIOps→Realize via `apcc_state`)** and **more visual than wired on Govern**. The biggest gap between promise and implementation is that governance sits beside the loop rather than inside it.

---

# 2. Product Architecture Overview

| Area | Current implementation | Evidence / files | Notes |
|---|---|---|---|
| Framework | Next.js 14.2.35 App Router, React, TS, Tailwind | `apps/web/next.config.mjs` | `output: "export"`, `trailingSlash`, `images.unoptimized`, `typescript.ignoreBuildErrors: true` |
| Structure | pnpm + Turborepo monorepo; one app + domain packages | `packages/*`, `apps/web` | Modular monolith: `apps/web` composes lab packages |
| Major packages | `lab-framing`, `lab-data`, `lab-rag`, `lab-deploy`, `lab-governance`, `lab-realize`, `program-core`, `design-system` | `packages/` | Each lab owns components + engine/lib + sample data |
| Static export | Fully static, client-rendered; no server runtime | `next.config.mjs` (`output:"export"`) | Deployed to Vercel serving `apps/web/out` |
| Route groups | `/frame`, `/data`, `/build`, `/deploy`, `/govern`, `/realize`, `/story` (+ `/*/guide`) | `apps/web/app/**/page.tsx` | ~45 routes; `/govern` has ~18 sub-routes |
| Shared state | `ProgramProvider` context + `localStorage` (`apcc_state`, `apcc_portfolio`, depth/mode keys) | `program-core/src/ProgramProvider.tsx`, `store.ts` | `update(mut)`, `addToPortfolio`, `reset`; SSR-guarded |
| Cross-app handoff | Encode/decode initiative via `apcc_state` localStorage or `?initiative=` URL | `program-core/src/handoff.ts`, `lab-rag/src/lib/handoff.ts`, `lab-data/src/lib/handoff.ts` | Designed additive; also supports cross-dev-port |
| Data/sample approach | Deterministic engines + static sample datasets; optional BYO-LLM key | `lab-rag/src/data/*`, `lab-governance/src/lib/demo-data.json`, `lab-*/src/engine/model.ts` | Most numbers are computed by engines, not hard-coded |
| Domain engines | Framing scoring, model-selection scoring, deploy ops, realize ROI | `lab-framing/src/strategy/model.ts`, `lab-rag/src/lib/model-selection/models.ts`, `lab-deploy/src/engine/model.ts`, `lab-realize/src/engine/model.ts` | All pure/deterministic, unit-tested (`*.test.ts`) |

---

# 3. Route and Stage Inventory

| Stage | Route(s) | Current purpose | Key components/modules | Depth level |
|---|---|---|---|---|
| Strategy & Planning | `/frame`, `/frame/guide` | Idea generation → workshop → readiness score → initiative brief | `StrategyPlanningView`, `IdeaGenerator`, `StrategyWorkshop`, `ScorePanel`, `InitiativeBrief`; `strategy/model.ts` | Deeply implemented |
| Data | `/data`, `/data/overview`, `/data/corpus`, `/data/pipeline`, `/data/guide` | Data readiness dashboards, corpus intake, PII, profiling, chunk-readiness | `DataLabView`, `CorpusView`, `ChunkReadiness`, `ColumnProfiler`, `ConsequenceSimulator`; `lib/prep/*` | Moderately–Deeply implemented |
| Build / RAG | `/build` + `/model`,`/dataset`,`/retrieval`,`/answers`,`/traces`,`/evaluations`,`/quality-gates`,`/failures`,`/overview` | Model fit + live RAG pipeline + evals + traces | `LiveLabView`, `EmbeddingProjector3D`, `ChunkExplorer`, `TraceExplorer`, `EvaluationsView`, `ModelSelectionView`; `lib/live-lab/*`, `lib/model-selection/models.ts` | Deeply implemented |
| AI Ops | `/deploy`, `/deploy/guide` | Operating envelope, SLOs, drift, incidents, config compare | `DeployView`, `OperatingEnvelope`, `IncidentPanel`; `engine/model.ts` (`deriveBaseline`,`computeOps`,`envelopeGrid`,`driftSeries`,`runIncident`) | Moderately–Deeply implemented |
| Govern | `/govern` + `live`,`use-cases`,`playground`,`evals`,`policies`,`risk`,`arcade`,`maturity`,`readiness`,`review-queue`,`evidence`,`audit-logs`,`brief`,`value`,`docs`,`settings` | Governance control plane | `ExecutiveCockpit`, `PipelineFlow`, `MetricCard`; `lib/governance.ts`,`rbac.ts`,`evidence-links.ts`,`demo-data.json`,`llm.ts` | Moderately implemented, mostly static data |
| Realize | `/realize`, `/realize/guide` | Risk-adjusted ROI narrative + waterfall + dossier | `RealizeView`, `ValueWaterfall`; `engine/model.ts` (ROI/NPV/payback/leakage) | Deeply implemented |
| Narrative | `/story`, `/story/brief` | Storyline walkthrough + board one-pager | `program-core/story.ts` (Story Spine) | Moderately implemented |

Note: `/govern/simulator`, `/govern/tour`, `/govern/realize` still exist as routes but were retired/redirected in prior work — worth confirming they don't resurface stale views.

---

# 4. Stage-by-Stage Current State

## 4.1 Strategy & Planning

| Capability | Status | Evidence | Gap / recommendation |
|---|---|---|---|
| Idea generation from vague ambition | Confirmed in code | `IdeaGenerator.tsx`, `engine/backlog.ts`, `engine/reframe.ts` | Strong; deterministic value/effort spread |
| Structured workshop intake (6 steps) | Confirmed in code | `StrategyWorkshop.tsx`, `strategy/model.ts` `Workshop` | Solid |
| Weighted readiness scoring + bands + gates | Confirmed in code | `scoreWorkshop()` (6 categories), `requiredGates()` | Strong |
| Auto-generated falsifiable target | Confirmed in code | `falsifiableTarget()`, `generateWorkshop()` | Recently added; metrics vary by driver |
| Initiative Brief object | Confirmed in code | `InitiativeBrief.tsx`, `buildBrief()`, `apcc_brief` localStorage | Present as brief + persisted |
| Model/pattern selection at framing | Partially present | Archetypes in `strategy/content.ts`; **actual Model Fit lives in Build** (`model-selection`) | Surface a lightweight capability/pattern tag at framing that pre-seeds Build's Model Fit |
| Handoff to Data | Confirmed in code | `toInitiative()` → `d.initiative` in `apcc_state`; `lab-data/FramingHandoff.tsx` consumes it | Works; but only params/scores carry, not full workshop |
| Risk/governance tier assignment | Missing | No governance tier emitted from framing | Emit a risk tier from `impactIfWrong`+`regulatory` for Govern to consume |

**Strong:** the vague→scored→brief journey is genuinely end-to-end and now auto-populates every field. **Missing:** framing does not stamp a capability tag, a governance risk tier, or a build-path recommendation that later stages read.

## 4.2 Data

| Capability | Status | Evidence | Gap / recommendation |
|---|---|---|---|
| Overview/exec + technical dashboards | Confirmed in code | `ExecutiveDashboard.tsx`, `TechnicalDashboard.tsx`, `ReadinessGauge.tsx` | Good |
| Corpus builder + upload (PDF/Word) | Confirmed in code | `CorpusView.tsx`, `DocumentIntakePanel`, `lib/prep/corpus.ts` | Strong |
| Sample corpus | Confirmed in code | `lib/prep/*`, sample data modules | Present |
| Pipeline stages | Confirmed in code | `/data/pipeline`, `PrepTimeline.tsx`, `lib/prep/engine.ts` | Present |
| PII / sensitive-data | Confirmed in code | PII panel + per-category chips; `lib/prep/rulebook.ts` | Strong |
| Chunk readiness | Confirmed in code | `ChunkReadiness.tsx` | Present |
| Provenance / licensing / freshness / metadata | Partially present / Mentioned only | Freshness appears in RAG failure copy; no dedicated provenance/licensing module in Data | Add provenance + licensing + freshness as first-class readiness dimensions |
| Ingestion-ready % vs broader readiness | Partially present | Readiness gauge exists; not clearly split into ingestion-ready vs purpose-readiness | Separate the two explicitly |
| Data Readiness Handoff to Build | Partially present | `lib/handoff.ts` + `session.ts` exist; Build's `FramingHandoff` reads the **initiative**, not a Data readiness score | Data's readiness output is not demonstrably consumed by Build |

**Strong:** corpus intake, PII, chunk-readiness, dual dashboards. **Missing:** provenance/licensing/freshness as governed dimensions, and a real Data→Build readiness payload distinct from the framing handoff.

## 4.3 Build / RAG

| Capability | Status | Evidence | Gap / recommendation |
|---|---|---|---|
| Actual RAG pipeline | Confirmed in code | `lib/live-lab/{chunking,retrieval,embeddings,answerGeneration,evaluation}.ts`, `LiveLabView.tsx` | Runs client-side end-to-end |
| Chunking | Confirmed in code | `chunking.ts`, `ChunkExplorer.tsx` | Real logic |
| Retrieval type | Partially present | `retrieval.ts` `Bm25Retriever` (lexical); comment names embedding-model+vector-store seam | **Lexical/BM25, not ANN/vector** — key technical gap |
| Embeddings | Partially present | `embeddings.ts` = TF-IDF term vectors → PCA → k-means | Deterministic stand-in for neural embeddings (MiniLM/OpenAI named as future) |
| Embedding visualization | Confirmed in code | `EmbeddingProjector3D.tsx`, `EmbeddingProjectorPanel.tsx` | Strong, interactive 3D |
| Answer generation | Confirmed in code | `answerGeneration.ts`, `llmProvider.ts`, `AnswerEnginePanel` | Deterministic default; real LLM if key supplied |
| Traces | Confirmed in code | `TraceExplorer.tsx`, `LiveTracesView.tsx`, `data/queryTraces.ts`, localStorage | Strong |
| Evaluations | Confirmed in code | `EvaluationsView.tsx`, `evaluation.ts`, `data/evaluationRuns.ts` | Strong |
| Golden dataset | Confirmed in code | `GoldenDatasetView.tsx`, `/build/dataset` | Present |
| Quality gates | Confirmed in code | `LiveQualityGates.tsx`, `/build/quality-gates` | Present |
| Failure modes | Confirmed in code | `FailureHeatmap.tsx`, `FailureCategoryChart.tsx`, `data/failureAnalysis.ts` | Strong |
| Citations / faithfulness | Confirmed in code | `ClaimVerificationPanel.tsx`, `data/answerQuality.ts` (faithfulness, citation accuracy) | Strong |
| Model selection | Confirmed in code | `model-selection/models.ts` (9 archetypes, weighted criteria), `ModelSelectionView.tsx` | Strong; persists `CHOICE_KEY` |
| Hybrid search / re-ranking | Missing | Only BM25 path | Add a vector path + hybrid + re-rank stage |

**Strong:** this is the technical heart — a working RAG pipeline with evals, traces, failures, and model fit. **Missing:** the retrieval substrate is lexical, embeddings are TF-IDF, and there's no hybrid/re-rank — so the "vector DB / neural embeddings" story is a seam, not an implementation.

## 4.4 AI Ops

| Capability | Status | Evidence | Gap / recommendation |
|---|---|---|---|
| Operating envelope (cost/latency/reliability) | Confirmed in code | `OperatingEnvelope.tsx`, `deriveBaseline()`, `computeOps()`, `envelopeGrid()` | Real deterministic engine |
| SLOs + error budget | Confirmed in code | `DeployView.tsx` (`sloReliability`,`sloLatencyMs`,`errorBudgetPct`) | Present |
| Drift | Confirmed in code | `driftSeries()`, `driftRisk` written to `apcc_state` | Simulated series |
| Incidents | Confirmed in code | `IncidentPanel.tsx`, `runIncident()` (outage→recovered) | Simulated scenario |
| Cost/latency driven by model choice | Confirmed in code | baseline scales by `modelCostFactor`/`modelLatencyFactor`/`capability` from Build | Strong continuity |
| Config comparison vs SLO | Confirmed in code | `DeployView` compareRows (cheapest mix meeting SLOs) | Good |
| Observability from real traces | Partially present / Simulated | Metrics derived from initiative+engine, not from Build's live traces | Not fed by actual RAG eval/trace output |
| Regression detection / runbooks | Missing | No eval-history regression or runbook artifacts | Tie AIOps regression to Build eval runs |
| Connected to Govern / Realize | Partially present | Writes `driftRisk` to state; Realize reads outcomes; **Govern doesn't read AIOps** | AIOps→Govern not wired |

**Strong:** a real SLO/envelope/drift/incident engine that responds to the model chosen in Build. **Missing:** it's driven by initiative parameters, not by live telemetry from the RAG lab, and it doesn't feed Govern.

## 4.5 Govern

| Capability | Status | Evidence | Gap / recommendation |
|---|---|---|---|
| Old control plane folded into `/govern/*` | Confirmed in code | 18 sub-routes under `apps/web/app/govern` | Yes |
| Executive cockpit | Confirmed in code | `ExecutiveCockpit.tsx` | Present |
| Use-case registry | Confirmed in code | `/govern/use-cases`, `[id]`, `/new` | Present |
| Runtime playground + guardrails | Confirmed in code | `/govern/playground`, `PipelineFlow.tsx`, `lib/llm.ts`, `settings.ts` (BYO key) | Real LLM call possible |
| Evals / red-team arcade | Confirmed in code | `/govern/evals`, `/govern/arcade` | Present |
| Policies / risk / maturity / readiness | Confirmed in code | `/govern/policies`,`/risk`,`/maturity`,`/readiness`; `lib/governance.ts` | Present |
| RBAC / human review / audit evidence | Confirmed in code | `lib/rbac.ts` (roles), `/review-queue`, `/evidence`, `lib/evidence-links.ts`, `/audit-logs` | Present |
| Data source | Partially present / Static | `lib/demo-data.json` drives most govern views | Static, not the live initiative |
| Connected to Strategy/Data/Build/AIOps | Missing | Govern reads `demo-data.json` + its own rbac/lens keys, not `apcc_state` | **Biggest continuity gap:** governance isn't governing *this* initiative |

**Strong:** by far the widest feature surface — registry, playground, policies, risk, evals, red-team, maturity, RBAC, audit evidence. **Missing:** it operates on its own demo dataset and does not consume the live initiative, the chosen model, the data sensitivity, or the AIOps drift — so it's parallel to the loop, not part of it.

## 4.6 Realize

| Capability | Status | Evidence | Gap / recommendation |
|---|---|---|---|
| Business value / ROI | Confirmed in code | `engine/model.ts`, `roiPct` | Real logic |
| Leakage (addressable→realized→risk-adjusted) | Confirmed in code | `model.test.ts` asserts `addressable > realized > riskAdjustedValue`; `ValueWaterfall.tsx` | Strong |
| Risk adjustment | Confirmed in code | `riskAdjustedValue`, adoption/quality/run-cost/risk discounts | Strong |
| Payback + 3-yr NPV | Confirmed in code | `paybackMonths`, `npv3yr` (types.ts, `vr.ts`) | Present (NPV computed, surfaced partially) |
| Adoption / unit economics | Partially present | adoption is an input lever; unit economics implied via cost/query, not itemized | Expose explicit unit economics |
| Connected to Strategy assumptions | Confirmed in code | ROI reads `initiative.scores`, `successMetric`, scope | Strong |
| Connected to AIOps metrics | Partially present | Run-cost leak reflects engine cost; not a live AIOps feed | Pull realized run-cost from AIOps ops output |
| Connected to governance risk | Missing | Risk discount is internal, not from Govern | Let the governance risk tier drive the risk discount |
| Writes outcomes back to state | Confirmed in code | `RealizeView` `update(d.outcomes = {roi, adoption, riskAdjustedValue, paybackMonths})` | Good, but nothing consumes it (no loop to Strategy) |

**Strong:** a defensible, traceable ROI narrative with leakage and risk-adjustment that genuinely reads upstream state. **Missing:** the risk discount isn't sourced from Govern, run-cost isn't sourced from live AIOps, and outcomes don't loop back to Strategy.

---

# 5. Cross-Stage Handoff Analysis

| Handoff | Current state | Evidence | Gap | Recommended improvement |
|---|---|---|---|---|
| Strategy → Data | **Real state** | `toInitiative()`→`apcc_state`; `lab-data/FramingHandoff.tsx` reads it | Only params/scores carry; workshop detail dropped | Carry data-sensitivity + purpose from workshop into Data |
| Data → Build/RAG | **Visual + partial** | Build `FramingHandoff` reads initiative, not a Data readiness payload | Data readiness score not consumed | Emit a Data Readiness Handoff object Build ingests |
| Build/RAG → AI Ops | **Real state** | `CHOICE_KEY`/`BuildSliceWriter` → `deriveBaseline` scales cost/latency/capability | Live eval/trace metrics not passed | Feed eval quality + trace latency into AIOps baseline |
| AI Ops → Govern | **Weak / not wired** | AIOps writes `driftRisk`; Govern reads `demo-data.json` | Govern ignores AIOps state | Have Govern read `apcc_state` drift/incidents |
| Govern → Realize | **Weak** | Realize risk discount is internal | Governance risk tier not used | Drive Realize risk discount from governance tier |
| Realize → Strategy / iterate | **Missing** | Realize writes `d.outcomes`, nothing reads it | No closed loop | Surface outcomes back in Strategy as "last run" priors |

**Overall:** there is genuine shared state (`apcc_state` via `ProgramProvider`), not just visual continuity — but it's **strong across Strategy→Data→Build→AIOps→Realize and absent across the Govern axis and the iterate loop.**

---

# 6. AI Concept Coverage Matrix

| Concept | Status | Depth | Evidence | What is missing / next improvement |
|---|---|---|---|---|
| Prompting | Covered | Working demo logic | `answerGeneration.ts`, govern `playground` | — |
| Prompt evaluation | Covered | Working demo logic | `evaluation.ts`, `EvaluationsView` | — |
| Prompt failure modes | Covered | Working demo logic | `data/failureAnalysis.ts` ("prompt overgeneralization") | — |
| RAG | Covered | Working demo logic | whole `lib/live-lab/*` | — |
| Chunking | Covered | Working demo logic | `chunking.ts`, `ChunkExplorer` | — |
| Retrieval | Covered | Working demo logic (lexical) | `retrieval.ts` `Bm25Retriever` | Add vector/hybrid retrieval |
| Evidence selection | Covered | Working demo logic | `RetrievedEvidencePanel` | — |
| Citation accuracy | Covered | Working demo logic | `data/answerQuality.ts`, `ClaimVerificationPanel` | — |
| Faithfulness | Covered | Working demo logic | `answerQuality.ts` (faithfulness metric) | — |
| Hallucination risk | Covered | Simulated | `queryTraces.ts` `hallucinationRisk` scores | — |
| Evaluations | Covered | Working demo logic | `evaluation.ts`, `evaluationRuns.ts` | — |
| Golden datasets | Covered | Working demo logic | `GoldenDatasetView` | — |
| Regression testing | Partially covered | Simulated | eval runs exist; no run-over-run regression | Add eval history + regression delta |
| Embeddings | Partially covered | Working demo logic (TF-IDF) | `embeddings.ts` | Neural embedding backend |
| Embedding visualization | Covered | Working demo logic | `EmbeddingProjector3D` | — |
| Vector databases | Partially covered | Future integration seam | `retrieval.ts` comment (embedding model + vector store) | Real ANN/cosine store |
| Hybrid search | Missing | Not present | — | Add lexical+vector fusion |
| Re-ranking | Missing | Not present | — | Add re-rank stage |
| Tool calling | Partially covered | Static copy only | agentic pattern + action-approval controls (framing/govern) | Tool schemas + call traces |
| Agents | Covered | Working demo logic | `model-selection` (agentic chains), framing pattern | — |
| Agentic workflows | Covered | Static/working | framing "Agentic workflow" + govern scope policy | Mechanics missing |
| Permission boundaries | Partially covered | Static copy | framing controls, govern rbac | Enforced boundaries not simulated |
| Action approvals | Partially covered | Static copy | framing controls | No approval workflow simulation |
| Fine-tuning | Partially covered | Static/working (decision) | `models.ts` "Fine-tuned small specialist" + customizability criterion | Mechanics (LoRA/PEFT) |
| Training | Partially covered | Static copy | specialist archetype ("training/eval loop") | No training internals |
| Labeled datasets | Mentioned only | Static copy | archetype "upfront labeled data" | Dataset labeling readiness in Data |
| Train/validation/test split | Missing | Not present | — | Add to a training-dataset readiness panel |
| Overfitting | Missing | Not present | "overgeneralization" is a RAG failure, not overfitting | Add generalization concept |
| Generalization | Missing | Not present | — | Pair with overfitting viz |
| Drift | Covered | Simulated | `driftSeries()` in deploy | Real signal source |
| Model selection | Covered | Working demo logic | `model-selection/models.ts` | — |
| Model costing | Covered | Working demo logic | `lib/live-lab/costing.ts`, deploy cost | — |
| Token analysis | Covered | Working demo logic | `tokenAnalysis.ts`, `TokenExplorer` | — |
| Latency | Covered | Working demo logic | deploy `computeOps` p95 | — |
| Observability | Partially covered | Simulated | deploy dashboards | Not fed by live traces |
| Governance policies | Covered | Static data | `lib/governance.ts`, `/govern/policies` | Connect to live initiative |
| Risk tiering | Partially covered | Static data | govern risk views | Not assigned from framing |
| Red-team testing | Covered | Static/working | `/govern/arcade`, `/govern/evals` | — |
| Human-in-the-loop | Covered | Static data | `/govern/review-queue`, framing `humanReview` | — |
| Audit evidence | Covered | Static data | `lib/evidence-links.ts`, `/govern/audit-logs`,`/evidence` | — |
| Transformers | Missing | Not present | — | Educational explainer (Phase 6) |
| Attention | Missing | Not present | — | Educational explainer |
| PyTorch | Missing | Not present | — | Out of scope for now |
| TensorFlow | Missing | Not present | — | Out of scope for now |

---

# 7. Current Gap Summary

## 7.1 Product Continuity Gaps

- **Govern is off-loop:** reads `demo-data.json`, not `apcc_state` (`lib/governance.ts`, `demo-data.json`). Highest-value continuity fix.
- **Data→Build has no readiness payload:** Build reads the framing initiative, not a distinct Data Readiness object.
- **No closed iteration loop:** `RealizeView` writes `d.outcomes` but nothing consumes it.
- **Workshop richness is lossy:** `toInitiative()` drops most of the 33-field workshop when handing to Data.

## 7.2 Technical Depth Gaps

- **BM25 instead of a vector store** (`retrieval.ts`) — no ANN/cosine.
- **TF-IDF+PCA embeddings** (`embeddings.ts`) — not neural.
- **No hybrid search / re-ranking.**
- **Tool calling has no mechanics** — no tool schemas or call traces; agentic is copy + governance policy only.
- **AIOps metrics are derived, not observed** — not fed by live RAG traces/evals.

## 7.3 AI Concept Gaps

- **Overfitting / generalization missing** (the one arguably in-scope model-quality gap).
- **Train/val/test split, labeled-dataset readiness missing.**
- **Transformers / attention / PyTorch / TensorFlow missing** (intentionally, model internals).

## 7.4 UX / Portfolio Polish Gaps

- **Reviewer path isn't explicit** — no single "start here / see the loop" entry that walks a reviewer Strategy→Realize.
- **Govern's static data can read as "demo"** next to the live left-half.
- **Tabs/anchors within labs** may not be individually crawlable/deep-linkable for a reviewer skimming.
- **No architecture/GitHub CTA** surfacing the engineering depth to a technical reviewer.

## 7.5 Codebase / Maintenance Gaps

- **Orphaned `.fuse_hidden*` files** in `lab-rag/src/components/live-lab/`, `/traces/`, `/dashboard/` — clean before commit.
- **Dev verification scripts committed** (`lab-deploy/verify.ts`, `verifyd.ts`, `lab-realize/vr.ts`) — fine but consider a `scripts/` or test folder.
- **Duplicated value viz:** `ValueRiver.tsx` appears superseded by `ValueWaterfall.tsx` — remove the dead one.
- **`typescript.ignoreBuildErrors: true`** in `next.config.mjs` hides type regressions — track separately.
- **Retired routes still present** (`/govern/simulator`, `/govern/tour`, `/govern/realize`) — confirm they're inert.

---

# 8. Strategy & Planning Specific Recommendations

| Proposed Strategy enhancement | Should add? | Why | Priority | Notes |
|---|---|---|---|---|
| AI Pattern & Capability Fit | Yes | Ties framing to Build's Model Fit; gives reviewers a capability spine | High | Archetypes already exist in `content.ts`; surface as a tag |
| Build Path Recommendation (RAG vs fine-tune vs prompt) | Yes | Connects to model-selection archetypes; shows judgment | High | Derive from pattern + data posture |
| Model Fit Decision Panel (in Strategy) | Partial | Full Model Fit belongs in Build; a *preview* here aids continuity | Medium | Pre-seed Build's `CHOICE_KEY`, don't duplicate |
| Capability tags | Yes | Enables roadmap coverage tags + reviewer scanning | High | Cheap, high-signal |
| Initiative Brief object | Already present | `buildBrief()` + `apcc_brief` | — | Extend, don't rebuild |
| Strategy → Data handoff | Already present (thin) | `toInitiative()` works | High | Enrich payload (sensitivity, purpose, tier) |
| Risk/governance tier assignment | Yes | Unlocks Govern→Realize wiring | Must have before roadmap | Compute from `impactIfWrong`+`regulatory` |
| Roadmap coverage tags (RAG, vector, tools, fine-tune, AIOps, govern, realize) | Yes | Makes the product self-describe its lifecycle coverage to reviewers | High | Render as chips on the brief |

**Verdict:** Strategy should get a **thin but high-leverage upgrade** (capability tag + governance tier + enriched handoff) *before* new features — it's the source of the state everything else consumes.

---

# 9. Data Lab Specific Recommendations

| Proposed Data enhancement | Should add? | Why | Priority | Notes |
|---|---|---|---|---|
| Initiative Context Banner | Yes | Shows Data is working *this* initiative | High | Reuse `FramingHandoff` |
| Data Readiness Score distinct from ingestion-ready % | Yes | Two different truths; conflating them misleads | High | Split cleanly in `ReadinessGauge` |
| Source inventory workspace | Yes | Enterprises think in sources, not one corpus | Medium | New view |
| Source profile drilldown | Yes | Depth per source | Medium | Extends `ColumnProfiler` |
| Data Purpose classification | Yes | RAG vs eval vs fine-tune data differ | High | Drives purpose panels |
| Purpose-specific readiness panels | Yes | Makes readiness meaningful | High | Depends on purpose tag |
| RAG Corpus Readiness | Already present (partial) | `ChunkReadiness` | Medium | Formalize as a scored panel |
| Evaluation Dataset Readiness | Yes | Build has golden datasets but Data doesn't prep them | High | Closes Data→Build eval gap |
| Fine-Tuning / Training Dataset Readiness | Partial | Only if you pursue Phase 4 | Do later | Labeled-data + split checks |
| Training & Generalization / Overfitting readiness | No (yet) | Belongs in a learning layer, not Data | Low | Phase 6 |
| Vector Index Readiness | Partial | Only meaningful once real vectors exist | Do later | Pair with Phase 2 |
| Tool & Action Data Contract | Partial | Only with tool-calling (Phase 3) | Do later | — |
| AI Ops telemetry readiness | Partial | Once AIOps reads live signals | Do later | — |
| Data Remediation Backlog | Yes | Turns issues into an actionable list | Medium | Mirrors framing backlog pattern |
| Data Readiness Handoff to Build | Yes | The missing state edge | Must have before roadmap | Emit object Build consumes |

**Verdict:** Data needs an **Initiative Context Banner + a split readiness model + a real Data→Build handoff** before broadening. Purpose classification is the unlock that makes everything else coherent.

---

# 10. Roadmap Recommendation

## Phase 1 — Lifecycle Coherence

- **Goal:** make the whole loop state-connected, not just the left half.
- **Features:** framing capability tag + governance risk tier; enriched Strategy→Data payload; Data Readiness Handoff to Build; Govern reads `apcc_state`; Realize risk discount from governance tier; outcomes loop back to Strategy; reviewer "see the loop" entry.
- **Why it matters:** the product's core claim is continuity; today it's half-wired.
- **Dependencies:** `program-core` state shape additions.
- **Risks:** low; additive state.
- **Priority:** Must have.

## Phase 2 — RAG Technical Substrate

- **Goal:** make retrieval technically real.
- **Features:** neural-or-simulated embedding backend, vector/ANN retriever behind the existing `Retriever` seam, hybrid search, re-ranking, trace comparison A/B.
- **Why:** closes the biggest technical-depth gap and the "vector DB" concept.
- **Dependencies:** `retrieval.ts` seam (already designed).
- **Risks:** medium (client-side vector at scale).
- **Priority:** High.

## Phase 3 — Agent / Tool-Calling Mechanics

- **Goal:** turn agentic copy into mechanics.
- **Features:** tool schemas, tool-call traces, approvals, permission boundaries, rollback, audit logs.
- **Why:** tool calling is the largest "partial" in List B.
- **Dependencies:** trace infra from Build/Govern.
- **Risks:** medium scope creep.
- **Priority:** Medium–High.

## Phase 4 — Training / Fine-Tuning / Generalization

- **Goal:** decision-grade build-vs-buy + model quality.
- **Features:** labeled dataset readiness, train/val/test split, overfitting/generalization viz, fine-tune-vs-RAG decisioning, model eval.
- **Why:** moves List A from "half" to "covered."
- **Dependencies:** Data purpose classification (Phase 1).
- **Risks:** could drift into course content — keep decision-focused.
- **Priority:** Medium.

## Phase 5 — AI Ops and Production Readiness

- **Goal:** observed, not derived, ops.
- **Features:** live monitoring from Build traces, latency/cost/drift, incidents, SLOs, regression detection, runbooks.
- **Why:** makes AIOps a consumer of real signals.
- **Dependencies:** Build→AIOps telemetry edge.
- **Risks:** low.
- **Priority:** Medium.

## Phase 6 — Model Internals Learning Layer

- **Goal:** optional "under the hood" explainers.
- **Features:** transformers, attention, PyTorch/TensorFlow explainers.
- **Why:** rounds out List A for educational credibility.
- **Dependencies:** none.
- **Risks:** distraction from the product's operating-system identity.
- **Priority:** Low / Do later.

---

# 11. What Not to Build Yet

| Feature | Build now? | Reason |
|---|---|---|
| Full model-training framework | No | Contradicts the operating-system identity; huge effort, low reviewer payoff |
| Deep PyTorch/TensorFlow notebooks | No | Turns the product into a course; out of scope |
| Heavy transformer theory | No (Phase 6 max) | Model internals are below your governance boundary |
| Overly complex backend | No | Static export is a feature; keep it client-side |
| Real user auth | No | No multi-tenant need for a portfolio product |
| Real enterprise data connectors | No | Sample/live-entered data is sufficient to tell the story |
| Real cloud deployment infra | No | Already deployed static; more infra ≠ more signal |
| Too many charts | No | You already risk chart density; add meaning, not charts |
| Chatbot-only experience | No | Would collapse the lifecycle narrative |
| Generic AI course content | No | Undercuts the "program OS" positioning |

---

# 12. Final Recommendation

- **Update Strategy first?** Yes — a *thin* upgrade (capability tag + governance risk tier + enriched handoff). It's the source of truth the rest of the loop reads.
- **Update Data first?** Second, immediately after — Initiative Context Banner, split readiness, and a real Data→Build handoff.
- **Both before Build/RAG?** Yes. Build/RAG is already your strongest stage; deepening it further (Phase 2) yields less than making the *loop* coherent (Phase 1). Do Strategy + Data continuity first, then the RAG substrate.
- **Next implementation prompt:** "Phase 1 — Lifecycle Coherence: add a `capabilityTag` + `governanceTier` to the framing initiative, emit a `DataReadiness` handoff object from Data that Build consumes, make `/govern` read the live `apcc_state` initiative instead of `demo-data.json`, and drive Realize's risk discount from the governance tier — additive, read-only to existing engines."
- **Highest-leverage improvement:** wiring **Govern into the live loop** — it's your biggest feature surface and your biggest disconnect; connecting it converts the product from "five wired stages + a governance app beside them" into a true closed lifecycle.
- **Most impressive to an AI program leader / TPM / product / consulting reviewer:** the **traceable closed loop** — a framed bet whose governance tier and data readiness flow into build and ops, and whose ROI in Realize is risk-adjusted by that same governance tier and traces back to the original assumption. That "every number traces to a decision, and the loop closes" story is what separates a program operating system from a dashboard.

---

*Maintenance note to action regardless of roadmap: remove the `.fuse_hidden*` orphans, the superseded `ValueRiver.tsx`, and confirm the retired `/govern/simulator|tour|realize` routes are inert before the next commit.*
