# Use-Case Layer & Industry Atlas — Plan & Structure

**Status:** Planning (no code yet) · **Prepared:** 2026-07-02 · **Owner:** Sudeep Lalka

> The ask: for every lab, add **3 real-world use-cases** a visitor can click through and view *inside the lab* — spanning the industries where AI is most active today, not only Sudeep's own résumé. The goal is to showcase a **diverse operator who understands these domains deeply**, not at surface level.

> **⛔ Scope — the 23 new labs only (Collections 2, 3, 4).** **Collection 1 (Enterprise AI Lifecycle) is explicitly EXCLUDED.** It is the keystone *AI Program Command Center* — a separate, already-shipped interface we do not disturb. No Use-Case Rail, no use-cases, and **zero touched files** for its lifecycle stages (FRAME / DATA / BUILD·RAG / DEPLOY / GOVERN / REALIZE) or its shipped instruments (Backlog Generator, RAG Evaluator, Govern). Totals remain 23 labs × 3 = **69**. The Industry Atlas and cross-lab storylines likewise cover only Collections 2–4; no thread routes into a Collection 1 lab.

---

## 1. Strategic intent — why this changes the portfolio

Today each lab proves a *mechanic* with one or two sample scenarios, most drawn from finserv/telecom (Sudeep's home turf). A sharp reviewer sees the technique but reads the range as "deep in two industries."

The use-case layer flips that. Each lab keeps its one engine but now demonstrates it across **three deliberately different industries**, each with a textured, insider-credible scenario. The portfolio-level payoff is a single, defensible claim:

> **One operator · ~20 industries · 8 AI patterns · 69 worked scenarios.**

That is the "diverse individual who gets it deeply" statement — made concrete, clickable, and honest.

**The bar (non-negotiable):** every use-case must survive scrutiny from someone who actually works in that industry. Specific workflow, real actors, the real constraint, the exact decision, and *the thing most people get wrong*. No generic "AI in healthcare."

---

## 2. Design principles

1. **Depth over decoration.** Each use-case names: the workflow, who's in the room, the hard constraint, the decision the lab illuminates, and the non-obvious insight ("what most people miss").
2. **Diversity by design.** Within a lab, the 3 use-cases hit 3 different industries. Across all 23 labs, we track a coverage matrix so no industry is a one-off and no cluster dominates.
3. **Radical honesty (extends §A4.4).** Every use-case carries a **provenance badge**: `First-hand` (Sudeep ran this pattern) vs `Studied` (informed by public industry patterns). Never fabricate client outcomes; numbers are plausible-illustrative and labeled.
4. **Reuse the engine.** A use-case = a *narrative brief* + a *payload* that reconfigures the lab's existing interactive mechanics. Zero new engines per use-case.
5. **One consistent pattern** across all 23 labs (cohesion is the craft signal).
6. **Data-driven authoring.** Adding a 70th use-case is a data entry, not a build.

---

## 3. Content model (the schema)

A use-case has an industry-agnostic **brief** and a lab-specific **payload**.

```ts
interface UseCase<Payload> {
  id: string;                 // "gap03-legal-contract-swarm"
  labId: string;              // "GAP-03"
  industry: IndustryKey;      // enum → label + icon + accent
  provenance: "first-hand" | "studied";
  title: string;              // "Contract-review swarm on an MSA"
  oneLiner: string;           // the hook (≤ 12 words)
  context: string;            // the setup: who, what, the workflow (2–3 sentences)
  theDecision: string;        // the specific call this lab makes here
  whatMostMiss: string;       // the depth line — the non-obvious insight
  stakes: string;             // the number/impact that makes it matter
  takeaway: string;           // industry-specific steering line (overrides the lab default)
  sources?: string[];         // light, credible "informed by" pointers (optional)
  payload: Payload;           // typed per lab → reconfigures the engine
}
```

- **Where it lives:** a new `@labs/kit/use-cases/` module, one typed file per lab, all indexed by `labId`. The `IndustryKey` enum (label + icon + accent) lives in `@labs/kit` so the Competency Map and the Industry Atlas can read coverage.
- **Payload is the only lab-specific part.** Each lab already has a state shape (scenario keys, slider values, sample arrays); the payload maps directly onto it via a small `applyUseCase(payload)` adapter the lab exposes.

---

## 4. The visitor experience (UX pattern)

**Recommended: an in-lab "Use Cases" rail** — one consistent component at the top of every lab.

1. A compact selector shows **3 industry chips** (icon + industry + one-liner) plus the lab's own **Default** scenario.
2. Selecting a chip does three things at once:
   - Slides in a **Use-Case Brief** card — industry, provenance badge, context, the decision, *what most miss*, stakes. Reads like a tight analyst one-pager (5–6 lines).
   - **Animates the payload into the live engine** — sliders move, sample data swaps, the plot redraws. The mechanic stays on screen the whole time.
   - **Rewrites the steering takeaway** to the industry-specific judgment.
3. A subtle **"Reader ↔ Run"** affordance: Reader shows just the brief (skim mode); Run drops you into the reconfigured lab.

*Why the rail beats the alternatives:* a drawer/modal hides the mechanic (the whole point is seeing the technique reconfigure); a separate use-case gallery fragments the experience and doubles navigation. The rail keeps engine + context in one view, one interaction, identical placement across all 23 labs.

**Portfolio-level payoff — the "Industry Atlas."** A new top-level view (linked from the Competency Map) renders an **Industries × AI-patterns matrix**: rows = ~20 industries, columns = the 8 lab "patterns" (protocol, orchestration, reliability, economics, governance, delivery, adoption, commercial). Each filled cell links straight to that use-case. Headline stat: *"~20 industries · 8 patterns · 69 scenarios."* This is the breadth claim made visible in one screen — the single most powerful "diverse operator" artifact on the site. A visitor can also **filter the gallery by industry** ("show me everything you've done in healthcare") and the matching tiles light up.

---

## 5. The industry palette (the deliberate spread)

We draw every use-case from this set so coverage is intentional, not accidental:

| | Industry | Signature AI patterns |
|---|---|---|
| 💳 | Financial services (banking / cards / payments) | fraud, disputes, KYC/AML, credit |
| 🛡️ | Insurance | claims, FNOL, underwriting, fraud |
| 📈 | Capital markets / wealth / asset mgmt | research, advisory memory, surveillance |
| 🏥 | Healthcare providers | scribing, triage, prior-auth, imaging |
| 🧬 | Life sciences / pharma / biotech | literature, competitive intel, trials |
| 🛒 | Retail & e-commerce | personalization, catalog, pricing, service |
| 📦 | Supply chain / logistics | exceptions, routing, demand |
| 🏭 | Manufacturing & industrial | defect vision, predictive maintenance, OEE |
| ⚡ | Energy & utilities | grid forecasting, field service |
| 📡 | Telecom | network ops, churn, care routing |
| 🎬 | Media & entertainment | generation, localization, moderation |
| 📣 | Marketing & advertising | creative at scale, measurement |
| ⚖️ | Legal & professional services | contract review, e-discovery |
| 💻 | Technology / SaaS | dev tools, support, observability |
| 🔒 | Cybersecurity | SOC triage, threat intel |
| 🏛️ | Public sector & government | benefits, citizen services, procurement |
| ✈️ | Travel & hospitality | irregular-ops, service |
| 🏢 | Real estate / proptech | lease/deal extraction |
| 🧑‍💼 | HR / talent | screening, L&D |
| 🎓 | Education | tutoring, assessment |

Sudeep's **first-hand** domains (cards/payments, wealth via Morgan Stanley, market data/ratings via S&P–CRISIL, telecom via Verizon, consulting delivery) are used where genuinely relevant and marked `First-hand`; the rest are `Studied`. The honesty is itself a differentiator.

---

## 6. The full mapping — 23 labs × 3 use-cases (69)

Format per row: **industry** — *scenario* → **the decision it illuminates** · `provenance`

### Collection 2 — Agent & Protocol

**GAP-01 · MCP Server Playground** *(expose a system as a clean tool contract)*
- 🏥 Healthcare — *Wrap a hospital EHR (FHIR R4) so a care-coordination agent can read encounters/labs/meds and* propose *orders, never auto-write; PHI stays behind the server* → which resources to expose and where the write-approval boundary sits · `Studied`
- 🛒 Retail — *Order-management + returns as MCP tools; `cancel_order` is idempotent + rate-limited so a retrying agent can't double-refund* → which mutations need idempotency keys + human confirm · `Studied`
- 🏭 Manufacturing — *MES/historian exposed read-only for a plant-ops copilot on the IT side of the OT/IT boundary; nothing can actuate equipment* → read-only resource design as the OT safety guarantee · `Studied`

**GAP-02 · Agent Loop & Failure Inspector** *(the four production failures)*
- 🛡️ Insurance — *FNOL triage agent; inject a hallucinated policy number → schema reject + re-ask* → the validation gate as fraud control · `Studied`
- 🔒 Cybersecurity — *SOC alert-triage agent loops on a flapping alert source → loop-breaker + escalate* → observability spend vs analyst alert-fatigue · `Studied`
- ✈️ Travel — *Irregular-ops rebooking agent during a storm; GDS tool 503 under load → retry/backoff + fallback* → resilience as a duty-of-care SLA · `Studied`

**GAP-03 · Multi-Agent Orchestration Board** *(supervisor + workers; cost vs quality)*
- ⚖️ Legal — *Contract-review swarm (clause-extractor / risk-scorer / redliner / citation-checker) on an MSA; the critic catches an unsupported redline* → when the quality lift beats 2–3× cost · `Studied`
- 🧬 Pharma — *Competitive-intel brief on a rival's Phase II readout (research / analysis / medical-writing / regulatory-critic)* → multi-agent only for high-stakes synthesis · `Studied`
- 📣 Marketing — *Campaign concepting (trend-research / strategy / copy / brand-safety critic); worth the multiplier for hero assets, not every banner* → per-asset, not per-team, autonomy · `Studied`

**GAP-04 · Tool-Use & Structured Output** *(schema-valid extraction + retry)*
- 🏥 Healthcare RCM — *Extract ICD-10/CPT + payer + service lines from a clinical note; retry fixes an unmapped modifier* → where the validation gate sits before the claim writes · `Studied`
- 🚚 Logistics — *Parse a messy carrier "where's my truck" email into a structured shipment-exception event* → reliability at the systems-of-record boundary · `Studied`
- 🏢 Real estate — *Pull rent / escalations / break clauses from a commercial lease PDF; nulls flag for legal review* → null-and-flag over hallucinate · `Studied`

**GAP-05 · Context & Memory Engineering** *(cost-fidelity dial)*
- 💻 SaaS support — *A 40-turn support thread across two sessions; summarize vs full-dump* → strategy per session length · `Studied`
- ⚖️ Legal e-discovery — *Review 50k docs; compress vs sub-agent handoff to stay in budget* → the dial at corpus scale · `Studied`
- 📈 Wealth advisory — *Carry a client's goals/constraints across quarterly reviews* → memory policy as relationship continuity · `First-hand`

**GAP-06 · Prompt Cost & Token Simulator** *(unit economics)*
- 🛒 Retail — *Refresh product copy for 4M SKUs seasonally; caching the brand/system prompt collapses the bill* → caching as the build-vs-buy lever · `Studied`
- 📞 Contact center / BPO — *Summarize 1.2M calls/month; batch discount decides feasibility* → batching as the go/no-go · `Studied`
- 📣 Adtech — *30 creative variants × thousands of campaigns; unit economics gate the feature* → economics before architecture · `Studied`

**GAP-07 · Protocol Selection Lab** *(producers × consumers)*
- 💳 Bank — *40 internal systems, many agent teams → MCP core + A2A across fraud/servicing/wealth agents* → hybrid at enterprise scale · `First-hand`
- 💻 Startup — *Two tools, one agent, ship this quarter → function calling; a protocol is premature* → don't over-build · `Studied`
- 📦 Supply chain — *A buyer's agent negotiating with suppliers' agents across orgs → A2A is the axis* → horizontal coordination · `Studied`

**GAP-08 · Human-in-the-Loop Approval** *(autonomy per risk tier)*
- 💳 Lending — *Auto-approve/deny thresholds by risk tier; the slip is a thin-file applicant* → autonomy gated by fair-lending risk · `First-hand`
- 🎬 Content moderation — *Auto-remove vs human-review by harm severity; over-automation lets an edge case through* → the throughput-vs-harm curve · `Studied`
- 🏥 Clinical — *AI-suggested orders auto-file only below an acuity threshold; high-acuity always human* → acuity as the autonomy dial · `Studied`

### Collection 3 — Business of AI

**C3-1 · AI Initiative Portfolio Dashboard**
- 🏥 Health system — *12 initiatives (scribe, imaging triage, prior-auth, bed management…); two should die* → kill/scale/hold across a clinical + admin book · `Studied`
- 💳 Retail bank — *cards / fraud / KYC / wealth* → the finserv portfolio · `First-hand`
- 🏭 Manufacturer — *predictive maintenance / defect vision / demand / procurement copilot* → industrial allocation · `Studied`

**C3-2 · Build-vs-Buy-vs-Fine-Tune**
- ⚖️ Legal — *Contract analysis: buy a legal-AI suite vs build on API vs fine-tune on the firm's precedents* → differentiation vs speed · `Studied`
- 🎬 Media — *High-volume localization/dubbing: fine-tune/self-host vs API at scale* → volume flips the answer · `Studied`
- 💳 Bank — *Fraud model: build/self-host (data gravity + latency) vs vendor* → control vs time-to-value · `First-hand`

**C3-3 · Inference Cost Forecaster**
- 💬 Consumer social — *A chat feature at tens of millions of DAU; the self-host cliff is early* → the crossover at consumer scale · `Studied`
- 🛡️ Insurance — *Document-heavy claims volume; utilization decides* → utilization as the real driver · `Studied`
- 📡 Telecom — *Network-ops assistant across NOCs* → portfolio-level run-rate · `First-hand`

**C3-4 · Vendor Evaluation & Risk Monitor**
- 🧬 Pharma — *Regulated-research LLM vendor; security + validation weighted heavily; concentration risk on one hyperscaler* → weights flip the ranking · `Studied`
- 🛒 Retail — *Personalization vendor; price/speed weighted; watch lock-in* → cost-sensitive weighting · `Studied`
- 🏛️ Public sector — *Vendor under data-sovereignty + procurement rules; open-source-backed rises* → constraints as weights · `Studied`

**C3-5 · Business Case / ROI Builder**
- 🏥 Healthcare — *Prior-authorization automation; the adoption-ramp sensitivity dominates* → present the range · `Studied`
- 🏭 Manufacturing — *Defect-detection rollout; value hinges on scrap-rate assumptions* → the swing driver · `Studied`
- 🛒 Retail — *Demand-forecasting; the tornado shows forecast-accuracy is the lever* → fund on the band · `Studied`

### Collection 4 — Engagement Leadership

**EL-01 · Adoption & Change Readiness**
- 🏥 Hospital — *An ambient AI scribe for 2,000 clinicians; trust + workflow-fit dominate* → gate on trust, not tech · `Studied`
- 📞 Contact center — *Agent-assist for 900 reps* → the finserv rollout · `First-hand`
- ⚡ Utilities / field — *A technician copilot on trucks; connectivity + comms are the risk* → adoption in the field · `Studied`

**EL-02 · Stakeholder & Sponsor Alignment**
- 🏛️ Public sector — *A benefits-modernization program; political sponsors drift* → re-align before the review · `Studied`
- 🧬 Pharma R&D — *Science + regulatory + commercial pulling apart* → the pre-steering brief · `Studied`
- 🛒 Retail transformation — *Merch / stores / IT / supply; a sponsor cooling before the QBR* → the silence between meetings · `Studied`

**EL-03 · Capacity & Resourcing Planner**
- 🧑‍💼 Consulting delivery — *A 30-person AI delivery pod; skills, not headcount* → hire/contract/upskill · `First-hand`
- 🏥 Health-tech scale-up — *ML + clinical-informatics skills scarce* → the skill-shaped gap · `Studied`
- 💳 Bank AI CoE — *Governance + MLOps the bottleneck* → the non-obvious pole · `First-hand`

**EL-04 · Delivery Health & RAID Radar**
- 🛡️ Insurance — *A claims-automation program; a "green" workstream trending amber on model drift* → trajectory over snapshot · `Studied`
- ⚡ Energy — *A grid-forecasting program; an OT-data dependency is the hidden red* → the dependency nobody watches · `Studied`
- 🛒 E-commerce — *A personalization program; adoption quietly reversing* → reported vs actual · `Studied`

**EL-05 · AI Compliance Readiness Navigator**
- 💳 Lending — *Credit decisioning: EU AI Act high-risk + fair-lending overlay* → tier + controls · `First-hand`
- 🧑‍💼 HR / hiring — *Résumé screening: high-risk employment use* → design-in, not retrofit · `Studied`
- 🏥 Healthcare — *Diagnostic support: AI-Act + medical-device (MDR) overlap* → two regimes at once · `Studied`

**EL-06 · Talent & Upskilling Pathway Planner**
- 💳 Bank AI CoE — *Classic ML team → agentic skills* → build/hire/partner mix · `First-hand`
- 🏭 Manufacturer — *OT engineers + AI literacy* → partner for speed · `Studied`
- 🎬 Creative agency — *Designers/writers + generative tooling* → the 18-vs-24-month gap · `Studied`

**EL-07 · RFP/RFI Response War Room**
- 🏛️ Public sector — *A government AI-services RFP; the honest no-bid on an unrealistic SLA* → bid/no-bid discipline · `Studied`
- 🏥 Health system — *An EHR-integrated AI RFP; incumbent advantage* → win-theme threading · `Studied`
- 🛒 Retail — *A fast, price-driven RFP; bid on the margin floor* → margin as the gate · `Studied`

**EL-08 · Estimation & Scoping Studio**
- 🛡️ Insurance — *A claims-automation platform; data-readiness discovery is the blow-up* → price the unknowns · `Studied`
- 🧬 Pharma — *A research-copilot; eval-harness + validation dominate* → AI-specific line items · `Studied`
- 🛒 Retail — *A search/personalization build; a scope change ripples margin* → change control · `Studied`

**EL-09 · Resource Onboarding & KT Tracker**
- 🧑‍💼 Global SI — *Onshore/offshore mobilization; access is the longest pole* → compress the ramp · `First-hand`
- 🏥 Health-tech — *HIPAA access + environment as the bottleneck* → critical-path onboarding · `Studied`
- 💳 Fintech — *SOC2/prod-access ramp; bus-factor on the fraud model* → KT before roll-off · `Studied`

**EL-10 · Executive Communication Studio**
- 💳 Bank — *A board QBR on the AI program* → force the decision · `First-hand`
- 🏥 Hospital — *A clinical-governance steering pre-read* → decisions, not status · `Studied`
- 🏭 Manufacturer — *A plant-leadership update tying AI to OEE* → speak the audience's metric · `Studied`

**Coverage:** ~20 industries, every one appearing in ≥ 3 labs (no one-offs), `First-hand` on ~12 where Sudeep genuinely ran the pattern, `Studied` on the rest. (A later pass can rotate Education / automotive-mobility / agriculture into 2–3 slots for even broader reach.)

---

## 7. Two fully-worked exemplars (the quality bar)

These show the depth and voice every use-case must hit.

**GAP-03 · Legal — Contract-review swarm** · `Studied`
- **Context:** A corporate legal team runs 400 vendor MSAs a quarter. A single agent misses cross-references; a swarm splits the work — a clause-extractor pulls terms, a risk-scorer flags liability/indemnity/termination, a redliner proposes edits, and a citation-checker verifies every claim against the playbook.
- **The decision:** Multi-agent buys ~30% higher risk-catch on this class for ~2.4× the cost and latency. For a $2M MSA that's trivially worth it; for a $5k click-through it isn't.
- **What most miss:** The value isn't the extra agents — it's the *critic*. Without an adversarial reviewer, a swarm just produces confident, un-cited redlines faster.
- **Stakes:** One missed auto-renewal or uncapped-liability clause dwarfs a year of inference cost.
- **Takeaway:** "I add agents where a critic changes the outcome, not where it adds motion."

**EL-05 · Lending — Credit decisioning compliance** · `First-hand`
- **Context:** A card issuer wants an AI assist in the credit-decisioning path. Under the EU AI Act this is **high-risk**; in the US it also triggers fair-lending (ECOA/Reg B) and adverse-action explainability.
- **The decision:** High-risk tier → risk-management system, data governance, human oversight, and *bias testing* are design inputs, plus a fair-lending overlay that a generic AI-Act checklist omits.
- **What most miss:** Teams classify against one regime. Credit AI lives in the overlap of the AI Act *and* fair-lending — the controls compound, and retrofitting the explainability path after launch is the 10× cost.
- **Stakes:** A disparate-impact finding is existential; the control cost is a rounding error against it.
- **Takeaway:** "Compliance is a design input. On credit AI, it's two design inputs at once."

---

## 8. Creative extensions (make it unique)

1. **Industry Atlas** (see §4) — the Industries × patterns matrix; the single best "range" artifact.
2. **Cross-lab program storylines.** Thread one industry through the lifecycle so a visitor can *follow a program*: e.g. *Health-system AI program* → RFP (EL-07) → protocol choice (GAP-07) → cost (C3-3) → adoption (EL-01) → RAID (EL-04) → exec comms (EL-10). A "Follow this program →" link chains the labs. This shows systems thinking, not point solutions.
3. **Provenance as a feature.** The `First-hand`/`Studied` badge is honest *and* distinctive in a market of inflated claims — it quietly says "I know the difference."
4. **Industry-specific takeaways.** The steering line rewrites per use-case, so the same engine renders a lending judgment, a clinical judgment, a manufacturing judgment — proof the understanding is real, not skinned.
5. **Shareable use-case cards.** Per-use-case OG image (industry + one-liner + badge) so a single scenario can be dropped into a LinkedIn post or a specific interview.

---

## 9. Technical architecture (for the build phase)

- `@labs/kit/use-cases/<labId>.ts` — typed `UseCase<Payload>[]`, plus an `industries.ts` registry (key → label, icon, accent).
- `@labs/design-system`: a `<UseCaseRail>` (chips) + `<UseCaseBrief>` (the one-pager card) — built once, imported by all 23 labs.
- Each lab exposes `applyUseCase(payload)` mapping the payload onto its existing state; the Default chip resets.
- New route `/industries` (the Atlas) reads coverage from the use-case registry; the Competency Map gains an "Explore by industry" entry + optional gallery filter.
- Reuses existing tokens/badges; adds an `industry` accent scale. No new engines.
- **Collection 1 is untouched.** Only the Collection 2/3/4 lab components receive `<UseCaseRail>` + `applyUseCase`. The Command Center app (`/frame`, `/data`, `/build`, `/deploy`, `/govern`, `/realize`, `/lifecycle` and their components) is not modified — its interface is preserved exactly. The use-case registry keys only on the 23 new lab IDs.

---

## 10. Phasing

- **Phase A — Pattern proof.** Schema + `industries` registry + `<UseCaseRail>`/`<UseCaseBrief>` + `applyUseCase` on **3 flagship labs** (GAP-03, C3-1, EL-01) fully authored. Validates the pattern end-to-end.
- **Phase B — Atlas + C2/C3.** Build the Industry Atlas view; author use-cases across Collections 2 and 3.
- **Phase C — C4.** Author Collection 4's use-cases.
- **Phase D — Creative layer.** Cross-lab storylines, per-use-case OG images, industry-filtered gallery.

Interview-relevant labs (EL-04, EL-10, C3-1) get their use-cases early within each phase.

---

## 11. Decisions — LOCKED (2026-07-02)

| # | Decision | Locked |
|---|---|---|
| D1 | UX pattern | ✅ **In-lab Use-Case Rail** — engine stays in view |
| D2 | Content depth | ✅ **Full analyst brief** — context + decision + what-most-miss + stakes + industry takeaway |
| D3 | Portfolio breadth view | ✅ **Industry Atlas** (Industries × patterns matrix) |
| D4 | Cross-lab storylines | ✅ **Yes** — "follow a program" threads (Phase D) |
| D5 | Industry spread | The ~20 in §5; rotate Education / mobility / agriculture in later |
| D6 | Provenance emphasis | `First-hand`/`Studied` badges visible; first-hand only where genuinely true |
| D7 | Phase A scope | ✅ **3 flagships — GAP-03, C3-1, EL-01** — one per new collection |

**Effort reality:** 69 use-cases at analyst-brief depth is real content work. The data-driven architecture keeps *engineering* cheap; the *authoring* is where the quality lives — which is why Phase A proves the pattern on 3 labs before scaling.

## 12. Phase A execution outline (build-ready, on your go)

Deliverables, in order — nothing here starts until you say build:

1. **Foundations** — `@labs/kit/industries.ts` (IndustryKey → label · icon · accent) + the `UseCase<Payload>` type; `@labs/kit/use-cases/` folder.
2. **Shared components** — `<UseCaseRail>` (industry chips + Default) and `<UseCaseBrief>` (the analyst one-pager card) in the design system, on the existing blue/ink tokens + a light industry-accent scale.
3. **Engine adapters** — add `applyUseCase(payload)` to the three flagship labs so a payload maps cleanly onto existing state (GAP-03 preset/agents/metrics; C3-1 initiative set + thresholds; EL-01 factor defaults + scenario copy).
4. **Author the 9 flagship use-cases** to the §7 quality bar — 3 each for GAP-03, C3-1, EL-01, spanning the industries in §6, with provenance badges and industry-specific takeaways.
5. **Wire + self-review** — rail on all three labs; rubric ≥ 26/30 each; confirm the pattern reads cleanly, then greenlight Phase B (Atlas + remaining C2/C3).

**Exit for Phase A:** the three flagships each show three industry use-cases through the rail, the pattern is proven and reusable, and we have a template + adapter recipe that makes the remaining 60 use-cases pure authoring + data.
