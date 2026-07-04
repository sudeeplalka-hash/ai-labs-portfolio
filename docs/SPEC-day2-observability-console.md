# Build Spec — AI Production Observability Console

**The "Operate / Day-2" control room — the missing stage of the lifecycle.**
Working id: **`OPS-01`** · Collection: Engagement Leadership (the control room) · Status target: shipped, `SIMULATED` (LIVE-ready)
Date: 2026-07-04 · Author of spec: portfolio build agent · Precedes implementation.

---

## 0. One-liner

*Ship day is Day 1. This is Day 2 — the live control plane that watches a deployed model/agent over time and tells you the one thing a snapshot can't: is it **still** trustworthy, and if not, what do I do about it?*

---

## 1. Why this exists (and the honest tension)

The portfolio demonstrates the whole AI lifecycle — Frame → Data → Build → Deploy → Govern → Realize — and then **stops at the moment the system goes live.** There is no surface for the operational reality that follows: drift, staleness, hallucination creep, cost drift, and the incident nobody saw coming. Every "monitor" already in the portfolio sits one altitude *above* the running model (program health, vendor risk, portfolio ROI); none watches the model itself.

**The tension, stated honestly.** Fable's review advised *"resist adding labs — the 24th lab is worth less than the 1st test."* That is correct for *breadth* labs. This is the exception, and the reason is structural: **OPS-01 is not the 24th parallel lab, it is the missing lifecycle stage** — the "Operate" loop the whole spine already implies. It closes Realize back to Frame. It adds *depth on the critical seam*, not breadth. If only one more instrument is ever built, it should be this one, because it is simultaneously (a) the top ML/DS operational gap, (b) the operating-model competency a delivery VP most wants to see, and (c) the artifact that makes the lifecycle a **loop** rather than a line.

---

## 2. The decision it forces

Not a passive dashboard — consistent with the portfolio doctrine that *every instrument ends in a decision.* OPS-01 forces the Day-2 call:

> **A signal has crossed its SLO. Do I roll back, retrain/re-index, tighten the guardrail, accept-and-watch, or page someone — and what do I tell the steering committee?**

The console's job is to make that decision fast, defensible, and routed: surface the breach, name the probable root cause, propose the action, and emit the paperwork.

---

## 3. Placement & routing

Two viable homes; recommendation follows.

- **Option A (recommended): a Collection-1 "Operate" stage** at `/operate`, inserted conceptually between Deploy and Realize, wired into the existing `ProgramState` handoff so the model deployed in Deploy is the one observed here, and a tripped SLO flows into Realize (value at risk) and Govern (incident record). Most honest — it literally closes the lifecycle loop the spine advertises.
- **Option B: an Engagement-Leadership control-room lab** at `/engagement/observability`, standalone, reusing the EL chrome and the use-case rail. Lower coupling, faster to ship, but doesn't visibly close the C1 loop.

**Recommendation:** ship **B first** (standalone, low-risk, reuses everything), then thread it into the C1 lifecycle as the Operate stage (A) as a fast-follow. This de-risks the build and still lands the loop-closing narrative in phase 2.

---

## 4. Data model — the four signal families + the SLO spine

The whole console is driven by one typed structure (authored per scenario, `SIMULATED`; LIVE-ready). Proposed shape:

```ts
type SignalFamily = "quality" | "safety" | "freshness" | "reliability";

interface Signal {
  key: string;
  label: string;              // "Groundedness", "Hallucination rate", "Index staleness", "p95 latency"
  family: SignalFamily;
  unit: "%" | "ms" | "$" | "days" | "rate";
  series: { week: number; value: number }[];   // the time axis
  slo: { target: number; comparator: "<=" | ">="; };  // e.g. groundedness >= 85, hallucination <= 5
  leads?: string;             // optional: key of a signal this one is a leading indicator for
}

interface DeployedSystem {
  key: string; label: string;  // "Disputes RAG assistant (finserv)"
  industry: IndustryKey;
  signals: Signal[];
  incidentWeek: number;        // when the SLO breach becomes visible
  rootCauseKey: string;        // which signal is the true cause (the leading indicator)
}
```

**The four families and their canonical signals:**

| Family | Signals (examples) | SLO example | The lesson |
|---|---|---|---|
| **Quality / drift** | Online eval score (faithfulness/accuracy), input **data drift** (PSI), output drift | eval ≥ 85% · PSI ≤ 0.2 | the model can decay with zero code changes |
| **Safety** | **Hallucination / groundedness** rate, guardrail hits, prompt-injection attempts | hallucination ≤ 5% | safety is a rate, not a one-time gate |
| **Freshness** | Data recency, **model age**, **index/KB staleness** (days since re-index) | index ≤ 7 days | the RAG killer everyone forgets |
| **Reliability / economics** | p95 latency, cost/req, throughput, error/fallback rate | p95 ≤ 1200ms · cost ≤ $0.02 | the SRE floor — necessary, not sufficient |

**The SLO spine:** each signal carries a target + comparator; the console computes **error-budget burn** (how much of the allowed breach budget is consumed) and an overall system state (Healthy / Watch / Breaching). This is the senior framing — SRE discipline applied to AI.

---

## 5. The time axis + the "week 7 incident" (the aha)

Every existing lab is a *snapshot*; OPS-01's differentiator is the **time axis**. A scrubber ("advance to week N") plays a developing story. The default authored scenario is engineered to teach the portfolio's sharpest Day-2 lesson:

> **Weeks 1–4:** all green. **Week 5:** the knowledge base silently stops being re-indexed — the *freshness* lane (index staleness) begins climbing; nothing else moves yet. **Weeks 6–7:** *quality* (groundedness) quietly decays and *safety* (hallucination rate) creeps up — **while latency, cost, throughput, and uptime stay perfectly green.** **Week 7:** groundedness crosses its SLO and the console fires.

The teaching payload, all in one moment:
1. **System-green, AI-red** — the traditional SRE dashboard would show *nothing wrong*. Only AI-specific observability catches it.
2. **Leading indicators** — freshness moved a week *before* quality. The console names index-staleness as the **root cause** (via the `leads` link), not the groundedness symptom. That's the senior diagnostic move.
3. **The decision** — the console proposes *re-index + re-run eval* (not "retrain the model," which is the naïve reflex), estimates the recovery, and routes the paperwork.

A **"trigger the incident"** button (à la the Fable-suggested incident interaction) jumps the scrubber to week 7 for demos.

---

## 6. Closing the loop

This is what makes it the *lifecycle* stage, not just a dashboard. On a breach, OPS-01 emits three routed outputs:

- **→ EL-04 RAID Radar:** a new risk item ("groundedness SLO breached, root cause index staleness") appears in the delivery board — reuse the deep-link / shared-data pattern.
- **→ EL-10 Exec Comm Studio:** the breach becomes a decision line in the steering pre-read ("re-index approved? owner? by when?").
- **→ Govern + Build:** an incident record (audit) and a **retrain/re-index trigger** back into the build loop; and **→ Realize:** value-at-risk if unaddressed.

The narrative sentence: *Realize doesn't end the program — Operate feeds the next Frame.* This is the money loop Fable flagged as missing, delivered as a byproduct.

---

## 7. Reuse map + the new engine

OPS-01 is largely **assembly**, which is why it's high-value/low-risk — it makes the recently-built machinery pay off again:

| Reuses | For |
|---|---|
| `lab-rag/evaluation.ts` | the quality lane as **online eval** — run the existing faithfulness/hallucination scorer over a rolling sample instead of once |
| EL-04 `portfolioData` health model + `healthIndex` | the roll-up state (Healthy/Watch/Breaching) |
| `FreshnessStamp` concept | promoted from *lab-content* freshness to *production* freshness (data/model/index) |
| HITL (GAP-08) | the human-feedback capture that seeds the eval set |
| Artifact engine (`components/artifact`) | the downloadable ops artifacts (§8) |
| Use-case rail + `?uc=` deep-link | the industry scenarios (§9) |
| `@labs/engines` + vitest | **new** `observability.ts` engine, unit-tested like the others |

**New pure engine — `packages/engines/src/observability.ts`** (framework-agnostic, tested):

```ts
export function sloState(signal: Signal): "ok" | "watch" | "breach";     // vs target, with a watch band
export function errorBudgetBurn(signal: Signal): number;                  // % of allowed breach consumed
export function drift(series: number[]): { psi: number; trend: "up"|"flat"|"down" }; // PSI-style drift
export function rootCause(system: DeployedSystem): string;               // leading-indicator resolution
export function systemState(system: DeployedSystem): "healthy" | "watch" | "breaching";
```

Tests (mirroring the existing suites): SLO comparator both directions, budget-burn boundaries, PSI monotonicity, root-cause picks the leading indicator not the loudest symptom, `systemState` is worst-of the lanes. ~30–40 assertions — extends the test story you just shipped.

---

## 8. Downloadable artifacts (ties into the artifact engine)

Every Day-2 review produces paperwork; reuse `downloadMarkdown` / `downloadCsv` with the provenance footer:

- **Weekly AI ops review** (MD) — signal states, budget burn, what changed, the one decision — the Day-2 analogue of EL-10's pre-read.
- **Incident report** (MD) — timeline, root cause, blast radius, action, owner, date — generated on a breach.
- **Model health scorecard / signal export** (CSV) — every signal × week for the record.

---

## 9. Industry use-cases (the rail)

Reconfigures per industry via the existing use-case pattern, each teaching a different Day-2 failure mode (and each honestly `studied` unless first-hand):

- **Finserv · fraud model** — *data drift* leads (transaction mix shifts post-holiday); false-positive rate creeps; system metrics fine.
- **Healthcare · clinical-support RAG** — *safety* is the gated SLO (groundedness/hallucination), staleness of guidelines is the root cause; human-review rate is a first-class signal.
- **Retail · personalization** — *freshness/seasonality* dominates; the model is "correct" but stale; cost drift from traffic spikes.

Each is a `DeployedSystem` payload; the rail + `?uc=` deep-link and the industry Atlas pick them up for free.

---

## 10. Honesty & live-readiness

- **Default:** `SIMULATED` — authored signal time-series, clearly labeled; a "how this is built" disclosure and a limitations note (as every lab has).
- **LIVE-ready path:** the quality lane can run **genuinely live** — with a model endpoint connected (reuse `llmProvider` + `evaluation.ts`), online eval over a sampled set produces real groundedness/hallucination numbers, and the badge flips `LIVE` on that lane while the rest stays `SIMULATED`. This is exactly the BYO-key pattern Fable wants surfaced — and Day-2 eval is its most natural home.
- Never fake-stream; a cached/authored series is labeled as such.

---

## 11. Layout / UX (section by section)

1. **Header + system selector + time scrubber** — pick the deployed system (rail), scrub weeks 1→N, "trigger incident" button, overall state chip (Healthy/Watch/Breaching) with error-budget summary.
2. **The four lanes** — one row per family, each a sparkline-over-weeks with its SLO line drawn in; the lane goes amber/red as its budget burns. Reliability lane visibly **stays green** during the incident — the whole point.
3. **Breach panel** — when an SLO trips: the signal, the **root cause** (leading indicator, named), the blast radius, and the **proposed action** with a recovery estimate. Buttons: *Roll back · Re-index/Retrain · Tighten guardrail · Accept & watch · Escalate.*
4. **Loop-out strip** — "Data out →" links that push to EL-04 RAID and EL-10 pre-read (deep-linked), plus the incident/audit record.
5. **Artifacts** — Generate weekly ops review / incident report / signal CSV.
6. **Credibility block** — steering-committee takeaway ("Day 1 is the data scientist's; Day 2 is mine"), resume echo, how-it's-built, limitations.

---

## 12. Acceptance criteria

- [ ] Scrubbing the timeline animates all four lanes; reliability stays green through the week-7 incident while quality/safety breach.
- [ ] The breach panel names **index staleness (freshness)** as root cause of the **groundedness (quality)** breach — leading indicator, not symptom.
- [ ] Every signal shows its SLO line and error-budget burn; `systemState` = worst-of lanes.
- [ ] Three industry use-cases load via the rail + `?uc=`; each has a distinct dominant failure mode.
- [ ] Three artifacts download, each with a provenance footer and current-scenario data.
- [ ] `@labs/engines/observability.ts` ships with ≥30 passing assertions in CI.
- [ ] LIVE-ready: with a key connected, the quality lane runs real online eval and badges `LIVE`; without, `SIMULATED`, honestly labeled.
- [ ] Loop-out links deep-link into EL-04 and EL-10.

---

## 13. Phased build plan (each independently shippable)

1. **Engine + tests** — `observability.ts` in `@labs/engines` + vitest (no UI risk; extends the test suite).
2. **Standalone lab (Option B)** — the console at `/engagement/observability`, one authored scenario, the four lanes + scrubber + breach panel. Ship it.
3. **Use-cases + artifacts** — the three industry `DeployedSystem` payloads on the rail; the three downloads.
4. **Loop-out + LIVE lane** — deep-links into EL-04/EL-10; the BYO-key online-eval quality lane.
5. **Fast-follow (Option A)** — thread into Collection 1 as the `/operate` stage, wired to `ProgramState`, closing the lifecycle loop visibly.

---

## 14. Explicitly out of scope (don't overbuild)

Real APM/agent instrumentation, a metrics database, live alerting integrations (PagerDuty/Slack), auto-remediation, or a general-purpose monitoring product. OPS-01 demonstrates the *judgment* of Day-2 operations — which signals matter, how to read them, when to act — at a leadership altitude. It is a decision instrument that *looks and reasons* like a production console, honestly labeled, not a real one.

---

*This spec closes the lifecycle loop the portfolio already implies, converts the top ML/DS operational gap into a flagship, and makes the recently-built engines, tests, artifacts, and use-case machinery pay off a second time. If one more thing is built, build this.*
