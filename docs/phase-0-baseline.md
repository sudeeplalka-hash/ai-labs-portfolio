# Phase 0 — Repo Hygiene & Baseline

Read-only stabilization pass before Phase 1 (lifecycle coherence). No product
behavior was changed. This note records what was inspected, what was cleaned,
and the manual steps that must be run on a machine with write access (the
analysis sandbox mounts the repo read-only for deletions).

## Baseline facts

- Framework: Next.js 14 (App Router), static export (`output: "export"`, `trailingSlash: true`, `images.unoptimized`).
- Package manager: pnpm 9.7.0; Turborepo (`turbo.json`).
- Scripts (root): `dev`, `build`, `lint`, `test`, `typecheck` (all via `turbo run`).
- Scripts (apps/web): `dev`, `build` (`next build`), `lint` (`next lint`), `typecheck` (`tsc --noEmit`).
- `apps/web/next.config.mjs` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`.

## Hidden / orphaned files

- Found: 94 `.fuse_hidden*` files under `apps/web/app/build/**` and `packages/lab-rag/src/components/**` (FUSE mount ghosts — orphaned inodes from files unlinked while held open).
- Referenced anywhere? No (grep for `fuse_hidden` across `apps` + `packages/*/src` returns nothing). They are dotfiles, so Next.js does not compile them; harmless but untidy.
- Action taken here: none possible — sandbox mount is read-only for deletes (`rm` → "Operation not permitted"). These may not even exist on the native Windows filesystem.
- **Manual cleanup (run locally):**
  ```bash
  find . -not -path '*/node_modules/*' -name ".fuse_hidden*" -delete
  ```

## Retired Govern routes — already handled

All three are already clean, static-export-safe **client redirect stubs** and are **not linked anywhere** (no references in code/nav). No action needed.

| Route | Status | Redirects to |
|---|---|---|
| `/govern/simulator` | Present, unlinked, redirect-only | `/govern` |
| `/govern/tour` | Present, unlinked, redirect-only | `/govern` |
| `/govern/realize` | Present, unlinked, redirect-only | `/realize` |

(The Phase 0 roadmap suggested `/govern/simulator → /govern/playground`; the existing redirect points to `/govern`. Left as-is to avoid a needless behavior change — both are valid.)

## Duplicate / superseded components

- `ValueWaterfall.tsx` — **active**. Imported and rendered by `RealizeView.tsx`. Keep.
- `ValueRiver.tsx` — **superseded / unused**. Only re-exported from `packages/lab-realize/src/index.ts`; no component imports or renders it. Marked `@deprecated` in this pass.
- **Manual cleanup (run locally):** delete `packages/lab-realize/src/components/ValueRiver.tsx` and remove its `export { ValueRiver } from "./components/ValueRiver";` line from `packages/lab-realize/src/index.ts`.

## Verification scripts

Standalone manual dev harnesses (console-log assertions on the engines). Not imported anywhere and not referenced by any `package.json` script, so they do not affect the app build.

| File | Purpose | Note |
|---|---|---|
| `packages/lab-deploy/verify.ts` | Ad-hoc checks on the deploy engine (`deriveBaseline`/`computeOps`/…) | Untyped; appears superseded by `verifyd.ts` |
| `packages/lab-deploy/verifyd.ts` | Typed version of the same checks | Keep or fold into a test |
| `packages/lab-realize/vr.ts` | Ad-hoc ROI engine checks (`computeRoi`) | — |

- Action taken here: none (moving requires deleting the originals, blocked by the read-only mount).
- **Recommended (run locally):** move these under `packages/<pkg>/scripts/` or convert into `*.test.ts` next to the existing `src/engine/model.test.ts`. Maintenance debt only — not blocking.

## TypeScript / build behavior

- `typescript.ignoreBuildErrors: true` is present (with `eslint.ignoreDuringBuilds: true`).
- A sandbox typecheck (`tsc --noEmit` in `apps/web`) returned 11 **syntax-level** errors (`TS1005`, `TS17008`, `TS1002`) — all in files edited this session (`frame/page.tsx`, `frame/guide/page.tsx`, `Sidebar.tsx`, `StoryThread.tsx`). These are **false positives from the sandbox mount serving truncated copies of recently-edited files**, not real errors: e.g. tsc flagged `frame/page.tsx(7,19)` while the on-disk file is a valid 8-line component.
- Conclusion: a trustworthy typecheck/build cannot be produced from the analysis sandbox. **Run `pnpm typecheck` and `pnpm build` locally** to get the real picture.
- Recommendation: do **not** flip `ignoreBuildErrors` in Phase 0. Address it in a dedicated hardening pass once a clean local typecheck baseline exists.

## Route integrity

No routes were removed or altered. All primary route directories remain present under `apps/web/app` (`frame`, `data/*`, `build/*`, `deploy`, `govern/*`, `realize`, `story/*`, guides).

## Risks / follow-ups before Phase 1

1. Run the two manual cleanups locally (fuse orphans; ValueRiver file + export). Neither blocks Phase 1.
2. Establish a real local typecheck/build baseline so Phase 1 changes can be verified against it.
3. Verification scripts are harmless; relocate when convenient.

## Phase 1 readiness

**Ready for Phase 1, with one caution:** the sandbox cannot delete files or run a reliable typecheck/build, so (a) the two manual cleanups above should be done locally, and (b) build verification for each future phase must run on your machine. No product behavior changed in Phase 0.
