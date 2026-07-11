# AI Program Simulator — Architecture & Technical Specification

**Version:** v1 (spec only — no code) · **Date:** 2026-07-11 · **Owner:** Sudeep Lalka
**Decisions locked:** hosted web product with sign-in (no downloads) · MBA/business player first · full architecture specified before any implementation.

**Read first:** `CLAUDE.md` (Redundancy Gate), then `SIM-PRODUCT-STRATEGY-2026-07-11.md` (why), then this (how).

---

## 0. What this is, and what it does to the existing repo

The Command Center **displays** an AI program. The Simulator makes one **playable**: with scarcity, hidden information, stochastic consequence, and a score.

| | Command Center (today) | Simulator (this spec) |
|---|---|---|
| State | `localStorage`, one browser | Server-persisted, account-bound |
| Truth | Fully visible, sealed to be contradiction-free | **Hidden state**; contradictions are *earned* |
| Time | None | A simulated calendar; decisions cost weeks |
| Money | Displayed | **Spent**; budget is finite |
| Outcome | Derived from what you typed | Derived from what you *chose*, plus what you didn't know |
| Purpose | Portfolio artifact | Product with a gradebook |

**Nothing in the Command Center gets thrown away.** Per Rule 1 (one capability, one canonical home):

- `@labs/program-core` keeps ownership of **every formula** it already owns — governance decision bands, release readiness (13 checks), ROI + risk discount, day-two drift signals, value-at-risk. The Simulator does **not** reimplement any of them.
- The Simulator adds the four things program-core deliberately does not have: **hidden truth, resource cost, the passage of time, and stochastic events.**
- The bridge is one pure function, `project(world) → ProgramState`. The existing panels (`ProgramRail`, `ReleaseBlockers`, the Realize verdict, the governance scorecard) then render the simulation's dashboard **unchanged**. The Command Center literally becomes the simulator's instrument panel.

> **The boundary rule:** `sim-core` owns *the world*. `program-core` owns *the formulas*. If a number can be computed from a `ProgramState`, program-core computes it. If it requires knowing something the player doesn't, sim-core owns it.

---

## 1. The architectural thesis: deterministic, event-sourced replay

This is the one idea the entire system hangs on. Everything else follows from it.

**A run is not a state blob. A run is a seed plus an ordered list of decisions.**

```
Run = { scenarioPackId, engineVersion, seed, decisions: Decision[] }

world_final = replay(Run)          // pure function
score       = score(world_final)   // pure function
```

The server stores only the seed and the decision log. It never stores a score it was handed. It **recomputes** every score by replaying. Seven consequences, all of which we want:

1. **Cheat-resistance is free.** The client cannot submit a score — only decisions. The server replays them and derives the score itself. There is nothing to forge.
2. **Grading is auditable.** "Why did I get a 63?" → replay the trace, step by step, and show the exact decision that cost the points. This is precisely the evidence AACSB Standard 5 wants, and no competing sim can produce it.
3. **The counterfactual debrief is free.** *"What would have happened if you'd bought the data audit in Round 2?"* is `replay(run.withDecisionChanged(2, buyAudit))`. The single most valuable teaching moment in the product **falls out of the architecture at zero marginal cost.** Nobody else has this, because nobody else is deterministic.
4. **The database is tiny.** A full playthrough is a few kilobytes of JSON, not a state tree.
5. **Class-level analytics are trivial.** Aggregate over decision logs: *"62% of your section shipped without monitoring coverage."* That's a `GROUP BY`, and it generates the professor's debrief slide.
6. **Bug fixes don't corrupt the term.** Runs are pinned to an `engineVersion`; a patched engine never retroactively changes a submitted grade (see §4.3).
7. **Multiplayer is additive, not a rewrite.** Four players' decisions are just four decision streams merged into one ordered log per round. The resolver doesn't care.

**The cost of the thesis:** the engine must be *perfectly* deterministic. §4 makes that a hard, enforced contract, not an aspiration.

---

## 2. The domain model

### 2.1 World state — visible and hidden

```
World = {
  clock:    { week: number, round: number, phase: Phase }
  purse:    Resources
  visible:  VisibleState     // what the player sees; projects to ProgramState
  hidden:   HiddenState      // the truth; never sent to the client
  ledger:   LedgerEntry[]    // every debit, with cause
  revealed: RevealId[]       // information the player has purchased or triggered
  fired:    EventId[]        // events that have occurred
}
```

`HiddenState` is the game. It is sampled from the scenario pack's generators at `seed` time and includes:

- **True data quality** per source (the player sees a *self-reported* quality; the audit reveals the real one).
- **Latent failure modes** — e.g. a citation-accuracy defect that only surfaces if evals are skipped *and* the system ships.
- **Latent regulatory exposure** — the use case is in scope for a regime the player hasn't discovered yet.
- **True adoption ceiling** — the business case the player writes in Realize assumes an adoption rate; the world has a real one.
- **Index decay rate** — how fast the corpus goes stale. Determines whether the Round-7 drift incident is survivable.
- **Vendor / market drift** — inference price changes, a competitor shipping, a model deprecation.

**The core MBA lesson this encodes:** *you are always deciding with less information than you want, information has a price and a lag, and the cost of not knowing shows up several rounds later, in a different function.*

### 2.2 The four currencies

Money alone produces a boring optimisation problem. Four currencies produce a genuine dilemma.

| Currency | Unit | Spent on | The lesson it teaches |
|---|---|---|---|
| **Budget** | $ (start ~$1.2M) | Audits, evals, controls, infra, headcount | Capital discipline |
| **Calendar** | weeks (start ~52) | Everything; some things run in parallel, most don't | Opportunity cost; the board's patience is finite |
| **Capacity** | FTE-weeks | Which work you can actually do *at all* this round | You cannot buy your way out of a staffing constraint |
| **Political capital** | 0–100 | Overriding a governance block; asking for more budget; surviving a bad round | **The one no other sim models.** Every override is borrowed against your next ask. |

Political capital is the MBA differentiator. A player who overrides the Governance Officer to hit a date *can* do it — and then has no credibility left when the drift incident hits in Round 7 and they need emergency funding. That is the actual experience of running an AI program, and it is not in any catalog today.

### 2.3 Decisions

A `Decision` is a typed, serialisable object. Never free text (free text isn't replayable or gradeable).

```
Decision = {
  round:  number
  kind:   DecisionKind        // e.g. "buy-audit" | "select-model" | "set-monitoring" | "override-gate"
  payload: Json               // strongly typed per kind
  cost:   Resources           // declared by the content pack, validated by the engine
}
```

Decision menus per round are **content, not code** (§3). This is what lets a professor get a healthcare scenario or a public-sector scenario without a release.

### 2.4 The resolution loop

One pure function, called once per round:

```
resolve(world, decisions[], rng) → {
  world:    World          // advanced
  reveals:  Reveal[]       // information the player now has
  events:   FiredEvent[]   // what happened to them
  narrative: Beat[]        // the copy that explains it
}
```

Order of operations inside a round — fixed, and part of the determinism contract:

1. **Validate** — are the decisions legal and affordable? (Server-side. Illegal decisions are rejected, not silently dropped.)
2. **Debit** — money, weeks, capacity, capital. Write the ledger.
3. **Apply** — mutate visible state via the decision's effects.
4. **Reveal** — pay-for-information decisions unlock hidden state into visible state.
5. **Advance clock.**
6. **Trigger events** — evaluate the event deck against `(world, hidden, rng)`.
7. **Derive** — call `program-core` on the projected `ProgramState` to compute governance decision, release readiness, ROI, drift signals. *These are consequences, not choices.*
8. **Narrate** — assemble the round's beats.

### 2.5 The event system

Events are the source of variance. Three kinds:

- **Triggered** — fire deterministically when a condition over `(hidden, decisions)` is met. *"You skipped the source audit AND you shipped → provenance incident."* These are the **teaching** events. They are not random; they are earned. The player must be able to see, in the debrief, exactly why it happened.
- **Stochastic** — fire with a seed-weighted probability, modulated by player choices. *"Inference prices rise 18%"* is more likely to hurt you if you chose an expensive engine. These create **replayability** and stop the sim from being a puzzle with one right answer.
- **Scheduled** — fire at a fixed round regardless. The Round-6 board review; the Round-7 drift incident. These are the **structure**.

**Design rule:** every stochastic event must be *survivable with good play* and *punishing with bad play*. If a random event can end a run that was played well, students correctly conclude the sim is unfair and stop learning. Enforced by the balance harness (§9.3).

### 2.6 Scoring — five dimensions

All machine-computed from the replayed world. All individually attributable. All rubric-mappable. This is the AACSB payload and the reason a professor buys.

| Dimension | Computed from | Weight (default, configurable) |
|---|---|---|
| **Value Realized** | risk-adjusted ROI (`program-core` Realize engine) | 30% |
| **Capital Efficiency** | value ÷ budget consumed | 20% |
| **Governance Integrity** | shipped with unresolved critical findings? overrides used? | 20% |
| **Operational Resilience** | did the Round-7 drift get *detected* before it cost money? | 20% |
| **Decision Traceability** | can every number in the final board brief be traced to an upstream decision? (`program-core` already computes this) | 10% |

Plus a qualitative **Board Verdict** band (*Funded / Funded with conditions / Held / Defunded*) — the thing students actually talk about afterwards, and the thing that makes a leaderboard meaningful without reducing the exercise to a single number.

### 2.7 The debrief

Three panels, all generated:

1. **Your trace** — every decision, its cost, and its downstream consequence, on one timeline.
2. **The counterfactual** — the three highest-leverage decisions you got wrong, each with `replay(run, with: alternative)` showing the score you would have earned. *This is the product.*
3. **The class** — where you sat in the distribution, and what your section did in aggregate.

---

## 3. Content: scenario packs are data, not code

```
packages/sim-content/packs/
  ├─ knowledge-assistant-v1/     ← ships first (MBA baseline)
  ├─ decision-support-v1/        ← high governance tier, human review, blocked sources
  ├─ agentic-workflow-v1/        ← permission boundaries, approvals, blocked actions
  └─ at-risk-legacy-v1/          ← what "not fundable" looks like
```

Each pack is a versioned, **content-hashed** bundle declaring: starting resources · hidden-state generators (the *ranges* the seed samples from) · the event deck with triggers and weights · decision menus per round · all narrative copy · the rubric mapping · the teaching note.

Three reasons this matters more than it looks:

1. **A new scenario ships without a code release** — which is what "a professor can build a whole class on this" actually requires.
2. **Scenario packs are a second SKU.** *AI in Healthcare*, *AI in Financial Services*, *AI in the Public Sector* are additional products against the same engine, and a professor who has adopted once will buy again. This is how Capsim built a catalog.
3. **A faculty co-author can write a pack** without touching TypeScript — which is how you get your first academic collaborator, and how you eventually get an *authored-by* line that HBP will carry.

Packs are validated against a schema at build time and content-hashed into the `engineVersion` (§4.3), so a pack edit can never silently change a submitted grade.

---

## 4. The determinism contract (enforced, not aspirational)

### 4.1 Rules
- **One RNG.** A single seeded PRNG (splitmix64/xoshiro-class), threaded explicitly through `resolve`. `Math.random()` is **banned** in `sim-core` and `sim-content` — enforced by an ESLint rule that fails the build.
- **No wall-clock.** `Date.now()` / `new Date()` are banned in the engine. Sim time lives in `world.clock`.
- **No locale.** No `Intl`, no `toLocaleString`, no locale-dependent sort inside the engine. Formatting happens in the UI layer, via `program-core/format.ts`.
- **No I/O, no network, no globals.** `sim-core` has **zero runtime dependencies**. It is a pure function library, exactly like `@labs/engines`.
- **Stable iteration.** Never iterate a `Set`/`Map` whose insertion order depends on anything but the decision log.

### 4.2 Why this is achievable here
The repo already works this way. `@labs/engines` (161 tests), `program-core` (97 tests), and the sealed-fixture discipline in `store.ts` are exactly this culture. `sim-core` is the same pattern with a seed threaded through.

### 4.3 Versioning — the thing that kills educational sims

```
engineVersion = hash(sim-core version + scenario pack content hash + scoring config)
```

- A `Run` is **pinned** to the `engineVersion` it started on, forever.
- Shipping a fix mid-term creates a *new* version. In-flight runs continue on the old one. Submitted grades never move.
- The instructor console shows which version a section is on and offers an explicit, opt-in migration between terms.
- Old engine versions are retained (they're pure code; keep them in the bundle or replay server-side against a pinned artifact).

**Nothing will destroy faculty trust faster than a student's grade changing after a deploy.** This is a first-class requirement, not a nice-to-have.

### 4.4 The Causality Invariant

The Command Center's `fixture.test.ts` proves *no contradiction can occur*. The Simulator's equivalent, and its most important test:

> **Every contradiction visible in the projected `ProgramState` must be traceable to a decision or a fired event in the run's log.**

If the dashboard says "no monitoring coverage," the log must contain the decision that declined it. Contradictions are the *content* — but they must be **earned**, never accidental. Property-tested across thousands of generated runs (§9.2).

---

## 5. Repository layout

The Command Center stays a static export. The Simulator is a **new app** in the same monorepo, sharing every package.

```
ai-labs-portfolio/
├── apps/
│   ├── web/                    ← unchanged. Static export. Portfolio + Command Center.
│   └── sim/                    ← NEW. Next.js (server). The product.
│       ├── app/(marketing)/      landing, pricing, request-access
│       ├── app/(student)/        play, debrief, artifacts
│       ├── app/(instructor)/     cohorts, gradebook, analytics, debrief generator
│       ├── app/api/              route handlers (§6.4)
│       └── server/               auth, db, services
├── packages/
│   ├── sim-core/               ← NEW. Pure engine. Zero deps. The crown jewel.
│   │   ├── world.ts              World, HiddenState, Resources
│   │   ├── rng.ts                seeded PRNG
│   │   ├── decisions.ts          Decision kinds + validation
│   │   ├── resolve.ts            the round resolver
│   │   ├── events.ts             the event deck evaluator
│   │   ├── score.ts              the five dimensions + board verdict
│   │   ├── replay.ts             replay(Run) → World; the whole architecture
│   │   ├── counterfactual.ts     replayWith(run, alt) → score delta
│   │   └── project.ts            project(World) → ProgramState  ← the bridge
│   ├── sim-content/            ← NEW. Scenario packs as validated, hashed data.
│   ├── program-core/           ← unchanged. Owns every formula. sim-core calls it.
│   ├── engines/ kit/ design-system/ lab-*/   ← unchanged. Reused as instruments.
└── docs/
```

`sim-core` depends on `program-core`. `program-core` depends on nothing new. **The dependency arrow never reverses** — that's what keeps the portfolio site buildable and the engines testable in isolation.

---

## 6. The platform

### 6.1 Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 15, App Router, server-rendered** (not static) | Same framework the team knows; server components for the instructor console; route handlers for the API. Deployed as its own Vercel project alongside the static one. |
| Auth | **Better Auth** (fallback: Auth.js v5) | 2026 default for App Router; HTTP-only cookie sessions, no boilerplate; email magic-link + Google. Must also accept an **LTI launch** as an auth path (§6.5). |
| DB | **Neon (serverless Postgres)** | Scales to zero, ~free at pilot scale, first-class on Vercel. |
| ORM | **Drizzle** | TS-native, no codegen daemon, matches the repo's typed-everything style. |
| Email | **Resend** | Magic links, instructor invites. |
| Badges | **Accredible** (Open Badges 3.0) | Deepest LMS/SIS integration, strongest OB 3.0 support, from ~$45/mo. Credly is the alternative if employer-recognition matters more than portability. |
| Hosting | **Vercel** | Already there. Sim resolution is milliseconds — serverless is the right shape; no long-running compute needed until multiplayer. |

**Sign-in flow for a student (the thing you asked for):** click the class link → magic-link email *or* Google → enter class code (or arrive pre-enrolled via LTI) → land directly in Round 1. No download, no install, no license key.

### 6.2 Data model (event-sourced)

```
institution   (id, name, type: degree|non-degree)     ← drives pricing tier
user          (id, email, name, role)
course        (id, institution_id, owner_user_id, title, term)
section       (id, course_id, join_code, pack_id, engine_version,
               section_seed, seed_policy: shared|variant, config_json, opens_at, closes_at)
enrollment    (user_id, section_id, role: student|ta|instructor)

run           (id, section_id, user_id | team_id, seed, engine_version,
               status: active|submitted|graded, started_at, submitted_at)
decision      (run_id, seq, round, kind, payload_json, created_at)   ← APPEND-ONLY. The source of truth.
result        (run_id, dimensions_json, total, band, computed_at)    ← CACHE. Recomputable. Never trusted from client.
artifact      (run_id, kind: board-brief|incident-report|audit-pack, blob, sha256)
badge_issue   (user_id, section_id, provider_id, issued_at)
audit_log     (actor, action, target, at)                            ← who changed a grade, and when
```

`decision` is append-only and immutable. `result` is a derived cache that can be rebuilt from scratch at any time. **That property is the whole system's safety net.**

### 6.3 Seed policy (academic integrity vs. shared discussion)

| Policy | Seed | Use |
|---|---|---|
| `variant` *(default for graded runs)* | `hash(section_seed, user_id)` | Same pack, same difficulty distribution, **different numbers per student.** Students can't copy answers; grading stays fair. |
| `shared` | `section_seed` | Everyone gets the identical world. Use for the in-class demo run and the shared debrief. |

The professor chooses per assignment. Both are one line of config; the engine doesn't care.

### 6.4 API surface (thin, server-authoritative)

```
POST /api/runs                      start a run          → { runId, round1View }
POST /api/runs/:id/decisions        submit a round       → server validates, appends, replays, returns next view
GET  /api/runs/:id/view             current visible view (hidden state NEVER serialised to the client)
POST /api/runs/:id/submit           lock the run, compute result, generate artifacts
GET  /api/runs/:id/debrief          trace + counterfactuals + class distribution
GET  /api/sections/:id/gradebook    CSV / JSON export
GET  /api/sections/:id/analytics    aggregate decision stats → the debrief generator
```

**Non-negotiable:** `HiddenState` is never sent to the browser, not even encrypted, not even "for performance." The client renders `project(world).visible`. The engine runs on the server for anything scored. (It *may* also run client-side for instant optimistic UI — the same pure function, same seed, same result — but the server's replay is the only one that counts.)

### 6.5 LTI 1.3 (Phase 4, but designed for now)

HBP will require it; Canvas/Blackboard/Moodle shops will demand it. LTI Advantage gives:
- **OIDC launch** → the student arrives already authenticated and rostered. No class code, no magic link. This is the frictionless path.
- **NRPS** (Names & Roles) → automatic roster sync.
- **AGS** (Assignment & Grade Services) → **grade passback straight into the LMS gradebook.** This is the feature that closes faculty deals.
- **Deep Linking** → the professor drops a specific scenario into a specific assignment.

The Node LTI library ecosystem is thin and partly stale, so treat this as a real engineering project (~4–6 weeks), not an afterthought. What it needs *now* is only that `user`, `section`, and `enrollment` can be provisioned from an external identity — which the schema above already allows.

### 6.6 Cost to run (pilot scale)

Vercel Pro $20/mo · Neon ~$0–19/mo · Resend ~$0 · Accredible ~$45/mo · domain ~$2/mo → **under $100/month** until there are thousands of concurrent students. There is no GPU, no model call, no long-running compute anywhere in this product.

---

## 7. The instructor console — the actual product

Students play the simulation. **Professors buy the console.** Priority order reflects that.

1. **Create a cohort** — pick a scenario pack, set budget/rounds/difficulty, choose seed policy, get a join code and a link. Under 3 minutes, or they won't adopt.
2. **Live progress** — who's started, who's stuck, who's submitted.
3. **Gradebook** — five dimensions per student, weighted total, CSV export, LMS passback (Phase 4). **Rubric mapping is configurable** so it drops into the school's existing AoL framework rather than fighting it.
4. **Decision-trace viewer** — open any student's run and see exactly what they did and what it cost. Handles the grade appeal in 30 seconds, and it's a *teaching* tool in office hours.
5. **The debrief generator** — ← **the adoption hook.** Aggregate the section's decision logs and emit the class discussion: *"41% of you overrode the governance gate to hit the date. Here's what it cost them in Round 7. Here are the three students to call on."* Exported as slides.

Running a good debrief is the hardest part of teaching with a simulation, and it is the reason professors avoid them. **Automating the debrief is the single highest-leverage feature in this entire spec.**

---

## 8. Integrity, privacy, compliance

- **Server-authoritative scoring.** Client submits decisions; server replays. No score is ever accepted from a browser.
- **Run locking.** Once submitted, the decision log is immutable. Grade changes go through `audit_log`.
- **Hidden state never leaves the server.**
- **FERPA / data minimisation.** Store email + display name and nothing else. Under LTI, accept the platform's pseudonymous subject ID and store *no* PII at all. **Build zero data liability** — it is a procurement blocker at universities and a free win here, since the sim needs almost nothing about the student.
- **Accessibility: WCAG 2.1 AA.** Universities will ask; some will require a VPAT. Cheaper to build in than to retrofit — and the current Command Center has an open a11y audit already, so do it once, for both.
- **Data residency** — Neon supports EU regions; needed the moment a European school signs.

---

## 9. Testing and balance

### 9.1 Golden-replay locks
A recorded decision trace must always produce the same score. Any change that moves a golden score fails CI and *must* be a deliberate version bump. This is the direct descendant of the existing `fixture-sync.test.ts` discipline.

### 9.2 Property tests
- **The Causality Invariant** (§4.4) holds across N generated runs.
- Resources never go negative; the ledger always balances.
- No stochastic event can defeat a run scored "good" by the reference policy.
- Every failing gate maps to a decision that could have prevented it.

### 9.3 The balance harness — `pnpm sim:balance`
A headless runner that plays **10,000 runs per pack** with scripted policies (`optimal`, `greedy-ship-fast`, `governance-maximalist`, `random`, `paralysed`) and reports the score distribution.

Acceptance gates before a pack ships:
- `optimal` beats `random` by a wide, stable margin (the sim is learnable).
- `greedy-ship-fast` wins Rounds 1–6 and **loses badly in Round 7** (the sim teaches the lesson it claims to).
- `governance-maximalist` never ships and scores poorly (over-governance is also punished — otherwise the sim just teaches "be cautious," which is wrong and boring).
- Score variance under a *fixed* policy across seeds is meaningful but bounded — the world matters, but skill matters more.

**This harness is not optional.** An unbalanced simulation is worse than no simulation: it teaches the wrong lesson confidently. Nobody will notice until a professor's whole section learns that governance doesn't pay.

---

## 10. Phase plan

| Phase | What ships | Gate | Est. |
|---|---|---|---|
| **P0** | This spec + the content spec for pack #1 (decision menus, event deck, rubric, teaching note) — **written, reviewed, frozen** | You and one faculty reader agree the *game* is right, on paper | 1–2 wks |
| **P1** | `sim-core` + `sim-content` — pure engine, headless, no UI. Golden replays, property tests, **balance harness green.** | `pnpm sim:balance` passes the §9.3 gates. **The sim is provably a good game before a single pixel exists.** | 4–5 wks |
| **P2** | `apps/sim`: auth, DB, one playable scenario ("The Drift", 90 min), student UI reusing Command Center panels, instructor console v1 (cohort + gradebook CSV) | 3 real classrooms play it | 5–6 wks |
| **P3** | The seven-round campaign on the *same engine* (mostly UI + content), full debrief + counterfactuals | A professor assigns it for a grade | 5–6 wks |
| **P4** | LTI 1.3 (launch, NRPS, AGS passback), badges, debrief generator, analytics | Ready for an HBP partner conversation | 5–6 wks |
| **P5** | Multiplayer ("The Room") — four roles, joint resolution. The event log already supports it. | Only when funded or partnered | 8–12 wks |

**P1 is the whole bet.** If the engine is deterministic, replayable, and balanced, everything after it is conventional web engineering. If it isn't, no amount of UI saves it.

---

## 11. Open decisions — I need these from you before P0 closes

1. **Product name and domain.** "AI Command Center" is the portfolio artifact; the sim needs its own identity (and a domain that isn't your personal one, if you ever want to sell or license it).
2. **Round count for the MBA campaign.** Seven stages ≠ seven sessions. Is this a **4-week module** (rounds batched, ~3 sittings) or a **10-week course spine** (one round per week)? This changes the pacing, the event deck, and the price tier.
3. **The faculty co-author.** Who? This is the highest-value unresolved item in the whole plan — they validate the game, they legitimise the badge, and they are pilot #1. Find them during P0, not after P3.
4. **Entity.** If professors' institutions are going to pay invoices and students' data is going to touch a database, this wants to be a company, not `sudeeplalka.com`. Worth deciding before the first pilot, because retrofitting it is painful.

---

## 12. What I am explicitly *not* proposing

- Not rewriting the Command Center. It becomes the instrument panel; `apps/web` keeps shipping as-is.
- Not reimplementing a single formula that `program-core` already owns.
- Not an LLM in the simulation loop. Non-deterministic scoring is ungradeable, unappealable, and unbalanceable — it would destroy the replay architecture, which is the only real moat here. (An LLM is fine *outside* the loop: a debrief-writing assistant, a "coach" that explains your trace. Never a judge.)
- Not multiplayer in v1.
- Not building an LMS. Integrate with theirs.

---

## 13. The build toolchain (skills, connectors, and what's missing)

### Already connected — use these
| Tool | Used for |
|---|---|
| **Vercel MCP** | Deploy `apps/sim`, read build logs, pull **runtime errors** and logs, search Vercel docs. Both apps deploy from this one repo. |
| **Chrome MCP** | Play the sim in a real browser during development; screenshot the student flow; verify the debrief renders. |
| **Google Drive / Gmail / Calendar** | Faculty pilot outreach, syllabus and teaching-note drafts, scheduling the pilot classes. |

### Recommended to add (cards above)
| Add | Why it earns its place here |
|---|---|
| **Engineering** plugin | `architecture` + `system-design` for the ADRs this spec implies; **`testing-strategy` is the important one** — the golden-replay locks and the Causality Invariant are the whole moat; `code-review` on every `sim-core` PR; `deploy-checklist` because a bad deploy mid-term changes grades. |
| **Design** plugin | The student UI has to be *beautiful* — professors are choosing between this and a Harvard title. `design-system` keeps one language across `apps/web` and `apps/sim`; `ux-copy` writes the in-round narrative; **`accessibility-review` clears WCAG 2.1 AA**, which universities will ask for in procurement (§8). |
| **Product Management** plugin | `write-spec` for each scenario pack (packs are the second SKU); `competitive-brief` for the Harvard Business Impact pitch; `roadmap-update` across P0–P5. |
| **Sentry** connector | **Non-negotiable once real students are playing.** A crash mid-round in a graded assignment is a support incident with a professor. |
| **Stripe** connector | Institutional invoices, per-seat billing, course site licences. Needed the moment pilot #1 converts to paid. |
| **Figma** connector | Design the student round-view and the instructor console properly before building them; `get_design_context` turns them into code. |
| **Exa** connector | Code-docs search — Better Auth, Drizzle, Neon, LTI 1.3 all have thin or fast-moving docs. |

### Already in the repo's skill set
`skill-creator` · `web-artifacts-builder` · `theme-factory` · `canvas-design` · `doc-coauthoring` · `xlsx`/`docx`/`pptx` (the **debrief-slide generator** in §7.5 outputs `.pptx` — that skill is the fastest path).

### The gap: there is no Postgres/Neon MCP in the registry
Checked — nothing for Neon, Supabase, or generic Postgres. **This is fine.** Drizzle Kit runs from the shell (`drizzle-kit generate` / `push` / `studio`), migrations live in the repo as SQL, and Neon's branching gives a throwaway DB per PR. No connector needed; just don't expect an MCP to manage the schema.

### One rule for the toolchain
Every one of these is a *development* tool. **None of them may appear in the simulation's runtime path.** `sim-core` has zero dependencies and no network. That is the determinism contract (§4), and it is the only thing protecting the gradebook.

---

**Bottom line:** the whole product rests on one property — a pure, seeded, versioned engine whose runs are a seed plus a decision list. Get that right in P1 and the gradebook, the counterfactual debrief, the anti-cheat, the class analytics, and multiplayer all come almost for free. Get it wrong and none of them are buildable.
