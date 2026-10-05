# Data and Governance interface upgrade

Implemented in the isolated portfolio-upgrade worktree. No engine formulas changed and no deployment performed by this agent.

## Data: PF17, PF20, PF23, PF30 and PF38

- CorpusView retains its existing intake, rule profiles, findings engine, duplicate resolution, cleaning proof and dossier. The path now names intake → findings → fixes → approval review and links directly to those sections.
- A desktop checkpoint pins the actual ready percentage, original baseline, percentage-point change, mean-score change, open findings and next action. A selected file also shows its actual baseline/current score. These values derive from the same `recomputeCorpus` result used by the matrix and gates; no independent success count or fabricated animation controls readiness.
- Findings appear before the optional spatial layer. Selecting a finding's document, matrix cell, file name, 2D point, 3D point or file card shares the existing selectedId. File/matrix/list controls expose selection state and the matrix is a named horizontally scrollable region with table headers and caption.
- Accepted risk remains distinct from fixed. The empty filtered backlog no longer claims the entire corpus is clean, and the matrix explains that accepted-risk findings retain their score penalty.
- The optional atlas defaults closed. Opening 3D dynamically imports its code; failure offers retry, 2D and file-list paths without discarding corpus state. Closing the disclosure unmounts the atlas. The 2D view uses a static selection ring. The 3D hover pulse is bounded to one 1.2-second cycle; pulse and inertia/reset work cancel on preference, visibility, viewport, resize and unmount changes. Duplicate-resolution scrolling follows reduced-motion preference.
- The existing analysis pipeline no longer waits an artificial 300ms. Generation guards cancel publication from obsolete file parsing or analysis after reset/profile replacement/unmount.
- Data's tooltip now reexports the shared accessible implementation; KPI and rulebook explanations provide metric-specific labels. File upload remains keyboard reachable with visible focus on the drop area.
- Canvas fallback follow-up: a missing or blocked 2D context now produces an explicit Data message with its 2D/file-list alternatives. The selected document, scores and findings remain in the parent. RAG's corresponding context failure enters its existing optional-view error boundary, which offers in-place retry/close and retains the document and text evidence. Shared acquisition tests cover absent, blocked and working context responses; browser fault injection remains unverified.

## Governance: PF17, PF20, PF23 and PF32

- ExecutiveCockpit distinguishes the embedded sample registry or API snapshot from the current program. Its next action comes from actual overdue reviews, critical cases and pending reviews, with a compact path through cases, policies, evaluation, review and evidence.
- Recorded high-risk events link back to their use-case ID. Metrics have retry and stale-request cleanup. Narrow KPI grids reflow to one column. Shared metric help is available on focus/touch.
- ActivityTicker no longer invents random live events or relative timestamps. It renders clearly labeled fixed examples, complete by default, with explicit bounded playback/manual steps and visibility/reduced-motion handling.
- PipelineFlow keeps the computed decision and each recorded stage detail visible immediately. Optional playback only highlights explanatory progress, uses the shared owner and resets when the result identity changes. The six stages reflow instead of overflowing a phone.
- Charts render static geometry and have equivalent textual risk, decision and daily-activity values.

## Governance app workflow: PF08, PF19, PF32 and PF44

- Repaired the invalid `/use cases/...` registry links. Detail uses the existing registry's `?case=ID` selection, which also supports records created in a browser session on a static export. Seeded detail routes remain available.
- Registration progresses through purpose/owner, risk context and input review. An actual API result produces a receipt with case ID, risk tier, controls and the session-persistence boundary. No redirect claims success before the API responds.
- Case detail carries identity into the playground, policy review, human review, audit and evidence. Review/event links preserve both case and event IDs. New browser-run events become inspectable session records and review decisions update their corresponding event status. These records explicitly remain outside the embedded sample hash chain.
- Analyst/reviewer/auditor/admin permissions gate the relevant mutation handlers and controls. Disabled controls explain their required role. Case rescoring, review actions and policy changes have success/error receipts. Browser roles are explained as a demonstration, not real authentication.
- Policy UI uses the API's returned enabled value. It no longer inverts an already-mutated static record a second time. The sample policy toggle is correctly described as registry configuration, separate from the fixed detector model.
- Evidence generation honors the requested period and includes current case/policy snapshots, date-filtered events/reviews, source case IDs and missing evaluation history. Coverage counts sections with available records; it never certifies controls or release. Historical embedded reports retain their supplied values but disclose missing source IDs and lack of fresh verification. Requested date ordering is validated.
- Audit begins in an explicit not-checked state. The static action reads an embedded integrity snapshot, while a backend result is labeled as API-provided. Neither claims new browser-session events were freshly hash-verified. Static latency fields remain intentionally modeled and are labeled accordingly.
- Fixed model-settings snapshot identity for useSyncExternalStore to prevent repeated re-rendering. Denied storage writes return failure instead of a false saved receipt. Provider configuration is distinguished from the provider actually used on the run; fallback remains explicit.
- Settings has associated labels, provider pressed states, save feedback, a remove-key control and direct task return. Architecture documentation has anchored contents, semantic readable sections, a first-success task, and accurate static-mode/evidence/role limits.
- Browser follow-up: the current-program panel shows Not assessed when no framed initiative exists. An incomplete recorded Data, Build or Operate assessment stays Not assessed, and the overall displayed verdict remains Pending evidence. Missing sections are explicit in the visible, printed and copied summary; provisional controls/findings do not imply clearance. The existing decision formulas and lifecycle persistence remain unchanged.
- Dashboard KPI help now identifies snapshot counts and modeled risk. Enabled policy configuration is distinct from enforcement by the static Playground detectors; session edits do not silently pretend to recalculate the executive snapshot.
- Playground policy/evaluation links use shared `/govern` navigation helpers and retain the originating case. Run, detector and audit confidence displays share fractional-to-percent formatting. Reporting-period inputs use the same state updater for date input/change events; receipts and report details use UTC calendar dates, preventing midnight values from displaying the previous local day.

## Lifecycle handoffs: PF08 and PF29

- StageThread adds a compact stage-specific source line: framing assumptions, local data rules, run-specific Build evidence, modeled Deploy/Realize outputs, separate governance scopes and seeded Operate telemetry. Sample/current program identity remains visible without adding another title.
- Data and Build handoffs expose source/gate details and unresolved/accepted-risk work from their existing contracts. Data makes program-model source labels distinct from file-level corpus gates. Build points back to the run's actual provider and timing evidence.
- NextStageCTA carries open blockers owned by the current stage and respects the next stage's lock. Continuing is explicitly exploration, not deployment approval. Empty modeled blocker lists no longer imply a real production release was certified.

## Validation and limits

- Data package typecheck passed; 94 existing regression tests passed across 14 files.
- Governance package typecheck passed before app rollout; full-web typechecking covers the final integrations. Governance regression suite: 32 tests passed across 5 files, including 13 new tests for stable/denied settings snapshots, policy confirmation, evidence dates/filtering/source contents, invalid periods, run→event identity, missing stage records, legitimate zero-valued assessments, route namespace/context, confidence scale and UTC calendar boundaries. Latest scoped Governance lint passed without warnings.
- No external dependency added. Data and Governance now declare their existing internal design-system dependency; a frozen offline install links it. External dependency versions are unchanged.
- No browser payload/LCP/INP/CLS improvement is claimed. PF38's route performance measurements remain with parent verification; this patch establishes lazy boundaries and stops avoidable invisible work.
- Parent browser validation confirmed Data sample→selected finding→fix with score 82→88, readiness 0→7% and mean score 57→58. The atlas uses Canvas2D, not WebGL; the matrix/list remain usable without a canvas. Import-failure retry still requires a deliberate browser fault injection to verify network recovery.
- Current-program engine and sample registry remain separate. Scoring and detector formulas were not rewritten. Browser-session records reset on a full refresh, and the embedded executive snapshot does not pretend to be a live aggregate of session edits.
