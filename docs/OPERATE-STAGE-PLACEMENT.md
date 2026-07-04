# Where does "Operate" go? — the placement thought process

**Question:** Where exactly does the AI Production Observability Console (OPS-01) belong in the enterprise AI program lifecycle? Is it a continuous-monitoring stage after Realize?

**Short answer:** Yes — place it as the stage **after Realize** whose defining feature is the arrow **back to Frame**. That loop-back is the whole point: it turns the lifecycle spine from a line into a cycle. But "after Realize" and "continuous" are both true, and the honest design reconciles them. The full reasoning follows.

---

## 1. The current spine, and what it's missing

The lifecycle today is linear and stops at launch:

```
Frame → Data → Build → Deploy → Govern → Realize
```

Nothing follows Realize. There is no "Operate / Observe" loop — the place where a deployed system actually lives. Every "monitor" already in the portfolio sits one altitude *above* the running model (EL-04 monitors program health, C3-4 vendor risk, C3-1 the portfolio); none watches the model itself in production.

---

## 2. The clean framing: Operate is the missing third leg of the "life after launch" triad

The decisive observation: the last three stages are **all post-deployment concerns**, and each answers a different question about a system that's already live:

| Stage | The question it answers | Concern |
|---|---|---|
| **Govern** | Is it *allowed*? | compliant, controlled |
| **Realize** | Is it *worth it*? | value, adoption |
| **Operate** | Is it *still working*? | healthy, drift-free, grounded |

The portfolio has two of the three legs of "running AI in production." **Observability is the third.** This is the cleanest justification for OPS-01 existing at all — it is not "a 7th thing bolted on," it is the operational leg the triad is obviously missing. Framing it this way also pre-empts Fable's "don't add labs" objection: this isn't breadth, it's completing a set.

---

## 3. The subtlety: "after Realize" vs "continuous" — and why both are true

There's a genuine design tension in *where exactly* on the line it sits:

- **Argument for "after Realize":** Realize is the last forward stage; Operate is the continuous overlay that then loops back to Frame. This is the *close-the-loop* view.
- **Argument for "starts at Deploy":** Day-2 observability actually begins the instant you deploy — it does **not** wait for value to be realized. Monitoring is live from launch, running *concurrently* with Govern and Realize.

Both are correct. The reconciliation:

```
 Frame → Data → Build → Deploy → Govern → Realize → Operate ┐
   ▲                     └──────── continuous ────────┘      │
   └──────────── retrain / re-index / re-scope ◄─────────────┘
                 (drift · staleness · SLO breach)
```

- **Semantically:** Operate is a **continuous overlay** that begins at Deploy and runs across Govern and Realize forever.
- **Visually / on the rail:** render it as the **capstone after Realize**, because (a) that's where the feedback arrow naturally originates and (b) it reads cleanly as the last stage on a linear spine.

**The rule of thumb: *placed after Realize, scoped from Deploy onward.***

---

## 4. Why the loop-back matters more than the box

The most important element is not the Operate box — it's the **arrow from Operate back to Frame/Build.** A drift breach or a stale index triggers a re-scope (→ Frame) or a retrain/re-index (→ Build). That closed loop is itself a maturity signal:

> A lifecycle that ends at Realize is a **project**. One that loops through Operate is a **program.** It's the difference between *"we ship AI"* and *"we run AI."*

That single feedback arrow is arguably the most senior thing on the whole map — it encodes a closed-loop operating model, which is exactly what a delivery VP is hiring for.

---

## 5. Concrete routing (how it wires in Collection 1)

- A new **`/operate`** stage, **seventh** on the lifecycle rail, positioned after Realize.
- Takes the **`ProgramState` handoff from Deploy** — the system you shipped is the system you watch (not a fresh, disconnected demo).
- On an SLO breach it writes **two feedback outputs**:
  - **→ Realize:** value-at-risk if the degradation goes unaddressed.
  - **→ Frame / Build:** a retrain / re-index / re-scope trigger that starts the next cycle.
- And it emits the operational paperwork (weekly ops review, incident report) via the shared artifact engine.

This makes the handoff chain honest end-to-end: Build → Deploy → **Operate watches the very thing that was built and deployed** → the loop feeds the next Frame.

---

## 6. The refinement this implies for the spec

The original `SPEC-day2-observability-console.md` placed Operate **"conceptually between Deploy and Realize"** (Option A). The reasoning above supersedes that: the better call is

> **Loop-closing 7th stage, *after* Realize, scoped from Deploy onward, with the defining feedback arrow back to Frame.**

The `ProgramState` wiring note should be updated to match (Deploy → Operate handoff; Operate → Realize + Frame feedback).

---

## 7. The one-sentence version

*Operate is the missing third leg of the post-launch triad (allowed / worth-it / still-working); render it as the capstone after Realize but scope it from Deploy onward, and make its feedback arrow back to Frame the hero — because that arrow is what turns a lifecycle line into a lifecycle loop, and a project into a program.*
