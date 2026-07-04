# Use-Case Layer — Review Addendum (Fable corrections, folded in)

**Status:** Binding · amends `USE-CASES-PLAN.md` · **Prepared:** 2026-07-03 · **Owner:** Sudeep Lalka
**Owner first-hand sign-off:** ✅ recorded 2026-07-03 (see §3).

> Fable 5 endorsed the use-case layer's design ("right enhancement, right architecture — rail + payload + Atlas") but gave **two binding corrections before build**. This addendum folds them in. Once these are the rules of record, **Phase A is a go** with unchanged scope (GAP-03, C3-1, EL-01).

---

## 1. What Fable flagged (§4.8 of the review)

1. **The coverage claim is false as mapped.** The plan's §6 asserted "~20 industries, each in ≥3 labs, no one-offs." As actually mapped, **telecom / wealth / travel / real-estate / cyber were one-offs, Education was zero, and healthcare appeared ~11×** (it dominated). → Coverage must be **computed from the registry**, never asserted, and **first-hand domains must each appear ≥3×**.
2. **Provenance needs teeth.** `sources` was optional. → Every `studied` use-case needs a **required `sources` field + a `lastVerified` date**, and every **`first-hand` badge needs explicit owner sign-off**.

---

## 2. Correction 1 — Schema & computed coverage (binding)

### 2.1 Amended `UseCase` type

`sources` and `lastVerified` are now **required**; provenance carries a sign-off flag.

```ts
type Provenance =
  | { kind: "first-hand"; ownerSignedOff: true }   // only true is representable
  | { kind: "studied" };

interface UseCase<Payload> {
  id: string;
  labId: LabId;
  industry: IndustryKey;
  provenance: Provenance;
  title: string;
  oneLiner: string;          // ≤ 12 words
  context: string;           // who / what / the workflow
  theDecision: string;       // the specific call this lab makes here
  whatMostMiss: string;      // the non-obvious insight
  stakes: string;            // the number/impact that makes it matter
  takeaway: string;          // industry-specific steering line
  sources: string[];         // REQUIRED — ≥1 credible "informed by" pointer
  lastVerified: string;      // REQUIRED — ISO date (YYYY-MM-DD)
  payload: Payload;
}
```

A tiny authoring-time assertion (`assertUseCase`) rejects any record with an empty `sources`, a missing `lastVerified`, or a `first-hand` provenance without `ownerSignedOff`. This makes the honesty rule mechanical, not a matter of discipline.

### 2.2 Coverage is computed, never asserted

The Industry Atlas and any coverage headline read the counts **live from the use-case registry** — e.g. `coverage() => Map<IndustryKey, number>`. No hardcoded "N industries · no one-offs" copy anywhere. The headline stat renders from the data (same doctrine as the freshness stamps and the live health strip).

---

## 3. Correction 2 — Owner-confirmed first-hand set (signed off 2026-07-03)

These four are **first-hand** (Sudeep personally ran the pattern). Each must appear **≥3×**:

| First-hand domain | Basis | Target appearances |
|---|---|---|
| **Financial services — cards & payments** | HCLTech @ American Express | ≥3 (lands at 10) |
| **Capital markets — wealth & ratings** | Genpact @ Morgan Stanley; S&P Global / CRISIL | ≥3 (lands at 4) |
| **Telecom** | Deloitte @ Verizon | ≥3 (lands at 3) |
| **Consulting delivery / program leadership** | HCLTech / Deloitte / Genpact | ≥3 (lands at 3) |

Everything else is **`studied`** (informed by public industry patterns) and carries `sources` + `lastVerified`.

---

## 4. Rebalanced coverage — computed target (21 industries, no one-offs)

Healthcare cut 11→5; retail 8→4; every industry now appears **≥2**; the four first-hand domains **≥3**; **Education added**. Financial services stays deepest — that is honest (it is the core résumé), and it is now *shown* as computed, not claimed.

| Industry | Count | | Industry | Count |
|---|---|---|---|---|
| 💳 Financial services (cards/banking) `FH` | 10 | | 📣 Marketing / adtech | 2 |
| 🏥 Healthcare | 5 | | 🎬 Media & entertainment | 2 |
| 🏭 Manufacturing | 5 | | 📦 Logistics / supply chain | 2 |
| 🛒 Retail & e-commerce | 4 | | 🔒 Cybersecurity | 2 |
| 📈 Capital markets / wealth `FH` | 4 | | ⚡ Energy & utilities | 2 |
| 🛡️ Insurance | 4 | | ✈️ Travel & hospitality | 2 |
| 🧬 Pharma / life sciences | 4 | | 🏢 Real estate / proptech | 2 |
| 📡 Telecom `FH` | 3 | | 🧑‍💼 HR / talent | 2 |
| 🧑‍💼 Consulting / prof. services `FH` | 3 | | 🎓 Education | 2 |
| ⚖️ Legal | 3 | | | |
| 💻 Technology / SaaS | 3 | | | |
| 🏛️ Public sector | 3 | | | |

**Computed headline (rendered from the registry):** *One operator · 21 industries · 4 first-hand · 8 AI patterns · 69 worked scenarios.* Deepest in financial services; credibly studied across 17 more.

---

## 5. The rebalanced 23 × 3 map (LOCKED — authoring target)

Format: **industry** — *scenario* → decision it illuminates · `provenance`. Changed-from-original rows marked ⤳.

### Collection 2 — Agent & Protocol

**GAP-01 · MCP Server Playground**
- 🏥 Healthcare — EHR/FHIR wrapped so an agent proposes, never writes → the write-approval boundary · `studied`
- 🛒 Retail — OMS/returns as idempotent, rate-limited tools → which mutations need idempotency + confirm · `studied`
- 🏭 Manufacturing — MES/historian read-only across the OT/IT line → read-only as the OT safety guarantee · `studied`

**GAP-02 · Agent Loop & Failure Inspector**
- 🛡️ Insurance — FNOL triage; hallucinated policy # → schema reject + re-ask → validation gate as fraud control · `studied`
- 🔒 Cybersecurity — SOC triage loops on a flapping alert → loop-breaker + escalate → observability spend vs alert-fatigue · `studied`
- ⤳ 📡 Telecom — NOC agent on a flapping alarm source during congestion → retry/backoff + fallback → resilience as a network-SLA duty · `first-hand`

**GAP-03 · Multi-Agent Orchestration Board** *(flagship)*
- ⚖️ Legal — contract-review swarm on an MSA; the critic catches an unsupported redline → when quality lift beats 2–3× cost · `studied`
- 🧬 Pharma — competitive-intel brief on a Phase II readout → multi-agent only for high-stakes synthesis · `studied`
- ⤳ 📈 Capital markets — equity-research swarm (analyst / risk / compliance-critic) on a thesis → the critic as the surveillance control · `first-hand`

**GAP-04 · Tool-Use & Structured Output**
- ⤳ 📈 Capital markets — extract covenants/terms from a bond prospectus; nulls flag for review → null-and-flag over hallucinate · `first-hand`
- 📦 Logistics — messy carrier email → structured shipment-exception event → reliability at the system-of-record boundary · `studied`
- 🏢 Real estate — rent / escalations / break clauses from a lease PDF → where the validation gate sits · `studied`

**GAP-05 · Context & Memory Engineering**
- 💻 SaaS support — 40-turn thread across sessions; summarize vs full-dump → strategy per session length · `studied`
- ⚖️ Legal e-discovery — 50k docs; compress vs sub-agent handoff → the dial at corpus scale · `studied`
- 📈 Wealth advisory — client goals/constraints across quarterly reviews → memory policy as relationship continuity · `first-hand`

**GAP-06 · Prompt Cost & Token Simulator**
- 🛒 Retail — refresh copy for 4M SKUs; cache the system prompt → caching as the build-vs-buy lever · `studied`
- ⤳ 📡 Telecom — summarize 1.2M care-center calls/month; batch discount decides feasibility → batching as go/no-go · `first-hand`
- 📣 Adtech — 30 creative variants × thousands of campaigns → economics before architecture · `studied`

**GAP-07 · Protocol Selection Lab**
- 💳 Bank — 40 internal systems, many agent teams → MCP core + A2A → hybrid at enterprise scale · `first-hand`
- 💻 Startup — two tools, one agent, ship this quarter → function calling; a protocol is premature · `studied`
- 📦 Supply chain — a buyer's agent negotiating across orgs → A2A as the horizontal axis · `studied`

**GAP-08 · Human-in-the-Loop Approval**
- 💳 Lending — auto-approve/deny by risk tier; the slip is a thin-file applicant → autonomy gated by fair-lending risk · `first-hand`
- 🎬 Content moderation — auto-remove vs human-review by harm severity → the throughput-vs-harm curve · `studied`
- 🏥 Clinical — AI orders auto-file only below an acuity threshold → acuity as the autonomy dial · `studied`

### Collection 3 — Business of AI

**C3-1 · AI Initiative Portfolio Dashboard** *(flagship)*
- 💳 Retail bank — cards / fraud / KYC / wealth book; two should die → kill/scale/hold across finserv · `first-hand`
- 🏥 Health system — 12 clinical + admin initiatives → allocation across a mixed book · `studied`
- 🏭 Manufacturer — predictive-maintenance / defect-vision / demand / procurement → industrial allocation · `studied`

**C3-2 · Build-vs-Buy-vs-Fine-Tune**
- ⚖️ Legal — buy a legal-AI suite vs build vs fine-tune on the firm's precedents → differentiation vs speed · `studied`
- 🎬 Media — high-volume localization/dubbing: fine-tune/self-host vs API → volume flips the answer · `studied`
- 💳 Bank — fraud model: build/self-host (data gravity + latency) vs vendor → control vs time-to-value · `first-hand`

**C3-3 · Inference Cost Forecaster**
- 💻 Consumer social — a chat feature at tens of millions DAU → the self-host crossover comes early · `studied`
- 🛡️ Insurance — document-heavy claims volume → utilization as the real driver · `studied`
- 📡 Telecom — network-ops assistant across NOCs → portfolio-level run-rate · `first-hand`

**C3-4 · Vendor Evaluation & Risk Monitor**
- 🧬 Pharma — regulated-research LLM vendor; security/validation weighted; concentration risk → weights flip the ranking · `studied`
- ⤳ 🎓 Education — an ed-tech LLM vendor under FERPA/COPPA; student-data privacy weighted → constraints as weights · `studied`
- 🏛️ Public sector — a vendor under data-sovereignty + procurement rules → open-source-backed rises · `studied`

**C3-5 · Business Case / ROI Builder**
- ⤳ 🎓 Education — an AI-tutoring rollout across a district; adoption-ramp sensitivity dominates → present the range · `studied`
- 🏭 Manufacturing — defect-detection rollout; scrap-rate assumptions swing it → the swing driver · `studied`
- ⤳ ✈️ Travel — airline irregular-ops automation; disruption frequency is the lever → fund on the band · `studied`

### Collection 4 — Engagement Leadership

**EL-01 · Adoption & Change Readiness** *(flagship)*
- 🏥 Hospital — ambient scribe for 2,000 clinicians; trust + workflow-fit dominate → gate on trust, not tech · `studied`
- 💳 Contact center — agent-assist for 900 finserv reps → the rollout you've run · `first-hand`
- ⚡ Utilities / field — a technician copilot on trucks; connectivity is the risk → adoption in the field · `studied`

**EL-02 · Stakeholder & Sponsor Alignment**
- 🏛️ Public sector — benefits-modernization; political sponsors drift → re-align before the review · `studied`
- 🧬 Pharma R&D — science + regulatory + commercial pulling apart → the pre-steering brief · `studied`
- ⤳ 📈 Capital markets — a wealth-platform program; a sponsor cooling before the QBR → the silence between meetings · `first-hand`

**EL-03 · Capacity & Resourcing Planner**
- 🧑‍💼 Consulting delivery — a 30-person AI delivery pod; skills, not headcount → hire/contract/upskill · `first-hand`
- ⤳ 🧑‍💼 HR-tech scale-up — I/O-psych + ML skills scarce → the skill-shaped gap · `studied`
- 💳 Bank AI CoE — governance + MLOps the bottleneck → the non-obvious pole · `first-hand`

**EL-04 · Delivery Health & RAID Radar** *(interview-critical — build early)*
- 🛡️ Insurance — a claims-automation program; a "green" stream trending amber on model drift → trajectory over snapshot · `studied`
- ⚡ Energy — grid-forecasting; an OT-data dependency is the hidden red → the dependency nobody watches · `studied`
- 🛒 E-commerce — personalization; adoption quietly reversing → reported vs actual · `studied`

**EL-05 · AI Compliance Readiness Navigator**
- 💳 Lending — credit decisioning: EU AI Act high-risk + fair-lending overlay → tier + controls · `first-hand`
- 🧑‍💼 HR / hiring — résumé screening: high-risk employment use → design-in, not retrofit · `studied`
- 🏥 Healthcare — diagnostic support: AI Act + medical-device (MDR) overlap → two regimes at once · `studied`

**EL-06 · Talent & Upskilling Pathway Planner**
- 💳 Bank AI CoE — classic ML → agentic skills → build/hire/partner mix · `first-hand`
- 🏭 Manufacturer — OT engineers + AI literacy → partner for speed · `studied`
- ⤳ 📣 Creative agency — designers/writers + generative tooling → the 18-vs-24-month gap · `studied`

**EL-07 · RFP/RFI Response War Room**
- 🏛️ Public sector — a government AI-services RFP; the honest no-bid on an unrealistic SLA → bid/no-bid discipline · `studied`
- ⤳ 🔒 Cybersecurity — a managed-SOC RFP with an unrealistic detection SLA → no-bid discipline on risk · `studied`
- 🛒 Retail — a fast, price-driven RFP; bid on the margin floor → margin as the gate · `studied`

**EL-08 · Estimation & Scoping Studio**
- 🛡️ Insurance — a claims-automation platform; data-readiness discovery is the blow-up → price the unknowns · `studied`
- 🧬 Pharma — a research-copilot; eval-harness + validation dominate → AI-specific line items · `studied`
- ⤳ 🏢 Real estate — a proptech lease-abstraction + analytics build; a scope change ripples margin → change control · `studied`

**EL-09 · Resource Onboarding & KT Tracker**
- 🧑‍💼 Global SI — onshore/offshore mobilization; access is the longest pole → compress the ramp · `first-hand`
- ⤳ ✈️ Travel — mobilizing onto an airline ops platform; security/access ramp → critical-path onboarding · `studied`
- 💳 Fintech — SOC2/prod-access ramp; bus-factor on the fraud model → KT before roll-off · `first-hand`

**EL-10 · Executive Communication Studio** *(interview-critical — build early)*
- 💳 Bank — a board QBR on the AI program → force the decision · `first-hand`
- ⤳ 🧑‍💼 Professional services — a partner-leadership update on the firm's AI delivery capability → decisions, not status · `first-hand`
- 🏭 Manufacturer — a plant-leadership update tying AI to OEE → speak the audience's metric · `studied`

---

## 6. Phase A — go (unchanged)

Scope stays **GAP-03, C3-1, EL-01** (one flagship per collection). Phase A now inherits: the amended schema (required `sources` + `lastVerified` + signed-off first-hand), the computed-coverage rule, and the locked map above. The nine flagship use-cases to author first:

- **GAP-03:** ⚖️ Legal · 🧬 Pharma · 📈 Capital markets
- **C3-1:** 💳 Retail bank · 🏥 Health system · 🏭 Manufacturer
- **EL-01:** 🏥 Hospital · 💳 Contact center · ⚡ Utilities-field

**Exit for Phase 0:** corrections are the rules of record; coverage is honest and computed; first-hand is signed off; the map is locked. → Phase A build begins.
