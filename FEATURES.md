# AI Command Center — Feature Inventory

An end-to-end list of every feature in the AI Command Center, organized by the six
program stages plus the shared platform layer. Grounded in the current codebase
(`labs-platform` monorepo, Next.js static export).

> Note: this reflects the current working tree, which may be ahead of the live site
> until changes are committed and pushed.

---

## Platform & shell (cross-cutting)

| Feature | What it does |
|---|---|
| Six-stage program spine | Strategy → Data → Build → AI Ops → Govern → Realize, wired as one lifecycle with gated progression (`program-core/stages.ts`) |
| Unified lab view | One comprehensive page per lab — narrated executive framing and the full practitioner detail (sliders, matrices, technical traces) always visible together |
| Story Thread (shell-mounted) | Narrated band on every lab showing the question, decision, and "so what" for that stage |
| Storyline + Board Brief | `/story` narrative walkthrough and `/story/brief` + `/govern/brief` one-page board summary generated from live state |
| Live / Demo mode | Per-lab toggle between seeded demo data and live-entered data |
| Per-lab Guides | Plain-language "how this lab works" pages for every stage (`/*/guide`) |
| Portfolio & program state | Shared `ProgramProvider` carrying the initiative, scores, and portfolio across stages; handoff bridges encode/decode between labs |
| Design system | Shared tokens + components (Panel, KpiCard, ScoreBar, MetricTooltip, DepthToggle, etc.); "i" metric tooltips throughout |

---

## Stage 01 — Strategy & Planning (`/frame`)

| Feature | What it does |
|---|---|
| Idea generator | Vague ambition + five knobs → sharpened framing and a scored value-vs-effort spread of options (`IdeaGenerator`, `Scatter`) |
| Strategy workshop | Six-step intake (business context, ambition, value, data, risk, delivery) that auto-populates from a picked idea |
| Readiness scoring | Six weighted categories → overall score, decision band (Proceed/Refine/Redesign/Stop), and required gates (`ScorePanel`) |
| Auto-generated falsifiable target | Baseline→target metrics derived from the value driver (handle time, cost/interaction, error rate, CSAT, etc.) |
| Initiative Brief | Document-style brief with Save to Program / Copy / Continue-to-Data handoff |
| Use-case archetypes | Six enterprise AI patterns with best-fit, data needed, risks, controls, success metric |
| Trade-off radar / verdict banner | Value-feasibility-data trade-off visual and a go/no-go verdict |

---

## Stage 02 — Data (`/data`)

| Feature | What it does |
|---|---|
| Data readiness dashboards | Executive + technical views with readiness gauge and ROI calculator |
| Corpus intake & star map | Upload/inspect a corpus (incl. PDF/Word), visualized as a corpus star map (`CorpusView`, `CorpusStarMap`) |
| PII / sensitive-data panel | Detects sensitive data with per-category chip breakdown |
| Column profiler & rule profiles | Profiles columns; selectable rule profiles with threshold controls |
| Consequence simulator | Shows how data-quality thresholds change downstream outcomes |
| Chunk readiness | Assesses whether the corpus is ready to chunk for RAG |
| Before/after diff + prep timeline | Visual diff of cleaning steps and a prep timeline; exportable report |

---

## Stage 03 — Build · RAG (`/build`)

| Feature | What it does |
|---|---|
| Model Fit (opening section) | Nine model archetypes scored against weighted criteria (cost, latency, reasoning, portability, customizability, ops simplicity); chosen engine threads into Deploy & Realize (`model-selection`) |
| Model score visuals | Shows how criterion weights change the fit ranking |
| Live RAG lab | End-to-end pipeline: document intake → chunking → retrieval → answer generation, run live (`LiveLabView`) |
| 3D embedding projector | Interactive embedding-space visualization with k-means clusters (TF-IDF→PCA stand-in for a neural encoder) |
| Chunk explorer | Inspect how documents are split into retrievable chunks |
| Retrieved evidence panel | Shows top-k retrieved chunks behind each answer, with scrollable evidence |
| Answer engine selector | Inline switch between answer engines/settings |
| Token explorer + cost/latency | Token-level breakdown and live cost/latency KPIs (`TokenExplorer`, `LiveCostLatency`) |
| Claim verification | Extracts answer claims and marks each supported/contradicted with citations |
| Trace explorer | Per-query traces with timeline, scores, and failure reasons |
| Evaluations + golden dataset | Adversarial/eval suites against a golden dataset (`/build/evaluations`, `/build/dataset`) |
| Quality gates | Pass/fail gates on faithfulness, completeness, citation accuracy (`/build/quality-gates`) |
| Failure analysis | Failure category chart + heatmap with root causes and recommended fixes (`/build/failures`) |
| Retrieval strategy chart | Compares retrieval strategies/parameters (`/build/retrieval`) |

---

## Stage 04 — AI Ops (`/deploy`)

| Feature | What it does |
|---|---|
| Operating envelope | Cost/query, latency, and hallucination envelope that scales with the chosen model's cost/latency/capability factors |
| Config comparison matrix | Side-by-side deployment configurations with trade-offs |
| Incident panel | Operational incidents and their handling |
| Unified ops view | Exec one-screen summary and the full ops charts on one page |

---

## Stage 05 — Govern (`/govern`)

| Feature | What it does |
|---|---|
| Executive cockpit | Governance KPIs across use cases (RAG assistant, agentic assistant), prompt-injection metrics (`/govern/live`) |
| Use-case registry | Register, view, and add governed AI use cases (`/govern/use-cases`, incl. detail + new) |
| Runtime playground | Prompt testing with input/output guardrails, injection blocking, citation & agentic-scope policies (`/govern/playground`) |
| Eval lab | Governance/red-team evaluation suites (`/govern/evals`) |
| Policy workbench | Author and manage guardrail policies (`/govern/policies`) |
| Risk studio | Assess deployment risk across contexts (`/govern/risk`) |
| Red-team arcade | Attack-vector exploration (`/govern/arcade`) |
| Maturity index | AI governance maturity scoring (`/govern/maturity`) |
| Readiness / review queue / evidence / audit logs | Deployment readiness, human review queue, evidence links, and audit trail (`/govern/readiness`, `/review-queue`, `/evidence`, `/audit-logs`) |
| Board brief + value + docs | Board one-pager, business-value view, and governance docs |

---

## Stage 06 — Realize (`/realize`)

| Feature | What it does |
|---|---|
| Value verdict hero | Single-scroll narrative opening with the ROI verdict |
| Value waterfall | Bridge chart tracing value contributions/leakage stage-by-stage (`ValueWaterfall`) |
| ROI KPIs & levers | Headline payoff KPIs with tooltips and adjustable value levers (practitioner adds sliders) |
| Traceability dossier | Ties every realized number back to decisions made upstream (framing → data → build → ops) |
