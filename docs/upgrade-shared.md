# Shared interface upgrade

Implemented in the isolated portfolio-upgrade worktree. No deployment or commit.

## Shared outcomes

- PF01: drawer, palette and mobile sidebar share native modal-dialog semantics, top-layer stacking and background inertness. Explicit Tab boundaries keep focus within content rather than allowing browser-chrome focus. Scroll locks count nested owners; cleanup restores the prior overflow and visible trigger or a page focus fallback.
- PF03/15: hidden compact navigation is unmounted. Breakpoint and route changes close the mobile sidebar. Header identity, subpage titles and next actions reflow at narrow widths.
- PF07: /builds now belongs to the standalone route family; its own instrument supplies the one coherent heading/navigation system.
- PF09/10: shared semantic type, surface, spacing, chart and motion tokens remain in the existing design system. InstrumentShell supplies a reflowing header, breadcrumb, skip link, decision, provenance, controls/actions, method and related slots. It has no Next.js dependency. Family owners integrate it into existing tools.
- PF10/22: DecisionSummary and Provenance present the computed decision, drivers and next action. They require caller-supplied execution mode and evidence; no dates, live claims or source confidence are invented.
- PF16: palette exposes a combobox/listbox, stable active descendant, visible active result, no-results feedback and keyboard selection.
- PF18: export is a keyboard-accessible disclosure with awaited operations and error feedback; canceled file selection settles cleanly. CopyButton reports actual clipboard success and offers selectable text when permission is denied.
- PF17: MetricTooltip uses an accessible persistent description, focus/touch access, portal positioning, Escape and hover persistence. Data and Governance consumers use this same shared primitive.
- PF17/PF41 follow-up: pointer exit no longer closes help while its trigger or panel owns keyboard focus. Open help uses one named scroll region and one description text node, without an aria-hidden focus target. Arrow Down enters the region; arrow/Page keys scroll; Tab or Escape closes it and returns to the trigger. Delayed dismissal rechecks current ownership, so moving focus into the portaled panel cannot race a stale close timer.
- PF19: Tabs have keyboard navigation and valid tab/panel semantics. SectionTabs correctly describes a button group. ToolbarButton emits pressed state only when an active value is explicitly supplied.
- PF20: ScatterPlot exposes named keyboard-selectable points, selection state, meaningful numeric labels and an expandable table. Shared chart color tokens and readable axes normalize legacy escaped labels. Static KPI/panel introductions no longer animate on every mount.
- PF23: usePlayback is a presentation clock independent of computed facts. Default is the complete outcome; replay is explicit, bounded and controllable. It cancels timers on hidden documents, reduced-motion changes, resize and caller-provided offscreen state. Exported useReducedMotion, usePageVisible, useInViewport and scrollToElement support consistent consumers. PlaybackControls offers step, outcome, reset, speed and pause without distorting measured timings.
- PF29/37: Home connects its checkpoint to the program journey. LabGuide has anchored task-led contents, a first-success action, semantic print-friendly sections and a return link to the corresponding tool. An optional taskHref can override automatic guide-path mapping.

## APIs

All new shared APIs export from `@labs/design-system`: `InstrumentShell`, `DecisionSummary`, `Provenance`, `ToggleGroup`, `CopyButton`, `PlaybackControls`, `usePlayback`, `useReducedMotion`, `usePageVisible`, `useInViewport`, `scrollToElement`, `MOTION`, `CHART_TOKENS` and `Modal`.

`usePlayback({steps, intervalMs?, initiallyComplete?, visible?})` returns `index` (completed steps 0..steps), `playing`, `speed`, `reducedMotion`, `play`, `pause`, `next`, `reset`, `complete`, `replay`, `setIndex`, `setSpeed`. For a new result with an unchanged step count, callers invoke stable `complete()` or `reset()` themselves. Playback never changes engine state.

Existing ScatterPlot, Drawer, Tooltip, ToolbarButton, CommandPalette and ExportMenu call sites remain compatible. ScatterPlot gains optional point labels and x value formatting. Export callbacks may return promises.

## Validation and boundaries

- Design-system unit tests: 58 passing across 11 files, including playback boundary/delay/label, nested scroll-lock, help focus-transfer/dismissal, and absent/blocked/available canvas acquisition regressions.
- Design-system package typecheck passed after the main primitives and CopyButton; final complete application verification is coordinated by the root agent.
- Parent browser verification passed initial dialog focus, Shift+Tab close→last action, last Tab→close, Escape→Assumptions trigger and restored body scrolling. Unit tests prove scroll ownership and playback arithmetic; browser checks validate actual focus behavior.
- No animation dependency or external package added. React review checklist applied to effects, state, accessibility and cleanup.
- Use actual caller evidence for provenance. Generic reusable summaries cannot certify engine correctness or approve a real deployment.
- Follow-up checks: full-web and all three affected package typechecks passed before the shared canvas acquisition extraction; the final full-web check covers that extraction too. Data 94/94 and RAG 38/38 engine regressions passed. These Node-only suites do not simulate DOM keyboard scrolling or a React error boundary; final browser checks of the help region and induced canvas failure remain distinct acceptance items. No test DOM dependency was added.
