# SPEC — Operate: the 7th Stage of the AI Program Command Center (v2)
**Date:** 2026-07-04 · **Supersedes:** `SPEC-day2-observability-console.md` (Option A placement, "OPS-01" identity) · **Incorporates:** `OPERATE-STAGE-PLACEMENT.md` (placement reasoning — adopted in full)
**Owner decision (2026-07-04):** Operate is part of the **Enterprise AI Program Command Center**, not a portfolio catalog lab. It joins Collection 1's instrument suite in the portfolio the same way Backlog Generator / RAG Evaluator / Govern do, and it is wired to the Command Center's ProgramState **at full capacity** — reads and writes, gates and loop-backs.

---

## 1. Identity — what changed from v1

| | v1 (superseded) | v2 (this spec) |
|---|---|---|
| Identity | "OPS-01," a lab | **A lifecycle stage**: `operate`, 7th on the spine |
| Placement | "conceptually between Deploy and Realize" | **After Realize on the rail, scoped from Deploy onward**, loop-back arrow to Frame/Build as the hero |
| Portfolio role | 24th catalog lab | **Collection 1 instrument row** (`C1-operate`) — appears on the landing's C1 shelf and the Competency Map automatically via the registry |
| Wiring | standalone demo | **Full ProgramState integration** (§5) |
| Use-case layer | 3 industry use-cases | **Excluded** — Collection 1 is locked out of the use-case layer; do not breach that scope |

Kill the OPS-01 label everywhere. The thing is called **Operate** and its route is **`/operate`**.

**The one-sentence thesis (from the placement doc, adopted):** Operate is the missing third leg of the post-launch triad — Govern asks *is it allowed*, Realize asks *is it worth it*, Operate asks *is it still working* — and its feedback arrow back to Frame is what turns a lifecycle line into a program loop.

---

## 2. Boundary rule — Deploy vs Operate (MUST be enforced, or the stages fight)

Stage 04 is currently labeled "AI Ops" and already owns drift/cost/latency/alerts/a simulated incident, plus the `program-core/operate.ts` release-readiness engine. Without a re-scope, Operate would duplicate it.

**The boundary: Deploy = day-0/day-1 (get it live safely). Operate = day-2 forever (keep it healthy, or loop back).**

- **Deploy (stage 04) keeps:** release readiness (`computeReleaseReadiness`), version lineage, rollback *capability*, operating envelope, monitoring *coverage* (is instrumentation in place?), the launch-time incident drill. Relabel stage 04 from "AI Ops" → **"Deploy"** (sub: "run"), and reword its `will` to the day-0/1 frame: *"Ship it safely: release readiness, rollout, rollback capability, and the instrumentation you'll live on."*
- **Operate (stage 07) owns:** everything *over time* — drift trends, canary-eval decay, index staleness, agent behavior in production, cost creep, SLO trends, the day-2 incident lifecycle, and the **retrain / re-index / rollback / re-scope decision** with its loop-back.
- **Shared engine, split surfaces:** extend `program-core/src/operate.ts` (it already exports `deriveMonitoringCoverage`, `deriveEvalRegression`, `deriveIncidents`, `ROLLBACK_OPTIONS`, `OpsIncident`). Deploy consumes the readiness-shaped exports; Operate adds and consumes the time-series-shaped ones (§4). One engine file, two stage surfaces, zero duplication.

---

## 3. The stage experience — three views, one incident arc, capped scope

Hard cap: **one screen, three views, one authored incident arc.** This must not become a Grafana cosplay. Every number is deterministic (seeded series), labeled SIMULATED, and traceable to the initiative that flowed down the spine.

### View 1 — Health Board (the layered board + the trap)
Four layers, deliberately ordered so the lesson reads top-to-bottom:
1. **System SLOs** (availability, p95 latency, error rate, throughput) — **all green.** Included precisely to show they're not enough.
2. **Model quality** — scheduled canary evals against the golden set inherited from Build (§5), grounding rate, schema-validation failure rate, refusal rate. **The engineered trap: canary pass-rate sliding week-over-week while every SLO above stays green.** This is EL-04's "reported green, trending amber" lesson replayed at model altitude — make the echo explicit in the copy.
3. **RAG signals** — index staleness (corpus age vs source-of-truth), retrieval recall on canaries, citation-rate decay, answerable-but-unanswered rate.
4. **Agent & cost signals** — loop/iteration anomalies, tool-call error rate, action-fingerprint anomaly (a tool called in a new sequence), autonomy-boundary events (bridges GAP-08's tiers), cost/task trend, cache-hit-rate decay, prompt creep across releases.

### View 2 — Incident Arc (the decision, not the dashboard)
One authored day-2 incident that the visitor can trigger ("week 7 happens"): source system schema change → staleness + drift breach → detection signal fires → triage panel (what we know, blast radius, value exposed) → **the four-option decision: retrain · re-index · rollback · re-scope**, each with cost/time/risk stated → choosing one visibly fires the loop-back (§5) → **incident report generates** (artifact). Also handle the quiet path: dismissing the alert shows value-at-risk accumulating — alert fatigue priced.

### View 3 — The Loop (why this stage exists)
The rail's loop-back arrow, expanded: what Operate sent where. Value-at-risk → Realize. Retrain/re-index task → Build. Re-scope trigger → Frame (as a new backlog candidate). Guardrail-trigger summary → Govern's evidence pack. This view is mostly *reading* the ProgramState writes from §5 — proof the loop is real, not painted.

**Stage credibility block** (same as every instrument): SIMULATED badge · freshness stamp · steering takeaway · how-built · limitations.
**Steering takeaway:** *"Green SLOs don't mean right answers. Infra health and answer health drift apart silently — you operate the loop, not the model."*

---

## 4. Engine additions (`program-core/src/operate.ts`)

Add, alongside the existing readiness exports:
- `deriveOpsSeries(state, weeks)` — seeded deterministic weekly series per layer-metric (SLOs flat-green; canary pass-rate decaying post-week-4; staleness accumulating; cost/task creeping). Seed from the initiative id so different demo archetypes produce different-but-stable operations.
- `detectSignals(series)` — threshold + trend detectors returning typed signals (`silent-drift`, `staleness-breach`, `cost-creep`, `agent-anomaly`), each with detection rationale (what a monitor would key on).
- `deriveDay2Incident(state)` — the authored incident arc with the four remediation options `{ option, costUsd, timeWeeks, risk, loopTarget: "build" | "frame" | "deploy" }`.
- `valueAtRisk(signal, realizeContext)` — degradation % × adoption × annualized value from `selectRealizeContext` — the money bridge.
- `buildOperateFeedback(decision)` — the loop-back contract (§5 writes).
- **Tests required** (this package already has the portfolio's test culture): series determinism per seed; silent-drift detector fires when SLOs green ∧ canary declining; value-at-risk monotonic in degradation; each remediation option routes to the correct loop target; feedback contract shape.

---

## 5. Full ProgramState wiring (the "full capacity" requirement)

**Reads (upstream → Operate):**
| From | What | Why it matters |
|---|---|---|
| Deploy | deployed config: model choice, envelope, SLO targets, monitoring coverage, rollback options | *The system you shipped is the system you watch* — Operate refuses to be a disconnected demo |
| Build | golden dataset + eval baseline | Canary evals decay **from the baseline Build actually established** — the numbers trace |
| Govern | risk tier + required controls | Tier sets alert severity policy (high-risk initiative → tighter drift thresholds) |
| Realize | value model + adoption | Powers value-at-risk in dollars, not percentages |

**Writes (Operate → the loop):**
| To | What | Surface where it lands |
|---|---|---|
| Frame | re-scope trigger → a new backlog candidate ("Re-scope: <initiative> — long-tail documents") | Appears in Frame's backlog view flagged "from Operate" — the next cycle made tangible |
| Build | retrain/re-index task with the failing canary evidence attached | Build's handoff banner acknowledges it |
| Realize | value-at-risk line while a breach is open | Realize shows realized value *net of* value-at-risk |
| Govern | ops evidence (signal log, incident record, decision + rationale) | Extends the existing `govern.ts` "Operate evidence" section — already scaffolded, now fed for real |

**Gating:** Operate unlocks when **Deploy is complete** (not Realize) — mechanically encoding "placed after Realize, scoped from Deploy onward." The rail renders it 7th; the gate honors reality.
**Mechanics:** follow the existing contract pattern (`selectGovernInputs` / `selectRealizeContext`) — add `selectOperateInputs(state)` and `applyOperateFeedback(state, feedback)` in `contracts.ts`/`store.ts`; extend `StageKey` with `"operate"`; add the 7th `STAGES` entry (`n: "07"`, `href: "/operate"`, label: "Operate", sub: "loop", question: "Is it still working?", raises: "Re-frame the next cycle.").
**Rail + story:** `ProgramRail` renders the loop-back arrow from Operate to Frame — **the arrow is the hero visual of the whole spine**; add the story beat ("…and then you run it — and the running teaches you what to build next").

---

## 6. Portfolio surfacing (the "suite of 4" requirement)

Operate ships inside Collection 1, and the portfolio presents it as such — no new collection, no catalog entry in C2/C3/C4:
1. **Registry row:** `{ id: "C1-operate", collection: 1, title: "Operate — Day-2 Observability", status: "in-build" → "shipped", live: "SIMULATED", problem: "Is the system still working — and what do we do when it isn't?", decision: "Retrain / re-index / rollback / re-scope, triggered by the right signal at the right threshold.", href: "/operate" }`. The landing's C1 shelf and the Competency Map pick it up automatically.
2. **Competency Map Domain 2** gains the evidence id (AI Program Delivery & Governance → add `C1-operate`).
3. **Sitemap:** add `/operate`.
4. **Changelog:** dated entry.
5. **Storylines:** extend Storyline 1 (disputes program) with a final Operate step — *"…then run it: week 7's drift breach and the re-index decision"* — deep-linked to `/operate`. This is the cheapest, highest-value narrative win: the flagship storyline currently ends at launch; now it closes the loop.
6. **Use-case layer: explicitly excluded** (Collection 1 lock stands). The Atlas is untouched.

---

## 7. Artifacts (first real implementations of the artifact engine)

Operate ships with two downloads, establishing the pattern the gap analysis (§6, REVIEW-BOARD-GAP-ANALYSIS) prescribes portfolio-wide:
- **Weekly ops review** (MD): per-layer health, open signals, value-at-risk, decisions pending — generated from live view state.
- **Incident report** (MD): timeline, detection signal, blast radius, options considered with costs, decision + rationale, loop-back issued. Generated at arc completion.
Both carry the provenance footer (date · initiative · SIMULATED · assumptions). These two artifacts double as the reference implementation for EL-10/C3-5 downloads later.

---

## 8. Honesty & limitations

- SIMULATED badge; seeded deterministic series; the incident is authored — say so: *"the drift arc is engineered into the data to teach the pattern; in production these series come from your eval pipeline and telemetry."*
- Freshness stamp; limitations note listing what real day-2 needs that this doesn't model (real telemetry ingestion, alert routing/paging, multi-initiative ops, on-call).
- No fake streaming, no fake "live tail." A play-through of authored weeks is fine; pretending it's real telemetry is not.

## 9. Build order & acceptance

1. Engine additions + tests (§4) → 2. `StageKey`/`STAGES`/gating/rail-arrow → 3. View 1 → 4. View 2 + feedback writes → 5. View 3 → 6. Registry/map/sitemap/changelog/storyline → 7. Artifacts.
**Done when:** all §4 tests green · Operate locked until Deploy completes · the silent-drift trap reads within 30 seconds of opening View 1 · choosing "re-index" visibly creates the Build task and the Frame candidate and updates Realize's net value · both artifacts download with provenance footers · `C1-operate` renders on the landing shelf and Competency Map · Storyline 1 ends at `/operate` · rubric ≥26/30.

## 10. Do NOT build

Live telemetry ingestion · configurable alert rules UI · more than one incident arc · per-metric drill-down pages · a 4th view · any use-case rail on this stage · an "OPS-01" tile in Collections 2–4.
