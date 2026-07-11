# Turning the Command Center into a teachable simulation product

**Date:** 2026-07-11 · **Author:** Sudeep Lalka (with Claude) · **Status:** strategy draft for decision, not a build plan yet

This document does four things:
1. Reports what the business-school simulation market actually looks like and what it pays.
2. Corrects two assumptions in the original brief (the HBR path, and the certificate's value).
3. Inventories what the Command Center already is vs. what a *simulation* requires — the honest gap.
4. Proposes **four** product concepts (three primary + one bundling play), with build cost, price, and a recommendation.

---

## Part 1 — What the market actually is

### 1.1 The channel has consolidated on Harvard

The single most important finding: **Wharton Interactive shut its own marketplace on 30 April 2025** and is porting its titles (e.g. the A/B Testing Simulation) into Harvard's marketplace, with the transition landing early Spring 2026. Wharton — a top-5 brand with a full-time interactive team and 20,000+ students on The Startup Game — concluded that running its own distribution was not worth it.

Meanwhile Harvard Business Publishing (now rebranding as **Harvard Business Impact**) has been aggressively signing *third-party simulation publishers* as distribution partners: **Marketplace Simulations, Hubro, MEGA Learning, Moblab, Sim Institute**, plus Forio-built titles from HBS, Darden, Wharton and Kellogg. Their own price-change notice explicitly says "Partner simulations follow the simulation publisher's pricing."

**Read this correctly.** It is simultaneously:
- **Bad news** for a direct-to-professor SaaS play. Professors don't want another vendor login, another invoice, another LMS integration. HBP is where they already shop, and even Wharton gave up fighting that.
- **Very good news** for you. HBP's partner-publisher model is an *open door*. Sim Institute is a tiny outfit (Tim Rogmans, managing director) with simulations in the Harvard catalog. That is a template you can follow. You do not need to be a professor. You need a simulation good enough that HBP wants to carry it, and you keep pricing control.

### 1.2 What a seat costs (verified, effective 1 July 2026)

Harvard Business Impact per-student pricing, degree-granting institutions:

| Product | Degree-granting | Non-degree (exec ed) |
|---|---|---|
| Case | $5.10 | $9.20 |
| **Simulation (tier 1)** | **$11.50** | $28.50 |
| **Simulation (tier 2)** | **$16.60** | $49.00 |
| **Simulation (tier 3)** | **$22.00** | $49.00 |
| **Simulation (tier 4)** | **$48.50** | $96.50 |
| Core Curriculum module | $8.85 | $17.15 |

Capsim's Capstone + Comp-XM has historically been ~$55/student (that figure is from a 2016 university disclosure — treat it as a ceiling indicator, not current). Cesim and StratX don't publish list prices.

**The unit economics that matter:** a simulation is a $12–$50 per-student, per-course product. The professor doesn't pay; the *student* pays, usually inside a course pack, and the professor's only cost is adoption effort. This is why the sale is a *teaching* sale, not a procurement sale — and why the teaching note, the rubric, and the instructor console are the actual product, not the simulator.

Simple revenue math, direct or via HBP:

| Scenario | Courses/yr | Avg class | Price/seat | Gross |
|---|---|---|---|---|
| Year-1 pilot | 6 | 45 | $22 | ~$6k |
| Year-2 traction | 40 | 50 | $22 | ~$44k |
| Year-3 catalog title | 150 | 55 | $22 | ~$180k |
| + exec-ed / corporate | 20 cohorts | 30 | $95 | ~$57k |

Through HBP you give up a revenue share (not publicly disclosed; assume the publisher keeps a material majority) in exchange for the catalog, the LTI integrations, the billing, and the brand. Direct-licensed to a professor at a **flat course site-license of $2,500–$6,000/term**, 30 courses/year is $75k–$180k with no rev share but with all the friction. The mature answer is *both*: HBP for reach, direct for exec-ed and corporate.

### 1.3 The demand signal for *this specific subject* is strong and unserved

- **Udacity/Accenture launched a fully accredited MBA in AI Product Management in March 2026** (<$5,000, 2,250 credit hours). When a bootcamp company accredits an entire MBA around your exact subject, the incumbents will scramble to answer it.
- Reported **40%+ growth in AI-focused MBA elective enrolment in 2025**. Chicago Booth now has an Applied AI MBA concentration.
- AACSB **Assurance of Learning (Standard 5)** requires direct, rubric-driven, individually-attributable measures of competency. Simulations are one of the few instruments that produce that data automatically. **This is the professor's real pain, and it is your wedge.**
- What does *not* exist, as far as I can find: a simulation in any major catalog that teaches **AI delivery** — the lifecycle from framing an AI bet, through data readiness, model/RAG quality, deployment economics, governance and risk tiering, to realized ROI and day-two drift. Harvard has AI *content* collections and an "AI in Strategy" collection. It does not have an AI *program-management* simulation. Capsim, Cesim, Markstrat, Hubro are all classic strategy/marketing/ops sims that predate the AI era.

There is a hole shaped exactly like the Command Center.

---

## Part 2 — Two corrections to the brief

### 2.1 "Publish it on HBR" — right instinct, wrong mechanism

**Harvard Business Review** (hbr.org, the magazine) publishes *ideas*. It does not distribute software, and it has no licensing relationship with professors. **Harvard Business Impact / HBP Education** (hbsp.harvard.edu) is the completely separate store where professors buy cases and simulations.

The correct sequence is:

1. **HBR article = demand generation and credibility.** A piece like *"Most AI Programs Fail at the Handoffs"* or *"Your AI Governance Board Is Reviewing the Wrong Thing"* — built on the actual mechanics your engines encode — is a realistic HBR pitch (via Submittable, or direct to an editor). It creates the citation that makes the simulation adoptable. Faculty adopt what they can cite.
2. **Harvard Business Impact partner-publisher deal = distribution.** Pitch it as a simulation, following the Marketplace/Hubro/Sim Institute pattern. Contact route: `HECustomerSuccess@hbsp.harvard.edu` → Strategic Relationship Manager.
3. **Direct pilots run *first*,** in parallel — HBP will want evidence of classroom use before they carry a title from an unknown author.

Do not treat the HBR article as the product launch. Treat it as the door-knock.

### 2.2 The certificate and LinkedIn badge — real, but not the way you think

A certificate issued by *you* has near-zero market value. A certificate issued by *the professor's institution*, where you supply the assessment engine, has real value — and it's what the institution wants anyway.

The workable design:
- The simulation emits a **verified, rubric-scored competency record** per student (this is exactly what AACSB Standard 5 needs).
- The **badge is co-branded** — institution name + "AI Program Simulation" — and issued via **Open Badges 3.0** through Accredible (from ~$45/mo, deepest LMS/SIS integration, strongest OB 3.0 support) or Credly (biggest employer-recognized network, but slower on OB 3.0 and pricier).
- Precedent exists: Pendo issues its "AI for Product Management" badge through Credly. A badge is table stakes, not a differentiator.

**Do not sell the badge. Sell the assessment, and give the badge away.** The badge is the student's souvenir; the gradebook is the professor's reason to buy.

---

## Part 3 — The honest gap: what you have vs. what a simulation needs

### What you already own (and it is a lot)

| Asset | Where | Why it matters for a sim |
|---|---|---|
| Seven-stage contract spine | `program-core/stages.ts`, `types.ts` | The sim's *board*. Frame → Data → Build → Deploy → Govern → Realize → Operate, and Operate loops back to Frame. That loop is the game. |
| Deterministic decision engines | `program-core/{contracts,operate,operate-day2,govern,training,agents,insights}.ts` | Governance decision (5 bands), release readiness (13 checks), ROI + risk discount, day-two drift signals, value-at-risk, canary breach projection. **Deterministic = auditable = gradeable.** Most sims hide their model; yours can show it. |
| Six archetypes | `store.ts` `DEMO_ARCHETYPES` | Six ready-made scenario seeds: knowledge assistant, summarization, classification, decision support, agentic workflow, at-risk. |
| 23 catalog labs | `apps/web/app/{agents,business,engagement}` | The student's *toolbox*: ROI builder, cost forecaster, RAID radar, stakeholder cockpit, build-vs-buy, HITL simulator. These become the in-sim instruments. |
| Real RAG substrate | `lab-rag` (BM25, TF-IDF, retrieval modes, eval bench with ROC/AUC/calibration) | Engineering students can actually *do* retrieval work, not just click through slides. |
| Exportable artifacts | audit evidence pack, board brief, weekly ops review, incident report | **These are the assignments.** Already implemented as downloadable markdown. |
| Honesty layer | SIMULATED/LIVE badges, limitations notes | Pedagogically superb. A professor can teach *"here is where the model stops"* — that's an actual learning objective. |
| 57 test files, ~15k lines of engine code | `packages/` | The credibility moat. Nobody else has tested AI-delivery engines. |

### What you do not have (the five gaps)

1. **No variance.** The Command Center is *deliberately* deterministic and — worse for a sim — the demo fixture is *sealed so that no contradictions can occur* (`sealDemo()`, `fixture.test.ts`). That is exactly right for a portfolio. It is exactly wrong for a simulation, where the entire point is that **your choices produce different, sometimes bad, outcomes.** You need seeded stochasticity, hidden state, and adversarial events. (You already have seeded RNG in `engines/evalbench.ts`, `operate-day2.ts`, `lab-data/live/session.ts` — the pattern exists, it just isn't wired into the spine.)
2. **No scarcity.** There is no budget, no clock, no headcount. Without constraints there are no trade-offs, and without trade-offs there is no learning. A sim needs a **budget, a calendar, and an opportunity cost.**
3. **No persistence beyond one browser.** State is `localStorage` (`apcc_state`). No accounts, no roster, no server. Static export, no backend at all.
4. **No instructor surface.** No cohort, no scoring, no leaderboard, no gradebook, no LTI 1.3 (Canvas/Blackboard/Moodle). HBP won't carry a title without LTI.
5. **No pedagogy package.** No teaching note, no session plan, no rubric, no debrief deck. **This is the thing professors actually evaluate**, and it's the cheapest gap to close.

Gaps 3–5 are the *product*. Gaps 1–2 are the *game*. Gap 5 is the *sale*.

---

## Part 4 — Four product concepts

---

### Concept A — **"THE AI INITIATIVE"** · a seven-round campaign simulation
*The Everest of AI delivery. Single-player, replayable, 3–5 hours across a term.*

**The pitch.** You are the AI program lead at a mid-size firm. You have **$1.2M, four quarters, and a board that will fund exactly one initiative.** Each round is one stage of the lifecycle. Every decision costs budget and time, changes what you learn, and constrains what you can do next. At the end, the board asks one question: *what did we get for the money?* Then drift hits, and you find out whether you built something that survives contact with day two.

**How it plays.**

| Round | The decision | What it costs / reveals |
|---|---|---|
| 1 · Frame | Pick 1 of 3 candidate use cases from a scored option spread. Set scope. | Cheap. But the wrong pick is unrecoverable — the classic lesson. |
| 2 · Data | Buy source audits, remediate, or ship with known gaps. | Each audit costs budget + a week. **Hidden state revealed:** one source you thought was clean is unowned and stale. |
| 3 · Build | Choose model archetype, retrieval mode, eval investment. | A stronger engine costs more per query forever. Skipping evals saves 2 weeks and hides a citation-accuracy failure until Round 6. |
| 4 · Deploy | Set the operating envelope, rollback plan, monitoring coverage. | Monitoring is the thing everyone under-buys. Round 7 punishes it. |
| 5 · Govern | Face the risk tier your Round-1 choices earned you. Buy controls, or seek an exception. | High-tier initiatives need human review — which crushes the ROI you promised in Round 1. |
| 6 · Realize | Present the business case. The engine computes risk-adjusted ROI from *everything above*. | The board scores you. The number is not yours to choose. |
| 7 · Operate | A day-two drift incident fires. Reindex / retrain / rollback / rescope. | Your Round-4 monitoring decision determines whether you *saw it coming* or found out from a customer. Loops back to Frame. |

**Why this is defensible.** No other simulation makes the *handoffs* the mechanic. Everest teaches team communication; Markstrat teaches positioning; Capstone teaches capacity. **The AI Initiative teaches that AI programs die at the seams** — that a Round-1 scoping choice is what makes a Round-5 governance review brutal. That's a genuinely new idea and it is the HBR article.

**Scoring (the AACSB payload).** Five graded dimensions, all machine-computed:
`Value Realized` (risk-adjusted ROI) · `Capital Efficiency` (value per $ spent) · `Governance Integrity` (did you ship with unresolved critical findings?) · `Operational Resilience` (did you detect drift before it cost you?) · `Decision Traceability` (can every number in your board brief be traced to an upstream decision? — you already compute this).

**Build delta:** seeded scenario generator + hidden state · budget/clock ledger · round gating · scoring engine · results/debrief screen · **backend for accounts + cohorts** · instructor console · LTI 1.3.
**Effort:** ~10–14 weeks solo. **Price:** $16.60–$22 tier. **Class fit:** any AI/tech-strategy MBA elective, 4–6 weeks of a course.

---

### Concept B — **"COMMAND CENTER: THE ROOM"** · a multiplayer, role-based team simulation
*Capsim-class. The highest ceiling, the highest cost.*

**The pitch.** Four students, one initiative, **four incompatible incentives.** Each plays a role with private information and a private scorecard:

- **Product Lead** — scored on value realized and adoption. Wants to ship.
- **Data/ML Lead** — scored on quality, faithfulness, drift resistance. Wants another eval cycle.
- **Risk & Governance Officer** — scored on findings closed and audit readiness. Can *block release*. Their private brief contains a regulatory exposure the others cannot see.
- **Executive Sponsor / CFO** — holds the budget, scored on capital efficiency and board credibility. Can pull funding.

Each round, all four submit decisions; the engine resolves them jointly. **The Governance Officer's veto is real.** The CFO's budget is real. A team that ships fast and ungoverned scores brilliantly in Round 6 and catastrophically in Round 7. A team that governs everything to death never ships at all. The learning is negotiation under genuine information asymmetry — which is *exactly what running an AI program is*, and exactly what no existing sim teaches.

Section-wide leaderboard. Teams compete for board funding against each other.

**Why it's the strongest teaching product.** Cross-functional conflict is the #1 thing MBA programs try to teach and the #1 thing static cases can't. It's also what Everest is famous for — and Everest is HBP's best-selling simulation. This is Everest for the AI era.

**Why it's the riskiest.** Multiplayer means real-time state, synchronized rounds, one player stalling a whole team, timezone problems in online programs, and a support burden. It also needs a facilitator — professors must be *trained* to run it, which is friction (HBP has an entire "Running Simulations" educator-training track for exactly this reason).

**Build delta:** everything in Concept A, **plus** real-time multiplayer state, role-scoped views, private briefs, joint resolution engine, team formation, facilitator run-of-show, section leaderboard.
**Effort:** ~24–30 weeks. Likely needs a collaborator or a platform partner (**Forio** builds exactly this and is HBP's long-standing simulation engine partner — a serious "buy the plumbing" option).
**Price:** $22–$48.50 tier. **Class fit:** capstone / integrative course, 6–10 weeks.

---

### Concept C — **"THE DRIFT"** · a 90-minute governance crisis simulation
*One class session. The wedge. Build this first.*

**The pitch.** The AI assistant you shipped six months ago is quietly getting things wrong. **SLOs are green. Availability is 99.9%. p95 latency is fine.** Every dashboard the company owns says the system is healthy. But canary pass rate has fallen 11 points, the index is 26 days stale, and a customer just escalated. You have 90 minutes and four options: **reindex, retrain, rollback, or rescope.** Each loops back to a different stage, costs a different amount, and buys a different amount of time. The clock is running and value-at-risk is accruing at $X/day on screen.

**Why it's the wedge.** It is:
- **One session.** Zero adoption risk. A professor can drop it into an existing course next week without redesigning anything.
- **Emotionally legible.** "The dashboards were all green and the system was broken" is a story that lands in 30 seconds — with a dean, with an HBR editor, with a room of students. It is the single best marketing asset you have and **you have already built the engine for it** (`operate-day2.ts`: `deriveOpsSeries`, `detectSignals`, `valueAtRisk`, `projectCanaryBreach`, `buildIncidentReport`).
- **The article.** *"Your AI Is Failing and Your Dashboard Says It's Fine"* is an HBR piece, and it is true, and you can prove it with a working artifact.
- **A funnel.** The 90-minute sim sells the seven-round campaign. Give it away free, or price it at the $11.50 tier.

**Deliverable per student:** a one-page **incident report + remediation recommendation** (already exported by `buildIncidentReport`), graded against a rubric you supply.

**Build delta:** timer + pressure loop · decision consequences · a real debrief screen showing the counterfactual (*"here's what the other three choices would have cost you"* — the highest-value pedagogical moment, and cheap to build because the engines are pure functions) · lightweight cohort (can launch with a shared class code, no full auth) · teaching note.
**Effort:** ~4–6 weeks. **Price:** free-to-$11.50. **Class fit:** any course, one session.

---

### Concept D — **"AI PRODUCT LEADERSHIP: COURSE IN A BOX"** · the bundling play
*Not a fourth simulation. The thing you sell to the professor who has to build a course from nothing.*

**The pitch.** A professor has been told to launch an AI Product Management elective in one quarter. They have no materials. You hand them: **a 10-week syllabus, the campaign sim (A), the crisis sim (C), 23 lab exercises drawn from the existing catalog, 10 graded assignments with rubrics, a debrief deck per session, and an auto-issued co-branded Open Badge.**

**Why this may be the real business.** The simulation is a $22 line item. **The course is a $5,000–$15,000/term institutional license** — and the person who needs it most (a professor being asked to stand up an AI curriculum they don't have time to design) has budget and urgency that a $22 seat sale never touches. It also converts your 23 orphaned catalog labs from "portfolio decoration" into a curriculum. And it's the only concept where the **certificate** is genuinely defensible: completing a 10-week, rubric-assessed course *is* worth a credential; playing a 90-minute sim is not.

**Build delta:** mostly *writing*, not code — syllabus, teaching notes, rubrics, slide decks, assignment sheets. Plus badge issuance (Accredible) and the instructor console.
**Effort:** ~8 weeks of writing on top of A + C. **Price:** $5k–$15k/term site license, or $95–$150/seat non-degree for exec-ed and corporate.

---

## Part 5 — Comparison and recommendation

| | A · The AI Initiative | B · The Room | C · The Drift | D · Course in a Box |
|---|---|---|---|---|
| Build effort | 10–14 wks | 24–30 wks | **4–6 wks** | 8 wks (writing) |
| Reuses existing engines | High | High | **Very high** | Total |
| Adoption friction | Medium | **High** (needs facilitator training) | **Very low** | Medium |
| Price ceiling | $22/seat | $48.50/seat | $11.50/seat | **$15k/term** |
| Teaching-market fit | Strong | **Strongest** | Good (single session) | Strong |
| HBR story quality | Good | Good | **Best** | Weak |
| Risk of building the wrong thing | Medium | **High** | **Low** | Low |

### The recommended sequence

**Ship C, then A, then D. Consider B only after a partner or a paying pilot demands it.**

1. **Now → 6 weeks: build "The Drift."** It's the smallest thing that is unmistakably a simulation, it rides engines you've already tested, and it produces the story that everything else is sold on. Give it away free to 5–10 professors.
2. **In parallel: write the HBR pitch** — *"Your AI Is Failing and Your Dashboard Says It's Fine."* You have the working artifact, which is the thing HBR pitches usually lack. This is your credibility.
3. **Weeks 6–20: build "The AI Initiative"** (Concept A) — the seven-round campaign — using what the free pilots taught you about what professors actually assign. **This is where the backend, cohorts, scoring and LTI 1.3 get built once and reused forever.**
4. **Weeks 20–28: wrap it in Concept D** and take *that* to Harvard Business Impact as a partner-publisher pitch, with classroom evidence in hand.
5. **Concept B** is the ten-year asset. Build it when someone is paying for it, or when Forio is building it with you.

### What must be true for this to work (the honest risks)

- **Professors adopt on evidence, not novelty.** They will ask "who else teaches with this?" You need 3–5 real classrooms before HBP will talk seriously. Budget a full academic year of free pilots.
- **Wharton's marketplace closure is a warning.** Self-distribution to faculty is genuinely hard. Plan for HBP (or Forio) as the channel from day one, and design for LTI 1.3 accordingly.
- **You are not a professor.** Sim Institute proves that's survivable, but you will need at least one faculty co-author — probably at a school that has just been told to launch an AI course and has no materials. That person is your first customer *and* your credibility. Find them before you write more code.
- **Determinism is your moat and your trap.** The engines being pure, tested, and inspectable is a *real* differentiator versus black-box sims — lean into it ("the model is open; argue with it"). But you must add seeded variance or every student in the section gets the same answer and the assignment is worthless.
- **The badge is a garnish, not a business.** Sell the gradebook.

---

## Part 6 — The specific first commit

If you agree with the sequence, the first bounded piece of work is:

**`packages/lab-sim`** — a new package holding: a seeded scenario generator (`makeScenario(seed, archetype)`), a budget/clock ledger, a decision-consequence resolver over the existing engines, and a scoring module. Zero UI. Fully unit-tested, like every other engine in this repo. It's the spine both C and A run on, and it can be built and proven before a single screen is designed.

Per **CLAUDE.md Rule 1**, nothing here duplicates an existing surface: the Command Center *displays* a program; `lab-sim` would make one *playable*, with variance, scarcity, and consequences that the current codebase deliberately does not have.

---

## Sources

- [Harvard Business Impact price changes, effective 1 July 2026](https://help.hbsp.harvard.edu/hc/en-us/articles/20690693122963-Harvard-Business-Publishing-Education-Price-Changes) — verified per-seat simulation pricing
- [Harvard Business Impact — Simulations catalog](https://hbsp.harvard.edu/simulations/)
- [Wharton Interactive — marketplace closure information](https://interactive.wharton.upenn.edu/)
- [Forio — Harvard Business Impact simulation partnership](https://forio.com/partner/hbplanding)
- [Marketplace Simulations + HBP partnership announcement](https://www.marketplace-simulation.com/blog/harvard-business-publishing-and-marketplace-simulations-form-partnership/)
- [Hubro — new partnership with HBP Education](https://hubrosimulations.com/blog/post/new-partnership-with-hbpe)
- [Sim Institute — Sustainability Management Simulation on HBP](https://www.hbsp.harvard.edu/product/FO0007-HTM-ENG)
- [Udacity/Accenture — accredited MBA in AI Product Management](https://newsroom.accenture.com/news/2026/udacity-part-of-accenture-launches-accredited-mba-to-train-the-next-generation-of-ai-product-leaders)
- [Chicago Booth — Applied AI MBA concentration](https://www.chicagobooth.edu/mba/academics/curriculum/concentrations/applied-ai)
- [AACSB — Transforming Assurance of Learning](https://www.aacsb.edu/insights/articles/2021/05/transforming-assurance-of-learning-for-lasting-impact)
- [HBR — Contributor guidelines for authors](https://hbr.org/guidelines-for-authors)
- [Capsim — business simulations](https://www.capsim.com/business-simulations)
- [Pendo — AI for Product Management badge on Credly](https://www.credly.com/org/pendo/badge/ai-for-product-management)
- [Digital badge platform comparison (Credly / Accredible / Open Badges 3.0)](https://sertifier.com/blog/digital-badge-platforms/)
</content>
