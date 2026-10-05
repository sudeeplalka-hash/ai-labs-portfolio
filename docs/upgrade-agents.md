# Agent tools and evaluation upgrade record

Implemented in the isolated portfolio-upgrade checkout. No engine formulas, fixtures, dependencies, commits, or deployments were changed by this work.

## Backlog mapping

| Items | Implemented behavior |
|---|---|
| PF06, PF18–20 | All eight agent tools and EvalBench use InstrumentShell, decision summaries, breadcrumbs, explicit input/method provenance, semantic result tables, and keyboard-operable controls. Agent tools remain SIMULATED; EvalBench is live browser computation over a seeded synthetic corpus. Authored dates are not presented as verification dates. |
| PF25 | Protocol ranking uses the existing weighted scorer. Pinned baseline stores answers and weights; the receipt identifies changed inputs, score deltas, and the actual winner transition. Only rank changes animate, using a short FLIP translation, with reduced-motion handling and cancellation on visibility/resize. Tables preserve the full scores and radar values. Shared links/imports validate all six answers and weights before applying; exports and links preserve the pinned baseline. |
| PF26 | Orchestration uses one task identity with synchronized handoff buttons, agent state, selected message, timeline and authored result. Play/Pause, Previous, Step, Show all, speed, reset and a step slider use the shared presentation clock. Complete cost/quality/latency values appear immediately. Playback never fabricates accrued spend, elapsed model latency, or an external run. A complete static timeline/result remains available. |
| PF35 | MCP has request/validation/response explanations, typed error recovery, history inspection that preserves the composer, UTF-8 byte counts, finite-number/enum validation, Unicode-safe shared setups and custom-tool definitions. Loop Inspector has shared playback and complete trace tables. Structured Output preserves edited drafts and explicitly refuses to present supplied outputs as extraction of custom text; it shows authored failed/repaired fields with copy/wrap controls. Context Memory compares actual retained/lost facts across a pinned turn. HITL shows changed queue routes, selected-item detail and full queue/policy tables. Cost Simulator shows dated illustrative rates, pinned workload comparison, exact numeric inputs, a savings ladder and consistent batch-adjusted cost decomposition. |
| PF36 | EvalBench puts threshold economics, confusion counts, review/missed-loss costs and a pinned baseline first. ROC/PR markers and labels follow the selected threshold; precision is undefined when no transactions are flagged. Curve/calibration tables and JSON/CSV exports expose the calculation. The method explicitly discloses in-sample evaluation and the 99-point sampled threshold minimum. |
| PF22–23, PF43 | Shared explanation controls pause on hidden page, resize, and offscreen explanation controls/stage; reduced-motion mode exposes completion without animation. Code panels wrap by default, offer a static text alternative, and report clipboard failure. Protocol, cost, HITL and evaluation exports include current assumptions and baseline/method metadata. |
| PF41–42 | Full app typecheck and the targeted browser/test evidence below. |

The optional explanation transport is confined to presentation. Existing scenarios, models, arithmetic, pricing snapshots, queues, protocol sensitivity, orchestration engines and seeded evaluation computation are preserved.

## Additional motion fixes assigned during verification

- StrategyPlanningView routes section scrolling through shared scrollToElement so reduced-motion preference is respected.
- ReadinessGauge now shows the current rounded score and matching arc immediately, with a semantic meter. Removed its count-up plus lagging CSS arc transition; it no longer reports an intermediate score during animation.

## Verification performed

- Full web typecheck: `node node_modules/typescript/bin/tsc --noEmit --pretty false`, from apps/web, passed with exit 0 (sessions 79291 and 40658). Earlier failures belonged to concurrently edited engagement/roadmap files and were sent to their owners; they were resolved before the passing checks.
- Existing package tests used `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=1` in each package, sequentially: program-core 97 tests/8 files; lab-framing 22/3; lab-deploy 12/2; lab-realize 51/3. All 182 tests passed. Root separately owns engine and full-suite evidence.
- Local browser verification used localhost:3101 in a separate Chrome tab. IAB was unavailable to this subagent. No hosted deployment was used for implementation verification.
- Protocol at 1440: default MCP 4.8, changing only tools to 1–3 yielded Function calling 5.0 with actual +1.7 delta and MCP −1.6; pinning reset deltas; copied URL restored the current recommendation after hydration. Invalid answer configuration returned a usable default decision. No console errors. Screenshot inspected for hierarchy and wrapping.
- Orchestration at 1440: Step revealed decomposition; Play exposed Pause; selecting Analyst paused at 3/6 and updated the selected task, working agent, and Researcher→Analyst envelope. Static complete outcome retained 19 quality points, 2.4× cost and 2.3× latency.
- EvalBench at 1440: threshold 0.5 yielded 101 flags/63 misses and $27,268; Inspect lowest-cost moved to 0.11 with 312 flags/7 misses and $5,436. ROC/PR labels matched the same counts. At threshold 1, 0 flags/148 misses, undefined precision and $62,160 were shown. Downloaded JSON was read from disk and matched the screen, including baseline $27,268. Browser download-event wait timed out even though the actual download succeeded; file inspection confirmed success.
- Structured Output: entered synthetic custom draft; Inspect example preserved it and stated that it could not be extracted. Restore + hard example + Show all displayed the failed JSON, three validation errors, retry and accepted result with four changed fields.
- MCP: empty dispute_id produced a named -32602 error. Correcting it produced an OK second call. Selecting the previous error preserved the corrected composer. Shared DSP-é input survived reload exactly. No console errors in this flow.
- All nine owned route defaults were loaded at 320px: protocol-selection, orchestration, eval-bench, context-memory, loop-inspector, structured-output, cost-simulator, hitl and mcp-playground. Each reported document scrollWidth 310 for viewport width 320; no page-level horizontal overflow.
- All nine owned route defaults were also checked at 390 and 430, scrollWidth 380 and 420 respectively. A navigation timeout initially left the previous page visible during the HITL pass; it was repeated and the actual HITL URL verified before recording the result. At 430 the protocol scoring drawer opened with Close focused and only dialog content exposed in the accessibility tree.
- At 430, MCP malformed injection on the string-only get_dispute tool produced a typed string error and wrapped request/response frames without overflow. Cost batching changed the monthly cost from $244.1952 to $207.5659; expanded bridge/rate tables remained within the page. HITL L3 changed 15 paths, review load 20→5, throughput 100→220 and exposure 0→40k; selected edge item 8 explained its $20k modeled severity and baseline human-review path. The phone screenshot was visually inspected. Browser viewport override was reset after testing.
- The final web typecheck after StrategyPlanningView and ReadinessGauge changes passed (session 14892, exit 0); the final recheck after viewport-aware protocol ranking also passed (4917, exit 0). Scoped `git diff --check` passed; owned TSX files were validated as UTF-8 without NUL bytes.

## Practical limits

- Recharts 2.12.7 emits existing React 18 development warnings for defaultProps on XAxis/YAxis/ReferenceDot/ReferenceLine. No crash or changed numerical result was observed. No dependency migration was attempted in this family change.
- This record distinguishes local checks from deployed behavior. It is not evidence of production performance, held-out model validation, screen-reader certification, or real agent/network execution.
- Reduced-motion/offscreen behavior uses the shared hook and was source-reviewed; OS preference and hidden-tab emulation were not yet exercised by this subagent. Full release checklist remains with the root agent.
