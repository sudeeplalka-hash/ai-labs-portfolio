# AI Labs Portfolio — Master Build Brief (Refined)

**Owner:** Sudeep Lalka · **Host:** `ai-labs.sudeeplalka.com` **Prepared:** 2026-07-02 (rev 5: second QA pass — LIVE-badge terminology disambiguated from deployment status, EL-10 data sources made precise, rendering fixes; verified all clear) · **Supersedes:** all prior docs. Single source of truth.

## Instructions to the builder (Claude Opus 4.8)

You are the implementation engine for this portfolio. This brief gives you full context (Part A), binding specifications (Part B), the complete lab catalog with per-lab build specs (Part C — 23 labs \+ Layer 0), and a phased plan with quality gates (Part D). Work phase by phase; never skip ahead. Within a phase, propose your approach before writing code, then build.

**How to navigate this brief:** Parts A, B, and D apply to everything — internalize them fully. Part C is a per-lab reference: when building a lab, you need its C entry plus B and D, not the whole catalog. Check Part D's **Interview Sprint override** before starting any phase — it can temporarily reorder priorities. Do not edit this brief; when you believe something in it is wrong, say so and propose the change to Sudeep. Maintain a `BUILD-LOG.md` in the repo recording each shipped lab, its rubric score, and any decisions made along the way.

**The bar:** this portfolio must land in the top 1% of the top 1%. That is not achieved by more labs — it is achieved by every shipped lab being unarguably excellent and every claim being evidenced. When capacity forces a choice, cut scope, never quality. A reviewer should leave thinking "I have never seen a candidate artifact this good," not "this person built a lot of demos."

**Self-review rubric (apply before presenting ANY lab as done).** Score 1–5 each; ship at ≥26/30, otherwise iterate:

1. **Insight density** — does a smart visitor learn something real in 60 seconds?  
2. **Interactivity that teaches** — does manipulating it change understanding, not just pixels?  
3. **Defensibility** — could Sudeep defend every number, formula, and recommendation in a panel interview?  
4. **Craft** — typography, motion, states, mobile: indistinguishable from a funded product?  
5. **Honesty** — badges, stamps, and limitations stated plainly?  
6. **Decision connection** — is the mapped enterprise decision specific enough that a VP nods?

**Working agreement:** ask Sudeep only when a decision genuinely changes the outcome; otherwise use the defaults herein. Present each finished lab with your rubric score and what you'd improve with one more day. Communication preference: fully objective, direct, no sugarcoating.

---

# PART A — CONTEXT

## A1. Who this is for

Sudeep Lalka — Engagement Manager at HCLTech, embedded on the American Express account, Phoenix AZ. Leads AI/technology delivery across multiple portfolios. Target roles: Senior EM, TPM, AI delivery leadership. Career: HCLTech/AMEX, Genpact/Morgan Stanley, Deloitte/Verizon, CRISIL/S\&P. Credentials: STEM MBA (AI & Quant, UT Austin McCombs), PMP, AWS SA, licensed architect.

**Proof points to weave into labs as sample data, card copy, and resume-echo lines:** $9M pipeline · $4M+ cost avoidance · 4.5× portfolio scale · 31-resource intelligence mapping at AMEX · Gen AI platform work (LLM/RAG/agentic).

**Sample-data doctrine:** every lab ships with realistic scenario data modeled on the kind of portfolio Sudeep actually runs (card-member servicing, fraud/disputes, wealth ops, telecom care — anonymized, invented numbers, plausible shapes). Never lorem-ipsum, never "Project A/B/C." The sample data is itself a credibility signal: it should read like it came from a real steering deck.

## A2. The positioning thesis (the spine of everything)

Four competencies at four altitudes, each a collection, each answering a buyer question, each with a structure that *embodies* its competency:

| \# | Collection | Buyer question | Competency | Structure |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Enterprise AI Lifecycle (already built and deployed — do not rebuild) | "Can this person run an AI *program*?" | Governed, sequenced systems thinking | **Spine** — shared state, gated sequence |
| 2 | Agent & Protocol Labs | "Does this person understand how agents *work*?" | Runtime/protocol fluency (MCP \+ A2A) | **Toolkit** — independent primitives |
| 3 | Business of AI Delivery | "Can this person run AI as a *business*?" | Capital allocation, P\&L, vendor judgment | **Gallery** — self-contained instruments |
| 4 | Engagement Leadership Labs | "Can this person lead the *humans* around the AI — and win, staff, and keep the work?" | Adoption, stakeholders, capacity, compliance \+ pre-sales, estimation, mobilization, exec comms | **Control room** — pursuit desk \+ operations floor |

**Layer 0 above all four: the Competency Map** — the Command Center landing page. Every skill mapped to evidence (lab / engagement / credential). A visitor reads "one person, unusual range," never "four disconnected galleries."

**Differentiator:** most candidates prove one competency; strong ones prove two. Proving all four, with visible structural contrast, is the market signal. Never blur collections into a uniform grid.

**Boundary rule (3 vs 4):** dollar decision (fund/kill/buy/build) → Collection 3\. People/client/risk-posture decision (adopt/train/escalate/gate) → Collection 4\.

## A3. What already exists (do not rebuild, do not duplicate)

Collection 1 is live: FRAME → DATA → BUILD(RAG) → DEPLOY → GOVERN & REALIZE arc; shared `ProgramState` in `localStorage` with stage gates; Backlog Generator and Tradeoff Triangle built on hybrid live-call \+ curated-fallback. Already covers RAG, evals/golden datasets, guardrails/risk tiering, AI Ops, program-level ROI. Exec/Practitioner toggle. **New labs must not duplicate any of this.**

## A4. The excellence thesis — what separates top 1%-of-1% from merely good

A merely good portfolio has working demos. An exceptional one has:

1. **Judgment made visible.** Every lab ends with a one-line **"Steering-committee takeaway"** — what Sudeep would tell leadership based on what the visitor just did. This converts a demo into evidence of judgment, the thing actually being hired.  
2. **The wire, shown.** Technical labs expose the real mechanics (raw JSON-RPC frames, actual token counts, real retry traces) — annotated so an exec can follow. Depth without gatekeeping.  
3. **Numbers that survive interrogation.** Business labs use stated formulas, visible assumptions, and sensitivity ranges — never black-box scores. Every scored output has an expandable "how this number is computed."  
4. **Radical honesty as strategy.** LIVE/SIMULATED badges, "last verified" stamps, visible roadmap (🔨 badges), a per-lab "limitations" note, and a public changelog. In a market flooded with inflated AI claims, verifiable honesty is the scarcest signal.  
5. **Proof of authorship.** Each lab carries a collapsible **"How this is built"** note (architecture sketch, \~5 lines: stack, state, live-call pattern, fallback). Preempts "did AI build this for you?" with "yes — and I can explain every layer, which is the job."  
6. **Zero broken windows.** No dead links, no console errors, no layout shift, no orphan states. One broken interaction erases ten excellent ones.

---

# PART B — BINDING SPECIFICATIONS

## B1. Design system (inherit exactly, all collections)

- **Type:** Fraunces (display) · Inter Tight (body) · JetBrains Mono (code/labels/numbers).  
- **Palette:** warm paper base · terracotta / teal / ochre accents. Semantic use: terracotta \= risk/cost, teal \= value/health, ochre \= attention/pending. Apply consistently so color itself carries meaning across collections.  
- **Treatment:** eyebrow labels, glass-pane cards, scroll-triggered motion (subtle; motion must clarify hierarchy, never decorate).  
- Cohesion via disciplined reuse, not novelty.

## B2. Live-call pattern

- One shared config: `LIVE_MODEL = "claude-sonnet-5"`; `claude-haiku-4-5` for cheap high-volume calls. **Never hardcode model strings in labs** (v1's scattered `claude-sonnet-4-6` is the failure mode this prevents).  
- Every live lab: dignified curated fallback (pre-computed real outputs, labeled "cached run from " — never fake-streamed), visible loading state with what's happening ("supervisor decomposing task…"), and error state that degrades to fallback without embarrassment.  
- API key handled by host; never in code. Rate-limit client-side; show remaining-runs affordance if needed.

## B3. Card anatomy (every lab, all collections)

Problem line (visitor's language, not jargon) · concept-proven tag · tech tags · **LIVE vs SIMULATED badge** · **the enterprise/engagement decision it maps to** (specific: "expose 40 internal APIs via MCP vs bespoke integrations," not "integration strategy") · **"last verified" stamp**. Inside each lab: **Steering-committee takeaway** line \+ **How this is built** collapsible \+ **Limitations** note. Collection 4 adds a **resume-echo line**.

## B4. Page architecture

- **Layer 0 (landing):** Competency Map per §C0. Hero must communicate "one person, four altitudes" in \<10 seconds — recommend an interactive four-layer cross-section (wire → lifecycle → P\&L → people) where hovering a layer highlights its domain panel. Honest ✅/🔨 badges; the visible roadmap is itself an EM signal.  
- **Collection 2:** layered-map hero — the 8 labs as execution substrate beneath the lifecycle stages; MCP as the vertical axis (tool access), A2A as the horizontal (agent coordination). Grid toggle for scanners. Reject flat-gallery-only.  
- **Collection 3:** gallery grid of instrument cards; each card previews its key visual (mini scatter, mini tornado) so the grid itself is information-dense.  
- **Collection 4:** control room in two zones — **pursuit desk** (EL-07…EL-10) and **operations floor** (EL-01…EL-06) — under one status strip spanning both: pipeline coverage, delivery health, adoption index, capacity utilization, compliance posture (each wired to real values from its shipped instrument; unshipped metrics show as "instrument in build," never fake numbers).  
- **Audience lenses (site-wide):** \[ Recruiter \] \[ Technical panel \] \[ Executive \]. Not just re-sorting: each lens rewrites card emphasis (Recruiter sees credentials \+ outcomes; Technical sees stack \+ wire; Executive sees decisions \+ dollars). Persist choice in `localStorage`.

## B5. Guardrails (absolute)

1. Every interactive element must **change something the visitor can see**.  
2. **Collection 2:** LIVE \> simulated where feasible; protect the live ratio (≥1 genuinely LIVE from MVP, ≥2 from end of Phase 3, never regress); badge honestly.  
3. **Collections 3–4:** simulated is correct — the signal is judgment. All logic defensible per §A4.3. No live calls for flash.  
4. **Collection 4:** every instrument echoes a real EM artifact; grounded in delivery patterns Sudeep has run. No generic-ops-tool genericism.  
5. Collections 2–4 stay independent of Collection 1's spine.  
6. **Freshness:** model names, pricing, protocol stats, regulatory content live in dated config/data files, never in copy. Quarterly review. EL-05 carries "as of" date \+ illustrative-not-legal-advice disclaimer.  
7. Structural contrast between collections is a feature; preserve it.

## B6. Craft standards (the difference between good and top-tier)

- **Microcopy voice:** confident, plain, first-person where it carries judgment ("I gate scale-up below 70 because I've watched pilots die there"). No hype words (revolutionary, cutting-edge, seamless). Numbers over adjectives.  
- **States:** every widget has designed empty, loading, error, and success states. No spinner-only loading; narrate what's computing.  
- **Performance:** static-first; labs code-split per route; target \<2s first meaningful paint on 4G; zero layout shift; Lighthouse ≥95 across the board.  
- **Accessibility:** keyboard-operable interactions, visible focus, WCAG AA contrast (verify the warm palette), `prefers-reduced-motion` respected, charts carry text equivalents.  
- **Responsive:** every lab genuinely usable at 375px — recruiters open links on phones. If an interaction can't work on mobile, design a mobile-specific reduced mode; never just shrink.  
- **Shareability:** per-lab URLs; OG image per lab (auto-generated card with problem line \+ badge) so links unfurl beautifully on LinkedIn; site-wide SEO basics (semantic HTML, meta, sitemap).  
- **Instrumentation:** lightweight privacy-respecting analytics (page \+ lab-interaction events) so Sudeep learns which labs convert attention; a quiet contact CTA ("Discussing a role? →") on every page footer.

## B7. Credibility mechanics (recap, enforced)

Steering-committee takeaway per lab · "How this is built" collapsible per lab · Limitations note per lab · expandable "how this number is computed" on every scored output · public changelog page · GitHub link if repo is public.

---

# PART C — THE LAB CATALOG

Per-lab spec format: **60-second path** (what a first-time visitor does and the "aha") · **Core mechanics** (inputs → computation → visible change) · **Defensibility/depth notes** · **Takeaway line** (draft — refine in build).

**Priority labels (P0/P1/P2) rank signal value within a collection; they do NOT set build order.** Build order is Part D, which balances priorities across collections (e.g., GAP-07 is P0 but builds in Phase 3 because MVP-7 already carries two C2 flagships). If a priority label and Part D ever appear to conflict, Part D wins.

## C0. Layer 0 — Competency Map (Command Center landing)

**Hero identity line:** *"AI delivery leader who works at four altitudes: the protocol wire, the program lifecycle, the P\&L, and the people."* Sub: Engagement Manager, HCLTech @ American Express · STEM MBA (AI & Quant, UT Austin) · PMP · AWS SA.

**Five domains**, each row \= claim \+ evidence badges (✅ shipped lab · 🔨 in build · 💼 engagement · 🎓 credential):

1. **Agentic & Protocol Engineering** → C2 labs; 💼 Gen AI platform (AMEX).  
2. **AI Program Delivery & Governance** → C1 labs; 💼 multi-portfolio AI delivery (AMEX), 4.5× portfolio scale.  
3. **Business of AI / Capital Allocation** → C3 labs; 💼 $4M+ cost avoidance, portfolio P\&L ownership.  
4. **Engagement Leadership** (pursuit → mobilization → operations: adoption, stakeholders, capacity, RAID, compliance, talent, RFP/estimation, onboarding, exec comms) → C4 labs, both wings; 💼 $9M pipeline, 31-resource mapping, weekly exec reporting.  
5. **Foundations & Credentials** → 🎓 all four credentials; 💼 finserv (AMEX/Morgan Stanley/CRISIL-S\&P), telecom (Verizon), consulting delivery model.

**Mechanics:** badges wired to a single `labs-registry` data file so the map updates automatically as labs ship. No claim without an evidence badge — if a row has none, delete the row.

## C1. Collection 1 — Enterprise AI Lifecycle (existing · spine)

Live; no new build. Scope, built components, and do-not-duplicate list in §A3. Phase 0 touches it only for model-config migration and freshness stamps.

## C2. Collection 2 — Agent & Protocol Labs (8 · toolkit)

Market context to cite on cards: 2026 enterprise default is the two-layer stack — MCP for vertical tool access (10k+ enterprise servers; Anthropic, OpenAI, Google, Microsoft, AWS), A2A for horizontal agent coordination (Linux Foundation, 150+ orgs, in production).

### GAP-01 · MCP Server Playground ★ SIM · M · P0

- **60-second path:** pick a mock enterprise system (e.g., "Disputes API," "HR knowledge base") → watch the MCP server manifest generate (tools/resources/prompts) → click a tool → see the full JSON-RPC round trip, both directions, each frame annotated in plain English. Aha: *"MCP is just a disciplined contract — and this person can read the wire."*  
- **Mechanics:** system picker → generated schema panel → interactive call composer (editable args, validation errors shown honestly) → annotated frame trace.  
- **Depth notes:** cover tools, resources, AND prompts (most demos stop at tools); show an error frame and a malformed-args rejection, not just the happy path. Exec annotation layer toggles on/off.  
- **Takeaway:** "Deciding MCP vs bespoke isn't religious — it's about how many systems and how many consumers. Here's the crossover."

### GAP-02 · Agent Loop & Failure Inspector — SIM · M/L · P1

- **60-second path:** press play on an agent solving a task → step through Thought → Action → Observation → toggle architecture (single / orchestrator-worker / evaluator-optimizer) and watch the trace restructure → inject a failure (tool error, loop, hallucinated args, context overflow) → see detection \+ recovery.  
- **Depth notes:** failure injection is the star; each failure shows the *detection signal* (what a monitor would catch) and the *recovery policy*. Ties to observability investment.  
- **Takeaway:** "You don't budget for agents; you budget for agents plus the harness that catches these four failures."

### GAP-03 · Multi-Agent Orchestration Board ★ **LIVE** · L · P0

- **60-second path:** enter a goal (or pick a preset: "prep a competitive brief") → supervisor decomposes → agent cards light up → A2A-semantics messages stream between panels (task lifecycle states visible) → assembled result, with a running **cost \+ latency meter comparing this run vs a single-agent run**. Aha: *"live, real, and they've measured when multi-agent is worth it."*  
- **Depth notes:** the comparison meter is the judgment layer — multi-agent must be shown as a tradeoff, not a party trick. Fallback: cached real run, labeled with date.  
- **Takeaway:** "Multi-agent bought 31% quality on this task class for 2.4× cost. That ratio, not the demo, is the decision."

### GAP-04 · Tool-Use & Structured Output — **LIVE** · M · P1

- **60-second path:** paste (or pick) messy text — a rambling customer email → watch it become schema-validated JSON → deliberately choose a "hard" sample and watch a validation failure \+ retry succeed, trace visible.  
- **Depth notes:** show the schema, the failure, the retry — reliability engineering, not magic.  
- **Takeaway:** "Where outputs feed systems of record, the validation gate is not optional. Here's where I place it."

### GAP-05 · Context & Memory Engineering — SIM · M · P2

- **60-second path:** one task, four context strategies side-by-side (full-dump / summarize / compress / sub-agent handoff) → cost, fidelity, and failure risk per strategy → flip to memory view: watch what persists across turns under each policy.  
- **Takeaway:** "Context strategy is a cost-fidelity dial. I set it per use case, not per platform."

### GAP-06 · Prompt Cost & Token Simulator — SIM · S · P1 (build first: momentum)

- **60-second path:** type/paste a prompt → live token count → set volume (calls/day) → cost/month at current published pricing ("as of" stamp) → toggle caching and batching → watch the annual figure drop. Aha: the caching toggle cutting a big number is visceral.  
- **Depth notes:** pricing in a dated data file; include a "portfolio preset" that echoes the $4M cost-avoidance story shape.  
- **Takeaway:** "Unit economics decide build-vs-buy long before architecture does."

### GAP-07 · Protocol Selection Lab ★ SIM · S/M · P0

- **60-second path:** answer 5–6 questions about an integration scenario (how many systems, how many agent consumers, coordination needs, governance) → recommendation across function calling / MCP / A2A / hybrid, with rationale AND the runner-up ("MCP, but function calling wins if you stay under 3 tools").  
- **Depth notes:** showing the runner-up and the flip condition is what makes it architecture judgment rather than a quiz. This answers the question every enterprise architect is actively asking in 2026\.  
- **Takeaway:** "The protocol isn't the decision — the number of producers and consumers is."

### GAP-08 · Human-in-the-Loop Approval Simulator — SIM · M · P1

- **60-second path:** watch an agent process items at autonomy level 1 (approve everything) → raise autonomy stepwise → see throughput rise AND a missed-edge-case slip through at the highest level → find the level where risk tier and throughput balance.  
- **Depth notes:** the deliberately-engineered slip-through is the lesson; map levels to risk tiers (bridges C1 Govern and EL-05).  
- **Takeaway:** "Autonomy is set per risk tier, not per enthusiasm."

## C3. Collection 3 — Business of AI Delivery (5 · gallery)

Thread: *capital allocation under uncertainty*. Every output is a dollar decision. Every scored output expandable to its formula.

### \#1 · AI Initiative Portfolio Dashboard ★ (flagship)

- **60-second path:** land on 12 realistic initiatives (card servicing, fraud, KYC, wealth ops shapes) plotted value × risk, sized by spend → click one → kill/scale/hold recommendation with visible reasoning → flip to Financials (burn, variance flags) → flip to Stage-Gate (approve/defer/kill queue). Aha: *"this is how a real portfolio owner thinks, instrumented."*  
- **Defensibility:** risk-adjusted ROI \= expected annual value × stage-based probability of success (discovery 0.15 / pilot 0.30 / scaling 0.60 / production 0.85 — cite as industry-informed defaults, editable) − run-rate cost. Kill/scale/hold via explicit thresholds shown in an assumptions drawer. Variance flags at ±10% plan.  
- **Takeaway:** "A portfolio where nothing gets killed isn't governed — it's unattended. Two of these twelve should die this quarter."

### \#2 · Build-vs-Buy-vs-Fine-Tune Evaluator

- **60-second path:** describe a use case via structured inputs (volume, data sensitivity, differentiation need, latency, team skill) → three-column scored comparison with 3-year TCO each (API usage-based / fine-tune: training \+ hosting \+ eval maintenance / buy: license \+ integration \+ lock-in premium) → recommendation with the flip condition ("buy — but build if volume triples").  
- **Defensibility:** weights visible and adjustable; TCO line items enumerated; includes the licensing dimension (API vs committed-use vs enterprise agreement vs self-host commitment risk).  
- **Takeaway:** "This decision is re-made every 18 months. The evaluator matters less than knowing your flip conditions."

### \#3 · Inference Cost Forecaster (portfolio-level)

- **60-second path:** set a model mix across initiatives, monthly volume, growth rate → run-rate curve over 24 months → **the cliff**: the crossover point where amortized self-host (GPU \+ ops \+ engineering) undercuts API spend, marked and explained.  
- **Defensibility:** self-host cost \= hardware amortization \+ utilization assumption \+ ops headcount fraction; all visible. Distinct altitude from GAP-06 (portfolio vs per-call) — cross-link the two.  
- **Takeaway:** "The cliff is real but further out than vendors say — utilization assumptions decide it."

### \#4 · Vendor Evaluation & Risk Monitor

- **60-second path:** score 3 pre-loaded archetype vendors (hyperscaler / specialist / open-source-backed) on a weighted matrix (capability, security, roadmap, lock-in, support, price) → ranking → flip to risk view: concentration exposure, renewal timeline, exit cost. Adjust weights, watch ranking flip — the aha is *how fragile rankings are to weights*.  
- **Takeaway:** "The scorecard picks the vendor; the concentration view tells you what it costs to be wrong."

### \#5 · Business Case / ROI Builder

- **60-second path:** structured inputs (investment, value drivers, adoption ramp, discount rate) → payback, NPV, IRR → **tornado sensitivity chart** (±30% on adoption and value lines) → one-click one-slide exec summary, rendered like a real steering-deck slide.  
- **Defensibility:** the tornado chart is the differentiator — single-point ROI is what juniors present; ranges are what gets funded. Adoption ramp links conceptually to EL-01.  
- **Takeaway:** "I present the range, not the point. Points get challenged; ranges get funded."

## C4. Collection 4 — Engagement Leadership Labs (10 · control room, two wings)

Thesis: AI programs fail on adoption, stakeholders, capacity, and risk — not technology. Hardest collection for a technical candidate to fake; maps 1:1 to the EM title. Every panel echoes a real EM artifact and carries a resume-echo line.

**Two wings, covering the full life of an engagement:**

- **OPERATE wing (EL-01…EL-06):** run the engagement — adoption, stakeholders, capacity, RAID, compliance, talent.  
- **COMMERCIAL & MOBILIZATION wing (EL-07…EL-10):** win and start the engagement — RFP response, estimation/scoping, resource onboarding, executive communication production. This wing exists because the EM lifecycle begins *before* delivery: pursue → estimate → staff → onboard → operate → report → renew. A portfolio that skips pre-sales and mobilization tells only the middle of the story.

Render the wings as two zones of the control room (pursuit desk / operations floor), with the status strip spanning both.

### EL-01 · Adoption & Change Readiness Instrument ★ (flagship) — P0

- **60-second path:** pick a rollout scenario (e.g., "AI assist for 900 servicing agents") → score six readiness factors on sliders (sponsorship strength, workflow disruption, trust in output, training coverage, incentive alignment, comms quality) → composite readiness dial → **gate verdict: SCALE / SCALE WITH CONDITIONS / HOLD** → generated two-week adoption plan (comms, training waves, floor-champion model) that visibly changes as sliders move.  
- **Defensibility:** weighted composite with visible weights; gate threshold defended in first person ("I gate below 70 because pilots that scaled anyway died at week six"). The generated plan must read like a real EM wrote it.  
- **Resume echo:** Gen AI rollouts at AMEX; the adoption half of the 4.5× scale story.  
- **Takeaway:** "The model was never the risk. The 900 people who have to trust it were."

### EL-02 · Stakeholder & Sponsor Alignment Cockpit — P1

- **60-second path:** power/interest grid of 8 archetype stakeholders → sentiment trajectories over program weeks (sponsor drifting from champion to neutral, flagged) → click the flag → auto-drafted pre-steering-committee briefing: who needs to hear what, from whom, before the meeting.  
- **Resume echo:** multi-stakeholder consulting delivery (Deloitte/Verizon, Genpact/Morgan Stanley).  
- **Takeaway:** "Programs don't lose sponsors in meetings; they lose them in the silence between meetings."

### EL-03 · Capacity & Resourcing Planner — P0

- **60-second path:** portfolio of initiatives vs a 30-person team's skill inventory → heatmap flags over-allocation and skill gaps → toggle hire / contract / upskill per gap → delivery-date and cost implications shift live.  
- **Resume echo:** **direct mirror of the 31-resource AMEX intelligence mapping — the most personal lab on the site; say so on the card.**  
- **Takeaway:** "Capacity plans fail on skills, not headcount. Thirty people ≠ thirty people."

### EL-04 · Delivery Health & RAID Radar — P1

- **60-second path:** RAID board across 4 workstreams, G/Y/R **with trend arrows** (trajectory, not snapshot) → one workstream is reported-green-trending-yellow — the radar surfaces it → click: auto-drafted status narrative for leadership (this generation may be LIVE — cheap, defensible).  
- **Depth note:** the reported-vs-actual gap is the whole lesson; engineer the sample data to teach it.  
- **Resume echo:** the weekly reality of multi-portfolio EM work at AMEX.  
- **Takeaway:** "Green with a downward arrow is yellow. Report trajectory or get surprised."

### EL-05 · AI Compliance Readiness Navigator — P1

- **60-second path:** describe an AI initiative (function, autonomy, data, user impact) → risk-tier classification (EU AI Act obligations now in force; finserv overlays) → required controls mapped, gap-highlighted → exportable audit-readiness checklist.  
- **Defensibility:** classification logic dated ("as of July 2026"); illustrative-not-legal-advice disclaimer; bridges C1 Govern \+ GAP-08 autonomy tiers.  
- **Resume echo:** regulated-industry delivery — AMEX, Morgan Stanley, S\&P/CRISIL.  
- **Takeaway:** "Compliance isn't a gate at the end; it's a design input at the start. Retrofit costs 10×."

### EL-06 · Talent & Upskilling Pathway Planner — P2

- **60-second path:** team skill inventory vs agentic-era target state → gap heatmap → build/hire/partner pathway per role with time-to-productive estimates.  
- **Takeaway:** "The stack went agentic in 18 months. Teams take 24\. Start the people plan before the platform plan."

### EL-07 · RFP/RFI Response War Room — COMMERCIAL wing · P1

- **60-second path:** load a realistic AI-services RFP excerpt → watch it decompose into a **compliance matrix** (requirement → response owner → evidence → status) → set win themes → red-team panel scores the draft response against the RFP's own evaluation criteria, exposing weak sections → bid/no-bid gauge updates as coverage and win probability shift.  
- **Mechanics:** requirement extraction (may be LIVE — a defensible, impressive use of the model) → matrix board → win-theme cards threaded through response sections → red-team scorecard with per-criterion gaps.  
- **Defensibility:** bid/no-bid logic visible: strategic fit × win probability × delivery capacity × margin floor. Include a deliberately marginal sample RFP where the honest answer is "no-bid" — declining bad work is senior judgment.  
- **Resume echo:** $9M pipeline — this is the instrument of how pipelines get built.  
- **Takeaway:** "The RFPs you decline fund the ones you win. Bid/no-bid is a portfolio decision, not a reflex."

### EL-08 · Estimation & Scoping Studio — COMMERCIAL wing · P1

- **60-second path:** pick a scoped AI use case → build a deliverable-based estimate three ways side-by-side (bottom-up task sum / analogous from past engagements / three-point PERT with confidence range) → watch the three disagree → staffing pyramid \+ critical path generate from the chosen estimate → apply a mid-engagement scope change via **change control**: see schedule, staffing, and margin impact ripple through, with the change-order artifact generated.  
- **Defensibility:** show estimate ranges, never points (consistent with \#5's tornado philosophy); include AI-specific estimation risks as explicit line items (data readiness discovery, eval-harness build, model iteration loops — the things classic WBS estimates miss). Margin math visible.  
- **Resume echo:** consulting delivery estimation across HCLTech/Genpact/Deloitte engagements.  
- **Takeaway:** "AI estimates blow up in data discovery and evaluation, not modeling. Price the unknowns as line items or eat them later."

### EL-09 · Resource Onboarding & Knowledge-Transfer Tracker — COMMERCIAL wing · P2

- **60-second path:** a new engagement wins; 6 resources need onboarding → per-role 30/60/90 ramp plans generate (access \+ compliance checklist, environment setup, domain immersion, buddy assignment) → tracker shows time-to-productive per person with blocked-on-access flags (the real killer) → flip to offboarding view: a rolling-off senior's knowledge mapped and KT sessions scheduled before departure.  
- **Defensibility:** onboarding modeled as a critical-path problem (access requests are usually the longest pole — show it); KT capture as risk mitigation, tied to a bus-factor score per workstream.  
- **Resume echo:** resource-lead reality of the 31-resource AMEX portfolio; onshore/offshore mobilization patterns.  
- **Takeaway:** "A resource is a cost from day one and an asset from day forty. Onboarding compression is the cheapest margin lever nobody manages."

### EL-10 · Executive Communication Studio (QBR & Steering Builder) — COMMERCIAL wing · P1

- **60-second path:** raw delivery data flows in (RAID states from EL-04, adoption index from EL-01, burn from C3 \#1's Financials sample data) → choose artifact type: weekly leadership update / steering-committee pre-read / QBR deck outline → structured draft generates (status, key decisions needed, risks \+ mitigations, asks — in that discipline) with a **talk track** per section (may be LIVE via `LIVE_MODEL`) → toggle audience (CIO vs program sponsor vs procurement) and watch emphasis rewrite.  
- **Depth notes:** this is the production side of EL-02's briefings and EL-04's narratives — those instruments detect; this one *communicates*. The "decisions needed / asks" framing is the senior-EM tell: juniors report status, seniors force decisions.  
- **Resume echo:** weekly leadership updates and QBRs across multiple AMEX portfolios.  
- **Takeaway:** "An exec update that contains no decision request is a diary entry. Every pre-read I send asks for something."

---

# PART D — PHASED BUILD PLAN

Strict order. Each phase ends with a review checkpoint. **Definition of done for any lab:** card anatomy (§B3) complete · guardrails (§B5) pass · craft standards (§B6) pass · rubric ≥26/30 · its `labs-registry` entry flips 🔨 → ✅ (which updates the Competency Map automatically). **Kill criterion:** a lab that can't reach 26 after two iterations gets cut from scope, not shipped weak.

## Phase 0 — Foundations & hygiene

1. Shared config module: `LIVE_MODEL`, dated pricing file, dated protocol-stats file, freshness-stamp component, `labs-registry` data file.  
2. Migrate Collection 1 live calls off hardcoded `claude-sonnet-4-6`; add freshness stamps to existing labs.  
3. Extract design system into reusable primitives (type scale, palette tokens, card, badge, drawer, chart wrappers) — all new collections import, never copy.  
4. Site chrome: analytics, OG-image generation, changelog page, contact CTA, sitemap.  
- **Exit:** Collection 1 visually unchanged; zero hardcoded model strings; primitives importable; Lighthouse ≥95 on existing pages.

## Phase 1 — Layer 0: Competency Map landing

1. Build per §C0/§B4: four-altitude hero, domain panels in miniaturized structural metaphors, credential strip, honest badges, audience lenses (persisted).  
2. Wire badges to `labs-registry`.  
- **Exit:** "one person, four altitudes" lands in \<10s (test with a cold viewer); every claim evidenced; lenses rewrite emphasis correctly; mobile excellent.

## Phase 2 — MVP-7 (the credible core, in order)

1. **GAP-06** (S — momentum) → 2\. **C3 shell \+ \#1 Portfolio Dashboard** (flagship business signal) → 3\. **C2 shell \+ GAP-01** (rarest technical signal) → 4\. **GAP-03** (LIVE — "has shipped") → 5\. **C4 shell \+ EL-01** (flagship EM signal) → 6\. **\#2 Evaluator** → 7\. **\#5 ROI Builder**.  
- MVP-7 answers all four buyer questions: 1 LIVE lab (GAP-03), the rarest protocol lab (GAP-01), 3 business instruments, 1 engagement instrument.  
- **Exit:** all 7 at ≥26/30; GAP-03 runs genuinely LIVE with dignified fallback; 7 new ✅ on the map; every lab has takeaway \+ how-built \+ limitations.

## Phase 3 — Expansion wave 1 (highest remaining signal)

**GAP-07** (architect signal) → **GAP-04** (second LIVE lab — restores the ≥2-live guardrail) → **EL-03** (most personal echo) → **EL-04** → **EL-10** (exec-comms production — pairs with EL-04's data) → **GAP-08** → **\#3 Forecaster**.

- **Exit:** every collection ≥3 shipped labs; C2 has ≥2 genuinely LIVE labs; C4 status strip computes from real shipped-instrument values.

## Phase 4 — Expansion wave 2 (capacity permitting)

**EL-07** (RFP War Room — opens the COMMERCIAL wing's pursuit desk) → **EL-05** → **EL-08** (Estimation Studio) → **\#4 Vendor Monitor** → **EL-02** → **GAP-02** → **GAP-05** → **EL-09** → **EL-06**. Cut from the bottom first; never from Phases 1–3.

## Interview Sprint override (use when an interview is scheduled)

When Sudeep has an interview for a specific role, temporarily re-prioritize to whatever subset best evidences that role's JD, shippable before the interview date. Minimum viable interview asset: **Phase 0 \+ Phase 1 (Competency Map) \+ the 2 labs most resonant with the JD**, polished to rubric standard — a live URL in an interview beats ten backlogged labs. For delivery-lead/TPM roles (e.g., Deloitte SFL Scientific — see Appendix 2), the highest-resonance pair is **EL-04 (RAID Radar) \+ EL-10 (Exec Communication Studio)**, backed by GAP-06 if time allows. Resume the normal phase order afterward.

## Phase 5 — Compounding & maintenance (ongoing)

1. One short write-up per shipped lab (what it teaches, one design decision, one thing learned) — publishes the judgment layer; fixes the no-published-writing gap cheaply; each post links its lab and vice versa.  
2. Quarterly freshness sweep: model names, pricing, protocol stats (ACP/UCP for agent commerce are emerging — refresh GAP-07's tree if the landscape shifts), EU AI Act status; update all stamps.  
3. Review analytics: double down on the labs that hold attention; revise or cut the ones that don't.

---

# APPENDIX 1 — Decisions already made (do not reopen)

- Parent frame \= Command Center whose landing IS the Competency Map.  
- Collection 3 \= gallery grid · Collection 4 \= separate collection with control-room layout · boundary rule per §A2.  
- Merges: v1 GAP-02+09 → Loop & Failure Inspector · v1 GAP-05+07 → Context & Memory · v1 C3 \#4+\#8 → Vendor Monitor · v1 C3 \#9+\#10 absorbed into Dashboard · v1 C3 \#5 split into Evaluator/Forecaster · v1 C3 \#7 moved to EL-03.  
- v1 "MCP-vs-Function-Calling" upgraded to Protocol Selection Lab (adds A2A \+ hybrid).  
- Collection 4 expanded to two wings (OPERATE \+ COMMERCIAL & MOBILIZATION, EL-01…EL-10) to cover the full engagement lifecycle: pursue → estimate → staff → onboard → operate → report → renew. Catalog total: 23 labs \+ Layer 0\.

# APPENDIX 2 — Live target: Deloitte "AI Technical Project Lead – SFL Scientific" (req 350679\)

Sudeep is interviewing for this role (Strategy & Transactions / SFL Scientific, a Deloitte data-science consultancy; Tempe AZ among locations; $128k–$252.5k; recruiting closes 8/31/2026). The JD maps almost one-to-one onto this portfolio — use this table to prioritize builds and to arm interview talking points. Note the return-to-Deloitte narrative: Sudeep delivered Deloitte/Verizon earlier in his career.

| JD requirement (verbatim themes) | Portfolio evidence | Status |
| :---- | :---- | :---- |
| "Proactively manage RAID, change control, and release planning" | EL-04 RAID Radar; change control inside EL-08 | 🔨 |
| "Weekly leadership updates… steering committees, QBRs, milestone reviews (talk tracks, visuals, pre-reads)" | EL-10 Executive Communication Studio; EL-02 briefings | 🔨 |
| "Translate business requirements into user stories… backlog hygiene" | C1 Backlog Generator | ✅ already shipped |
| "Validate feasibility, sequencing, integration dependencies (LLM integration, RAG, evaluation, model deployment)" | C1 lifecycle (RAG/evals/deploy) ✅ \+ all of Collection 2 | ✅/🔨 |
| "Data and AI governance frameworks" | C1 Govern stage ✅; EL-05 Compliance Navigator | ✅/🔨 |
| "Change management and AI solution rollout/adoption" (preferred) | EL-01 Adoption & Change Readiness | 🔨 |
| "Pre-sales: estimating, scoping, workplans, RAID, delivery approach" (preferred) | EL-07 RFP War Room \+ EL-08 Estimation Studio | 🔨 |
| "Delivery governance, KPI reporting and/or budgets" | C3 \#1 Portfolio Dashboard (Financials \+ Stage-Gate views) | 🔨 |
| "Working knowledge of AI/ML and GenAI concepts (LLMs, prompt patterns, RAG, MLOps)" (preferred) | Collections 1+2 in their entirety | ✅/🔨 |
| "Drive and evaluate estimates by deliverable… critical path, inter-project dependencies" | EL-08 (three-method estimation \+ critical path) | 🔨 |
| 4+ yrs Agile/Jira/client-facing delivery | 💼 work history (HCLTech/AMEX, Genpact/MS, Deloitte/Verizon) | 💼 |

**Sample-data note for this target:** SFL Scientific's domains include cancer detection, clinical trials, manufacturing/semiconductor defect detection, autonomous/edge AI, and GenAI search/chat. Add one non-finserv scenario preset (e.g., "clinical-trial site selection AI" or "semiconductor defect detection rollout") to the flagship labs (C3 \#1, EL-01, EL-04) so the portfolio doesn't read as finserv-only to this interviewer.

**Interview framing (one line):** "I built the instruments of this job — RAID radar, QBR studio, adoption gates, estimation ranges — as working software. Here's the URL."

# APPENDIX 3 — Anti-patterns (if you catch yourself doing these, stop)

- Shipping a lab whose interactivity doesn't change understanding (guardrail 1 in costume).  
- A black-box score anywhere (violates §A4.3).  
- Faking a live call, fake-streaming a cached run, or soft-pedaling a SIMULATED badge (violates §A4.4 — and one dishonest pixel poisons the whole site's honesty premium).  
- Uniform card grids across collections (kills the structural-contrast signal).  
- Generic sample data ("Project Alpha, $100k") — violates the sample-data doctrine.  
- Adding labs before existing ones hit 26/30 (breadth is the enemy at this bar).  
- Jargon in problem lines; hype adjectives anywhere.  
- A takeaway line that describes the lab instead of rendering a judgment.

