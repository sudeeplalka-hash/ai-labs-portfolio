# Program Ops — Roadmap & Implementation Spec

**Scope:** the four deferred program-operations capabilities — FinOps chargeback, staffing/RACI
operating model, vendor procurement & third-party model risk, and quarterly benefits tracking.

**Placement thesis:** these are not a seventh lifecycle stage — they are the *program office*
that sits across all six. They get one new top-level surface, **`/program` (Program Ops)**,
listed in the sidebar below the six stages with distinct "cross-cutting" styling, plus thin,
contract-shaped integrations into the stages that already own the underlying data. This keeps
the six-stage identity pure while finally earning the "program operating system" claim at the
portfolio/operations level.

Every item follows the established house pattern:

1. **Deterministic engine** in `packages/program-core` (or the owning lab), pure + offline
2. **Vitest coverage** including archetype-awareness assertions
3. **UI panel** consuming `useProgramSource()` (never forgets the demo archetype)
4. **Writers** (if any) use the signature-keyed effect pattern, live-gated via `isDemo`,
   with a loop-safety review and — where cross-writer risk exists — a pinned invariant test
5. **Simulation boundary note** on every surface (modeled splits/uplifts labeled as such)

---

## Phase J0 — Scaffold the Program Ops surface *(small, do first)*

| What | Detail |
| ---- | ------ |
| Route | `/program` + `/program/finops`, `/program/operating-model`, `/program/vendors`, `/program/benefits` |
| Sidebar | New "Program Ops" group under the six stages (briefcase icon, no stage number — visually a layer, not a step) |
| Hub page | Four cards (one per capability) with live headline chips once built; ghost states + `LoadSampleInline` before that |
| Rail | No new rail chip (the rail is the lifecycle); the hub gets its own mini-summary strip |
| Copy | One paragraph establishing the framing: "the program office view — cost, people, vendors, and benefits across every stage" |

---

## Phase J1 — FinOps: chargeback & unit-economics guardrails *(1 session)*

**Why first:** every input already exists (`deploy.costPerQuery`, `monthlyCostAtTarget`,
model cost factors, Realize run cost) — this is pure derivation plus one small writer.

| Aspect | Design |
| ------ | ------ |
| Engine | `program-core/src/finops.ts` — `deriveFinOps(s)`: unit economics (cost/query, cost per resolved task = cost/query ÷ resolution rate, cost per adopted user/mo), budget guardrails (monthly budget derived per archetype; burn %, breach status), chargeback allocation (modeled split across consuming units derived from audience — e.g. Support 60 / Sales 25 / Ops 15 — **labeled modeled**), savings levers (cache uplift, model-tier step-down; reuse Deploy's `computeOps` factors) |
| UI | `/program/finops`: unit-economics KpiCards → chargeback table + hand-rolled donut → guardrail status chips → "what moves cost" links into Deploy's levers |
| Integrations | Operate: guardrail chip beside cost/query. Realize: run-cost line annotated "see chargeback →" |
| Writer | Optional `finops` slice (summary only) emitted for Govern evidence ("budget adherence"); signature = deploy cost fields; **never** includes its own output |
| Tests | Chargeback sums to 100%; guardrail trips on the at-risk archetype (0.05/query); determinism |

## Phase J2 — Quarterly benefits tracking *(1 session)*

**Why second:** highest executive value, and the honest time-dimension trick is already half-built —
`outcomes.createdAt` only changes on real outcome changes (H2), so recorded history is truthful.

| Aspect | Design |
| ------ | ------ |
| Engine | `lab-realize/src/engine/benefits.ts` — `deriveBenefitsPlan(inp, roi, adoptionPlan)`: quarterly *planned* ramp (Q1–Q8) from the ROI model with an adoption S-curve toward the adoption plan's projected % |
| Ledger | New `benefitsLedger?: { at: string; riskAdjustedValue: number; roi: number; adoption: number }[]` slice (cap 12). Realize's existing outcomes effect appends **only when `changed`** (same guard as createdAt) — recorded points are real recorded runs, not fabricated history |
| UI | Realize: new "Benefits over time" section — step/line chart (hand-rolled SVG, house style): planned ramp vs recorded points, variance chips, "benefit at risk" callout when recorded < plan for 2+ points. `/program/benefits` shows the summary + ledger table |
| Honesty | Recorded = actual realization runs in this browser; planned = modeled ramp. Both labeled |
| Tests | Ramp monotonic to target; ledger append-only + capped; no append when unchanged (churn guard) |

## Phase J3 — Vendor procurement & third-party model risk *(1 session)*

**Why third:** it wires two existing surfaces together (Model Fit ↔ Govern) — high credibility,
medium effort.

| Aspect | Design |
| ------ | ------ |
| Engine | `program-core/src/vendors.ts` — `deriveVendorProfile(s)`: from the chosen engine (`rag.model`, `modelDeployment`) derive vendor posture: deployment exposure (hosted API vs self-hosted), data-residency & sub-processor risk, lock-in score, exit-plan requirement. Procurement checklist (security review, DPA, model-card review, SLA, indemnity) with mandatory-vs-recommended derived from `auditEvidenceRequired` + tier |
| Exit strategy | The Model Fit ranking's #2 candidate becomes the documented fallback vendor — a real cross-surface payoff |
| UI | `/program/vendors`: selected-engine vendor card → checklist with status chips → third-party risk score → fallback-vendor card linking to Model Fit |
| Integration | One new governance finding when a mandatory checklist item is open ("Vendor DPA outstanding" → Govern, severity by tier) — extend `deriveOpenFindings` so the decision engine sees it |
| Tests | Hosted vs self-hosted risk ordering; audit-required archetypes get more mandatory items; finding appears/disappears with checklist state |

## Phase J4 — Operating model: staffing & RACI *(1 session)*

**Why last:** biggest content surface, lowest wiring risk — it reads meta and writes nothing.

| Aspect | Design |
| ------ | ------ |
| Engine | `program-core/src/operatingModel.ts` — `deriveOperatingModel(s)`: role catalog (Sponsor, Product Owner, AI Program Lead, Data Owner, RAG Engineer, AI Ops/SRE, Governance Lead, Change Lead — plus Tool Owner for agentic, ML Engineer when training-relevant, Compliance for High/Critical tier); 6-stage × role RACI matrix derived from archetype; FTE band estimate per stage (scope/effort-driven, labeled modeled) |
| Insight | "Single point of failure": any role Accountable on 3+ stages gets flagged — an actual program-design smell |
| UI | `/program/operating-model`: RACI grid (R/A/C/I chips, weakest-link highlighting), staffing-estimate cards, SPOF callout. Owners already named on findings/controls link here |
| Tests | Matrix covers all six stages; every stage has exactly one Accountable; archetypes add/remove roles correctly |

---

## Sequencing & guardrails

| Order | Phase | Effort | New writers | Risk notes |
| ----: | ----- | ------ | ----------- | ---------- |
| 1 | J0 scaffold | Small | none | Pure routing/UI |
| 2 | J1 FinOps | Medium | `finops` summary slice | Loop-safety review; signature excludes own output |
| 3 | J2 Benefits | Medium | `benefitsLedger` append | Reuses the `changed` guard; add churn-guard test |
| 4 | J3 Vendors | Medium | none (extends findings engine) | Decision engine consistency test (breakdown = score) must stay green |
| 5 | J4 RACI | Medium | none | Content-heavy; keep to one screen |

**Definition of done, per phase (unchanged from A–I):** `pnpm typecheck` 0 errors ·
all tests green · static export 60(+4)/60(+4) pages · demo works across all six archetypes ·
simulation boundary noted on every new surface · loop-safety audit for any new writer.

**Out of scope (still):** real billing/ERP integrations, real HR/staffing data, real vendor
contract management, real benefits actuals from finance systems — each capability's boundary
note names the production system it would map to.
