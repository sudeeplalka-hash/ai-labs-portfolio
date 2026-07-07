# Fable 5 — End-to-End Review #2: Command Center + Portfolio
**Reviewer:** Claude Fable 5 (senior PM · senior AI engineer · senior QA) · **Date:** 2026-07-07
**Scope:** the full monorepo at HEAD `adbfea4`, both deploys (portfolio.sudeeplalka.com + ai-labs.sudeeplalka.com), all packages, docs, CI, and the live sites themselves.
**Method:** full pipeline run in a clean sandbox (install → typecheck → test → build), loop-safety code review of all seven state writers, built-output link audit across every generated page, live-site fetches diffed against the repo, static sweeps (security, a11y, model strings, copy drift), and verification of every finding from the 2026-07-02 review.

---

## 1. Verdict

**The codebase is in genuinely good shape — the gates are green and the honesty system now holds.** Typecheck passes 8/8 packages, tests pass 7/7 suites (250+ assertions), and the production build generates all 159 static pages with type-checking on. No security issues (zero `dangerouslySetInnerHTML`, no hardcoded secrets, no model-string drift in shipped code). The two honesty blockers from the last review (F-1 unwired LIVE flip, F-2 unverifiable provenance) are properly fixed — GAP-03/GAP-04 now say "authored and deterministic… the badge stays SIMULATED," which is exactly right.

**But three operational problems need attention before anything else, and two of them are invisible from inside the code:**

1. **The live portfolio site is stale.** portfolio.sudeeplalka.com is serving a build from *before* your latest push — the old hero ("AI delivery leader who works at four altitudes"), old lab names ("MCP Server Playground"), and the em dashes you removed are all still live. Your latest language pass exists only on GitHub. ai-labs.sudeeplalka.com *is* current.
2. **Your git index is one commit away from breaking both deploys.** `tsconfig.base.json`, `turbo.json`, and `vercel.json` are staged as **deleted** (a sync/tooling glitch — the disk copies are intact and byte-identical to HEAD). Commit as-is and Vercel loses its build config.
3. **`/operate/guide` 404s on the live command-center site** — and it's linked from the home page's stage cards *and* the header of `/operate`.

## 2. What was verified green (QA)

| Gate | Result | Evidence |
|---|---|---|
| Install | ✅ | pnpm 9.7.0, workspace resolves (one benign native-build failure: `canvas`, transitive/optional, not needed) |
| Typecheck | ✅ 8/8 | `turbo run typecheck` — all packages + app, strict, `ignoreBuildErrors: false` confirmed in config |
| Unit tests | ✅ 7/7 suites | engines (95 tests), kit (29), program-core (39+), design-system (37), lab-* — all passing |
| Production build | ✅ | `next build` static export, **159/159 pages**, type-check on, unmodified config |
| Internal links (built output) | ⚠️ 78/79 | Audited every `href` in every generated page against the output tree. **One broken: `/operate/guide/`** |
| Security sweep | ✅ | No `dangerouslySetInnerHTML`, no eval, no secrets, no unguarded `window.*` at render time (share-link code is event-scoped) |
| Model-string freshness | ✅ | Zero hardcoded model IDs in shipped code; `LIVE_MODEL`/`LIVE_MODEL_CHEAP` used throughout (only the dead `apps/governance` copy still has old strings) |
| Em-dash sweep | ✅ | 0 remaining in user-facing copy |
| Sitemap/robots/titles | ✅ | Present, site-aware, per-route titles consistent (`GAP-01 · MCP Server Contract Workbench · Sudeep Lalka`) |
| Loop safety (7 state writers) | ✅ | See §4 — verified convergent, with two hardening recommendations |

**CI parity:** `.github/workflows/ci.yml` runs the same three gates that passed locally. The repo state at HEAD would pass CI.

## 3. Blocking / correctness findings

### B-1 · Portfolio production deploy is stale (P0)
Live portfolio content matches the repo *before* HEAD (`adbfea4` renamed "MCP Server Playground" → "MCP Server Contract Workbench"; live still shows the old names, old hero, em dashes). `main` == `origin/main`, so the push happened — the portfolio Vercel project either failed its last build or never picked it up. The command-center project deployed the newer language commit fine.
**Action:** open the portfolio project in Vercel → Deployments, check the last build log, and redeploy `adbfea4`. Until then, the site recruiters see is not the site you wrote.

### B-2 · Git index staged deletions of build config (P0)
`git status`: `tsconfig.base.json`, `turbo.json`, `vercel.json` staged as deleted, with identical untracked copies on disk, plus two zero-byte `_tmp_22_*` files at root (hardlink artifacts of the same glitch) and an untracked `portfolio-lab-guide.md`.
**Action (safe — disk content verified identical to HEAD):**
```bash
git restore --staged tsconfig.base.json turbo.json vercel.json
rm _tmp_22_7eea935f0fb31761dbabb3e8e3b8a35a _tmp_22_8dec46402b5dcbbd8b5829ca4b8e4429
# then decide: commit or delete portfolio-lab-guide.md
```
Verify `git status` is clean before the next commit.

### B-3 · Broken route: `/operate/guide` (P1)
Operate is the only stage without a guide page, but two components generate the link mechanically:
- `apps/web/components/shell/Home.tsx:100` — every stage card renders `${s.href}/guide`
- `apps/web/components/shell/Header.tsx:33` — "New here? How this lab works" on `/operate`
Confirmed 404 on the live command-center site.
**Action:** ship `app/operate/guide/page.tsx` (Operate is your newest, most-differentiated stage — it deserves the guide), or add `hasGuide` to `StageDef` and gate both links.

## 4. Loop-safety review (requested focus, §8 of the overview doc)

Reviewed all seven writers: `DataHandoffCard`, `BuildContractCard`, `RetrievalModes` (user-action-gated), `AgentTooling`, `TrainingReadiness`, `OperateSpine` enrichment, `GovernLoop`, plus the `RealizeView` outcomes effect.

**Verdict: loop-safe as written.** Every effect keys on a JSON signature of *upstream* inputs and never includes the object it writes. Cross-writer chains (Data handoff → Build contract sig; Ops enrichment → Govern sig) converge because every derivation is deterministic and none reads its own output: worst case is a two-pass settle as you navigate, not a cycle. `RealizeView`'s `changed` check before re-stamping `createdAt` is exactly the right idempotency discipline.

Two hardening recommendations:
- **R-1 — Nothing *enforces* the pattern.** A future edit that adds a written field to a signature (e.g. `rag.contract.*` into `BuildContractCard`'s sig) loops silently. Add one program-core test that mounts the writer chain against a seeded state and asserts a fixed point within N updates — cheap insurance for the highest-risk area you have.
- **R-2 — `RealizeView` effect deps are incomplete.** It writes `outcomes.adoption`, `paybackMonths`, `valueLeakage` but only re-runs on `roiPct/riskAdjustedValue/npv3yr/nextAction`. An input change that moves adoption or payback without moving ROI leaves persisted outcomes stale. Use the same JSON-sig pattern as the other six writers.

Also in state-land: **`loadState()` shallow-merges persisted state with no schema version.** A returning visitor from a pre-Operate build has `progress` without the `operate` key (the whole nested object is taken from storage). Optional chaining saves you today; add `STATE_VERSION` + migrate-or-reset so it stays true.

## 5. Credibility & product findings (PM lens)

### P-1 · The registry now *understates* — 23 hammers on the shelf (P1, biggest perception lever)
Every catalog lab (all of C2/C3/C4) is still `status: "in-build"`, so the live landing shows an amber hammer on all 23 tiles. Meanwhile: the labs passed QA on 2026-07-02, scored shipped-quality in the rubric review, and your changelog announces Operate as shipped — while `C1-operate` *also* still says in-build. Five days ago the honesty problem was overclaiming; today it's underclaiming, and a recruiter reads "nothing here is finished."
**Action:** define the ship bar (e.g. QA-passed + rubric ≥26 + live-verified), flip qualifying labs to `shipped`, and render the computed `progress()` strip on the landing ("X of 23 shipped · verified Jul 2026"). Registry + changelog must agree.

### P-2 · Six vs seven stage copy drift (P1)
The 7th stage (Operate) landed, but: `Welcome.tsx` says "Six labs" (and its stage line lists six), `StorylineView.tsx` says "all six stages" twice, the Header's storyline subtitle says "six beats" — and contains a typo: *"one idea, idea to business case."* `roadmap/page.tsx` still plans "RACI across the six stages." The command-center home correctly says seven.
**Action:** one grep-driven copy pass (`six stages|six labs|six beats`).

### P-3 · Docs describe infrastructure that doesn't exist (P2)
README's repo tree and DEPLOY.md both document `services/governance-api` (FastAPI, seed scripts, Dockerfile) — the directory isn't in the repo. Anyone who clones and follows DEPLOY.md hits a wall. Same doc-drift class: `apps/web/public/_redirects` still ships the old Render proxy placeholder (`YOUR_RENDER_URL_HERE`) + SPA fallback — dead config on Vercel, actively wrong on Netlify, and publicly fetchable.
**Action:** cut the service references (or restore the service), delete/rewrite `_redirects`.

### P-4 · The legacy `apps/governance` app is still in the repo (P2)
60 files, workspace-excluded since Jul 2, contains stale model strings and old branding; `LabArt.tsx` is still parked too. Flagged for deletion in three documents; visible to anyone reviewing the GitHub repo.
**Action:** `git rm -r apps/governance apps/web/components/map/LabArt.tsx`, and remove the workspace-exclusion note.

### P-5 · Still no OG image, still no collection index pages (carried from review #1)
- Root metadata has no `openGraph` block at all and no image anywhere — portfolio links shared on LinkedIn unfurl bare. One static 1200×630 (your four-altitudes framing is already the artwork brief) is the cheapest distribution win on the list. Analytics remains absent — fine if deliberate, decide it.
- `/agents`, `/business`, `/engagement` still have no index routes; C2–C4 shelf headers have no "Open" target (only C1 → `/lifecycle`). The structural-contrast thesis (toolkit vs gallery vs control room) remains shelf *labels*. This was the #2 recommendation last review; it's still the right big bet, C4 control room first.

### P-6 · What's genuinely improved since 07-02 (credit where due)
F-1/F-2 honesty blockers fixed correctly · `ignoreBuildErrors` off and true · changelog shipped, dated, honest · sitemap + robots + per-route titles · model catalog labels made provider-generic · `progress()` counts catalog-only · anonymization policy unified (employer names as public résumé facts, consistently) · the use-case layer implements the addendum *properly* — typed provenance where `firsthand` is unrepresentable without sign-off, required `sources` + `lastVerified`, coverage computed from the registry. The one-codebase-two-deploys `SITE` switch is clean engineering, and `useProgramSource()` closing the demo-archetype hole is exactly the right centralization.

## 6. Engineering findings (AI-engineer lens)

- **E-1 · ESLint doesn't exist (P2, honesty-of-tooling).** No ESLint config or dependency anywhere; `next lint` prompts interactively; root `pnpm lint` can't succeed; `eslint: { ignoreDuringBuilds: true }` guards a linter that isn't installed, and the config comment promises "flip to false once `next lint` is verified clean" — unverifiable today. Either adopt `eslint-config-next` (+ fix findings, add to CI, flip the flag) or delete the lint scripts and flag. A portfolio whose thesis is "no gate you can't show evidence for" shouldn't advertise this one.
- **E-2 · No custom 404 (P3).** Static export ships Next's default "404: This page could not be found" — unbranded, and old shared links will find it. A `not-found.tsx` with the shelf links is 20 minutes.
- **E-3 · Freshness stamps age out this quarter (P3).** `MODELS_AS_OF`/`PRICING_AS_OF` = 2026-07-02 — fine today, but the quarterly sweep (B5.6) should be calendared; the freshness system being stale is the one visible failure mode it has.
- **E-4 · Command-center home renders two `<h1>`s** (Header's "Command Center" + hero). Demote one. (Portfolio pages verified single-h1 in built output.)

## 7. Accessibility (QA lens, carried F-9, partial credit)

Real progress: 34 `aria-label`s (was zero), `role="group"`/`aria-pressed` on the mode toggle, `aria-label` on the demo-archetype select, focus-visible rings on tiles. Still open before any WCAG-AA claim: **17 bare `<label>`s vs 4 `htmlFor`** — most lab sliders/inputs have no programmatic association; the landing quick-look is still hover-only (touch users get the truncated resting card); status icons rely on `aria-label` on the SVG (add `role="img"` or visually-hidden text). One labeling pass across the 23 labs closes most of it.

## 8. Prioritized actions

**Today (unblock production):**
1. Fix the git index (B-2 commands above), clean `_tmp` files, push a clean commit.
2. Vercel dashboard → portfolio project → inspect last deployment, redeploy HEAD (B-1).
3. Confirm live portfolio shows the new hero/lab names after deploy.

**This week (P1):**
4. `/operate/guide` — build it or gate the links (B-3).
5. Registry status decision + flip + landing progress strip (P-1). Sync `C1-operate` with the changelog.
6. Six→seven copy pass incl. the Header typo (P-2).
7. Delete `apps/governance` + `LabArt.tsx` (P-4); fix README/DEPLOY service references + `_redirects` (P-3).

**Next (P2/P3):**
8. OG image + root `openGraph` block; analytics decision (P-5).
9. ESLint: adopt-or-remove (E-1). Custom 404 (E-2).
10. A11y labeling pass (§7). State versioning (§4). Writer-chain fixed-point test (R-1) + RealizeView sig (R-2).
11. Big bet, unchanged from review #1: the three collection index pages, C4 control room first.

---
*Every finding above was verified directly: pipeline runs in a clean sandbox, link audit against built output, live-site fetches, git history checks. Nothing is carried forward from the 07-02 review without re-verification; items fixed since then are credited in §5/P-6.*
