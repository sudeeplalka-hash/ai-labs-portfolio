# AI Command Center — End-to-End Overview (Review Context)

**Purpose of this document:** a self-contained, in-depth description of the application, written so an AI reviewer with no prior access to the codebase can perform a QA pass and suggest improvements. It covers what the product is, how it's architected, how data flows, what's real vs simulated, every route, and the specific areas most worth scrutiny. A "How to review this" section at the end lists concrete questions.

---

## 1. What this product is

**AI Command Center** is an enterprise **AI program operating system** — a portfolio/demo product that shows how a single AI initiative moves from a vague idea to **governed, measurable business value** across six lifecycle stages. It is intentionally *not* a chatbot, a dashboard, a governance-only tool, or an ML-training platform. Its differentiator is that the six stages are **contract-driven**: each stage emits a structured object that the next stage consumes through shared client-side state, forming a closed loop.

Positioning: MLOps-, LLMOps-, and RAGOps-aware, but it does **not** replace specialized ML platforms. Everything is deterministic and client-side — no backend, no auth, no API keys, no GPUs, deployed as a **Next.js static export**.

The six stages:
1. **Strategy & Planning** (`/frame`)
2. **Data** (`/data`)
3. **Build / RAG** (`/build`)
4. **Operate / AI Ops / MLOps** (`/deploy` — route kept, positioned as "Operate")
5. **Govern** (`/govern`)
6. **Realize** (`/realize`)

---

## 2. Tech stack & repository architecture

- **Framework:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS. `output: "export"` (static), `trailingSlash: true`, `images.unoptimized`.
- **Monorepo:** Turborepo + pnpm workspaces (pnpm 9.7). Modular monolith: one app (`apps/web`) composes lab packages.
- **Config caveat:** `apps/web/next.config.mjs` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` (see Known Issues).

```
labs-platform/
├── packages/
│   ├── design-system/    Tailwind preset, tokens, shared UI (Panel, Badge, KpiCard, SectionHeader, InsightCard, cn)
│   ├── program-core/      shared state + all deterministic engines (see §4)
│   ├── lab-framing/        Strategy & Planning engine + views
│   ├── lab-data/           Data lab
│   ├── lab-rag/            Build/RAG lab (retrieval, evals, traces, embeddings, model-fit)
│   ├── lab-deploy/          Operate engine + views
│   ├── lab-governance/     Govern cockpit (older control plane, demo-data-driven)
│   └── lab-realize/        Realize ROI engine + views
├── apps/web/               the one app: shell, routing, composes labs, hosts lifecycle/reviewer components
└── services/governance-api/ optional FastAPI microservice (NOT used by the live demo)
```

Path aliases in `apps/web`: `@labs/*` → package barrels; `@rag`, `@data`, `@gov` → lab source dirs; `@/` → `apps/web`.

---

## 3. Shared state & the contract-driven loop

**Single source of truth:** `packages/program-core/src/ProgramProvider.tsx` exposes `useProgram()` with `{ state, portfolio, hydrated, depth, setDepth, mode, setMode, update(mut), addToPortfolio, reset }`. State persists to `localStorage` under `apcc_state` (plus `apcc_portfolio`, `apcc_depth`, `apcc_mode`). `update((draft) => {...})` deep-clones, mutates, saves — the write path used everywhere. `loadState()` spreads `{...blankState(), ...parsed}` so new optional fields are backward-compatible.

**Two global toggles:**
- **Depth**: `exec` vs `practitioner` (narrated vs interrogable views).
- **Mode**: `live` (threaded initiative + upstream slices) vs `demo` (curated `demoState()` sandbox; never writes back).

**The contract each stage emits → who consumes it:**

| Stage | Writes to state | Key fields | Consumed by |
|---|---|---|---|
| Strategy | `initiative.meta` | primary AI pattern, capability tags, build-path recommendation, governance tier + rationale, operational criticality, human-review/audit flags | Data, Build, Govern, Realize |
| Data | `data.handoff` | data readiness score, approved/conditional/blocked/rejected sources, sensitivity restrictions, metadata/chunking reqs, eval-set readiness, known risks, remediation backlog, recommendation | Build, Govern |
| Build/RAG | `rag.contract` | model, retrieval mode + lineage, eval run, quality/citation/faithfulness/hallucination, failed gates, failure modes, cost/latency, **agent fields**, **training fields** | Operate, Govern, Realize |
| Operate | `deploy.evidence` | release readiness score + recommendation, SLO status, p95, cost/query, drift, monitoring coverage, regression status, incident summary, rollback readiness, version lineage, **tool telemetry**, **training telemetry**, open operational risks | Govern, Realize |
| Govern | `governance.decision` | decision (5 bands), score, rationale, evidence used, required controls, open findings, release blockers, approval conditions, audit readiness, next review | Realize |
| Realize | `outcomes` + `iteration` | ROI, risk-adjusted value, payback, NPV, adoption, value leakage, recommended next action, last-run summary | Strategy (last-run panel) |

**Loop closure:** Realize's `outcomes`/`iteration` feed a "Last realization run" panel back in Strategy; and Govern's tier + Operate's drift + Build's quality feed **into** Realize's risk-adjusted ROI. Stages degrade gracefully when upstream hasn't run.

---

## 4. Deterministic engines (packages/program-core/src)

All pure, client-side, offline:
- **`contracts.ts`** — `buildDataReadinessHandoff`, `buildBuildOutputContract`, `selectGovernInputs` (full cross-stage aggregator), `deriveGovernanceDecision` (5-band engine), `deriveGovernanceScorecard`, `deriveOpenFindings`, `deriveRequiredControls`, `selectRealizeContext`.
- **`operate.ts`** — `computeReleaseReadiness` (13 checks), `deriveVersionLineage`, `deriveMonitoringCoverage`, `deriveEvalRegression` (modeled prior run), `deriveIncidents`, `deriveOpsEvidenceEnrichment`.
- **`govern.ts`** — `buildAuditEvidencePack`, `auditPackToText`.
- **`agents.ts`** — `TOOL_REGISTRY` (6 tools), `WORKFLOW_TRACE`, `MISUSE_EVALS` (6), `PERMISSION_BOUNDARIES`, `isAgenticInitiative`, `buildAgentToolingContract`.
- **`training.ts`** — `deriveFineTuneMemo`, `deriveDatasetReadiness`, `deriveGeneralizationAssessment`, `deriveDataPurposes`, `buildTrainingReadinessContract`, `GENERALIZATION_SCENARIOS`, `trainingRelevant`.
- Lab-owned engines: `lab-framing/strategy/model.ts` (workshop scoring, `toInitiative`, `deriveInitiativeMeta`, idea generator), `lab-rag/lib/live-lab/*` (chunking, BM25 retrieval, TF-IDF embeddings, answer gen, evaluation) + `lib/model-selection/models.ts` + `lib/live-lab/retrievalModes.ts` (BM25/vector/hybrid/re-rank), `lab-deploy/engine/model.ts` (operating envelope, SLO, drift, incidents), `lab-realize/engine/model.ts` (ROI, leakage, risk discount, payback, NPV).

---

## 5. Stage-by-stage detail

### Strategy & Planning (`/frame`)
Idea generator (vague ambition + 5 knobs → sharpened framing + scored option spread on a value/effort scatter), a six-step workshop with live weighted readiness scoring and gates, an auto-generated falsifiable target (baseline→target metrics), an Initiative Brief (Save/Copy/Continue-to-Data), six use-case archetypes, an **AI Pattern & Capability Fit + Build Path** panel, and a **Last realization run** panel (iteration loop). Emits `initiative.meta`.

### Data (`/data`)
Executive/technical readiness dashboards, corpus intake (incl. PDF/Word) + star map, PII/sensitive-data with category chips, column profiler, consequence simulator, chunk readiness, before/after diff, prep timeline. Adds a **Data Readiness Handoff card** and a **Data Purpose Readiness** table (RAG corpus vs eval vs training vs telemetry vs outcomes vs tool logs). Emits `data.handoff`.

### Build / RAG (`/build` + sub-routes)
Model Fit (nine archetypes scored on weighted criteria; chosen engine drives Operate/Realize), a live RAG pipeline (chunk → retrieve → answer → evaluate), a 3D embedding projector (TF-IDF→PCA), chunk explorer, retrieved-evidence panel, token/cost explorer, claim verification, trace explorer, evaluations + golden dataset, quality gates, failure analysis. **Retrieval modes** (`/build/retrieval`): BM25 baseline, simulated vector, hybrid, hybrid+re-rank with governance-aware re-ranking that **excludes Data-handoff-blocked sources**; mode comparison, trace-by-mode, vector-index readiness. **Agents** (`/build/agents`): tool registry, workflow trace with a blocked branch, permission boundaries, approval flow, misuse evals. **Training** (`/build/training`): fine-tune-vs-RAG-vs-prompt memo, dataset readiness, train/val/test split, overfitting/generalization. **Under the Hood** (`/build/internals`): optional transformers/attention/embeddings/framework-placement explainer. Emits `rag.contract` (+ retrieval, agent, training fields).

### Operate (`/deploy`, positioned "Operate · AI Ops · MLOps · LLMOps")
Preserves the existing operating envelope, SLOs, error budget, drift series, incident simulation, config comparison. Adds Release Readiness (13-check score), Version & Lineage, Monitoring Coverage (with honest gaps), Evaluation Regression (modeled prior run), Incident & Rollback, and an Ops Evidence summary. Emits `deploy.evidence` (+ tool + training telemetry).

### Govern (`/govern` + ~18 sub-routes)
Live layer above the existing cockpit: Live Initiative banner (or polished sample-mode fallback), Live Governance Scorecard (use-case/data/build/ops/audit), Governance Decision panel (5 bands), Required Controls, Open Findings, Audit Evidence Pack (copyable). Writes `governance.decision`. The older cockpit + subroutes (playground, evals, policies, risk, arcade, maturity, readiness, review-queue, evidence, audit-logs, brief, value, docs, settings) still render from `demo-data.json`.

### Realize (`/realize`)
Single-scroll ROI narrative: value verdict hero, value waterfall (bridge chart), ROI KPIs + levers, traceability dossier. Risk discount folds in governance tier, ops drift, build quality, open findings, and (Phase 6) overfitting/generalization risk. Writes `outcomes` + `iteration`.

---

## 6. Cross-cutting / reviewer surfaces
- **Homepage** (`/`): thesis, "Start here" program loop, two ways to use it, six stage cards, contract-driven loop visual, "what this project demonstrates", reviewer paths (Executive/Technical/Governance/Product-TPM), quick links.
- **Story** (`/story`, `/story/brief`): narrative walkthrough + board one-pager.
- **Architecture** (`/architecture`): implementation notes, contract loop, real-vs-simulated, "where model internals sit" layer stack.
- **Roadmap** (`/roadmap`): current/next/future/out-of-scope + simulation boundary.
- **Per-lab Guides** (`/*/guide`) and a shell-mounted depth-aware Story Thread with the single global exec/technical toggle.

---

## 7. Full route inventory
`/` · `/story` · `/story/brief` · `/frame` · `/frame/guide` · `/data` · `/data/overview` · `/data/corpus` · `/data/pipeline` · `/data/guide` · `/build` · `/build/model` · `/build/dataset` · `/build/retrieval` · `/build/agents` · `/build/training` · `/build/internals` · `/build/answers` · `/build/traces` · `/build/evaluations` · `/build/quality-gates` · `/build/failures` · `/build/overview` · `/build/guide` · `/deploy` · `/deploy/guide` · `/govern` (+ `live`, `use-cases`, `use-cases/new`, `use-cases/[id]`, `playground`, `evals`, `policies`, `risk`, `arcade`, `maturity`, `readiness`, `review-queue`, `evidence`, `audit-logs`, `brief`, `value`, `docs`, `settings`) · `/govern/simulator|tour|realize` (retired → client-redirect stubs) · `/realize` · `/realize/guide` · `/architecture` · `/roadmap`.

---

## 8. State-write pattern (loop-safety — review this closely)
Seven components write contracts to shared state. The intended safety pattern: a `useEffect` keyed on a **stable input signature** (JSON of upstream inputs only), deriving the contract **from the `update` draft** (`d`), and **never** including the object being written in the signature — so a write can't retrigger its own effect. Writers: `DataHandoffCard`, `BuildContractCard` (`apps/web/components/lifecycle/StageContracts.tsx`), `RetrievalModes` (on user action), `AgentTooling`, `TrainingReadiness` (`apps/web/components/build/*`), `ReleaseReadinessPanel` (`apps/web/components/operate/OperateSpine.tsx`), `GovernLoop` (`apps/web/components/govern/GovernLoop.tsx`), and the Realize outcomes effect (`lab-realize/RealizeView.tsx`). **This is the highest-risk area for infinite update loops** and deserves careful review.

---

## 9. Simulation boundary (honesty is a feature — verify no overclaiming)
**Implemented / deterministic:** lifecycle state + contracts, Strategy scoring, Data handoff derivation, RAG pipeline logic (chunking, BM25 retrieval, TF-IDF embeddings, answer gen, evals), retrieval-mode comparison + re-rank, agent/tool contract simulation, Operate evidence engine, Governance decision engine, Realize ROI engine.
**Modeled / simulated:** production telemetry, real enterprise connectors, real vector database / neural embeddings, real tool execution, real training/fine-tuning, live incident/regression streams, MLOps-platform integrations. Retrieval is BM25 + TF-IDF (not neural/ANN); agent tools never execute; no model is trained. Each technical page carries its own boundary note.

---

## 10. Known issues, tech debt & open risks (please scrutinize)
1. **Build not verified green.** A full `pnpm typecheck && pnpm lint && pnpm build` has not been completed. `program-core` engines typecheck clean in isolation; app-level `tsc` in the dev environment fails on module resolution (environmental, hits even `app/layout.tsx`), so the real gate is a local `next build`.
2. **`ignoreBuildErrors` / `ignoreDuringBuilds` are ON** in `next.config.mjs`, masking type/lint issues. Pre-existing genuine issues exist (`bridges/DataSliceWriter.tsx` `SessionGate` comparison; `key`-prop excess on `build/overview` + `StorylineView`; `handoff.ts` `{}` inference).
3. **Deterministic/modeled numbers** — many metrics (eval regression prior run, ops telemetry, training curves, agent telemetry) are modeled constants; directionally sensible but not measured.
4. **Govern subroutes** still render `demo-data.json` beneath the new live layer (only the landing page is fully live-wired).
5. **`ValueRiver.tsx`** is deprecated/dead (export removed) but the file still exists.
6. **Two "versions" of similar concepts** (e.g., Phase 1 `GovernLiveBanner` superseded by `GovernLoop`; still exported, unused).
7. Accessibility, keyboard nav, and reduced-motion have not been formally audited.

---

## 11. How to run
```bash
corepack enable && corepack prepare pnpm@9.7.0 --activate
pnpm install
pnpm dev            # http://localhost:3000
# or static build:
pnpm build          # → apps/web/out
npx serve apps/web/out
```

---

## 12. How to review this (requested QA focus)
Please evaluate and suggest concrete improvements on:
1. **Coherence & narrative** — does the six-stage, contract-driven story land in 2–5 minutes? Where does it feel disjointed or over-built?
2. **Loop-safety** — inspect the seven state writers (§8). Are the signature/`draft` patterns actually loop-safe? Any effect whose dependency could churn?
3. **Type safety** — given the pre-existing issues (§10), what should be fixed before flipping `ignoreBuildErrors` off? Any risky `any`/optional-field access?
4. **Honesty of claims** — is anything overclaimed vs the simulation boundary (§9)? Any copy that implies real training/telemetry/vector-DB/tool-execution?
5. **UX & information density** — are the lab pages too dense? Where should progressive disclosure or trimming help? Mobile/responsive concerns?
6. **Reviewer clarity** — do `/`, `/architecture`, `/roadmap`, and reviewer paths make the product obvious to a recruiter/TPM/AI-engineer/consulting reviewer?
7. **Technical credibility** — is the RAG substrate (BM25 + TF-IDF, hybrid/re-rank), agent governance, training-readiness, and MLOps framing convincing to a senior AI engineer? What would raise it without scope creep?
8. **Highest-leverage next improvements** — 3–5 concrete, bounded changes that would most increase quality, credibility, or clarity.
9. **Anything missing** — gaps a senior AI program leader / consulting reviewer would expect that aren't represented.
10. **Deployment readiness** — any static-export or runtime risks to flag before pushing live.

Please return findings grouped as: (a) blocking/correctness, (b) credibility/UX, (c) polish, (d) recommended next steps — with specific file/route pointers where possible.
