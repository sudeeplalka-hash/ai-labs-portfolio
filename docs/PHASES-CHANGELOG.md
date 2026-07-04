# AI Command Center — What Changed Across All Phases

A single reviewer-facing record of the phased upgrade that turned the AI Command Center from a set of visually-linked labs into a **contract-driven, closed-loop enterprise AI program operating system**.

> Scope note: every change below is additive and type-safe by construction. The work was done in an environment that could not run a trustworthy `tsc`/`next build`, so a local `pnpm typecheck && pnpm lint && pnpm build` is the outstanding verification step. Nothing reaches the live site until committed and pushed.

---

## The product in one paragraph

AI Command Center is an enterprise AI program operating system. It follows one initiative across six stages — **Strategy → Data → Build/RAG → Operate (AI Ops) → Govern → Realize** — where each stage emits a structured contract the next stage consumes through shared client-side state (`apcc_state` via `ProgramProvider`). It is MLOps-, LLMOps-, and RAGOps-aware without trying to replace a specialized ML platform. All engines are deterministic and client-side; there is no backend, no auth, no API key, and it deploys as a Next.js static export.

---

## The closed loop (contract-driven)

| Stage | Emits | Consumed by |
|---|---|---|
| Strategy | `initiative.meta` (pattern, capability tags, governance tier, build path, criticality, review/audit flags) | Data, Build, Govern, Realize |
| Data | `data.handoff` (readiness, approved/blocked sources, sensitivity, chunking, eval-set readiness, risks) | Build, Govern |
| Build/RAG | `rag.contract` (model, retrieval mode, eval run, quality/citation/faithfulness/hallucination, gates, agent + training fields) | Operate, Govern, Realize |
| Operate | `deploy.evidence` (release readiness, lineage, monitoring, regression, incidents, rollback, tool + training telemetry) | Govern, Realize |
| Govern | `governance.decision` (decision, score, controls, findings, blockers, conditions, audit readiness) | Realize |
| Realize | `outcomes` + `iteration` (ROI, risk-adjusted value, payback, leakage, recommended next action) | Strategy (last-run panel) |

The loop closes: Realize's outcomes feed back into Strategy, and Govern's tier + Operate's drift + Build's quality feed back into Realize's risk-adjusted ROI.

---

## Phase-by-phase changes

### Phase 0 — Repo hygiene & baseline
Read-only stabilization. Documented 94 `.fuse_hidden*` mount-orphans, confirmed the three retired Govern routes (`/govern/simulator|tour|realize`) are already inert client-redirects, marked `ValueRiver.tsx` deprecated (superseded by `ValueWaterfall`), documented the dev verify scripts, and flagged that `typescript.ignoreBuildErrors: true` is masking type checks. Established the sandbox constraint (read-only deletes; `tsc` truncation on freshly-edited files). Deliverable: `docs/phase-0-baseline.md`.

### Phase 1 — Lifecycle coherence & shared contracts
The backbone. Built the six stage contracts into `program-core` (`contracts.ts`) and wired each stage to read upstream and write its contract:
- **Strategy** now emits `initiative.meta` (primary AI pattern, capability tags, build-path recommendation, governance tier + rationale, operational criticality, human-review/audit flags) and shows an "AI Pattern & Capability Fit" panel + a "Last realization run" panel (the iteration loop).
- **Data** emits a `DataReadinessHandoff`; **Build** consumes it and emits a `BuildOutputContract`; **Operate** consumes that and emits `OpsEvidence`; **Govern** got a live-state read path + banner; **Realize** consumes governance + ops + build risk into its risk discount and writes richer `outcomes` + `iteration`.
- New per-stage cards (`StageContracts.tsx`) make each handoff visible.

### Phase 2 — Operate / AI Ops / MLOps spine
Repositioned `/deploy` as **Operate · AI Ops · MLOps · LLMOps** (route unchanged) and wrapped the existing operating-envelope engine with a deterministic production-readiness spine (`operate.ts`):
- **Release Readiness** (13-check gate → score + recommendation), **Version & Lineage**, **Monitoring Coverage** (with honest gaps), **Evaluation Regression** (modeled prior run), **Incident & Rollback**, and an enriched `OpsEvidence` handoff for Govern/Realize. New UI: `OperateSpine.tsx`.

### Phase 4 — Govern live-loop integration
Converted `/govern` from a static control plane into a live evidence-based stage (`govern.ts` + expanded `contracts.ts`), preserving the demo cockpit beneath it:
- Full **governance inputs aggregator** across Strategy/Data/Build/Operate/Realize, a **5-band decision engine** (Approved for pilot / with restrictions / Human review required / Hold / Not approved), a **live scorecard** (use-case, data, build, operational, audit), **required controls**, **open findings**, and an **audit evidence pack** (copyable). Writes `governance.decision` to state for Realize. New UI: `GovernLoop.tsx`.

### Phase 8 — Reviewer experience & portfolio polish
Made the product understandable in 2–5 minutes (`Reviewer.tsx`):
- Homepage **"Start here" program loop**, **reviewer paths** (Executive/Technical/Governance/Product-TPM), **"What this project demonstrates"**, a **contract-driven loop** visual, and quick links.
- New pages **`/architecture`** (implementation notes + real-vs-simulated) and **`/roadmap`** (current/next/future/out-of-scope + simulation boundary).
- Concise "what this stage demonstrates" notes on Data/Build/Realize.

### Phase 3 — RAG technical substrate
Deepened retrieval credibility while keeping BM25 as the baseline (`retrievalModes.ts` engine, self-contained; live pipeline untouched):
- Retrieval **mode selector** (Lexical BM25 / Simulated vector / Hybrid / Hybrid + re-rank), a **governance-aware re-ranker** (authority, freshness, metadata, citation readiness, and **Data-handoff exclusion of blocked sources**), a **mode comparison**, **trace-by-mode**, and a **vector-index-readiness** panel. Build contract gains retrieval lineage. New UI: `RetrievalModes.tsx` on `/build/retrieval`.

### Phase 5 — Agent & tool-calling mechanics
Added an enterprise-safe agent layer (`agents.ts`); no real actions are ever executed:
- A **6-tool schema registry** (with a deliberately **blocked** refund tool), a **governed workflow trace** (with a blocked branch), **permission boundaries**, an **action approval flow**, **6 misuse evals**, and an **AgentToolingContract** written to `rag.agentTooling`. Tool telemetry flows to Operate; findings/controls flow to Govern. New route **`/build/agents`**, UI `AgentTooling.tsx`.

### Phase 6 — Training / fine-tuning / generalization readiness
Closed the model-quality decision gap (`training.ts`); no model is trained:
- A **Fine-tune vs RAG vs Prompt decision memo**, **Training Dataset Readiness** (labels, splits, holdout, balance, leakage, overfitting), **Train/Validation/Test split** visual, an **Overfitting & Generalization** explainer with scenario table, a **Data Purpose Readiness** panel in the Data lab, and a `TrainingReadinessContract` on `rag.trainingContract`. Feeds Operate telemetry, Govern findings/controls, and Realize risk. New route **`/build/training`**, UIs `TrainingReadiness.tsx` + `DataPurposes.tsx`.

### Phase 7 — Optional model-internals layer
A lightweight, optional **"Under the Hood"** explainer (`UnderTheHood.tsx`, static) closing the last concept gaps: transformers, attention (explicitly distinguished from retrieval), embeddings, RAG-vs-fine-tuning, PyTorch/TensorFlow **placement** (not dependencies), and lifecycle tie-back — with a clear "explanation, not implementation" boundary. New route **`/build/internals`**; architecture gains a layer stack; roadmap notes the intent.

---

## New routes added

| Route | Purpose |
|---|---|
| `/architecture` | Implementation notes, contract loop, real-vs-simulated, layer stack |
| `/roadmap` | Current / next / future / out-of-scope + simulation boundary |
| `/build/retrieval` (enhanced) | Retrieval modes, comparison, re-rank, vector readiness |
| `/build/agents` | Agent & tool-calling mechanics |
| `/build/training` | Training / fine-tuning / generalization readiness |
| `/build/internals` | Under the Hood: model internals explainer |

No routes were removed. `/deploy` was repositioned as Operate (route unchanged; nav label kept as "AI Ops" per an explicit earlier preference).

---

## Shared state (program-core) additions

`initiative.meta` · `data.handoff` · `rag.contract` (+ `retrievalMode`, `agentTooling`, `trainingContract`) · `deploy.evidence` (+ tool + training telemetry) · `governance.decision` · `outcomes` · `iteration`. All optional and backward-compatible via the `loadState` spread; new deterministic engines: `contracts.ts`, `operate.ts`, `govern.ts`, `agents.ts`, `training.ts`.

---

## Simulation boundaries (stated in-product)

The product is honest about what is deterministic vs modeled: real logic (lifecycle state, scoring, data-readiness derivation, RAG lab logic, operate/govern/realize engines) vs modeled (production telemetry, incident/regression history, real vector DB, real embeddings, enterprise connectors, real tool execution, real training). Each technical stage (retrieval, agents, training, internals) carries its own explicit boundary note. No overclaiming.

---

## Verification status

Static verification only was possible in the build environment (export/import integrity, no duplicate declarations, no circular imports, contract wiring). **A local `pnpm typecheck && pnpm lint && pnpm build` is the required green-baseline step** and has not yet been run. Recommended final hardening: run the local build, optionally flip off `ignoreBuildErrors`/`ignoreDuringBuilds`, smoke-test the new routes for state-update loops, run the deferred Phase 0 file cleanups, then commit and push.
