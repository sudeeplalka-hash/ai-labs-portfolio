# The AI Labs Portfolio, Explained

A plain English guide to every lab in the portfolio: what it does, how it works, what it measures, and why the decision behind it matters. Written so each lab can be understood on its own, without needing to open the site or read any code.

## What this portfolio is

The portfolio is organized around a simple idea: every technical pattern in enterprise AI (an integration protocol, a multiagent workflow, a context strategy) eventually turns into a decision a senior leader has to make, usually one with a dollar amount, a risk, or a timeline attached. Each lab takes one of those technical patterns and turns it into an interactive artifact where you can change the inputs and watch the decision move.

There are 23 labs, organized into three collections, plus a fourth "spine" that ties the whole AI delivery lifecycle together:

- **Collection 1, Enterprise AI Lifecycle.** A working spine that walks one initiative through Frame, Data, Build, Deploy, Govern, and Realize, gate by gate. Covered briefly near the end of this guide.
- **Collection 2, Agent Architecture and Protocol Strategy (GAP-01 through GAP-08).** Eight labs about the technical choices behind agentic systems, MCP, multiagent orchestration, protocols, memory, cost, and human oversight, each reframed as an architecture or investment decision.
- **Collection 3, AI Investment Strategy and Portfolio Governance (C3-1 through C3-5).** Five labs about the financial and governance side of AI: what to fund, what to kill, build vs buy, vendor risk, and the business case itself.
- **Collection 4, Operating Model and Transformation Leadership (EL-01 through EL-10).** Ten labs about the people and delivery side of running AI programs: adoption, stakeholders, capacity, compliance, talent, bids, estimation, onboarding, and executive communication.

Every lab in Collections 2 through 4 is SIMULATED, meaning it runs on deterministic, authored logic and modeled data rather than a live production system or a live model API. That is a deliberate choice: it means every number on screen is explainable and every lab works identically every time, and each lab says so explicitly in its own "Limitations" note. A few labs are marked LIVE ready and will flip to a fully live mode once a host model endpoint is configured.

## How to read each lab's entry

Every lab below follows the same structure:

- **The question:** the plain language problem the lab opens with.
- **What you do:** the actual interaction: what you click, drag, or change, and what happens.
- **The decision it maps to:** the real enterprise or engagement decision this is standing in for.
- **Key KPIs:** the specific numbers and metrics the lab surfaces, i.e. what you'd actually track if you ran this for real.
- **The tradeoff:** the tension the lab won't let you avoid.
- **The takeaway:** the one line verdict a steering committee would actually walk away with.
- **Limitations:** what this lab deliberately simplifies, stated honestly.

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
| C3-2 | Build, Buy, or Fine Tune Decision Evaluator | 3-year TCO across all three paths, with the flip condition |
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

# Collection 2 · Agent Architecture and Protocol Strategy

These eight labs take the plumbing of agentic AI (protocols, orchestration, memory, cost, oversight) and turn each into an architecture or investment decision.

## GAP-01 · MCP Server Contract Workbench

**The question:** What actually goes over the wire when an agent calls a tool, and at what point does a shared protocol beat writing custom integration code for every system?

**What you do:** Pick a mock enterprise system (a disputes API, an HR knowledge base) and watch its MCP "manifest" generate: the tools, resources, and prompts it exposes. Compose a real tool call, fill in its arguments, and send it. You see the full request and response, including what happens when you deliberately send malformed arguments. A separate panel lets you slide the number of systems and the number of agent consumers to see the crossover between bespoke integrations (which scale as systems × consumers) and a shared protocol (which scales as systems + consumers).

**The decision it maps to:** Whether to standardize AI tool access through MCP or keep building bespoke, point to point integrations, and how that answer changes as the number of systems and agent consumers grows.

**Key KPIs:**
- The crossover point in the systems × consumers chart, i.e. the consumer count where a shared protocol becomes cheaper than bespoke glue
- Connector count reduced
- Tool onboarding time
- Protocol adoption share
- Integration change failure rate

**The tradeoff:** A protocol layer is overhead when the integration surface is tiny (a handful of tools, one consumer). The lab shows exactly where the surface gets large enough that standardizing actually pays off.

**The takeaway:** The MCP decision isn't ideological. Count the systems, count the consumers, and find the crossover where standardization becomes cheaper than custom glue.

**Limitations:** This is a deterministic portfolio artifact, not a production MCP server. A real implementation would need authentication, authorization, capability negotiation, streaming, pagination, observability, and enterprise security controls.

## GAP-02 · Agent Failure and Recovery Inspector

**The question:** How do autonomous agents actually fail, and what catches it before it becomes an incident?

**What you do:** Step through three agent architectures (single agent, orchestrator worker, and evaluator optimizer). For each one, the lab shows specific failure modes, whether a detection signal exists for that failure, what recovery policy applies, and what latency or operational cost that safety net adds.

**The decision it maps to:** How much to budget for the observability and recovery harness that surrounds an agent, sized to the failure modes that actually occur rather than a generic "add monitoring" line item.

**Key KPIs:**
- Failure classes caught vs. escaped
- Harness coverage of the full failure taxonomy
- Failure detection time
- Recovery success rate
- Escalation rate
- Repeat failure rate
- Incident cost

**The tradeoff:** A richer observability harness costs money and adds latency; an uninstrumented failure reaches a real system of record.

**The takeaway:** Don't budget for agents alone. Budget for agents plus the operating harness that detects failures, recovers safely, and knows when to involve a human.

**Limitations:** Models representative failure paths rather than live traces. A production environment would need real tool telemetry, policy enforcement, alert routing, and incident management integration.

## GAP-03 · Multiagent Orchestration Economics Board

**The question:** Is a multiagent workflow actually worth its added cost and coordination, or is it an impressive demo that doesn't pay for itself?

**What you do:** Watch a supervisor decompose a goal and delegate to role specialized agents that coordinate over A2A-style messages with explicit lifecycle states (assigned → working → completed). The board tracks a head to head scorecard: the quality delta versus a single agent baseline, alongside the cost and latency multiples that extra quality costs.

**The decision it maps to:** When a multiagent architecture's quality gain is large enough to justify its cost and latency multiplier, on a task class by task class basis rather than as a blanket rule.

**Key KPIs:**
- Quality lift vs. single agent baseline
- Cost multiple
- Latency multiple
- Rework reduction
- User acceptance

**The tradeoff:** More agents raise quality, cost, and latency together. The single agent baseline finishes first, at lower quality. The lab makes that tension literal instead of leaving it implied.

**The takeaway:** The decision isn't whether the workflow looks sophisticated. It's whether the quality gained per dollar and per second is high enough for the task.

**Limitations:** Uses deterministic scoring and authored scenarios, not live model calls. Production orchestration would need real model calls, trace storage, routing policies, evaluation data, and failure handling.

## GAP-04 · Structured Output Reliability Gate

**The question:** How do messy, unpredictable model outputs become schema valid data that a real system can safely act on?

**What you do:** Run representative tasks through a validation workflow and watch where raw model output fails a schema check, how a corrective retry repairs it, and what that retry costs in latency.

**The decision it maps to:** Where to place the validation gate before a model's output is allowed to write to a system of record, and how strict to make it.

**Key KPIs:**
- Schema valid rate at the gate
- Repair (retry) success rate
- Escapes downstream (bad data that gets through anyway)
- Retry rate
- Latency added
- Escalation rate

**The tradeoff:** A strict gate adds retries and latency. A loose gate lets bad data reach systems of record.

**The takeaway:** If model output updates a system of record, validation isn't optional. It's a reliability control.

**Limitations:** Demonstrates validation behavior with authored tasks. Production use would need real schema contracts, logging, retry policies, exception handling, and system integration.

## GAP-05 · Context and Memory Strategy Evaluator

**The question:** As a conversation or task gets longer, which context strategy, keep everything, summarize, compress, or hand off to a fresh subagent, actually holds up?

**What you do:** Compare four context strategies (full dump, summarize, compress, subagent handoff) side by side, on the same growing task, and watch how token load, overflow risk, and answer fidelity change as the conversation lengthens.

**The decision it maps to:** Setting the cost/fidelity dial per use case rather than defaulting to whatever a platform ships with.

**Key KPIs:**
- Token cost per task, by strategy
- Overflow events
- Answer quality/fidelity
- Context recall
- User rework

**The tradeoff:** Higher fidelity costs more tokens. Aggressive compression eventually starts hurting the answer, and the lab shows where.

**The takeaway:** Context strategy is a cost and fidelity decision. Set it based on the workflow, not enthusiasm for bigger context windows.

**Limitations:** A modeled comparison, not real conversation traces. Production use would need actual conversation data, task level evaluation, memory policies, privacy controls, and retention rules.

## GAP-06 · Token Economics Simulator

**The question:** What will this agent workflow actually cost per month at real volume, before anyone commits to an architecture?

**What you do:** Convert a call structure into an estimated annual cost by adjusting model choice, prompt size, volume, caching, and batching, and see the effect of each lever on the total.

**The decision it maps to:** Build vs. buy, decided on unit economics before architecture gets drawn, not after.

**Key KPIs:**
- Cost per call
- Monthly and annual run rate
- Cache hit rate
- Batching savings
- Cost per successful outcome
- Monthly delta of switching models

**The tradeoff:** The cheapest model isn't always adequate for the task; caching adds engineering work for a real but not guaranteed saving.

**The takeaway:** Size the call before arguing the architecture. Unit economics often settles the design debate earlier than a diagram does.

**Limitations:** Uses modeled pricing and assumptions. Production forecasting would need current vendor pricing, actual traffic patterns, utilization data, and finance approved costing rules.

## GAP-07 · Protocol Selection Decision Model

**The question:** Function calling, MCP, A2A, or a hybrid, which protocol actually fits this integration pattern?

**What you do:** Answer a short set of questions about an integration scenario (how many producers, how many consumers, how much coordination is needed) and get a scored recommendation, the runner up option, and the single input that would flip the recommendation if it changed.

**The decision it maps to:** Letting the number of producers and consumers, not trend or preference, pick the protocol.

**Key KPIs:**
- Fit score per protocol option
- The "flip condition" (which single input change would change the recommendation)
- Integration reuse
- Onboarding time
- Tool adoption
- Change effort
- Support complexity

**The tradeoff:** Broadening scope raises value but lowers feasibility; function calling and MCP sit as near opposites on tool breadth, and this lab shows where you land on that curve.

**The takeaway:** The protocol isn't the first question. Count the systems, consumers, coordination needs, and governance constraints. The protocol follows from that shape.

**Limitations:** A decision model, not a full architecture review. Production selection needs security review, platform standards, vendor constraints, latency requirements, and implementation testing.

## GAP-08 · Human Review and Autonomy Control Simulator

**The question:** How much autonomy can an agent be given before an edge case slips through unreviewed?

**What you do:** Process a modeled queue of decisions (credit approvals, content moderation, clinical orders, depending on the scenario) at different autonomy levels, and watch throughput rise while edge case exposure changes.

**The decision it maps to:** Setting the autonomy level per risk tier, not per enthusiasm for automation.

**Key KPIs:**
- Edge case coverage vs. throughput
- The recommended autonomy level (the highest one with zero missed edge cases)
- Review load
- Escalation rate
- Control exceptions

**The tradeoff:** More autonomy means more throughput, and eventually, an unreviewed high severity error.

**The takeaway:** The question isn't how much autonomy is possible. It's how much autonomy is appropriate for the risk tier.

**Limitations:** A simplified queue simulation. Production workflows would need live performance data, risk policy, audit logging, escalation paths, and ongoing exception review.

---

# Collection 3 · AI Investment Strategy and Portfolio Governance

These five labs are the financial and governance side of AI: what gets funded, what gets killed, and what it actually costs.

## C3-1 · AI Portfolio Capital Allocation Dashboard

**The question:** Across a whole portfolio of AI initiatives, which ones should be killed, scaled, or put on hold this quarter?

**What you do:** Treat a portfolio of AI initiatives like investment options, each with its own value, risk, stage probability, and spend. Move a budget slider and watch an efficient frontier chart show cumulative value against cumulative spend, then reallocate funding from weak initiatives toward stronger scale candidates.

**The decision it maps to:** Portfolio kill / scale / hold calls, made through risk adjusted ROI thresholds rather than gut feel or whoever presents best.

**Key KPIs:**
- Risk adjusted ROI per initiative (expected value × stage probability − run cost)
- Risk adjusted value
- Value per dollar
- Kill decision cycle time
- Realized vs. modeled ROI
- Funding efficiency

**The tradeoff:** Funding the single highest value initiative can starve three efficient ones. The "greedy funder" pattern and the frontier's knee point show exactly where diminishing returns begin.

**The takeaway:** A portfolio where nothing is stopped isn't governed. It's unattended.

**Limitations:** Financials are illustrative and use modeled assumptions. Real portfolio governance would need finance approved forecasts, initiative level probability estimates, delivery capacity data, and benefits tracking.

## C3-2 · Build, Buy, or Fine Tune Decision Evaluator

**The question:** For a given AI capability, should the organization build it, buy it, or fine tune an existing model?

**What you do:** Estimate a 3-year total cost of ownership and score build, buy, and fine tune paths against cost and strategic criteria (control, customization, time to value). The evaluator surfaces the leading path, the runner up, and the exact condition that would flip the recommendation.

**The decision it maps to:** A defensible build/buy/fine tune call, tied to a "flip condition" that tells you when to revisit it, not a one time answer.

**Key KPIs:**
- 3-year TCO per path
- Time to value
- Control score
- Skill readiness
- Requirement fit
- The break even volume or customization level that flips the recommendation

**The tradeoff:** Build and fine tune buy you control at the cost of speed; buying trades customization for time to value.

**The takeaway:** The recommendation matters, but the flip condition matters more. Revisit this decision when usage, requirements, or strategic control needs change.

**Limitations:** A modeled decision tool. A real sourcing decision needs procurement data, security review, vendor contracts, implementation estimates, legal input, and architecture validation.

## C3-3 · Inference Run Rate Forecaster

**The question:** At what point does running your own model infrastructure actually beat paying for API calls?

**What you do:** Project API and self hosted costs across 24 months and watch the crossover point move as you adjust growth, token volume, the share of traffic that needs a frontier tier model, utilization, and staffing assumptions.

**The decision it maps to:** The API vs. self host crossover, which is driven by utilization assumptions far more than by list price.

**Key KPIs:**
- Monthly run rate
- Cumulative 24-month cost, both paths
- Utilization
- Cost per task
- Crossover month

**The tradeoff:** API pricing is flexible, pay per use; self hosting is fixed capacity that only pays off once you're past the crossover point.

**The takeaway:** The crossover isn't decided by vendor claims. It's decided by utilization, growth, and the share of workloads that truly need higher cost models.

**Limitations:** Uses simplified cost assumptions. Production forecasting would need current pricing, real workload profiles, infrastructure benchmarks, reliability requirements, and finance approved cost allocation.

## C3-4 · Vendor Selection and Concentration Risk Monitor

**The question:** Beyond who scores best on paper, what does it cost you if the winning vendor relationship goes wrong?

**What you do:** Compare vendor archetypes across capability, security, roadmap, lock in, support, and price, then switch to a risk view that shows concentration exposure, renewal timing, and estimated exit cost if you needed to switch.

**The decision it maps to:** A weighted vendor pick that also names its concentration and exit cost exposure up front, instead of treating vendor choice as a pure feature comparison.

**Key KPIs:**
- Weighted vendor score
- Concentration exposure
- Exit cost
- Renewal timing
- Switching feasibility

**The tradeoff:** The best fit vendor on paper can also be the biggest concentration risk in practice.

**The takeaway:** The scorecard tells you who wins. The risk view tells you what it costs if the winner turns out to be wrong.

**Limitations:** A simplified vendor model. Real vendor selection needs procurement terms, security review, architecture fit, legal review, financial analysis, and operational due diligence.

## C3-5 · AI Business Case and ROI Builder

**The question:** What's the actual payback on this AI investment, and how fragile is that number?

**What you do:** Turn investment, value, adoption ramp, and discount rate into NPV, IRR, and payback period, then look at a tornado chart that ranks which single assumption swings the business case the most.

**The decision it maps to:** Fund, fund with conditions, or defer, based on a range and its sensitivity, not a single confident looking number.

**Key KPIs:**
- NPV (net present value)
- IRR (internal rate of return)
- Payback period
- The widest tornado chart driver (the assumption the case hinges on)
- Adoption progress
- Realized value vs. modeled value

**The tradeoff:** Optimistic value assumptions vs. conservative adoption and run cost assumptions, both defensible, both producing very different NPVs.

**The takeaway:** Present the range, not only the point. Points get challenged. Ranges with clear assumptions get governed.

**Limitations:** A portfolio business case artifact. Real funding decisions need finance validation, benefits ownership, implementation estimates, risk adjustments, and post launch value tracking.

---

# Collection 4 · Operating Model and Transformation Leadership

These ten labs are about running the AI program itself: the people, the stakeholders, the bids, and the communication that make or break delivery. Several are explicitly modeled on real engagement leadership experience (noted where relevant).

## EL-01 · Adoption Readiness Decision Instrument

**The question:** Is the organization actually ready to scale this AI rollout, or is it only the model that's ready?

**What you do:** Score six adoption factors (things like trust, workflow fit, sponsorship, training, incentives), weight them, and compare the composite score against scale thresholds. The instrument then generates the smallest set of moves that would clear the gate.

**The decision it maps to:** Scale, scale with conditions, or hold, decided on adoption evidence rather than technical confidence alone.

**Key KPIs:**
- Composite readiness score vs. the Scale cutoff
- Adoption rate
- Support volume
- Override rate
- Trust score
- Time to scale
- Readiness reassessment at 2 and 6 weeks

**The tradeoff:** A broad, slow change management push vs. a small number of targeted, high leverage moves; the "flip the gate" plan shows the cheapest path to a Scale verdict.

**The takeaway:** The model may be ready before the organization is. Scale decisions need adoption evidence, not only technical confidence.

**Real world basis:** Modeled on gen AI rollouts at American Express, the adoption half of a 4.5× portfolio scale story.

**Limitations:** A modeled adoption instrument. Real rollout decisions need user research, change analytics, operational data, manager feedback, and post launch measurement.

## EL-02 · Stakeholder and Sponsor Alignment Cockpit

**The question:** Which sponsor is quietly drifting away from the program before that shows up in the next steering committee meeting?

**What you do:** Map stakeholders on a power/interest grid, track sentiment trajectories over six weeks of program time, and get flagged the moment someone's alignment starts trending down. The cockpit can generate a pre steering briefing focused on the stakeholder you select.

**The decision it maps to:** Who needs to hear what, from whom, before the meeting, not after.

**Key KPIs:**
- Alignment gap per stakeholder
- Alignment score
- Drift flags
- Sponsor sentiment
- Decision delays
- Escalation frequency

**The tradeoff:** Time spent aligning people ahead of the meeting vs. getting blindsided inside it.

**The takeaway:** Programs don't lose sponsors in the meeting. They lose them in the silence before the meeting.

**Real world basis:** Multi stakeholder consulting delivery (Deloitte/Verizon, Genpact/Morgan Stanley).

**Limitations:** A simulated stakeholder model. Real use needs stakeholder interviews, relationship context, meeting history, sentiment inputs, and the delivery lead's own judgment.

## EL-03 · Capacity and Skills Coverage Planner

**The question:** Do the people on this program actually cover the skills the portfolio needs, or does headcount just look fine on paper?

**What you do:** Map demand and capacity by skill pool (not just raw headcount), see where the team is overallocated, and model what hiring, contracting, or upskilling actions do to cost and schedule.

**The decision it maps to:** Hire / contract / upskill, decided per skill gap, with the date and cost impact of each option made explicit.

**Key KPIs:**
- Skill utilization vs. target
- Open gaps
- Delivery date impact
- Monthly cost
- Time to productive capacity

**The tradeoff:** Hiring is slow and expensive, contracting is fast but thin, upskilling is durable but takes time to pay off.

**The takeaway:** Thirty people do not equal thirty usable delivery units. Capacity fails by skill, not by headcount.

**Real world basis:** A direct mirror of a 31-resource AMEX intelligence mapping exercise, described as the most personal lab on the site.

**Limitations:** A deterministic planner. Real capacity planning needs availability data, role definitions, location constraints, ramp time, vendor constraints, and delivery priorities.

## EL-04 · Delivery Health and RAID Radar

**The question:** Which workstream that's reporting "green" is actually trending into trouble?

**What you do:** Compare each workstream's reported status against a calculated actual health score and trend line, built from its RAID detail (risks, assumptions, issues, dependencies). The radar computes a portfolio health index and highlights the gap between what's reported and what's real.

**The decision it maps to:** Escalate the workstream whose trajectory is worse than its reported status, before it becomes a missed milestone.

**Key KPIs:**
- Reported vs actual gap
- Portfolio health index
- Issue aging
- Dependency closure
- Steering decision cycle time

**The tradeoff:** A comfortable reported status vs. the honest trajectory sitting underneath it.

**The takeaway:** Green with a downward trend is not green. Report trajectory, or prepare to be surprised.

**Real world basis:** The weekly reality of multi portfolio engagement management work at AMEX.

**Limitations:** A modeled delivery governance artifact. Real use needs current plan data, workstream updates, RAID ownership, dependency status, and a real leadership review cadence.

## EL-05 · AI Compliance Readiness Navigator

**The question:** What regulatory risk tier does a given AI use case actually fall into, and what controls does it owe as a result?

**What you do:** Classify a representative AI function into a simplified risk tier (drawing on EU AI Act categories and finserv specific overlays), apply the relevant overlays, and see the resulting map of required controls versus what's currently in place, plus an audit readiness view.

**The decision it maps to:** Naming the risk tier and required controls before a delivery plan commits to a release path, not after.

**Key KPIs:**
- Risk tier
- Control coverage vs. what the tier requires
- Unresolved gaps
- Audit readiness
- Time to compliance review
- Release blockers

**The tradeoff:** Control burden and slower time to market vs. regulatory and reputational exposure if you skip it.

**The takeaway:** Compliance is not a gate at the end. It is a design input at the start.

**Real world basis:** Regulated industry delivery experience across AMEX, Morgan Stanley, and S&P/CRISIL.

## EL-06 · Talent and Upskilling Pathway Planner

**The question:** How does a delivery team get to agentic era skills before the platform roadmap outruns them?

**What you do:** Compare current team capability coverage against the target skill set the roadmap demands, see where the gaps are, and model build (train), hire, or partner pathways for each one, along with the time each pathway takes to become productive.

**The decision it maps to:** Build / hire / partner, decided per role, with a time to productive figure attached to each choice.

**Key KPIs:**
- Capability coverage
- Time to ready, per pathway
- Open gaps
- Pathway cost
- Productive capacity

**The tradeoff:** Building skills in house is slow but durable; hiring is fast but expensive; partnering is quick but external and less sticky.

**The takeaway:** The AI stack may change in 18 months. Teams often take longer. Start the people plan before the platform plan becomes urgent.

**Real world basis:** Team capability building across multiple delivery portfolios.

**Limitations:** A modeled capability planner. Real workforce planning needs a role inventory, skills assessment, hiring market data, vendor strategy, budget, and manager validation.

## EL-07 · RFP and Bid Decision War Room

**The question:** Should you even bid this piece of work, and if so, where is the proposed response weakest?

**What you do:** Decompose an RFP into a compliance matrix, score the strength of a draft response against it, apply bid criteria (fit, win probability, capacity, margin), and get a bid or no bid memo out the other end.

**The decision it maps to:** Bid / no bid, treated as a portfolio decision (fit × win probability × capacity × margin) rather than a reflexive "we should chase everything."

**Key KPIs:**
- Composite bid/pursuit score
- Requirement coverage
- Margin fit
- Win rate
- Proposal effort
- Capacity consumed

**The tradeoff:** Chasing a marginal bid vs. preserving capacity for a stronger one that comes along later.

**The takeaway:** The pursuits you decline create room for the pursuits you can win and deliver well.

**Real world basis:** Modeled on a $9M pipeline, i.e. the actual instrument of how a pipeline gets built, one qualified pursuit at a time.

**Limitations:** A modeled pursuit artifact. Real bid decisions need client context, competitive intelligence, delivery estimates, pricing review, legal input, and executive judgment.

## EL-08 · Estimation and Scope Control Studio

**The question:** What's the real estimate for this engagement, and what happens to margin the moment scope moves?

**What you do:** Compare three estimation methods, bottom up, analogous, and PERT (three point), side by side, and watch them disagree. Then model staffing, schedule confidence, and what a scope change does to margin under a formal change control process.

**The decision it maps to:** A deliverable estimate range plus staffing plan, with the change control impact of scope movement made explicit up front.

**Key KPIs:**
- P80 estimate (80% confidence commitment point)
- Schedule variance
- Margin impact
- Change order value
- Scope movement

**The tradeoff:** Quietly absorbing scope creep protects the client relationship but erodes margin; a formal change order protects margin but is a harder conversation to have.

**The takeaway:** AI estimates most often break in data discovery and evaluation. Price those unknowns as line items, or absorb the cost later.

**Real world basis:** Consulting delivery estimation experience across HCLTech, Genpact, and Deloitte engagements.

**Limitations:** A portfolio estimation model. Real estimation needs delivery history, actual client scope, technical discovery, staffing rates, vendor constraints, and commercial review.

## EL-09 · Onboarding and Knowledge Transfer Tracker

**The question:** Why does it take 40 days to make a new hire productive, and what is that delay actually costing?

**What you do:** Model onboarding timelines, access delays, ramp time, and carrying cost across a set of new resources, and see which ones are blocked and where a single departing senior person represents a "bus factor" risk (i.e. critical knowledge with no backup).

**The decision it maps to:** The onboarding critical path, plus how much knowledge transfer gets captured before a senior person rolls off.

**Key KPIs:**
- Time to productive
- Blocked resources
- Pre provisioning savings
- KT (knowledge transfer) completion
- Bus factor risk

**The tradeoff:** Ramping people faster vs. how much knowledge transfer depth actually gets captured in that shorter window.

**The takeaway:** A resource is a cost from day one, and becomes an asset only once productive. Compressing onboarding is a real operating lever, not just an HR nicety.

**Real world basis:** The resource lead reality of a 31-resource AMEX portfolio, including onshore/offshore mobilization.

**Limitations:** A modeled onboarding and KT tracker. Real use needs access systems data, role plans, training status, manager validation, KT artifacts, and resource calendars.

## EL-10 · Executive Communication Decision Studio

**The question:** Does this week's executive update actually force a decision, or does it just report status and change nothing?

**What you do:** Feed in shared delivery data and generate executive facing artifacts, weekly updates, steering pre reads, QBR outlines, each organized around status, decisions, risks, and asks, then rewritten for the specific audience receiving it (a CIO needs different framing than a sponsor or procurement).

**The decision it maps to:** What decision to force this week, and how to frame it for the audience actually in the room.

**Key KPIs:**
- Whether a decision is actually being asked for (vs. just status reporting)
- Audience fit of the framing
- Decisions requested
- Decisions made
- Risk acceptance
- Action closure
- Stakeholder response time

**The tradeoff:** A comfortable, easy to write status update vs. forcing an uncomfortable but necessary decision.

**The takeaway:** An executive update with no decision request in it is a diary entry. Every pre read should ask for something.

**Real world basis:** Weekly leadership updates and QBRs across multiple AMEX portfolios.

**Limitations:** Uses modeled portfolio data and generated framing. Real executive communication needs current facts, stakeholder context, political judgment, and review by the accountable delivery lead.

---

# Collection 1 · Enterprise AI Lifecycle (the spine)

Unlike Collections 2 through 4, which are 23 independent artifacts, Collection 1 is a single connected system: the AI Program Command Center. It walks one fictional initiative through the entire delivery lifecycle, gate by gate, with shared state carrying forward from one stage to the next. It answers a different question than the other labs: not "is this one decision sound," but "can this person actually run an AI program end to end."

The lifecycle runs **Frame → Data → Build → Deploy → Govern → Realize**, with an **Operate** loop that brings you back to Frame when something needs to be reframed, rebuilt, or rescoped. Four instruments live inside that spine and are also visible as their own catalog entries:

- **Backlog Generator:** turns business requirements into a sequenced, estimable backlog with proper backlog hygiene.
- **RAG Quality Evaluator:** scores a retrieval and generation pipeline on faithfulness, citation accuracy, and hallucination rate, before anyone trusts it in production.
- **Govern, guardrails and risk tiering:** risk tiers a use case and maps the guardrails it requires before it ships.
- **Operate, Day Two Observability:** the loop that decides whether the system is still working, and if it isn't, whether the fix is a retrain, a reindex, a rollback, or a full reframe back at the start.

Where the 23 catalog labs each isolate one decision, the spine is meant to be walked start to finish. It's the part of the portfolio that demonstrates operating the whole gated lifecycle, not just any single stage of it.

---

# Glossary

A quick reference for terms that show up repeatedly across labs.

- **MCP (Model Context Protocol):** A standard way for an AI agent to discover and call tools, read resources, and use prompts exposed by a system, instead of writing custom integration code for each one.
- **A2A (Agent to Agent):** A messaging pattern for how multiple agents coordinate with each other on a shared task.
- **LLM:** Large language model, the underlying model an agent or assistant is built on.
- **RAG (Retrieval Augmented Generation):** An approach where a model's answer is grounded in documents retrieved at query time, rather than relying purely on what the model memorized during training.
- **HITL (Human in the Loop):** A design where a person reviews or approves an AI system's action before, or instead of, it acting autonomously.
- **TCO (Total Cost of Ownership):** The full cost of a solution over a set time horizon, not just its sticker price.
- **NPV (Net Present Value):** The value today of a stream of future cash flows, used to judge whether an investment is worth making.
- **IRR (Internal Rate of Return):** The rate of return at which an investment breaks even in present value terms; a common companion metric to NPV.
- **P80:** An estimate with an 80% confidence level, meaning there's an 80% chance the real outcome comes in at or under that number. Used instead of a single "best guess" estimate.
- **RAID:** Risks, Assumptions, Issues, and Dependencies, the standard categories used to track what could go wrong on a delivery program.
- **Risk tier:** A classification (e.g. minimal, limited, high) that determines what controls and oversight a given AI use case is required to have, often tied to frameworks like the EU AI Act.
- **Bus factor:** The number of people who could leave a project before it stalls from lost knowledge; a "bus factor of one" means a single departure would be very damaging.
- **SIMULATED vs. LIVE:** A SIMULATED lab runs on deterministic, authored logic and modeled data. A LIVE lab is wired to a real, running system (for example, an actual model API). Every lab states which one it is.

---

*This document was generated from the portfolio's own source content (the registry, case study text, and outcome framing embedded in each lab) so it stays accurate to what is actually built.*
