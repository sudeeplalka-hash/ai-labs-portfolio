# Portfolio upgrade browser verification

Verified on 2026-10-05 in the Codex in-app Chromium browser against the local Next.js development server. These are interaction and layout checks, not production performance measurements or a WCAG conformance claim.

## Complete paths exercised

- Home → catalog search `portfolio` → tool → browser Back: the three filtered results, URL query, originating card focus and scroll position return together.
- Industry selection with incompatible filters: an explicit zero-result explanation and recovery controls remain available.
- Assumptions dialog: initial focus, Tab/Shift+Tab containment, Escape, trigger focus restoration and released body scroll lock.
- Command palette: search, no results, End selects and scrolls to the last option, stationary pointer does not override keyboard selection, Escape restores its trigger.
- Mobile navigation: opening at 390px and resizing to desktop closes the drawer, releases body scroll lock and focuses the visible active sidebar link.
- ROI: changing annual value from 1.4M to 1M changes NPV from approximately 1.91M to 1.07M; the baseline delta agrees. Tornado keyboard activation focuses the matching input. Restore baseline, share/reload and export disclosure dismissal work.
- Adoption: projected readiness progresses 63 → 68 → 75 while current readiness remains 63 and the sponsor assumption remains unchanged. Reset returns the projection to its baseline.
- Onboarding: the default access delay shows 46 = 11 + 35 days; alternate delays and preprovisioning reconcile the displayed timing and cost.
- Storyline: disputes delivery step 5 opens Compliance with the scenario, story and step in the URL and the correct selected industry. Previous/next context is visible.
- Data: load 14 sample files → select vendor_onboarding_kb.md → strip repeated boilerplate. Its score changes 82 → 88, ready proportion 0 → 7%, mean 57 → 58 and open findings 68 → 67. Selected-file context remains synchronized. Optional 2D → 3D → 2D preserves the selected file and score.
- RAG: load travel policy → ask about reimbursement receipts → inspect C1 → return to answer. Evidence, answer, quality and trace agree. The optional spatial layer loads on demand, supports keyboard point selection and explicit rotate/pause/close.
- Governance: sample financial recommendation → ESCALATE → linked human review → Reject with rationale → original audit event. Event identity is retained and the audit review status changes to rejected; the receipt explains browser-session persistence.
- Governance registration: purpose/owner → risk context → review → register → newly created case detail. Entered values, calculated tier/score, controls and case ID are retained and reachable.
- Governance settings: switching provider and back persists the selected setting without a rendering loop. No API key or external provider request was used.
- Capacity: resolving one skill removes it from the next-action list; resolving all three shows zero unresolved gaps, 21-week delivery and 676k monthly cost under the default contract assumptions.

## Responsive evidence

Build, Cost Forecaster, Stakeholders, Capacity, Talent, Traces, Answers, Governance overview and Governance Playground fit 320/360/390/430px viewport widths. The document width remained within the viewport; intentional data-table scrolling stayed inside its container. Overview measurements were taken after its actual content loaded.

All eight agent tools and EvalBench were separately verified at 320/390/430px; detailed interaction receipts are in upgrade-agents.md. Home and Corpus were inspected at 390px. Desktop home and featured-case screenshots, plus the mobile home screenshot, are saved in the task outputs.

## Limits and follow-up

- Production builds, hosted identity/redirect checks and asset comparisons are tracked separately. Development timings are not production Web Vitals.
- Real screen-reader, Windows forced-colors, OS reduced-motion and browser 200% zoom journeys have not been run. Motion cancellation and semantics have source/unit coverage; that does not establish assistive-technology conformance.
- Normal optional-view loading and state preservation passed. Deliberate failed chunk/PDF-worker recovery was source-reviewed, not browser fault-injected.
- No external API-provider call was made. Browser examples use deterministic local/sample mode.
- Existing Recharts React development deprecation warnings remain; no claim of a warning-free browser console is made.
