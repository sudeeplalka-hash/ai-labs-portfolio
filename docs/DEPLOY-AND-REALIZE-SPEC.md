# Deploy & Realize — Build Spec (cohesion-checked)

The two payoff stages that prove the thesis: *take a fuzzy ambition and produce a
governed, costed, **risk-adjusted business case where every number is defensible.***
This spec is written **after auditing the existing labs** so nothing is repeated.

---

## A. Cohesion audit — decisions that prevent duplication

1. **Operations belongs to Deploy, not Build.** The RAG lab currently ships a full
   `/operations` (Cost & Latency) dashboard — avg/p95 latency, cost/query, tokens, cache,
   error/timeout. That is the Deploy stage's job.
   → **On re-home: move RAG `/operations` content into the Deploy lab.** Build keeps a single
   "config efficiency: $X/answer · Yms" line that hands off to Deploy.
2. **Maturity/Readiness belongs to Govern, not Build.** RAG ships a `/governance` maturity +
   production-readiness route that duplicates the Governance lab.
   → **On re-home: drop RAG `/governance`.** Govern owns maturity, controls, regulatory readiness.
3. **Disambiguate shared names** (concepts differ; labels must be precise):
   - Readiness → **Data Readiness** (fuel) · **Release Readiness / Quality Gates** (engine) · **Regulatory Readiness** (compliance)
   - Evals → **Quality Evaluations** (RAG) · **Red-Team / Safety Evals** (Govern)
   - Drift → **Regression, version-to-version** (RAG evals) · **Production drift, over time** (Deploy)

### KPI ownership (each metric has exactly one home)
| Lab | Owns | Must NOT show |
| --- | --- | --- |
| Frame | Value/Feasibility/Data-readiness scores, scope, value×effort, success-metric def | run cost, quality |
| Data | readiness, PII, completeness, duplicates, freshness, chunk-readiness | model quality, cost |
| Build/RAG | faithfulness, citation accuracy, hallucination, precision/recall, quality gates, failures | ops cost/latency-at-scale, maturity |
| Deploy | cost-at-scale, p95/p99 under load, throughput, error/timeout/cache, SLO/error-budget, drift-over-time, incident/MTTR | per-answer quality (cites Build) |
| Govern | risk tier, guardrails, red-team evals, controls, escalation, audit, regulatory readiness, maturity | ROI, ops |
| Realize | ROI, adoption, risk-adjusted value, payback/NPV, sensitivity | re-deriving metrics — it cites them |

### One signature visual per lab (all visually distinct)
| Lab | Hero |
| --- | --- |
| Frame | Tradeoff Triangle (radar) |
| Data | Corpus Star Map (constellation) |
| Build | Embedding Projector 3D |
| Govern | Guardrail Pipeline Flow |
| **Deploy** | **Operating Envelope** (new) |
| **Realize** | **Value River / Sankey** (new) |

---

## B. Stage 04 — Deploy / Operations · "Does it run reliably, at what cost?"

Inherits RAG's operations content, then adds the dimensions Build can't see: **load, time,
availability, incidents.**

**Hero — the Operating Envelope.** A contour/heat-map of **load × configuration → SLO &
cost zones**, with a live operating point. The Scale Dial moves the point from the green
"safe zone" toward the red "breaks here" zone; **Inject Incident** knocks it red, then it
recovers. Answers "where does this break, and how close are we?"

**Features**
- **Scale Dial** — pilot (100/day) → production (100k/day); recomputes everything live.
- **Cost at scale** — monthly cost curve that bends upward (the "pilots lie about cost" reveal); levers: caching %, model tier, reranker. (Per-query primitive is *cited from Build*, not re-derived.)
- **Latency under load** — p95/p99 tails + throughput as concurrency rises (the load dimension Build lacks).
- **Reliability** — SLO status + **error-budget burndown** over time.
- **Production drift** — quality decays over time → "refresh / retrain" trigger (distinct from Build's version regression).
- **Inject Incident** (set-piece) — spike / model regression / retrieval outage → alerts trip, burndown craters, **MTTR clock**, runbook plays out, self-heal.

**Depth toggle** — Exec: "Can we run this at scale without it costing more than it saves?" (SLO status, monthly cost at projected volume, the one risk). Practitioner: p95/p99, cost breakdown, drift chart, alert thresholds, incident trace, scaling knobs.

**Reads:** user volume + job (Frame) → traffic; success metric (Frame, e.g. "$1.20/req") → target; per-answer cost + hallucination/containment (Build) → run cost + escalation rate; risk tier (Govern) → SLO strictness.
**Writes:** `deploy: { costPerQuery, monthlyCostAtTarget, latencyP95, latencyP99, reliability, errorBudgetPct, driftRisk, status }`.

---

## C. Stage 05 — Realize / Business Outcome · "What's it worth, risk-adjusted — traceably?"

Built by **elevating the existing governance Business Case (`/value`)**: same calculator,
inputs now **derived from upstream ProgramState and tagged with their source stage** (overridable).

**Hero — the Value River (Sankey).** Addressable value flows in; **leaks** split off —
adoption-gap, quality-gap, run-cost, risk-discount — and **risk-adjusted value** reaches the
end. Each leak is **clickable → jumps to the upstream stage that caused it.**

**Derivation (each line sourced upstream):**
- Addressable value = user volume × job frequency × time/cost saved per task → *Frame + success metric*
- × Realized fraction = adoption curve (shapeable) × quality factor → *Build faithfulness*
- − Run cost → *Deploy cost-at-scale*
- − Risk discount → *Govern risk tier + Data readiness confidence*
- = Risk-adjusted annual value · NPV · payback

**Features**
- Value River (hero) + a **waterfall** breakdown (practitioner).
- **Sensitivity tornado** — which upstream assumption moves ROI most (usually adoption ≫ cost).
- **Initiative Dossier** — one screen: bet (Frame) → readiness (Data) → quality (Build) →
  reliability (Deploy) → risk tier (Govern) → risk-adjusted ROI, each with its number AND the
  decision it traces to. The shareable artifact + route-back-to-contact CTA.

**Depth toggle** — Exec: "$1.2M/yr risk-adjusted, 7-month payback — gated on the data gap."
Practitioner: full model, assumptions table (each tagged with source stage), sensitivity math.

**Reads:** every stage slice. **Writes:** `outcomes: { roi, adoption, riskAdjustedValue, paybackMonths }`.

---

## D. Traceability spine (small foundation addition)

Add to `@labs/program-core`:
```ts
export interface Traced<T> { value: T; source: StageKey; basis: string }
```
Realize composes `Traced<number>` from the stage slices; the Value River, waterfall, and
Dossier render value + a "source: stage" badge everywhere. This is what makes the ROI
defensible rather than asserted.

---

## E. Build sequence
1. Re-home **Data + RAG** (write `data`/`rag` slices; **move ops → Deploy backlog, drop RAG `/governance`**).
2. **Deploy** (Operating Envelope + scale/SLO/drift/incident; writes `deploy`).
3. **Realize** (elevate `/value`; Value River + waterfall + sensitivity + Dossier; writes `outcomes`).
Each stage degrades gracefully if an upstream slice is empty (derives from Frame + defaults).
