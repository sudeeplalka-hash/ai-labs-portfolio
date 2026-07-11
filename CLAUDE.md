# CLAUDE.md — operating rules for this repo (read before building anything)

## Rule 1: THE REDUNDANCY GATE (added 2026-07-10 after a costly lesson)

Before building, reviving, deploying, or registering ANY lab, app, or capability:

1. **Grep first.** Search `apps/web/app/` routes, `packages/*/src`, and
   `packages/kit/src/registry.ts` for the capability. The Command Center has
   absorbed and refined earlier standalone projects; folders under
   `~/Claude/Projects/` (RAG Evaluator, AI Governance Guardrails Project, ...)
   are largely ANCESTORS of what already ships here, not new material.
2. **Assume planning docs are stale.** `PORTFOLIO-EXPANSION-PROPOSALS.md` and
   similar files have already twice recommended building things that existed
   (their own correction sections admit it). Verify against code, not docs.
3. **No duplicate public surfaces.** One capability, one canonical home. A
   standalone deploy of something the Command Center already does dilutes the
   portfolio and creates maintenance debt. The 2026-07-10 case: standalone
   governance + RAG sites were deployed, then retired the same day when review
   showed /govern and /build were their refined successors.
4. **No claim without reachable evidence.** A registry row's href must be
   verified publicly reachable (not a private repo, not an unpublished link)
   before the row ships. Collection 5 entries require working public proof.

## Rule 2: Verify, then ship

- Engines change → run the package's vitest + the probe pattern (see
  HANDOFF-2026-07-09 §4 for the corpus engine truths).
- After every push: check the Vercel deployment state and the footer build
  stamp (`build <sha>`) before debugging anything "stale".
- The full `next build` runs ONLY on Vercel; local sandboxes typecheck via
  per-package `tsc` and the turbo tasks.

## Rule 3: Sandbox hazards (Claude sessions)

- Mount writes need the reliable-write ritual: write → sha256 verify → zero-NUL
  check. `.git` index/locks may be phantom-corrupted; commit via
  `GIT_INDEX_FILE` plumbing + direct ref write. Never trust mount `git status`.
- `/tmp` is wiped on VM recycle; rebuild toolchain from `git archive HEAD`.
- Background processes are killed silently; run foreground with `timeout 40`.
