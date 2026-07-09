# The AI Program Command Center and Labs Portfolio, Complete Guide

A complete, plain English guide to everything that has been built across both experiences on this site: the AI Program Command Center (the connected, seven stage lifecycle at ai-labs.sudeeplalka.com) and the Labs Portfolio (the 23 independent decision artifacts at portfolio.sudeeplalka.com). It explains what each piece does, what every KPI and term means, and how the two experiences relate. A full appendix at the end documents the actual formula behind every computed number, traced back to the source file that calculates it, so nothing here is guesswork about what the code does.

## How to use this document

The guide has four parts. Part 1 explains the two sites and how they share a foundation. Part 2 walks the AI Program Command Center stage by stage: Frame, Data, Build, Deploy, Govern, Realize, Operate. Part 3 covers the 23 standalone labs in the portfolio, organized by their three collections. Part 4 is a glossary of every recurring term. The appendix at the very end is organized to mirror Parts 2 and 3, so each stage or lab's KPIs can be looked up by the same name in the appendix to see exactly how the number is calculated.

Two labels appear throughout and matter: **SIMULATED** means an artifact runs on deterministic, authored logic and modeled data, no live model call, no production system behind it, so every number is explainable and reproducible. **LIVE** or **LIVE ready** means a real call path exists (a live model endpoint, for instance) even if it is not always switched on. Every lab and stage states which one it is. This is a deliberate honesty rule for the whole site: nothing pretends to be more real than it is.

---

# Part 1 · Two Experiences, One Foundation

This codebase deploys to two different websites from the same source, selected by an environment variable at build time:

- **ai-labs.sudeeplalka.com** (the "command center" deploy target) renders the **AI Program Command Center**: a single connected experience that walks one fictional AI initiative through a full delivery lifecycle, stage by stage, with real state carried from one stage into the next.
- **portfolio.sudeeplalka.com** (the "portfolio" deploy target) renders the **Competency Map**: a landing page into 23 independent labs, each one a self contained artifact about a single decision.

Both sites are built from the same shared packages: a design system, a labs registry, and a library of calculation engines. The difference is what gets assembled on top. The Command Center answers "can this person run an AI program end to end, gate by gate, with the outputs of one stage actually feeding the next." The Portfolio answers "can this person reason clearly about 23 distinct, high stakes AI decisions," each one isolated so it can be understood in a few minutes on its own.

A useful way to think about the relationship: the Command Center is the spine, one continuous story with state that threads through every stage. The Portfolio labs are 23 individual snapshots, each zoomed in on one decision the spine would otherwise walk past quickly. Several Portfolio labs and Command Center stages are powered by the exact same calculation engines (for example, the adoption readiness math in EL-01 and the Realize stage's ROI math both live in the same package), so learning the formula once pays off in two places.

Everything on both sites is deterministic: given the same inputs, the same output appears every time. Nothing is randomly generated in a way that would make the numbers unreproducible; where a series looks like it has natural variation (the Operate stage's twelve week history, for instance), it is produced by a seeded pseudo random function that always returns the same sequence for the same initiative name, not real telemetry.

---

# Part 2 · The AI Program Command Center

The Command Center walks a single initiative through seven stages in a fixed order: **Frame → Data → Build → Deploy → Govern → Realize → Operate**, and then loops back to Frame when Operate decides something needs to be reframed. Each stage asks one plain question and hands a concrete package of evidence to the next stage. The whole point of the design is that a stage does not have to take the previous stage's word for it, it reads the actual output object the previous stage produced (its "contract" or "handoff") and falls back to a sensible default only when that stage has not been run yet.

## The seven stage questions

Each stage exists to answer one question, and each raises the next stage's question in turn:

1. **Frame** asks: is this worth doing? It raises: can we feed it?
2. **Data** asks: can we feed it? It raises: does the system work?
3. **Build** asks: does the system work? It raises: can we trust it in production?
4. **Deploy** asks: does it run reliably at cost? It raises: is it safe to run?
5. **Govern** asks: is it safe to run? It raises: what is it actually worth?
6. **Realize** asks: what is it actually worth? It raises: is it still working?
7. **Operate** asks: is it still working? It raises: reframe the next cycle, closing the loop back to Frame.

## Stage 1 · Frame (Strategy and Planning)

**What it does.** Frame turns a vague ambition ("I want AI to help with customer questions") into a scoped, scored initiative. You choose five parameters, who the AI serves (Employees, Customers, Analysts, Frontline staff, Developers, Executives, or Partners), what job it does (Answer, Summarize, Extract, Classify, Decide, Monitor, Generate, or Orchestrate), what pain it addresses (Too slow, Inconsistent, Too expensive, Hard to scale, Error prone, Knowledge trapped, Poor experience, or Impossible today), how ready your data is (Rich and ready, Scattered, Sparse, or Unstructured), and your risk appetite (Conservative, Balanced, or Aggressive). You also type your own ambition in plain words, and a scope slider controls how broad or narrow the bet is.

**What comes out.** A "reframed" problem statement that echoes your own words back in a sharper form, a generated backlog of use case ideas sorted into four buckets (Wins, Core, Differentiators, Foundations), a suggested success metric shape, and the centerpiece: a **triangle score** across three axes, Value, Feasibility, and Data Readiness, each 0 to 100, plus a plain English verdict (a balanced bet, aimed too wide, data is the bottleneck, safe but small, or live tension).

**Key terms.** The **scope** slider (0 to 1) trades value for feasibility and data readiness, a wider scope generally raises potential value while lowering how buildable and how data ready the bet looks. The **backlog buckets**, Wins are fast and safe, Core is the dependable middle, Differentiators are high value and high effort bets, Foundations are the unglamorous plumbing (data cleanup, evaluation harnesses) that everything else depends on. A **human review flag** fires automatically when the bet is aggressive and either feasibility or data readiness is weak.

**What it hands to Data.** The scored initiative, most importantly the Data Readiness estimate Frame is guessing at, which the Data stage will actually test against real files.

## Stage 2 · Data (Corpus Intelligence)

**What it does.** Data asks the question Frame could only guess at: is the underlying content actually good enough to feed an AI system? You upload files (or use the built in sample corpus) and the lab profiles each one against eight guideline categories: format and encoding, de duplication, freshness and versioning, privacy and PII, provenance and licensing, taxonomy and metadata, content concentration (how repetitive it is), and topical cohesion and admissibility (does it belong with the rest of the corpus, is it even in the expected language).

**What comes out.** A per file readiness score (0 to 100) and a gate verdict, Approved, Conditional, Hold, or Rejected. Findings are tracked individually (open, fixed, or accepted as risk) and roll up into a scorecard across all eight categories. A corpus wide "Atlas" plots every file in 2D or 3D by content similarity, using the same PCA (principal component analysis) technique the Build stage uses for its own embedding view. A duplicate and version resolution workflow groups near identical files together and recommends which copy to keep. A topic grouping feature suggests topical clusters using k means, and a human confirms or renames the labels. The showpiece is the **cleaning to quality proof**: the exact same retrieval algorithm is run twice against an authored set of test questions, once on the raw corpus and once on the cleaned one, and the measured accuracy difference is the concrete argument for why data preparation matters.

**Key terms.** A **finding** is one specific issue on one specific file (for example, "12% missing values" or "SSN detected"). A **gate** is the resulting ingest decision. **Content concentration** measures how much of a document is repeated phrasing (low is bad, meaning boilerplate heavy). **Topical cohesion** measures how well a document's content matches the rest of the corpus's center of gravity, using cosine similarity. **Parsability** is how much usable text actually came out of a file (a scanned PDF might yield almost none). PII detection covers SSNs, card numbers, IBANs, routing and account numbers, medical record numbers, API keys, emails, phones, and more.

**What it hands to Build.** The Data Readiness Handoff, a structured object naming which sources are approved, conditional, blocked, or rejected, what sensitivity restrictions apply, what chunking approach the content needs, and a remediation backlog of open issues.

## Stage 3 · Build (RAG Quality Evaluator and Model Selection)

**What it does.** Build proves the actual retrieval and generation engine works, not in theory but on a real document you provide. It chunks the document, retrieves the passages most relevant to your question using a real lexical search algorithm (BM25, the same family of ranking algorithm used by real search engines), generates a grounded answer with citations back to specific chunks, and then evaluates that answer across six dimensions. A separate but related tool, model selection, lets you weigh eight criteria (capability, cost, latency, context window, data control, portability, customization, operational simplicity) across nine representative model archetypes and see which one best fits a chosen scenario.

**What comes out.** Retrieval relevance, citation coverage, citation accuracy, faithfulness (is the answer actually grounded in the retrieved text), answer completeness, context utilization, and hallucination risk, six numbers that combine into one overall quality score and a quality gate: Passed, Warning, or Failed. A human review flag fires automatically on low scores or high risk topics. Token and dollar cost are computed per call from real token counts.

**Key terms.** **BM25** is the specific, real ranking formula used for retrieval, term frequency weighted by how rare each word is in the corpus, with a length normalization factor, exactly the algorithm the appendix documents in full. **Chunking** is how a document gets cut into retrievable pieces (roughly 700 characters with 120 characters of overlap, sentence aware). **Faithfulness** measures what fraction of the answer's actual words trace back to the retrieved evidence. **Hallucination risk** is essentially the inverse of faithfulness and citation accuracy, adjusted upward when the answer contains numbers or policy terms that never appeared in the evidence. A **quality gate** is the Passed and Warning and Failed decision a release process would actually check.

**What it hands to Deploy and Govern.** The Build Output Contract: the selected model, retrieval mode, quality score, which quality gates failed (if any), known failure modes, and cost and latency estimates that Deploy will use as its starting point.

## Stage 4 · Deploy (Operations and Release Readiness)

**What it does.** Deploy asks whether the system that worked in Build will actually hold up once it is running at real volume, under a real budget, with a real reliability target. You choose a model tier (small or large), a caching percentage, whether a reranker is enabled, and a daily query volume, and the stage computes what that configuration actually costs and how it performs.

**What comes out.** Cost per query and monthly cost, p50/p95/p99 latency (the median, 95th percentile, and 99th percentile response time), utilization (peak load versus capacity), error rate, reliability against a service level target, and an error budget (how much of your allowed unreliability you have left). An "operating envelope" grid shows, across every combination of volume and cache percentage, whether the system lands in a green, amber, or red zone. A drift chart projects quality decay over 16 weeks. An incident simulator walks through an outage, a traffic spike, or a model regression, tick by tick. The stage will also search across tier, cache percent, and reranker settings to recommend the cheapest configuration that still lands in the green zone at your chosen volume.

**Key terms.** **SLO** (service level objective) is the reliability and latency target the system is held to. **Error budget** is the cushion between actual reliability and the SLO, expressed as a percentage, it can go negative if the SLO is being breached. The **operating envelope** is the safe combination of load and mitigations (caching, tier, reranking). **Zone** is the green, amber, or red read on whether the current configuration is safe. **Drift** is the gradual decline in answer quality over time as source content and query patterns move away from what the system was built and tuned on.

**What it hands to Govern and Realize.** Operational evidence, reliability, cost per query, drift risk, incident history, which feeds directly into both the governance decision and the realized value calculation.

## Stage 5 · Govern (Risk, Guardrails, and Decisions)

**What it does.** Govern is where the question "is it safe to run" gets a real, defensible answer. It combines a use case risk model (weighing data sensitivity, deployment context, use case type, business function, and human oversight into a single risk score and tier) with a live guardrail engine that actually scans real prompts and responses for eight categories of problems: prompt injection, sensitive data (PII), unsupported or overconfident claims, regulated financial advice, high risk tool actions, toxicity, bias against protected classes, and missing citations on retrieval grounded claims.

**What comes out.** A governance scorecard across five dimensions (use case risk, data risk, build quality, operational risk, audit readiness), a list of open findings with severity and owner, a list of required controls, and a single final decision: Approved for pilot, Approved with restrictions, Human review required, Hold pending remediation, or Not approved. For any given prompt, the guardrail engine returns a specific decision (Allow, Block, Escalate, Redact, Rewrite, Require confirmation, Allow with disclaimer) with a named reason and a confidence score. There is also a regulatory orientation view that maps the initiative to an EU AI Act risk class and the four NIST AI Risk Management Framework functions (Govern, Map, Measure, Manage), explicitly labeled as informational orientation rather than legal advice.

**Key terms.** A **guardrail** is one specific detector (for example, the PII guardrail, the prompt injection guardrail). **Decision precedence** is the rule for what happens when multiple guardrails fire at once, the most restrictive action wins (Block beats Escalate beats Require confirmation beats Redact beats Rewrite beats Allow with disclaimer beats Log only beats Allow). **Severity** ranges from info to critical. **Risk tier** (Low, Medium, High, Critical) determines how much oversight and control a use case is required to carry.

**What it hands to Realize.** A risk discount, essentially a percentage haircut applied to the value calculation to reflect governance tier, open findings, operational drift, and reliability, so a system with real open risk shows a lower, more honest realized value than one with a clean bill of health.

## Stage 6 · Realize (Business Value)

**What it does.** Realize answers what this initiative is actually worth, once every upstream honesty check has been applied. It does not start from a fresh, optimistic estimate, it reads the real numbers the earlier stages produced: how many tasks are addressable, how much time each one saves, how many people actually adopted it, how good the answers actually are, what it actually costs to run, and what risk discount governance and operations earned.

**What comes out.** A "value river," a waterfall that starts at total addressable value and subtracts, in order, the value lost to incomplete adoption, the value lost to imperfect quality, the run cost, and the risk discount, landing on a final risk adjusted value. From that: ROI percentage, payback period in months, and a three year NPV. A sensitivity tornado shows which single assumption (adoption, quality, time saved per task, labor rate, or investment) the case depends on most. A full dossier traces every number in the final figure back to the stage that produced it, frame, data, build, deploy, or govern, so the business case is fully auditable.

**Key terms.** **Value river** is the waterfall view of value gained and lost. **Risk adjusted value** is the bottom line dollar figure per year after every discount is applied. **Adoption loss** and **quality loss** are the two biggest, most human factor driven leaks in the value chain, usually larger than the run cost itself.

## Stage 7 · Operate (Day Two and the Loop Back)

**What it does.** Operate has two halves. The first half, release readiness, is the day zero and day one check: a 13 point checklist (is the initiative approved, is the data readiness handoff in place, are build quality gates passing, is a rollback path defined, and so on) that rolls up into a single readiness score and recommendation (Ready for pilot, Ready with restrictions, Hold before pilot, Not production ready). The second half, day two operations, is the part most programs skip: a twelve week simulated operating history across four layers, system reliability (which stays green the whole time, deliberately), model quality (a canary evaluation score that quietly slides), RAG freshness (how stale the index has become), and agent and cost behavior. A scripted incident lands in week seven: an upstream source system changes its schema, the nightly refresh job silently starts skipping content, and the index goes stale while every infrastructure dashboard stays green. Automatic detectors catch four kinds of problems: silent drift, staleness breaches, cost creep, and agent behavior anomalies.

**What comes out.** A release readiness score and a monitoring coverage score (how many of twelve key signals are actually being watched). A canary breach projection extrapolates the current quality trend forward to the week it will cross a quality floor, before it happens rather than after. When the week seven incident fires, you choose one of four remediation options, reindex, retrain, rollback and restrict, or rescope, each with a real cost, a real timeline, and a stated tradeoff. Whichever you choose writes a typed feedback contract that is sent back to Realize (the dollar value at risk while the issue stays open), to Govern (an evidence note for the audit trail), and to whichever stage actually owns the fix, Build, Deploy, or all the way back to Frame if the honest answer is that the original scope was wrong.

**Key terms.** A **canary evaluation** is a small, scheduled quality check run against a known golden set, meant to catch quality decline before users notice. **Staleness** is how many days behind the source of truth the retrieval index has fallen. **Silent drift** is the specific failure pattern where every infrastructure signal (uptime, latency, error rate) looks perfectly healthy while the actual answers are quietly getting worse, the whole reason day two observability has to watch model quality signals separately from system uptime signals. **Value at risk** is the annualized dollar exposure of leaving a known quality problem unresolved. The **loop back** or **feedback contract** is what makes this a program, not a project, Operate's decision changes what Frame, Build, Deploy, Realize, or Govern do next.

## Why the stages are threaded together

The single most important design idea in the Command Center is that each stage's numbers are not invented independently. Deploy's cost model is scaled by the actual model archetype chosen in Build. Realize's adoption input prefers the Data stage's real readiness score over Frame's original guess, and its quality input prefers Build's real faithfulness score over a generic default. Govern's decision folds in Deploy's actual reliability and drift readings. Operate's release readiness checklist reads Build's actual failed gates and Data's actual blocked sources, not placeholders. When an upstream stage has not been run yet, each downstream stage degrades gracefully to a sensible default rather than breaking, but the moment you actually run the upstream stage, the downstream numbers visibly move. That is what "the same initiative, threaded through a lifecycle" means in practice, and it is why the full formula chain matters enough to document completely in the appendix.

---

# Part 3 · The Labs Portfolio

The portfolio is organized around a simple idea: every technical pattern in enterprise AI (an integration protocol, a multiagent workflow, a context strategy) eventually turns into a decision a senior leader has to make, usually one with a dollar amount, a risk, or a timeline attached. Each of the 23 labs takes one of those technical patterns and turns it into an interactive artifact where you can change the inputs and watch the decision move.

The labs are organized into three collections, each mapped to a distinct kind of decision maker:

- **Collection 2, Agent Architecture and Protocol Strategy (GAP-01 through GAP-08).** Eight labs about the technical choices behind agentic systems, MCP, multiagent orchestration, protocols, memory, cost, and human oversight, each reframed as an architecture or investment decision.
- **Collection 3, AI Investment Strategy and Portfolio Governance (C3-1 through C3-5).** Five labs about the financial and governance side of AI: what to fund, what to kill, build vs buy, vendor risk, and the business case itself.
- **Collection 4, Operating Model and Transformation Leadership (EL-01 through EL-10).** Ten labs about the people and delivery side of running AI programs: adoption, stakeholders, capacity, compliance, talent, bids, estimation, onboarding, and executive communication.

Every lab in Collections 2 through 4 is SIMULATED: it runs on deterministic, authored logic and modeled data rather than a live production system or a live model API. That is a deliberate choice, it means every number on screen is explainable and every lab produces the same output every time, and each lab says so explicitly in its own Limitations note. A couple of labs are marked LIVE ready and can run a genuine model call once a host endpoint is configured.

Where a lab's numbers are computed by a real, documented formula rather than authored purely as narrative, its entry below says so and points to the matching section in Appendix B or C.

## How to read each lab's entry

Every lab below follows the same structure: the question it opens with, what you actually do with it, the real decision it maps to, the key KPIs it surfaces, the tradeoff it won't let you avoid, its one line takeaway, and its stated limitations.

## Quick reference table

| ID | Lab | Decision it maps to |
|---|---|---|
| GAP-01 | MCP Server Contract Workbench | Expose systems via MCP vs. bespoke integrations, and where the crossover is |
| GAP-02 | Agent Failure and Recovery Inspector | How much to budget for the observability harness around agents |
| GAP-03 | Multiagent Orchestration Economics Board | When multiagent's quality gain justifies its cost multiplier |
| GAP-04 | Structured Output Reliability Gate | Where to place the validation gate before outputs hit systems of record |
| GAP-05 | Context and Memory Strategy Evaluator | Set the cost/fidelity dial per use case, not per platform |
| GAP-06 | Token Economics Simulator | Build vs. buy on unit economics, before architecture |
| GAP-07 | Protocol Selection Decision Model | Which protocol (function calling, MCP, A2A, hybrid) fits the integration pattern |
| GAP-08 | Human Review and Autonomy Control Simulator | Set autonomy level per risk tier, not per enthusiasm |
| C3-1 | AI Portfolio Capital Allocation Dashboard | Kill / scale / hold each initiative, via risk adjusted ROI |
| C3-2 | Build, Buy, or Fine Tune Decision Evaluator | three year TCO across all three paths, with the flip condition |
| C3-3 | Inference Run Rate Forecaster | The API vs. self host crossover, driven by utilization |
| C3-4 | Vendor Selection and Concentration Risk Monitor | Weighted vendor pick plus concentration/exit cost exposure |
| C3-5 | AI Business Case and ROI Builder | Fund / defer on an NPV range, not a single point |
| EL-01 | Adoption Readiness Decision Instrument | Scale / scale with conditions / hold the rollout |
| EL-02 | Stakeholder and Sponsor Alignment Cockpit | Who needs to hear what, from whom, before the meeting |
| EL-03 | Capacity and Skills Coverage Planner | Hire / contract / upskill per gap, with date and cost impact |
| EL-04 | Delivery Health and RAID Radar | Escalate the workstream whose trend is worse than its status |
| EL-05 | AI Compliance Readiness Navigator | Risk tier and required controls, before release commits |
| EL-06 | Talent and Upskilling Pathway Planner | Build / hire / partner per role, with time to productive |
| EL-07 | RFP and Bid Decision War Room | Bid / no bid as a portfolio decision |
| EL-08 | Estimation and Scope Control Studio | The real estimate, and the margin impact when scope moves |
| EL-09 | Onboarding and Knowledge Transfer Tracker | Onboarding critical path, and KT capture before a senior rolls off |
| EL-10 | Executive Communication Decision Studio | What decision to force this week, framed per audience |

---

## Collection 2 · Agent Architecture and Protocol Strategy

These eight labs take the plumbing of agentic AI (protocols, orchestration, memory, cost, oversight) and turn each into an architecture or investment decision.

### GAP-01 · MCP Server Contract Workbench

**The question:** What actually goes over the wire when an agent calls a tool, and at what point does a shared protocol beat writing custom integration code for every system?

**What you do:** Pick a mock enterprise system (a disputes API, an HR knowledge base) and watch its MCP "manifest" generate: the tools, resources, and prompts it exposes. Compose a real tool call, fill in its arguments, and send it, seeing the full request/response, including what happens on malformed arguments. A separate panel lets you slide the number of systems and agent consumers to see the crossover between bespoke integrations (scaling as systems × consumers) and a shared protocol (scaling as systems + consumers).

**The decision it maps to:** Whether to standardize AI tool access through MCP or keep building bespoke, point to point integrations, and how that answer changes as systems and agent consumers grow.

**Key KPIs:** the crossover point in the systems × consumers chart; connector count reduced; tool onboarding time; protocol adoption share; integration change failure rate. *Formula: Appendix B.1.*

**The tradeoff:** A protocol layer is overhead when the integration surface is tiny. The lab shows exactly where the surface gets large enough that standardizing pays off.

**The takeaway:** The MCP decision isn't ideological. Count the systems, count the consumers, and find the crossover.

**Limitations:** A deterministic portfolio artifact, not a production MCP server. Real implementation needs authentication, authorization, capability negotiation, streaming, pagination, observability, and enterprise security controls.

### GAP-02 · Agent Failure and Recovery Inspector

**The question:** How do autonomous agents actually fail, and what catches it before it becomes an incident?

**What you do:** Step through three agent architectures (single agent, orchestrator worker, evaluator optimizer). For each, the lab injects one of four authored failures (tool error, infinite loop, hallucinated arguments, context overflow) into the step trace and shows whether a detection signal exists and what recovery policy applies.

**The decision it maps to:** How much to budget for the observability and recovery harness around an agent, sized to the failure modes that actually occur.

**Key KPIs:** failure classes caught vs. escaped; harness coverage of the full failure taxonomy; failure detection time; recovery success rate; escalation rate; repeat failure rate; incident cost.

**The tradeoff:** A richer observability harness costs money and adds latency; an uninstrumented failure reaches a real system of record.

**The takeaway:** Don't budget for agents alone. Budget for agents plus the operating harness that detects failures, recovers safely, and knows when to escalate.

**Limitations:** This lab is a scripted trace walkthrough: the four failure scenarios and their detection/recovery text are authored, not computed from a formula, so there is no numeric model to trace in the appendix beyond the step logic itself. Production use needs real tool telemetry, policy enforcement, alert routing, and incident management integration.

### GAP-03 · Multiagent Orchestration Economics Board

**The question:** Is a multiagent workflow actually worth its added cost and coordination, or is it an impressive demo that doesn't pay for itself?

**What you do:** Watch a supervisor decompose a goal and delegate to role specialized agents that coordinate over A2A style messages with explicit lifecycle states. The board tracks a head to head scorecard: the quality delta versus a single agent baseline, alongside the cost and latency multiples that extra quality costs.

**The decision it maps to:** When a multiagent architecture's quality gain is large enough to justify its cost and latency multiplier, task class by task class.

**Key KPIs:** quality lift vs. single agent baseline; cost multiple; latency multiple; rework reduction; user acceptance. *Formula: Appendix B.2.*

**The tradeoff:** More agents raise quality, cost, and latency together.

**The takeaway:** The decision isn't whether the workflow looks sophisticated. It's whether the quality gained per dollar and per second is high enough for the task.

**Limitations:** Uses deterministic scoring and authored scenarios, not live model calls. Production orchestration needs real model calls, trace storage, routing policies, evaluation data, and failure handling.

### GAP-04 · Structured Output Reliability Gate

**The question:** How do messy, unpredictable model outputs become schema valid data that a real system can safely act on?

**What you do:** Run representative tasks (an angry customer email, an ambiguous complaint, a time off request) through a validation workflow and watch where raw model output fails a schema check, how a corrective retry repairs it, and what that retry costs in latency.

**The decision it maps to:** Where to place the validation gate before a model's output writes to a system of record, and how strict to make it.

**Key KPIs:** schema valid rate at the gate; repair (retry) success rate; escapes downstream; retry rate; latency added; escalation rate.

**The tradeoff:** A strict gate adds retries and latency; a loose gate lets bad data reach systems of record.

**The takeaway:** If model output updates a system of record, validation isn't optional. It's a reliability control.

**Limitations:** This lab is an authored validation demo: the three samples and their pass/fail/retry outcomes are pre written, not generated by a scoring formula. Production use needs real schema contracts, logging, retry policies, exception handling, and system integration.

### GAP-05 · Context and Memory Strategy Evaluator

**The question:** As a conversation or task gets longer, which context strategy, keep everything, summarize, compress, or hand off to a fresh subagent, actually holds up?

**What you do:** Compare four context strategies (full dump, summarize, compress, subagent handoff) side by side on the same growing task, and watch token load, overflow risk, and answer fidelity change as the conversation lengthens (1 to 10 turns).

**The decision it maps to:** Setting the cost/fidelity dial per use case rather than defaulting to a platform's default context handling.

**Key KPIs:** token cost per task, by strategy; overflow events; answer quality/fidelity; context recall; user rework. *Formula: Appendix C.1.*

**The tradeoff:** Higher fidelity costs more tokens. Aggressive compression eventually starts hurting the answer.

**The takeaway:** Context strategy is a cost and fidelity decision. Set it based on the workflow, not enthusiasm for bigger context windows.

**Limitations:** A modeled comparison, not real conversation traces. Production use needs actual conversation data, task level evaluation, memory policies, privacy controls, and retention rules.

### GAP-06 · Token Economics Simulator

**The question:** What will this agent workflow actually cost per month at real volume, before anyone commits to an architecture?

**What you do:** Convert a call structure into an estimated monthly and annual cost by adjusting model choice, prompt size, volume, caching, and batching, and see the effect of each lever.

**The decision it maps to:** Build vs. buy, decided on unit economics before architecture gets drawn.

**Key KPIs:** cost per call; monthly and annual run rate; cache hit rate; batching savings; cost per successful outcome; monthly delta of switching models. *Formula: Appendix B.3.*

**The tradeoff:** The cheapest model isn't always adequate for the task; caching adds engineering work for a real but not guaranteed saving.

**The takeaway:** Size the call before arguing the architecture. Unit economics often settles the design debate earlier than a diagram does.

**Limitations:** Uses modeled pricing and assumptions. Production forecasting needs current vendor pricing, actual traffic patterns, utilization data, and finance approved costing rules.

### GAP-07 · Protocol Selection Decision Model

**The question:** Function calling, MCP, A2A, or a hybrid, which protocol actually fits this integration pattern?

**What you do:** Answer a short set of questions about an integration scenario (how many producers, how many consumers, how much coordination is needed) and get a scored recommendation, the runner up, and the single input that would flip the recommendation if it changed.

**The decision it maps to:** Letting the number of producers and consumers, not trend or preference, pick the protocol.

**Key KPIs:** fit score per protocol option; the "flip condition"; integration reuse; onboarding time; tool adoption; change effort; support complexity. *Formula: Appendix B.4.*

**The tradeoff:** Broadening scope raises value but lowers feasibility; function calling and MCP sit as near opposites on tool breadth.

**The takeaway:** The protocol isn't the first question. Count the systems, consumers, coordination needs, and governance constraints. The protocol follows from that shape.

**Limitations:** A decision model, not a full architecture review. Production selection needs security review, platform standards, vendor constraints, latency requirements, and implementation testing.

### GAP-08 · Human Review and Autonomy Control Simulator

**The question:** How much autonomy can an agent be given before an edge case slips through unreviewed?

**What you do:** Process a modeled queue of 20 decisions at five autonomy levels (review all, review high and medium risk, review high only, sample about 20%, full autonomy), and watch throughput rise while edge case exposure changes.

**The decision it maps to:** Setting the autonomy level per risk tier, not per enthusiasm for automation.

**Key KPIs:** edge case coverage vs. throughput; the recommended autonomy level (the highest one with zero missed edge cases); review load; escalation rate; control exceptions. *Formula: Appendix B.5.*

**The tradeoff:** More autonomy means more throughput, and eventually, an unreviewed high severity error.

**The takeaway:** The question isn't how much autonomy is possible. It's how much autonomy is appropriate for the risk tier.

**Limitations:** A simplified queue simulation. Production workflows need live performance data, risk policy, audit logging, escalation paths, and ongoing exception review.

---

## Collection 3 · AI Investment Strategy and Portfolio Governance

These five labs are the financial and governance side of AI: what gets funded, what gets killed, and what it actually costs.

### C3-1 · AI Portfolio Capital Allocation Dashboard

**The question:** Across a whole portfolio of AI initiatives, which ones should be killed, scaled, or put on hold this quarter?

**What you do:** Treat a portfolio of AI initiatives like investment options, each with its own value, risk, stage probability, and spend. Move a budget slider and watch an efficient frontier chart show cumulative value against cumulative spend, then reallocate funding from weak initiatives toward stronger scale candidates.

**The decision it maps to:** Portfolio kill / scale / hold calls, made through risk adjusted ROI thresholds rather than gut feel.

**Key KPIs:** risk adjusted ROI per initiative (expected value × stage probability minus run cost); risk adjusted value; value per dollar; kill decision cycle time; realized vs. modeled ROI; funding efficiency. *Formula: Appendix B.6.*

**The tradeoff:** Funding the single highest value initiative can starve three efficient ones. The efficient frontier's knee point shows where diminishing returns begin.

**The takeaway:** A portfolio where nothing is stopped isn't governed. It's unattended.

**Limitations:** Financials are illustrative and use modeled assumptions. Real portfolio governance needs finance approved forecasts, initiative level probability estimates, delivery capacity data, and benefits tracking.

### C3-2 · Build, Buy, or Fine Tune Decision Evaluator

**The question:** For a given AI capability, should the organization build it, buy it, or fine tune an existing model?

**What you do:** Estimate a three year total cost of ownership and score build, buy, and fine tune paths against cost and strategic criteria (control, customization, time to value). The evaluator surfaces the leading path, the runner up, and the exact condition that would flip the recommendation.

**The decision it maps to:** A defensible build/buy/fine tune call, tied to a flip condition that tells you when to revisit it.

**Key KPIs:** three year TCO per path; time to value; control score; skill readiness; requirement fit; the break even volume or customization level that flips the recommendation. *Formula: Appendix C.2.*

**The tradeoff:** Build and fine tune buy you control at the cost of speed; buying trades customization for time to value.

**The takeaway:** The recommendation matters, but the flip condition matters more. Revisit this decision when usage, requirements, or strategic control needs change.

**Limitations:** A modeled decision tool. Real sourcing decisions need procurement data, security review, vendor contracts, implementation estimates, legal input, and architecture validation.

### C3-3 · Inference Run Rate Forecaster

**The question:** At what point does running your own model infrastructure actually beat paying for API calls?

**What you do:** Project API and self hosted costs across 24 months and watch the crossover point move as you adjust growth, token volume, the share of traffic needing a frontier tier model, utilization, and staffing assumptions.

**The decision it maps to:** The API vs. self host crossover, driven by utilization assumptions far more than by list price.

**Key KPIs:** monthly run rate; cumulative 24 month cost, both paths; utilization; cost per task; crossover month. *Formula: Appendix B.7.*

**The tradeoff:** API pricing is flexible and pay per use; self hosting is fixed capacity that only pays off past the crossover point.

**The takeaway:** The crossover isn't decided by vendor claims. It's decided by utilization, growth, and the share of workloads that truly need higher cost models.

**Limitations:** Uses simplified cost assumptions. Production forecasting needs current pricing, real workload profiles, infrastructure benchmarks, reliability requirements, and finance approved cost allocation.

### C3-4 · Vendor Selection and Concentration Risk Monitor

**The question:** Beyond who scores best on paper, what does it cost you if the winning vendor relationship goes wrong?

**What you do:** Compare vendor archetypes across capability, security, roadmap, lock in, support, and price, then switch to a risk view showing concentration exposure, renewal timing, and estimated exit cost if you needed to switch.

**The decision it maps to:** A weighted vendor pick that also names its concentration and exit cost exposure up front.

**Key KPIs:** weighted vendor score; concentration exposure; exit cost; renewal timing; switching feasibility. *Formula: Appendix C.3.*

**The tradeoff:** The best fit vendor on paper can also be the biggest concentration risk in practice.

**The takeaway:** The scorecard tells you who wins. The risk view tells you what it costs if the winner turns out to be wrong.

**Limitations:** A simplified vendor model. Real vendor selection needs procurement terms, security review, architecture fit, legal review, financial analysis, and operational due diligence.

### C3-5 · AI Business Case and ROI Builder

**The question:** What's the actual payback on this AI investment, and how fragile is that number?

**What you do:** Turn investment, value, adoption ramp, and discount rate into NPV, IRR, and payback period, then look at a tornado chart ranking which single assumption swings the business case the most.

**The decision it maps to:** Fund, fund with conditions, or defer, based on a range and its sensitivity, not a single confident looking number.

**Key KPIs:** NPV (net present value); IRR (internal rate of return); payback period; the widest tornado chart driver; adoption progress; realized value vs. modeled value. *Formula: Appendix B.8.*

**The tradeoff:** Optimistic value assumptions vs. conservative adoption and run cost assumptions, both defensible, both producing very different NPVs.

**The takeaway:** Present the range, not only the point. Points get challenged. Ranges with clear assumptions get governed.

**Limitations:** A portfolio business case artifact. Real funding decisions need finance validation, benefits ownership, implementation estimates, risk adjustments, and post launch value tracking.

---

## Collection 4 · Operating Model and Transformation Leadership

These ten labs are about running the AI program itself: the people, the stakeholders, the bids, and the communication that make or break delivery. Several are explicitly modeled on real engagement leadership experience (noted where relevant).

### EL-01 · Adoption Readiness Decision Instrument

**The question:** Is the organization actually ready to scale this AI rollout, or is it only the model that's ready?

**What you do:** Score six adoption factors (things like trust, workflow fit, sponsorship, training, incentives), weight them, and compare the composite score against scale thresholds. The instrument generates the smallest set of moves that would clear the gate.

**The decision it maps to:** Scale, scale with conditions, or hold, decided on adoption evidence rather than technical confidence alone.

**Key KPIs:** composite readiness score vs. the Scale cutoff; adoption rate; support volume; override rate; trust score; time to scale; readiness reassessment at 2 and 6 weeks. *Formula: Appendix B.9.*

**The tradeoff:** A broad, slow change management push vs. a small number of targeted, high leverage moves.

**The takeaway:** The model may be ready before the organization is. Scale decisions need adoption evidence, not only technical confidence.

**Real world basis:** Modeled on gen AI rollouts at American Express, the adoption half of a 4.5× portfolio scale story.

**Limitations:** A modeled adoption instrument. Real rollout decisions need user research, change analytics, operational data, manager feedback, and post launch measurement.

### EL-02 · Stakeholder and Sponsor Alignment Cockpit

**The question:** Which sponsor is quietly drifting away from the program before that shows up in the next steering committee meeting?

**What you do:** Map stakeholders on a power/interest grid, track sentiment trajectories over six weeks of program time, and get flagged the moment someone's alignment starts trending down. The cockpit generates a pre steering briefing focused on the stakeholder you select.

**The decision it maps to:** Who needs to hear what, from whom, before the meeting, not after.

**Key KPIs:** alignment gap per stakeholder; alignment score; drift flags; sponsor sentiment; decision delays; escalation frequency.

**The tradeoff:** Time spent aligning people ahead of the meeting vs. getting blindsided inside it.

**The takeaway:** Programs don't lose sponsors in the meeting. They lose them in the silence before the meeting.

**Real world basis:** Multi stakeholder consulting delivery (Deloitte/Verizon, Genpact/Morgan Stanley).

**Limitations:** A simulated stakeholder model with eight authored stakeholders and six week sentiment trajectories; drift is a simple "current reading below week one" check, not a statistical model. Real use needs stakeholder interviews, relationship context, meeting history, sentiment inputs, and the delivery lead's own judgment.

### EL-03 · Capacity and Skills Coverage Planner

**The question:** Do the people on this program actually cover the skills the portfolio needs, or does headcount just look fine on paper?

**What you do:** Map demand and capacity by skill pool (not just raw headcount), see where the team is overallocated, and model what hiring, contracting, or upskilling actions do to cost and schedule.

**The decision it maps to:** Hire / contract / upskill, decided per skill gap, with the date and cost impact of each option made explicit.

**Key KPIs:** skill utilization vs. target; open gaps; delivery date impact; monthly cost; time to productive capacity. *Formula: Appendix C.4.*

**The tradeoff:** Hiring is slow and expensive, contracting is fast but thin, upskilling is durable but takes time to pay off.

**The takeaway:** Thirty people do not equal thirty usable delivery units. Capacity fails by skill, not by headcount.

**Real world basis:** A direct mirror of a 31 resource AMEX intelligence mapping exercise.

**Limitations:** A deterministic planner. Real capacity planning needs availability data, role definitions, location constraints, ramp time, vendor constraints, and delivery priorities.

### EL-04 · Delivery Health and RAID Radar

**The question:** Which workstream that's reporting "green" is actually trending into trouble?

**What you do:** Compare each workstream's reported status against a calculated actual health score and trend line, built from its RAID detail (risks, assumptions, issues, dependencies). The radar computes a portfolio health index and highlights the gap between what's reported and what's real.

**The decision it maps to:** Escalate the workstream whose trajectory is worse than its reported status, before it becomes a missed milestone.

**Key KPIs:** reported vs actual gap; portfolio health index; issue aging; dependency closure; steering decision cycle time. *Formula: Appendix B.10.*

**The tradeoff:** A comfortable reported status vs. the honest trajectory sitting underneath it.

**The takeaway:** Green with a downward trend is not green. Report trajectory, or prepare to be surprised.

**Real world basis:** The weekly reality of multi portfolio engagement management work at AMEX.

**Limitations:** A modeled delivery governance artifact. Real use needs current plan data, workstream updates, RAID ownership, dependency status, and a real leadership review cadence.

### EL-05 · AI Compliance Readiness Navigator

**The question:** What regulatory risk tier does a given AI use case actually fall into, and what controls does it owe as a result?

**What you do:** Classify a representative AI function into a simplified risk tier (drawing on EU AI Act categories and finserv specific overlays), apply the relevant overlays, and see the resulting map of required controls versus what's currently in place, plus an audit readiness view.

**The decision it maps to:** Naming the risk tier and required controls before a delivery plan commits to a release path, not after.

**Key KPIs:** risk tier; control coverage vs. what the tier requires; unresolved gaps; audit readiness (met controls ÷ total controls); time to compliance review; release blockers.

**The tradeoff:** Control burden and slower time to market vs. regulatory and reputational exposure if you skip it.

**The takeaway:** Compliance is not a gate at the end. It is a design input at the start.

**Real world basis:** Regulated industry delivery experience across AMEX, Morgan Stanley, and S&P/CRISIL.

**Limitations:** Tier assignment and the control checklist are an authored rule table (a lookup by function, autonomy, data sensitivity, and impact), not a statistical model, and the lab states explicitly that it is illustrative, not legal advice, with classification logic as of July 2026 (obligations phasing in).

### EL-06 · Talent and Upskilling Pathway Planner

**The question:** How does a delivery team get to agentic era skills before the platform roadmap outruns them?

**What you do:** Compare current team capability coverage against the target skill set the roadmap demands, see where the gaps are, and model build (train), hire, or partner pathways for each one, along with the time each pathway takes to become productive.

**The decision it maps to:** Build / hire / partner, decided per role, with a time to productive figure attached to each choice.

**Key KPIs:** capability coverage; time to ready, per pathway; open gaps; pathway cost; productive capacity. *Formula: Appendix C.5.*

**The tradeoff:** Building skills in house is slow but durable; hiring is fast but expensive; partnering is quick but external and less sticky.

**The takeaway:** The AI stack may change in 18 months. Teams often take longer. Start the people plan before the platform plan becomes urgent.

**Real world basis:** Team capability building across multiple delivery portfolios.

**Limitations:** A modeled capability planner. Real workforce planning needs a role inventory, skills assessment, hiring market data, vendor strategy, budget, and manager validation.

### EL-07 · RFP and Bid Decision War Room

**The question:** Should you even bid this piece of work, and if so, where is the proposed response weakest?

**What you do:** Decompose an RFP into a compliance matrix, score the strength of a draft response against it, apply bid criteria (fit, win probability, capacity, margin), and get a bid or no bid memo out the other end.

**The decision it maps to:** Bid / no bid, treated as a portfolio decision (fit × win probability × capacity) rather than a reflexive "we should chase everything."

**Key KPIs:** composite bid/pursuit score; requirement coverage; margin fit; win rate; proposal effort; capacity consumed. *Formula: Appendix C.6.*

**The tradeoff:** Chasing a marginal bid vs. preserving capacity for a stronger one that comes along later.

**The takeaway:** The pursuits you decline create room for the pursuits you can win and deliver well.

**Real world basis:** Modeled on a $9M pipeline, the actual instrument of how a pipeline gets built, one qualified pursuit at a time.

**Limitations:** A modeled pursuit artifact with two authored RFP scenarios. Real bid decisions need client context, competitive intelligence, delivery estimates, pricing review, legal input, and executive judgment.

### EL-08 · Estimation and Scope Control Studio

**The question:** What's the real estimate for this engagement, and what happens to margin the moment scope moves?

**What you do:** Compare three estimation methods, bottom up, analogous, and PERT (three point), side by side, and watch them disagree. Then model staffing, schedule confidence, and what a scope change does to margin under a formal change control process.

**The decision it maps to:** A deliverable estimate range plus staffing plan, with the change control impact of scope movement made explicit up front.

**Key KPIs:** P80 estimate (80% confidence commitment point); schedule variance; margin impact; change order value; scope movement. *Formula: Appendix B.11.*

**The tradeoff:** Quietly absorbing scope creep protects the client relationship but erodes margin; a formal change order protects margin but is a harder conversation to have.

**The takeaway:** AI estimates most often break in data discovery and evaluation. Price those unknowns as line items, or absorb the cost later.

**Real world basis:** Consulting delivery estimation experience across HCLTech, Genpact, and Deloitte engagements.

**Limitations:** A portfolio estimation model. Real estimation needs delivery history, actual client scope, technical discovery, staffing rates, vendor constraints, and commercial review.

### EL-09 · Onboarding and Knowledge Transfer Tracker

**The question:** Why does it take 40 days to make a new hire productive, and what is that delay actually costing?

**What you do:** Model onboarding timelines, access delays, ramp time, and carrying cost across a set of new resources, and see which ones are blocked and where a single departing senior person represents a "bus factor" risk (critical knowledge with no backup).

**The decision it maps to:** The onboarding critical path, plus how much knowledge transfer gets captured before a senior person rolls off.

**Key KPIs:** time to productive; blocked resources; pre provisioning savings; KT (knowledge transfer) completion; bus factor risk. *Formula: Appendix C.7.*

**The tradeoff:** Ramping people faster vs. how much knowledge transfer depth actually gets captured in that shorter window.

**The takeaway:** A resource is a cost from day one, and becomes an asset only once productive. Compressing onboarding is a real operating lever, not just an HR nicety.

**Real world basis:** The resource lead reality of a 31 resource AMEX portfolio, including onshore/offshore mobilization.

**Limitations:** A modeled onboarding and KT tracker with six authored roles. Real use needs access systems data, role plans, training status, manager validation, KT artifacts, and resource calendars.

### EL-10 · Executive Communication Decision Studio

**The question:** Does this week's executive update actually force a decision, or does it just report status and change nothing?

**What you do:** Feed in shared delivery data (the same portfolio data structure EL-04 uses) and generate executive facing artifacts, weekly updates, steering pre reads, QBR outlines, each organized around status, decisions, risks, and asks, then rewritten for the specific audience receiving it (a CIO needs different framing than a sponsor or procurement).

**The decision it maps to:** What decision to force this week, and how to frame it for the audience actually in the room.

**Key KPIs:** whether a decision is actually being asked for (detected by scanning each ask for decision language) vs. just status reporting; audience fit of the framing; decisions requested; decisions made; risk acceptance; action closure; stakeholder response time.

**The tradeoff:** A comfortable, easy to write status update vs. forcing an uncomfortable but necessary decision.

**The takeaway:** An executive update with no decision request in it is a diary entry. Every pre read should ask for something.

**Real world basis:** Weekly leadership updates and QBRs across multiple AMEX portfolios.

**Limitations:** Uses the same modeled portfolio data as EL-04 and generated framing text. Real executive communication needs current facts, stakeholder context, political judgment, and review by the accountable delivery lead.

---

# Part 4 · Glossary

Every recurring term across both the Command Center and the Portfolio, in one place. Terms with a real, numbered formula point to their appendix section.

**A2A (Agent to Agent).** A messaging pattern for how multiple agents coordinate on a shared task, structured as request/response frames (assign, handoff, review request, return) rather than free text.

**Adoption.** The share of intended users who actually use a system, expressed 0 to 1 or as a percent. One of the two largest value leaks in any AI business case, alongside quality.

**Basis points, discount rate.** The discount rate is the interest rate used to convert future cash flows into today's dollars (see NPV). A higher rate makes future value worth less today.

**Bisection method.** A numerical technique for solving an equation with no clean algebraic solution by repeatedly narrowing a range in half until the answer is pinned down. Used to solve for IRR, see Appendix B.8.

**BM25 (Okapi BM25).** A real, industry standard lexical search ranking formula. It scores how well a passage matches a query using three ingredients: how rare each query word is across the whole document set (inverse document frequency), how many times the word appears in this passage (term frequency, with diminishing returns), and how long the passage is relative to average (length normalization). Both the Build stage's retrieval and the Data stage's cleaning to quality proof use the same BM25 formula, documented in full in Appendix A.3.

**Bus factor.** The number of people who could leave a project before it stalls from lost knowledge. A bus factor of one means a single departure would be very damaging.

**Canary evaluation.** A small, scheduled quality check run against a known "golden" set of questions with known good answers, meant to catch a decline in answer quality before real users notice it. Distinct from system uptime monitoring, which can stay perfectly healthy while a canary score quietly falls, the core lesson of the Operate stage.

**Chunking.** Splitting a document into retrievable pieces sized for a search index, usually a target character or token count with some overlap between consecutive chunks so meaning isn't lost at the seams.

**Citation accuracy.** In the Build stage, whether the specific passages an answer cites actually support what the answer claims, not merely whether a citation exists.

**Composite score, weighted score.** A single number built by multiplying several component scores by their assigned importance (weight) and summing, then normalizing by the total weight so the result stays on a consistent scale (usually 0 to 100) no matter how the weights are set.

**Confidence level (P50, P80, P90, P95).** A stated probability that the real outcome lands at or under an estimate. P50 is a coin flip (as likely to beat the estimate as miss it); P80, P90, and P95 build in progressively more contingency so the estimate is progressively more likely to hold. See Appendix B.11 for how these are computed from a three point estimate.

**Corpus.** The full collection of documents or files being evaluated together, as opposed to one file in isolation.

**Cosine similarity.** A way to measure how similar two things are by the angle between their vector representations, ranging from 0 (unrelated) to 1 (identical direction). Used in the Data stage to measure whether a document's content matches the corpus's overall center of gravity (topical cohesion).

**Crossover point.** The specific input value (a number of consumers, a month, a volume) at which one option stops being cheaper than another and the recommendation flips. A recurring device across the portfolio, GAP-01's protocol crossover, GAP-07's integration economics, and C3-3's API vs. self host crossover are all the same underlying idea applied to different questions.

**Decision precedence.** The rule for what happens when multiple governance guardrails fire on the same request at once, the single most restrictive action among them wins (Block outranks Escalate, which outranks Require confirmation, and so on). See Appendix A.5.

**Discounted cash flow.** See NPV.

**Drift.** The gradual decline in an AI system's real world performance over time as the world, the source data, or user behavior moves away from what the system was built and tuned against, even though nothing about the system itself changed.

**Efficient frontier.** A chart ranking investment options by value per dollar spent and plotting cumulative value against cumulative spend; the point where the curve's slope visibly flattens (the "knee") marks where you move from highly efficient spending into diminishing returns. See Appendix B.6.

**Error budget.** The amount of allowed unreliability an SLO leaves you, expressed as a percentage of the gap between the target and total failure; it shrinks as real reliability approaches the SLO and can go negative if the SLO is breached.

**EU AI Act risk class.** A simplified classification (Prohibited, High risk, Limited risk, Minimal risk) drawn from the EU's AI regulation, used across the site as an illustrative, non legal reference point for how much oversight and documentation an AI use case would be expected to carry.

**Faithfulness.** In the Build stage, the share of an answer's actual content that can be traced back to the retrieved evidence, the core measure of whether an answer is grounded rather than invented.

**Governance tier.** A classification (Low, Medium, High, Critical) assigned to an AI initiative based on its risk profile, which in turn determines what controls, review, and evidence it is required to carry before and during release.

**Greedy algorithm.** A simple, honest allocation method: rank every option by its value per dollar of cost, then take options in that order until the budget runs out. It is not a mathematically optimal solution to every possible allocation problem, but it is transparent and reproducible, which is the point in a portfolio funding tool. See Appendix B.6.

**Guardrail.** One specific, automated detector inside the governance engine (for example, the PII guardrail, the prompt injection guardrail), each of which independently inspects a prompt or response and returns whether it triggered, how severe that is, and what action it recommends.

**Hallucination risk.** An estimate of how likely an AI answer contains fabricated or unsupported content, calculated in the Build stage as roughly the inverse of faithfulness and citation accuracy, with penalties added when the answer contains numbers or claims that never appeared in the retrieved evidence.

**HITL (Human in the Loop).** A design where a person reviews or approves an AI system's action before, or instead of, it acting fully autonomously.

**IRR (Internal Rate of Return).** The discount rate at which a project's NPV is exactly zero, i.e. the effective rate of return the investment delivers. Because it has no clean algebraic formula, it is solved numerically (see bisection method, Appendix B.8).

**Jaccard similarity.** A simple overlap measure between two sets: the size of their intersection divided by the size of their union. Used in the Data stage to detect near duplicate and stale version file pairs by comparing the sets of words each file contains.

**K means clustering.** An algorithm that groups items into a fixed number of clusters by iteratively assigning each item to its nearest cluster center and recomputing the centers. Used in the Data stage to suggest topic groups across a corpus.

**LLM.** Large language model, the underlying model an agent, assistant, or generation step is built on.

**MCP (Model Context Protocol).** A standard way for an AI agent to discover and call tools, read resources, and use prompts exposed by a system, instead of custom integration code being written for each system individually.

**MTTR (Mean Time to Recover).** How long an incident takes from detection to resolution; used in the Deploy stage's incident simulator and the Operate stage's day two incident timeline.

**NIST AI RMF.** The U.S. National Institute of Standards and Technology's AI Risk Management Framework, organized around four functions: Govern (accountability and policy), Map (understanding context and risk), Measure (evaluating and tracking risk), and Manage (responding and recovering). Used in the Govern stage as an informational orientation, not a compliance certification.

**NPV (Net Present Value).** The value today of a stream of future cash flows, each future dollar discounted back to the present at a chosen rate because a dollar received later is worth less than a dollar received now. A positive NPV means the investment is worth more than it costs; see Appendix B.8 for the exact formula.

**Overfitting.** When a model performs well on the data it was tuned on but fails to generalize to new, real cases, a risk flagged in the Command Center's optional training/fine tuning track.

**P80.** An estimate carrying an 80% confidence level, see Confidence level.

**Parsability.** How much usable text actually survives extracting a file to plain text; a scanned PDF might yield almost none, which is invisible until measured directly.

**PCA (Principal Component Analysis).** A mathematical technique for reducing many dimensions of data down to the two or three directions that capture the most variation, used to plot documents or files on a 2D or 3D map where distance reflects real content similarity.

**PERT (three point estimation).** An estimating technique that takes an optimistic, most likely, and pessimistic estimate for the same task and combines them into a single weighted mean and a standard deviation, from which confidence levels like P80 and P90 are derived. See Appendix B.11.

**Quality gate.** A pass/warning/fail decision computed from several underlying quality metrics at once, used at multiple points across both experiences (Build's evaluation gate, Data's ingestion gate) to turn several numbers into one operational decision.

**RAG (Retrieval Augmented Generation).** An approach where a model's answer is grounded in documents retrieved at query time, rather than relying purely on what the model memorized during training. Note: "RAG" also separately means Red/Amber/Green status reporting in delivery contexts (EL-04); the site uses both meanings, and each usage makes clear which is meant.

**RAID.** Risks, Assumptions, Issues, and Dependencies, the standard categories used to track what could go wrong on a delivery program.

**Risk adjusted value.** A dollar figure that has already had adoption loss, quality loss, run cost, and a governance/operational risk discount subtracted out, the honest bottom line rather than an optimistic headline number.

**Risk tier.** A classification (Low, Medium, High, Critical, or similarly Minimal/Limited/High/Prohibited under EU AI Act framing) that determines what controls and oversight a given AI use case is required to have.

**Scope.** In the Frame stage, a 0 to 1 slider that trades value against feasibility and data readiness; widening scope tends to raise potential value while making the bet harder to build and more data hungry.

**SIMULATED vs. LIVE.** A SIMULATED lab or stage runs on deterministic, authored logic and modeled data. LIVE or LIVE ready means a real call path exists to a live system (for example an actual model API). Every lab and stage states which one it is.

**SLO (Service Level Objective).** A target for reliability and/or latency that a system is held to; the basis for computing error budget.

**Staleness.** How many days behind the real, current source of truth a retrieval index has fallen, a leading indicator of answer quality decline in RAG systems.

**TCO (Total Cost of Ownership).** The full cost of a solution over a set time horizon (commonly three years across this site), not just its sticker price, including integration, hosting, maintenance, and risk premiums.

**Tornado chart.** A sensitivity analysis chart that swings each input assumption up and down by a fixed percentage, holding everything else constant, and sorts the resulting outcome swings from widest to narrowest, visually naming the assumption the whole case depends on most.

**Value at risk.** In the Operate stage, the annualized dollar exposure of leaving a known, currently open quality or reliability problem unresolved, computed from the realized annual value, the adoption rate, and the measured quality degradation.

**Value river.** The Realize stage's waterfall view of value: starting from total addressable value and subtracting adoption loss, quality loss, run cost, and the risk discount in sequence to land on the final risk adjusted value.

**Z score.** In statistics, the number of standard deviations above a mean a given confidence level corresponds to (for example, P80 corresponds to a Z of about 0.84). Used in Appendix B.11 to convert a PERT estimate's mean and spread into P50/P80/P90 figures.

---

# Appendix · How Every Number Is Calculated

This appendix documents the actual formula behind every KPI and computed figure referenced above, organized to mirror Part 2 (the Command Center) and Part 3 (the Portfolio). Three kinds of logic appear across the codebase, and it matters which kind a given number is:

1. **Engine formulas** live in a small set of shared, framework agnostic calculation packages, each one unit tested on its own. These are the "real math" in the strictest sense: pure functions with named inputs, a documented formula, and an output, completely independent of how any screen displays them. Appendix A (Command Center) and Appendix B (Portfolio, shared engines) document these.
2. **Inline formulas** are real arithmetic, just written directly inside a lab's own component rather than factored into a shared package, because the formula is specific to that one lab. Appendix C documents these.
3. **Authored scenarios** are labs where the point of the artifact is to walk through a specific, pre written situation (an agent failure trace, a schema validation sample, a stakeholder's story) rather than to compute a number from a formula. These are called out in their own Part 3 entries above (GAP-02, GAP-04, EL-02's drift flag, EL-05's tier lookup, EL-10's decision detection) and are not listed again here, since there is no additional formula to show beyond what is already described.

All figures across the site, in every category, are deterministic: identical inputs always produce identical outputs. Where a series looks like it varies randomly (the Operate stage's twelve week history is the main example), it is generated by a seeded pseudo random number function (a small, fixed piece of arithmetic called mulberry32) that always produces the same sequence of numbers for the same initiative name, so the appearance of natural variation is fully reproducible and never actual randomness.

## Appendix A · The Command Center Engines

### A.1 · Frame: the triangle score and the backlog

Five parameters each carry a small weighting table behind the scenes: every **user** type has a volume weight (0 to 1), every **job** has a difficulty, frequency, and data need weight, every **pain** has a severity weight, and every **data posture** has a self sufficiency weight. Combined with the scope slider, these feed three formulas:

> **Value** = 100 × clamp[ 0.3 + 0.55 × (pain severity × (0.55 + 0.45 × user volume) × (0.55 + 0.45 × job frequency)) + 0.18 × (scope − 0.5) ]

> **Feasibility** = 100 × clamp[ 0.95 − 0.4 × job difficulty − 0.45 × scope × (0.5 + 0.5 × job difficulty) ]

> **Data Readiness** = 100 × clamp[ 0.55 × posture self sufficiency + 0.45 × (1 − 0.7 × job data need) − 0.18 × (scope − 0.5) ]

("clamp" means the bracketed value is held between 0 and 1 before multiplying by 100; every result is then rounded to a whole number.) Widening scope always pulls Value up slightly and Feasibility and Data Readiness down, which is what makes the scope slider feel like a real tradeoff rather than a free lunch. The three scores are compared against fixed targets of 65 / 60 / 60 to produce the plain English verdict: whichever of the three scores is lowest, and whether it clears its target, decides whether the read is "a balanced bet," "aimed too wide," "data is the bottleneck," "safe but small," or "live tension." A human review flag fires automatically when risk appetite is Aggressive and either feasibility or data readiness is under 45, or whenever data readiness is under 35 regardless of risk appetite.

The generated backlog works differently: a pool of about 20 authored idea "archetypes" (spread across the Wins, Core, Differentiators, and Foundations buckets) each carry a relevance rule keyed to your five parameters (for example, an idea about deflecting repetitive requests scores extra relevant when the pain is "Hard to scale" or "Too expensive"). Every archetype's relevance is combined with a deterministic noise value generated by hashing your exact inputs, so any single change to any parameter, or even to the free text ambition, reranks and reshuffles which ideas surface, while more relevant ideas still tend to rise to the top. The two highest scoring ideas in each bucket (three for Foundations) are kept, each with a value and effort score built from a base figure plus that same seeded noise, then adjusted for risk appetite (Conservative adds 10 points to Wins and subtracts 16 from Differentiators; Aggressive does the reverse) and clamped to a 15 to 95 range.

### A.2 · Data: Corpus Intelligence scoring

**Per file readiness score.** Every automated check on a file lands at one of four levels, healthy, watch, risk, or critical, each carrying a fixed penalty: healthy costs nothing, watch costs 6 points, risk costs 16, and critical costs 34. The file's score is 100 minus the sum of penalties for every check that has not been fixed, floored at 2 and capped at 100. A file with any uncleared critical finding (severe PII, unreadable content) is hard Blocked regardless of its numeric score. Otherwise: 85 or above is Ready/Approved, 65 to 84 is Needs review/Conditional, below 65 is Not ready/Hold.

**Category rollups.** Findings are also rolled up across all eight guideline categories (format, de duplication, freshness, privacy, provenance, taxonomy, concentration, cohesion/admissibility). Each open finding subtracts from a 100 point per file budget in its category (watch −10, risk −25, critical −45, floored at 0), and a category's corpus wide score is the average of every file's remaining budget in that category, so a single bad file lowers the score but a clean corpus still shows 100.

**Content concentration** (how repetitive a document is): every consecutive 3 word sequence (trigram) in the document is counted; the share of trigrams that are exact repeats of an earlier one is the "repeated share," and the score is 100 × (1 − repeated share). A document that never repeats a 3 word phrase scores 100; one that is mostly boilerplate scores low.

**Topical cohesion** (how well a document matches the rest of the corpus): every document's term vector is scaled to unit length, the corpus "centroid" is the average of all those unit vectors (also rescaled to unit length), and each document's cohesion is the cosine similarity between its own vector and the centroid, turned into a 0 to 100 score by multiplying by 100. A document whose vocabulary points in a very different direction from the rest of the corpus scores low and is flagged as a possible topical outlier.

**Parsability** (how much of a file actually became usable text): extraction yield is extracted characters divided by the file's raw byte size; a large file yielding under 2% of its bytes as text is flagged critical (very likely scanned or image heavy), under 8% is flagged risk. Separately, the share of characters that are encoding replacement characters, and the share of lines that repeat verbatim (headers, footers, boilerplate that survived extraction), each have their own thresholds that can bump the file's parsability level up to watch, risk, or critical.

**Duplicate and version detection.** Every pair of files is compared with Jaccard similarity, the size of the overlap between their two word sets divided by the size of their combined word set. A similarity of 0.97 or higher is called a near duplicate; 0.5 or higher with a version marker in either filename (things like "v2," "legacy," "draft") is called a stale version pair; 0.45 or higher on its own is a softer "near duplicate, review" flag. Grouped duplicate/version sets are resolved by a deterministic "keeper" rule: a file with an explicit staleness marker in its name loses first, then the file with the lower readiness score loses, then the smaller file, then alphabetical order breaks any remaining tie, so the "authoritative copy" pick is always explainable.

**The corpus map (Atlas).** Every file's word frequency vector is projected down to its top three principal components (the same PCA technique used in the Build stage's own embedding view) so that on screen distance between two files genuinely reflects how similar their content is, not an arbitrary layout.

**Topic groups.** A k means clustering pass (choosing 2 to 4 groups depending on corpus size) clusters files by their term vectors; each group's suggested label is its two most distinctive shared terms, with corpus wide, generic, or single year terms excluded so the label is actually meaningful. A group is marked "Unsure" when it is a singleton, has fewer than two usable terms, or its top terms carry less than 12% of its total term weight, an honest signal that the suggestion should not be trusted blindly.

**The cleaning to quality proof.** The exact same retrieval formula documented in A.3 below (BM25) is run twice against eight authored test questions, once over the raw uploaded files and once over a "cleaned" version (excluded files removed, confirmed topic labels attached, worth a 1.15× score boost when a question's topic hint matches). Accuracy in each pass is simply the number of questions correctly answered divided by the total; the measured difference between the two passes is the concrete number behind the claim that data preparation improves retrieval.

### A.3 · Build: retrieval, chunking, cost, and evaluation

**Chunking.** Documents are split into pieces targeting 700 characters, with 120 characters of overlap carried into the next chunk (so meaning at the seams is not lost), a minimum chunk size of 80 characters, and heading detection that keeps a document's own section structure intact where possible.

**BM25 retrieval**, the same real world lexical ranking algorithm search engines use, and the exact formula behind both the Build stage's retrieval and the Data stage's cleaning to quality proof:

> score(query, chunk) = Σ over each query term t of: idf(t) × [ tf(t) × (k1 + 1) ] ÷ [ tf(t) + k1 × (1 − b + b × chunkLength / averageChunkLength) ]

> where idf(t) = ln( 1 + (N − df(t) + 0.5) / (df(t) + 0.5) )

Here N is the total number of chunks, df(t) is how many chunks contain the term, and tf(t) is how many times the term appears in this specific chunk. The constants k1 = 1.5 and b = 0.75 are the standard, widely used BM25 tuning values (k1 controls how quickly extra repetitions of a word stop adding much value, b controls how much a chunk's length is penalized relative to average). The Build stage's own retriever adds two refinements on top: a small bonus when a two word phrase from the question appears verbatim in the chunk, and a penalty (chunks scored down to 15% or 60% of their raw score) for chunks that are mostly repeated boilerplate. Final relevance is the chunk's score as a fraction of the top scoring chunk, scaled by how confident the overall match is, and clamped between 0.04 and 0.98 so a weak match never reads as a strong one.

**Cost per call.** Input tokens = the question's tokens + the sum of every retrieved chunk's estimated tokens + 80 (a fixed system prompt overhead); output tokens are estimated from the generated answer's length. Cost = (input tokens ÷ 1,000,000) × $0.15 + (output tokens ÷ 1,000,000) × $0.60, a sample GPT-4o-mini class pricing profile used purely to make the unit economics concrete.

**Evaluation, the six scores and the overall quality formula.** For a given question, retrieved evidence, and generated answer:
- *Retrieval relevance* = the average relevance score of every retrieved chunk, on a 0 to 100 scale.
- *Citation accuracy*: for every chunk the answer actually cites, award 40 points simply for citing a real retrieved chunk, plus 30 points if the chunk shares a keyword with the question, plus 30 points if it shares a keyword with the answer; average across every cited chunk (0 if nothing was cited at all).
- *Faithfulness* = the share of the answer's own content words that also appear somewhere in the retrieved evidence, as a percentage, then reduced by 12 points for every number in the answer that never appeared in the evidence, and by 6 points for every policy sounding term used in the answer but absent from both the question and the evidence.
- *Answer completeness* = 60% weight on how much of the question's own content words are covered by the retrieved evidence, plus 25% weight on having at least 4 chunks retrieved, plus 15% for the answer stating an honest caveat about its own limits.
- *Context utilization* = the share of retrieved chunks that were actually used in the final answer.
- *Hallucination risk* = 100 minus a blend of faithfulness (60% weight) and citation accuracy (40% weight), then bumped up further for ungrounded numbers (+8), ungrounded policy terms (+5), zero citations (+10), or weak retrieval relevance under 45 (+8).

These combine into one **overall quality score**:

> Overall quality = 0.25 × retrieval relevance + 0.20 × citation accuracy + 0.25 × faithfulness + 0.15 × answer completeness + 0.05 × context utilization + 0.10 × (100 − hallucination risk)

A separate, related "published" version of this formula is used for the site wide maturity rollup rather than a single live answer: 0.25 × retrieval quality + 0.25 × faithfulness + 0.20 × citation accuracy + 0.15 × (100 − hallucination risk) + 0.10 × operational reliability + 0.05 × governance readiness, folding in signals from Deploy and Govern that a single question's evaluation does not have access to.

The **quality gate** reads: Passed requires overall quality of 80 or more, hallucination risk of 20 or less, and citation accuracy of 80 or more; Warning requires overall quality of 65 or more with hallucination risk of 35 or less; anything short of that is Failed. Human review is automatically required whenever hallucination risk exceeds 35, citation accuracy or faithfulness falls under 70, or the question or answer touches a small list of high risk topic keywords.

**Model selection.** Each of nine model archetypes (a frontier flagship, a fast/mini tier, a large self hosted open model, a small self hosted open model, a regional/sovereign hosted option, a multi model router, a reasoning specialized tier, a multimodal generalist, and a fine tuned small specialist) carries a fixed 0 to 100 score on eight criteria (capability, cost efficiency, latency, context headroom, data control, portability, customization, operational simplicity). A chosen scenario (Balanced, Max quality, High volume/cost, Regulated, On prem/sovereign, or Lean team) assigns a 0 to 5 weight to each criterion. The fit score for a model is the weighted average of its eight criterion scores using those weights (weighted sum divided by the sum of the weights), so the ranking moves visibly as you change what you say you care about.

### A.4 · Deploy: the operations model

**Baseline.** Every job type (Answer, Summarize, Extract, Classify, Decide, Monitor, Generate, Orchestrate) has its own fixed per query cost, base latency, and sustainable capacity (queries per second), reflecting that a "Decide" or "Orchestrate" job is inherently slower and pricier per call than a simple "Answer" job. The baseline hallucination rate prefers Build's real, measured hallucination reading when available, otherwise it is estimated from Frame's data readiness score (roughly 0.32 minus a fraction of readiness, clamped between 0.04 and 0.32), and is further scaled by whichever model archetype was chosen in Build, a stronger engine hallucinates less. The target cost per query a system is expected to beat = the job's base cost × 1.5, plus 2.5 × the hallucination rate × 0.7, meaning the honest budget target already accounts for the cost of a human catching a likely wrong answer, not just raw compute.

**Live operating math.** Choosing a small or large model tier applies a fixed multiplier set (large costs 2.6× as much, runs 1.8× slower, handles 0.55× the throughput, but cuts hallucination to 0.6× of small's rate). Caching reduces cost by up to 85% and latency by up to 50% of whatever share of traffic is cacheable; enabling a reranker adds a flat $0.004 and 180 milliseconds per query but cuts effective hallucination by a further 20%.

> costPerQuery = baseCost × tier cost multiplier × cache discount + reranker cost + (hallucination rate × $2.50 escalation cost)

> monthlyCost = costPerQuery × daily volume × 30

> utilization = (daily volume ÷ 86,400 × 3) ÷ capacity — i.e. peak load is assumed to run at three times the average rate, and utilization compares that peak to sustainable capacity.

Latency (p50) scales the same way cost does; p95 and p99 apply an additional penalty that grows sharply once utilization passes 100% (a queueing effect: past full utilization, tail latency worsens far faster than the median does). Error rate holds near 0.1% to 0.7% under normal load and rises steeply past full utilization; reliability is 1 minus the error rate, and the error budget is how much of the gap between actual reliability and the target SLO remains unused, as a percentage (it can go negative once the SLO is actually breached). The resulting **zone** is green when both the reliability target and the latency target are met, red when reliability falls meaningfully short, latency badly overshoots, or utilization exceeds capacity outright, and amber in between. The **operating envelope** grid simply recomputes this zone across eight preset volume levels and five preset cache percentages, so the safe region is visible at a glance. A built in search across every tier, cache, and reranker combination at the current volume finds and recommends the lowest cost configuration that still lands in the green zone.

**Drift and incidents.** The projected quality drift starts at 100 minus the hallucination rate and decays by (1 plus 4 times the hallucination rate) points every week, resetting whenever a refresh brings it back above an 80 point threshold, projected 16 weeks out. The incident simulator runs a fixed 22 tick timeline (detection at tick 3, mitigation starting at tick 8, recovery by tick 15) with peak latency and error rate multipliers that depend on the incident type, an outage spikes latency 6× and errors to 45%, a traffic spike 3.5× and 18%, a model regression 2× and 9%, and computes a mean time to recover and a "budget burn" percentage from how severe and how long the incident ran.

### A.5 · Govern: risk scoring and guardrails

**Use case risk score.** Five factors each contribute an independent, additive weight toward a single 0 to 1 risk score: data sensitivity (public 0, internal 0.08, confidential 0.18, regulated 0.28), deployment context (internal 0.05, customer facing 0.16, agentic 0.25), use case type (classifier 0.04, assistant 0.08, RAG 0.12, agentic 0.25), business function (Operations/IT 0.04, HR 0.10, Customer 0.12, Legal 0.16, Finance 0.20), and human oversight (always 0, required 0.05, optional 0.10, none 0.24). The sum, capped at 1.0, maps to a tier: 0.75 or above is Critical, 0.50 or above is High, 0.25 or above is Medium, otherwise Low. Launch readiness follows from the tier and whether oversight is strong: Low tier starts at 96%, Medium at 88%, High at either 74% (with strong oversight) or 48% (without), Critical at either 58% or 28%.

**Prompt level risk scoring.** A live prompt is checked against seven weighted pattern categories (prompt injection at 0.9 to 0.95, PII at 0.8, financial decisioning language at 0.7 to 0.75, destructive tool actions at 0.7); the single highest matching weight, plus a further 20% credit for any separately supplied base risk, becomes the prompt's score (capped at 1.0), which maps to the same Low/Medium/High/Critical bands.

**Guardrails and decision precedence.** Eight independent guardrail detectors scan every prompt and response: prompt injection, sensitive data (PII, with specific patterns for SSNs, card numbers, IBANs, routing numbers, medical record numbers, API keys, and more), unsupported or overconfident claims, regulated financial advice, high risk tool actions, toxicity, bias against a legally protected class, and missing citations on a retrieval grounded claim. Each independently returns whether it triggered, a severity (info through critical), a confidence score, and a recommended action. When more than one guardrail fires at once, the single most restrictive action wins, following a fixed ranking from least to most restrictive: Allow, Log only, Allow with disclaimer, Rewrite, Redact, Require confirmation, Escalate, Block. A request is automatically routed to human review whenever the final decision is Escalate, or Block at Critical severity.

**The governance scorecard.** Five independent dimensions, use case risk, data risk, build quality, operational risk, and audit readiness, are each leveled good, warning, or blocker by their own rule (for example, build quality is a blocker if any build quality gate has failed or hallucination risk is 25% or higher), each level worth a fixed score (good 90, warning 65, blocker 35), and the overall governance score is the plain average of the five. The final decision itself follows a fixed cascade, evaluated in order: Not assessed if no initiative has been framed yet; Not approved if hallucination risk is 25% or higher on a high criticality workflow; Hold pending remediation if any hard blocker exists (a blocked data source, a failed build gate, a breached SLO, a regression blocker, or a critical finding); Human review required for a High or Critical tier initiative with open findings or a review requirement; Approved with restrictions if any lesser finding, conditional data source, or review flag exists; otherwise Approved for pilot.

### A.6 · Realize: the business value model

Every input to the ROI model prefers a real, upstream measured value over a generic assumption whenever one is available, which is the heart of why Realize's number is described as risk adjusted rather than optimistic:

> Addressable value = annual addressable tasks × (minutes saved per task ÷ 60) × labor rate per hour

> Adoption loss = addressable value × (1 − adoption rate); Realized after adoption = addressable value × adoption rate

> Quality loss = realized after adoption × (1 − quality); Realized value = realized after adoption × quality

> Gross value = realized value − annual run cost

> Risk discount amount = max(0, gross value) × risk discount rate; Risk adjusted value = gross value − risk discount amount

The **risk discount rate** itself is built from the governance tier (Critical 40%, High 30%, Medium 20%, Low 10% as a starting point), plus 8 percentage points if data readiness is under 50, plus up to 5 points for high operational drift risk, plus 4 points for reliability under 99%, plus 4 points for build quality under 75%, plus up to 8 points (3 points each) for open governance findings, the whole total clamped between 5% and 70%.

From risk adjusted value: **ROI%** = risk adjusted value ÷ (investment + annual run cost) × 100. **Payback period** (months) = investment ÷ (risk adjusted value ÷ 12), or effectively infinite if risk adjusted value is zero or negative. **Three year NPV** = the sum, for years 1 through 3, of risk adjusted value divided by 1.1 raised to that year (a flat 10% discount rate), minus the upfront investment. The **value river** simply lays these five terms out as a waterfall: addressable value flows in, then adoption gap, quality gap, run cost, and risk discount each flow out in sequence, landing on risk adjusted value. A **sensitivity tornado** swings adoption, quality, minutes saved per task, labor rate, and investment each up and down 15% independently, recomputes risk adjusted value at each extreme, and ranks the five by how wide a swing they cause, exactly the same tornado technique used in C3-5's business case builder (Appendix B.8).

### A.7 · Operate: release readiness and day two

**Release readiness.** Thirteen named checks (initiative approved, data handoff exists, blocked data excluded, build quality gates passed, evaluation run recorded, citation accuracy, faithfulness, hallucination risk, governance tier assigned, human review decided, monitoring plan defined, rollback path defined, owner and runbook assigned) each score pass (1 point), warn (0.5 point), or fail (0 points); the release readiness score is the mean of those thirteen scores times 100. A score of 85 or above with no outright fail reads as Ready for pilot; 70 or above as Ready with restrictions; 55 or above as Hold before pilot; below that, Not production ready.

**Monitoring coverage.** Twelve named signals are tracked (p95 latency, cost per query, token usage, error rate, citation failure rate, faithfulness drop, hallucination risk, drift signal, incident triggers, retrieval miss rate, escalation rate, user feedback rate); nine are "monitored" by design in this build and three are deliberately left as open gaps representing instrumentation that has not been added yet, so coverage reads 75% (9 of 12) until those three are addressed.

**The twelve week day two history.** A pseudo random but fully reproducible sequence (seeded from the initiative's own name, so the same initiative always produces the exact same history) drives four layers of weekly readings: system reliability signals (availability, p95 latency, error rate) stay in a narrow, healthy band for all twelve weeks, deliberately, because that is the whole point of the lesson; model quality signals (a canary pass rate benchmarked against Build's real faithfulness score, plus a grounding percentage) begin a quiet decline starting week 5 that steepens sharply from week 7 onward; RAG freshness signals (index staleness in days, retrieval recall) accumulate normally then jump once the week 7 incident hits; and agent and cost signals (loop anomalies, tool error rate, cost per task) show cost creeping up roughly 2% a week regardless of the incident, with anomalies spiking only in the incident window.

**Automatic signal detection** fires on four independent rules: *silent drift* the first week canary pass rate falls 8 or more points below its own baseline while availability stays 99.5% or higher and the error rate stays under 1%, precisely the pattern where every infrastructure dashboard looks fine while real answer quality is quietly failing; *staleness breach* when the index falls more than 21 days behind the source of truth (a tighter 14 day threshold applies automatically for High or Critical governance tiers); *cost creep* the first week cost per task sits 15% or more above its week one level; *agent anomaly* when loop anomalies reach 3 or more, or the tool error rate exceeds 1.8%.

**Value at risk** = annual realized value (from Realize, or a stated default) × adoption percentage × quality degradation percentage, where degradation is simply how far the latest canary pass rate has fallen from its own baseline, as a percentage of that baseline. **Canary breach projection** takes the average week over week change in canary pass rate over roughly the last month of the series and, if that trend is negative, projects forward the number of weeks until the rate would cross a stated quality floor, an honest straight line extrapolation of the existing trend, not a prediction engine.

**The week seven incident and its remediation options.** Four options are offered, each with an authored cost, timeline, risk level, and which stage the fix loops back to: Reindex ($35,000, 2 weeks, low risk, loops to Build, fixes the immediate root cause), Retrain ($120,000, 6 weeks, medium risk, loops to Build, fixes both the drift and the underlying decay but takes far longer), Rollback and restrict ($10,000, 1 week, low risk, loops to Deploy, buys time but fixes nothing structurally), and Rescope ($0, 4 weeks, medium risk, loops all the way back to Frame, the honest admission that the original scope may have been wrong). Whichever is chosen writes a single feedback contract that is sent, simultaneously, to Realize (the dollar value at risk while the issue stays open), to Govern (a dated evidence note for the audit trail), and to whichever stage owns the fix.

### A.8 · How the stages read each other's numbers

The single mechanism that makes the Command Center a connected lifecycle rather than seven independent demos is a small set of shared "contract" objects, each produced by one stage and consumed by the next, with a documented fallback whenever the upstream stage has not been run:

- **Data Readiness Handoff** (Data → Build): approved, conditional, blocked, and rejected sources; sensitivity restrictions; chunking requirements; a remediation backlog.
- **Build Output Contract** (Build → Deploy, Govern): the selected model and retrieval mode, the quality score, which quality gates failed, cost and latency estimates.
- **Ops evidence** (Deploy → Govern, Realize): reliability, cost per query, drift risk, incident status.
- **Governance decision** (Govern → Realize): the tier, the decision, open findings, and the resulting risk discount.
- **Operate feedback contract** (Operate → Frame, Build, Deploy, Realize, Govern): the remediation decision and the value at risk while it stays open.

Each downstream formula in Appendix A.1 through A.7 above states, where relevant, which upstream figure it prefers when available, and what it falls back to when that upstream stage has not been run yet. That preference order, not any single formula on its own, is what makes the whole Command Center behave like one program rather than seven separate calculators.

## Appendix B · Portfolio Labs Backed by the Shared Calculation Engines

These eleven labs draw their core numbers from `@labs/engines`, a small library of pure, framework independent calculation functions that are unit tested on their own, completely separate from how any screen displays them. That separation is what the site's changelog means by "every number expands to its formula": the formula the chart is drawing and the formula the automated tests check are the exact same function.

### B.1 · GAP-01, MCP Server Contract Workbench

The crossover chart's own math is the simplest formula on the entire site, and deliberately so, since it is the plainest possible statement of the argument for a shared protocol:

> Bespoke integration cost = systems × consumers (every system needs its own connector to every consumer)

> Shared protocol cost = systems + consumers (every system exposes one MCP interface; every consumer speaks one MCP client)

As either count grows, systems × consumers grows far faster than systems + consumers, and the gap between the two lines is the crossover the lab is built to show. The manifest diff panel is powered by a small, separate comparison function that takes two lists of tool, resource, and prompt names and reports exactly which were added, removed, or kept between two systems, flagging "changed" whenever any list differs. The custom tool builder validates a tool definition against MCP's actual shape rules (a lower_snake_case unique name, at least one named and typed argument, enum arguments carrying real values) before allowing it into a manifest. The protocol session panel renders the five real JSON-RPC style frames an MCP session opens with (initialize request, the negotiated capabilities response, the initialized notification, a tools/list request, and its response), so a newly added custom tool visibly appears in that list with no other change required, exactly the point of coding to a shared contract.

### B.2 · GAP-03, Multiagent Orchestration Economics Board

The **timeline** splits a run's authored total latency into a Decompose span, one span per delegated agent, and an Assemble span: the supervisor's two "bookend" spans together consume a fixed share (20% by default) of the total, split evenly between Decompose and Assemble, and the remaining time is divided evenly across however many agents were delegated to, guaranteeing the visual timeline always sums exactly to the authored total. The **A2A message inspector** expands each coordination step into a structured request or response frame (assign, handoff, review request, or return), carrying the recipient's actual assigned task on a request and the sender's actual output on a response or handoff, so the message contract on screen is a real, structured shape rather than a decorative arrow.

The **head to head scorecard**, the board's centerpiece, computes:

> Percent change for any metric = (multiagent value − single agent value) ÷ single agent value × 100

applied to quality (where higher is better), cost per run, and latency (where lower is better for both), plus two multiples:

> Cost multiple = multiagent cost ÷ single agent cost; Latency multiple = multiagent latency ÷ single agent latency

which combine into the one line verdict format: "+X% quality for Y× cost and Z× latency."

### B.3 · GAP-06, Token Economics Simulator

The per call cost formula prices input and output tokens separately, and applies prompt caching only to the portion of input that is genuinely reusable static context:

> Effective input price per million tokens = list price × [ 1 − cacheable share × (1 − cached price ÷ list price) ] (only applied if caching is enabled)

> Call cost = (input tokens ÷ 1,000,000) × effective input price + (output tokens ÷ 1,000,000) × output price, then reduced further by (batch eligible share × batch discount, default 50%) if async batch processing is enabled

Monthly cost is simply call cost × calls per day × 30. The **savings ladder** recomputes monthly cost three times, once at full list price, once with caching alone applied, once with both caching and batching applied, and reports each step's percentage saved relative to the list price step, exactly the "list price → plus cache → plus batch" waterfall the lab displays. A separate comparison ranks every model in a rate table by this same per call cost formula, cheapest first.

### B.4 · GAP-07, Protocol Selection Decision Model

Six 0 to 2 answers about the integration scenario feed four weighted scores, one per candidate protocol:

> MCP score = 1.6×(tool breadth answer) + 1.1×(consumer count answer) + 1.0×(governance answer) + 1.1×(discoverability answer)

> A2A score = 2.4×(agent coordination answer) + 0.8×(consumer count answer)

> Function calling score = 1.7×(2 − tool breadth answer) + 1.6×(2 − agent coordination answer) + 1.5 bonus if the consumer count answer is the lowest option + 1.0 bonus if the last answer is the lowest option

> Hybrid score = 1.15 × the lower of the MCP and A2A scores + 0.7×(governance answer)

The highest scoring protocol is the primary recommendation, the second highest is the runner up. **Sensitivity** checks, for every one of the six questions, whether changing just that single answer (holding all five others fixed) would change which protocol wins, reporting the first alternative answer that flips it, an empty result means the call is robust to any single input changing. The **integration economics** panel applies the identical bespoke cost versus shared protocol cost logic documented in B.1 above, generalized with configurable per link and per endpoint costs, and solves algebraically for the crossover consumer count at a given producer count. The **affinity radar** measures each protocol's actual sensitivity to each decision dimension by moving that one dimension from its lowest to highest setting (holding the others neutral) and reading how much each protocol's score moves, so the radar shape is measured from the real scoring function rather than hand drawn, and a dimension that favors a protocol at its low end (like function calling favoring "few tools") is shown correctly as a negative, inward facing response. The **"why not" contrast** finds, for each rival protocol, the single decision dimension where the recommended protocol's real, weighted contribution most exceeds that rival's, which is what lets the lab say something like "your tool breadth answer is what points to MCP over function calling." **Confidence** in the final recommendation card is read directly from the margin between the primary and runner up scores as a fraction of the leading score: 25% or more of a gap reads as "clear," 10% to 25% reads as "close," under 10% reads as "toss up."

### B.5 · GAP-08, Human Review and Autonomy Control Simulator

Twenty modeled work items are seeded with a fixed risk tier (high, medium, or low) and four of them are deliberately placed as "edge cases" that would cause real harm if auto approved without review. Five autonomy levels define which items get reviewed: level 1 reviews everything, level 2 reviews everything except low risk items, level 3 reviews only high risk items, level 4 reviews a fixed 20% sample regardless of risk, and level 5 reviews nothing. For any level:

> Throughput = 100 × (1 + (level − 1) × 0.6) — a fixed, illustrative curve showing throughput rising with each step up in autonomy

> Exposure ($k) = the sum of each slipped edge case's severity (high risk edge cases carry a modeled $50k severity, medium $20k, low $5k)

> Edge coverage % = (edge cases caught ÷ total edge cases) × 100

The lab's headline recommendation, the "highest autonomy level that still catches every edge case," is found simply by checking every level from 1 to 5 and keeping the highest one at which zero edge cases slip through unreviewed.

### B.6 · C3-1, AI Portfolio Capital Allocation Dashboard

Every initiative carries an expected annual value, a spend, and a lifecycle stage (discovery, pilot, scaling, or production), each stage assigned a fixed probability of eventual success (15%, 30%, 60%, 85% respectively, an industry informed default). The central formula:

> Risk adjusted value ($M per year) = expected value × stage success probability − spend

A negative risk adjusted value recommends Kill; a strongly positive one on a mature initiative (scaling or production) with controlled risk recommends Scale; everything else reads Hold. The **budget constrained funding tool** ranks every positive value initiative by value per dollar of spend (highest first) and greedily takes initiatives in that order until the stated budget is used up, an honest, transparent allocation rule rather than a claim of mathematically perfect optimization. **Redeploying the kills** first removes every negative value initiative (a pure, guaranteed improvement equal to the drag it was creating), then offers the freed capital to positive value "scale" targets in the same value per dollar order, capped at a multiple of each target's current spend, crediting each dollar redeployed at that target's own current return per dollar (an illustrative extension of a real, current ratio, not an invented growth curve). The **efficient frontier** chart ranks every initiative by value per dollar and accumulates value against cumulative spend; the "knee" where the chart's slope visibly flattens is simply the point past which an item's own efficiency first drops below the whole book's average efficiency, marking the line between the efficient core of the portfolio and its diminishing returns tail.

### B.7 · C3-3, Inference Run Rate Forecaster

Monthly call volume compounds at a stated growth rate from a starting volume. Per call API cost blends a cheap tier price and a frontier tier price by whatever share of traffic needs the frontier tier:

> Blended price per million tokens = cheap tier price + (frontier share ÷ 100) × (frontier price − cheap price)

> API cost in a given month = monthly volume × tokens per call × blended price ÷ 1,000,000

Self hosting cost is a step function: the number of GPU clusters needed = the smallest whole number of clusters whose combined, utilization adjusted token capacity covers that month's total token volume, and monthly self host cost = clusters × cost per cluster + operations staff × cost per FTE. The **crossover month** is simply the first month at which the projected API cost line crosses above the projected self host cost line; a **sensitivity check** reruns the full 24 month projection after bumping one assumption at a time (growth rate, frontier share, utilization, and so on) and reports how many months earlier or later the crossover lands, naming which single assumption most moves the case for or against self hosting.

### B.8 · C3-5, AI Business Case and ROI Builder

Adoption ramps up linearly over a stated number of months, and a given year's cash flow is:

> Cash flow (year 1 and beyond) = annual value × average adoption that year − annual run cost; Cash flow (year 0) = −upfront investment

> NPV = Σ over every year of cash flow ÷ (1 + discount rate) ^ year

**IRR** has no clean algebraic formula, so it is solved the honest numerical way: repeatedly narrowing a bracketed range (a technique called bisection) 90 times until the discount rate that makes NPV exactly zero is pinned down to a very fine precision. **Payback period** is the year cumulative cash flow first reaches zero or above, refined to a fractional year by interpolating exactly where the crossing happens within that year. The **tornado chart** swings five drivers, annual value, adoption ramp speed, run cost, upfront investment, and the discount rate, each up and down by 30%, recomputes NPV at both extremes, and sorts the five by the width of the resulting swing (highest to lowest), naming in one glance which single assumption the business case depends on most.

### B.9 · EL-01, Adoption Readiness Decision Instrument

Six adoption factors are each scored 0 to 100 and assigned an editable weight; the **composite readiness score** is:

> Composite = ( Σ weight × factor score, across all six factors ) ÷ ( Σ weights )

rounded to a whole number, which keeps the composite meaningfully on a 0 to 100 scale no matter how the weights are set, a deliberate design choice so that a user editing the weights always gets an honest reading rather than a number that silently drifts out of range. The **gate** compares the composite against two editable cutoffs: at or above the Scale cutoff reads Scale, at or above a lower Conditional cutoff reads Scale with conditions, otherwise Hold. The **"flip the gate" plan**, the instrument's signature feature, works from a simple identity: since the composite is a weight normalized average, raising one factor by a point moves the composite by (that factor's weight ÷ the sum of all weights) points. The plan spends the fewest total points by raising the highest weighted factors with remaining headroom first, until the projected composite clears the target, which is provably the cheapest path to a passing score under this scoring rule. A companion **sensitivity view** ranks every factor by how many composite points it could add if pushed all the way to 100 (its weight share × its remaining headroom), and a **two population comparison** attributes the gap between any two readiness scores (for example, your program versus a benchmark) to whichever single factor's weight share times difference contributes the most to that gap.

### B.10 · EL-04, Delivery Health and RAID Radar

Every workstream carries both a self reported status (green, amber, red) and an independently modeled actual status, plus a trend (up, flat, down). Each status maps to a fixed health score (green 100, amber 60, red 25), and:

> Portfolio health index = the average of every workstream's actual status score, rounded to a whole number

A workstream is flagged as **"reads green but is actually sinking"** whenever it reports green while its actual status is not green, or reports green while its own trend is heading down, precisely the two situations a simple status snapshot would otherwise hide from a steering committee.

### B.11 · EL-08, Estimation and Scope Control Studio

Three point (PERT) estimation combines an optimistic, most likely, and pessimistic estimate for the same task:

> Mean = (optimistic + 4 × most likely + pessimistic) ÷ 6; Standard deviation = (pessimistic − optimistic) ÷ 6

From the mean and standard deviation, a confidence level is simply mean plus a fixed multiple (a "Z score") of the standard deviation: P50 uses a multiple of 0, meaning the mean itself is a coin flip estimate; P80 uses about 0.84 standard deviations above the mean; P90 uses about 1.28; P95 about 1.645, each progressively more likely to hold because more contingency has been built in. **Margin percentage** on a piece of billed work = (billed effort × bill rate − cost effort × cost rate) ÷ (billed effort × bill rate) × 100, the standard, plain definition of gross margin, made visible here specifically so a scope change's effect on margin is not left to intuition.

## Appendix C · Portfolio Labs With Their Own Inline Formula

These seven labs compute a real formula directly inside their own component rather than through a shared engine package, because the math is specific to that one decision. Every figure below is transcribed directly from the lab's own source, including the exact constants it uses.

### C.1 · GAP-05, Context and Memory Strategy Evaluator

A fixed working context window of 24 thousand tokens sets the stage; each of the four strategies has its own formula for how context size, answer fidelity, and overflow risk move as the conversation grows to t turns:

- **Full dump:** context = 4 + 3t (thousand tokens). Fidelity holds at 100% until context exceeds the window, then falls to (window ÷ context) × 100. Overflow risk rises from the point context passes 70% of the window, reaching 100% by the time it is 30% over.
- **Summarize:** context = 6 + 3 × min(t, 2) (it plateaus after two turns, since only a rolling summary plus the last two turns are kept). Fidelity = max(60%, 82% − t). Risk = min(60%, 4t).
- **Compress:** context = 7 + 2 × log2(t + 1) (grows slowly, a logarithmic curve, reflecting semantic compression). Fidelity = max(70%, 90% − 0.7t). Risk = min(40%, 2t).
- **Subagent handoff:** context is fixed at 7 (thousand tokens) regardless of turn count, since only the current subtask's brief is carried. Fidelity = max(58%, 76% − t). Risk = min(75%, 5t), a coordination risk rather than an overflow risk.

Cost for every strategy is simply context size times $3 per thousand calls (reflecting roughly $3 per million input tokens), so the chart's cost bars and its context bars always move together.

### C.2 · C3-2, Build, Buy, or Fine Tune Decision Evaluator

Three year total cost of ownership is built line by line for each path, using a blended $0.004 per call API rate and a self hosting cost that steps up in cluster sized jumps (one cluster covers 2 million calls per month, at $6,000 per cluster per month):

- API TCO = $20,000 integration + (monthly volume × 36 months × $0.004 per call)
- Fine tune / self host TCO = $60,000 training + $40,000 eval harness build + (hosting cost per month × 36) + $45,000 ongoing eval maintenance
- Buy (license) TCO = $360,000 license + $50,000 integration + $30,000 lock in risk premium

Each path also carries a qualitative control, speed, differentiation, and risk score, adjusted by the sliders for data sensitivity, differentiation need, latency requirement, and team skill. The composite recommendation score is a weighted blend: 35% weight on a cost score (100 times the cheapest path's TCO divided by this path's TCO), 15% each on speed and control, 20% on differentiation (scaled up further the more the differentiation need slider is raised), and 15% on risk, with the whole total then discounted by a feasibility factor that specifically penalizes the fine tune path when team skill is low (feasibility = 0.7 plus 0.15 times the skill slider; the other two paths carry no such discount). The highest composite is the recommended path; the flip condition names what would need to change for the second highest path to take the lead.

### C.3 · C3-4, Vendor Selection and Concentration Risk Monitor

Three vendor archetypes are scored on six weighted criteria (capability, security, roadmap, low lock in, support, price/value), with either a preset weighting (Balanced, Cost sensitive, Security first) or a fully custom set of weights. A vendor's score is the weighted average of its six criterion scores (the sum of weight times score for every criterion, divided by the sum of the weights), and vendors are ranked by this score alone. Concentration exposure (the share of total AI spend that vendor would represent if chosen), renewal timeline, and estimated exit cost are separate, authored per vendor attributes displayed alongside the ranking, deliberately not folded into the score itself, since the whole point of the lab is that the top scoring vendor and the highest risk vendor can be the same vendor.

### C.4 · EL-03, Capacity and Skills Coverage Planner

Six skill pools each carry a demand and a capacity figure (in FTE equivalents). Gap = the amount by which demand exceeds capacity (zero if there is no gap). Three resourcing actions can close a gap, each with a fixed lead time and monthly cost per FTE: Hire (6 weeks, $18,000/FTE/month), Contract (1 week, $28,000/FTE/month), Upskill (4 weeks, $8,000/FTE/month, drawing on existing slack elsewhere). Choosing an action for a gap raises effective capacity to demand level; utilization for any pool = demand divided by effective capacity. If a gap is left unresourced, its own schedule slip is estimated as (demand divided by capacity, minus 1, times the base delivery timeline of 20 weeks); if an action is chosen, the slip is simply that action's fixed lead time. Overall delivery slip = the largest single slip across every skill pool, since the plan can only move as fast as its slowest resolved bottleneck, and total delivery weeks = the base timeline plus that slip. Monthly cost = a fixed base team cost (30 FTE at $16,000 loaded monthly cost each, $480,000 total) plus the sum of gap size times the chosen action's rate across every resourced gap.

### C.5 · EL-06, Talent and Upskilling Pathway Planner

Six capabilities each carry a current and a target coverage percentage; gap is the amount target exceeds current. Three pathways carry a fixed, authored time to ready: Build (8 months), Hire (4 months), Partner (2 months), with no pathway chosen counting as unresolved. Readiness now = the average of every capability's current coverage; readiness after the plan = the average of every capability's coverage assuming every chosen pathway succeeds (target if resolved, current if still open). Overall time to team readiness = the longest single pathway duration among every capability that has a pathway chosen, and stays unset ("close every gap to compute") until every gap has one, since the team is only as ready as its slowest capability to close. This is compared directly on a timeline against the stated pace the AI stack itself is assumed to move (18 months by default), the visual argument that people plans need to start before the platform plan becomes urgent.

### C.6 · EL-07, RFP and Bid Decision War Room

An RFP is decomposed into individually rated compliance requirements (met earns full credit, partial earns half credit, gap earns none); requirement coverage % is the average credit across every requirement, times 100. A separate red team score checks the draft response against the RFP's own stated evaluation weights (for example, technical approach worth 30%, relevant experience 25%, team and delivery model 20%, price 15%, governance 10%): it is the sum, across every criterion in the RFP's own rubric, of that criterion's weight times the response's score on it. The bid or no bid pursuit score multiplies three independent factors together, each on a 0 to 1 scale: strategic fit times win probability times delivery capacity, times 100. The final recommendation is Bid only when both the margin clears its floor (typically 25%) and the pursuit score reaches at least 35; otherwise the honest recommendation is No bid, with the memo naming exactly which of the two conditions failed.

### C.7 · EL-09, Onboarding and Knowledge Transfer Tracker

A fixed 35 day ramp applies once system access actually lands, and every day of access beyond a 7 day norm is a direct, one for one delay to productivity: time to productive = 35 plus whatever the access delay exceeds 7 days by. Carrying cost = time to productive times the daily rate (onshore $1,100/day, offshore $700/day). A resource is flagged blocked whenever its access delay exceeds 14 days. The pre provisioning lever caps every resource's modeled access delay at 5 days, and the tracker reports the difference in total carrying cost between the current setting and that pre provisioned scenario as the concrete savings on offer. On the knowledge transfer side, each knowledge area carries a small bus factor (how many people currently hold that knowledge, typically 1 to 3); an area is flagged a single point of failure if, even after crediting any knowledge transfer session scheduled for it (which adds one to the bus factor), the resulting count would still be under 2, meaning fewer than two people would understand it well enough to keep it running.

---

*This document was generated directly from the portfolio's and Command Center's own source content: the registry, the shared calculation engines, the stage engines, and every lab's own case study, KPI, and outcome text, so it stays accurate to what is actually built. Every formula in the appendix was read from the code that computes it, not reconstructed from memory or inferred from the interface alone.*

