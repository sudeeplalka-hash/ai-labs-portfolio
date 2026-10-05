# Production verification checklist — PF38 / PF41 / PF42

Reviewed 2026-10-05. This is a source/evidence audit and a repeatable release procedure, not a production benchmark. No production build, source change, commit or deployment was performed for this review. Run the production steps on authorized Vercel previews and, after release, on the two public domains.

## Current evidence and remaining gates

| Requirement | Evidence available | Gate still open |
| --- | --- | --- |
| PF38 performance | Data and RAG 3D views have explicit lazy boundaries; PDF/DOCX parsers import on demand. Shared playback and both canvases contain motion/visibility safeguards. A public HTTP asset-size baseline and fixed regression budgets are now recorded below. | No production browser waterfall comparison, reproducible interaction trace or field LCP/INP/CLS record is in the upgrade evidence. Source changes and asset-size estimates do not establish a speed improvement. Measure the same fixtures before marking this item passed. |
| PF38 recovery | Data's `OptionalCorpusAtlas` keeps corpus state in its parent and offers retry, 2D and file-list paths. RAG now creates a fresh lazy instance for up to two in-place retries, preserves parent document/chunks/answers and offers Close with focus restoration. The prior page-reload recovery was removed. | Normal open/close and state retention passed locally. Deliberately fail a chunk/PDF worker and verify recovery in the hosted browser; a source-level retry path does not prove network/cache recovery. |
| PF38 invisible work | Shared playback clears timers on hidden page, preference, resize and caller-supplied offscreen state. Both bridge writers now use `usePageVisible`, clear their polling interval when hidden and re-sync on return; each sync also checks document visibility. | Record actual idle/hidden/offscreen CPU and re-entry behavior. The source safeguards are implemented; no measured CPU reduction is claimed. |
| PF41 accessibility | Family docs record keyboard/focus, mobile widths, numerical parity and browser interactions. Shared drawer/palette focus behavior was exercised. | No complete, versioned screen-reader, forced-colors, 200% zoom and OS reduced-motion journey receipt is present. Complete the matrix below; existing keyboard checks do not imply assistive-technology conformance. |
| PF42 routing/identity | `upgrade-route-smoke.json` final summary: 84/84 template HTTP checks and 69/69 industry scenarios passed; sitemap has 146 unique URLs. `upgrade-site-identity-check.json` checks both identities from source. | Repeat against built output for both site variants. HTTP GET/source evaluation cannot establish client redirect behavior, correct production build flag, exported-file parity, external proof reachability or full interaction coverage. |
| Release reproducibility | pnpm 9.7.0 is pinned; CI uses Node 20; web is Next 14.2.35 / React 18.3.1. Vercel exports `apps/web/out`. The hosted install now uses a fresh temporary store, forced reinstall and frozen lockfile to avoid the tracked cache's lost executable mode; see `upgrade-build-recovery.md`. | Root/web scripts contain no dedicated performance/browser/accessibility gate. CI still uses `--no-frozen-lockfile` and a full build step, differing from the Vercel install and CLAUDE.md's “full next build runs ONLY on Vercel” instruction. Reconcile that hosted-build policy separately; do not run a local build to resolve it. |

Read the **resolvedResults/final summary**, not only the historical `results` array, in the route receipt. Its original failed responses are intentionally retained. The localhost HTTP durations and HTML byte counts are not production Web Vitals, compressed route payloads or browser load times.

Other source facts to include in measurement: Public Sans loads through a remote Google Fonts CSS import with several weights and `display=swap`; PDF parsing loads its worker from unpkg; Recharts remains a static import in several chart routes. Inspect their actual waterfall, cache and failure behavior before changing them. Source import presence alone does not prove which chunks reach the landing page. `@vercel/analytics` is mounted for page analytics; no Web Vitals/Speed Insights measurement integration was found in the reviewed root/web configuration.

## 1. Freeze a comparable release record

- [ ] Record baseline deployment URL and its footer SHA; record candidate immutable deployment URL, full Git SHA, footer SHA, Vercel build result and timestamp. The original audit saw live `138740e` and local `d691b08`; **re-read** the current baseline rather than assuming those are still deployed.
- [ ] Record `NEXT_PUBLIC_SITE` for each candidate: `portfolio` and `command-center`. Record demo/API mode without secrets. Use the default simulated mode for the comparable baseline; test configured live-provider mode separately and label it separately.
- [ ] Capture Chrome, OS, Lighthouse, Node and pnpm versions; device/model, viewport, DPR, CPU and network settings; fixture IDs, input sizes and hashes. Use synthetic/public fixtures, not private uploads or API keys, in share URLs, traces or HAR files.
- [ ] Re-run final typecheck/lint/relevant package tests on the frozen candidate and retain exit codes. Existing family test receipts predate possible concurrent changes. The configured build runs on Vercel; test the exported deployment, not `next dev` or the unused `next start` path.

## 2. Measure the real visitor path

Use the same machine/browser with extensions disabled for baseline and candidate. Alternate their runs to reduce time-of-day/network bias. Use a fresh browser profile for cold runs; do not clear a user's existing browser data.

| Route / variant | Fixed interaction fixture |
| --- | --- |
| `/` on both domains | Arrive cold; read hero; find and open a tool; return through browser Back with catalog context intact. |
| `/agents/protocol-selection/` | Default scenario; change the tools answer to 1–3; inspect the actual ranking/delta; open assumptions; export/share; restore. |
| `/data/corpus/` | Load the same named sample; inspect a finding; open 2D/3D; select a file; close the optional view. Repeat with one fixed supported large corpus. |
| `/build/` | Select the same named document in simulated mode; process it; ask the same sample question; inspect evidence; open/close optional 3D. |
| `/business/portfolio/` | Same scenario; pin baseline; change one budget value; inspect frontier/initiative and contribution values; export; restore. |

- [ ] For every row run **five cold Lighthouse mobile Navigation reports** with the same pinned version/default mobile profile, saving HTML and JSON, including effective throttling settings. Do not stack DevTools throttling onto Lighthouse's simulated throttling. Report median and range, not only the best result. Repeat desktop navigation for both home variants.
- [ ] For manual interaction traces use viewport 390×844, DPR 1, CPU 4× slowdown and a saved custom network profile: 150 ms latency, 1.6 Mbps download, 750 kbps upload. Record those settings as a lab simulation, not a claim about real phone hardware. Run the fixed interaction three times after warm-up, retain Performance traces and note input-to-next-paint durations/long tasks. Also spot-check on a named physical phone when available.
- [ ] Record LCP and its element, CLS and shifted elements, TBT as a diagnostic, transferred/compressed JS/CSS/font/image bytes, request count and failed requests. Separate cold arrival from warm client navigation and interaction cost. Save a sanitized waterfall/HAR and console error list.
- [ ] Record route input bounds and fixture size. Test supported large corpus input, PDF and DOCX parsing, export and repeated route navigation; verify responsive controls and a visible recoverable error for unsupported/failed input. Large-input behavior must not be inferred from the small demo fixture.
- [ ] The plan targets field p75 **LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1**, evaluated separately for mobile and desktop. These are targets, not observed results. Establish numeric route payload and lab responsiveness budgets in the release record before declaring PF38 passed. Lighthouse TBT is an interactivity diagnostic, not INP; lab medians are not field p75. Obtain actual field data when available and explicitly mark insufficient/unavailable traffic. [Google's definitions and thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds), [lab/field measurement guidance](https://web.dev/articles/vitals).

Minimum result row: `SHA | site | URL | fixture/hash | browser/device | viewport/DPR | network/CPU | cold/warm | run count | LCP | CLS | TBT | interaction trace | transfer bytes | budget | pass/fail | raw evidence path`. Leave unmeasured cells **not measured**.

### Recorded initial-asset baseline and regression budgets

`docs/upgrade-asset-baseline.json` records a read-only public HTTP capture on 2026-10-05: all six HTML pages and all 50 unique referenced asset URLs returned successfully. The four pages exposing a footer stamp show `138740e`; the protocol and business portfolio HTML contain no build stamp, so their individual stamps remain unverified. A second inventory reproduced all six byte totals exactly and passed the comparator.

Budgets are baseline **plus 16 KiB JavaScript and 4 KiB CSS**, with a combined **20 KiB** maximum allowance per route. All three limits must pass. These are fixed initial-asset regression limits for this upgrade, not Web Vitals or a claim that the baseline is fast. Do not silently increase a budget to accommodate a regression: document the cause and tradeoff.

| Site / route | Baseline JS gzip bytes | Baseline CSS gzip bytes | Combined baseline bytes | Combined limit bytes |
| --- | ---: | ---: | ---: | ---: |
| Portfolio `/` | 257,473 | 14,670 | 272,143 | 292,623 |
| Portfolio `/agents/protocol-selection/` | 276,527 | 14,670 | 291,197 | 311,677 |
| Portfolio `/data/corpus/` | 300,100 | 14,670 | 314,770 | 335,250 |
| Portfolio `/build/` | 301,829 | 14,670 | 316,499 | 336,979 |
| Portfolio `/business/portfolio/` | 282,785 | 14,670 | 297,455 | 317,935 |
| Command Center `/` | 256,649 | 14,670 | 271,319 | 291,799 |

The script measures decoded raw response sizes and a local gzip-level-9 estimate for unique external script/stylesheet/preload URLs directly referenced in each initial HTML response. It fetches no media. It excludes recursive JS dependencies, dynamic imports, CSS imports/fonts, inline code (included only in HTML size), browser execution/prefetch and API traffic. Nomodule/preload references are counted even if a particular browser would not use them. This is an **initial-transfer proxy**, not actual wire/Brotli bytes, page weight, loading speed, LCP, INP or CLS. Raw/estimated-gzip sizes, status, response headers and hashes are retained per asset; HTML is measured separately.

Reusable Node script: `C:/Users/sudee/Documents/Codex/2026-10-04/l/work/portfolio-asset-inventory.mjs`. After authorized hosted builds, replace both preview-origin placeholders and run the same script against the immutable deployments:

```powershell
node C:/Users/sudee/Documents/Codex/2026-10-04/l/work/portfolio-asset-inventory.mjs --portfolio https://PORTFOLIO-PREVIEW-HOST --command-center https://COMMAND-CENTER-PREVIEW-HOST --expected-sha FULL-EXPECTED-COMMIT-SHA --baseline C:/Users/sudee/Documents/Codex/portfolio-upgrade/docs/upgrade-asset-baseline.json --out C:/Users/sudee/Documents/Codex/portfolio-upgrade/docs/upgrade-asset-candidate.json --label production-preview
```

Inventory version 2 requires the expected commit for a candidate comparison (`--portfolio-sha` / `--command-center-sha` override the common SHA when needed). Each page must have the intended public canonical origin/path and site title; the same-host root must expose the expected SHA. A bare tool without a footer is explicitly labeled as using the validated root SHA, never as having its own observed stamp. Unexpected login HTML fails before its assets are counted. Exit 0 means all identity, complete-capture and byte-budget gates passed; exit 1 identifies failures in the receipt. This does not certify interactive behavior. The original version-1 public baseline remains unchanged. Keep baseline and candidate files separate; overwriting the baseline is blocked.

**Protected preview boundary:** ordinary Node fetch cannot use a signed-in browser session. A supplied share URL would need a cookie bootstrap; placing its query in `--portfolio` does not work. The helper now supports a separately authorized URL from `--portfolio-share-env ENV_NAME` / `--command-center-share-env ENV_NAME`, with exact-origin, memory-only cookies, bounded redirects and redacted receipts. It never obtains an access link. **No actual share URL was used in this release review:** automatic approval rejected creating temporary authentication-bypass links, so this path must remain unused unless separately authorized. Do not weaken project protection, extract browser cookies or obtain a bypass through another tool.

The exported `await createScopedPreviewClient({origin, shareUrl?})` provides `fetch(pathOrUrl, {redirect: 'manual'})`, returning a native Response for read-only route smoke. Default redirects stay on the exact origin; cross-origin requests are rejected. Do not serialize its response's Set-Cookie headers. Local fake-HTTP fixtures verified six successful routes, bare-route SHA attribution, duplicate-reference deduplication, rejection of login HTML/wrong SHA/wrong bootstrap host, cookie expiry, manual redirects and zero cookie forwarding to external assets. Fixture receipts and logs were checked for token leakage. These are helper tests, not preview verification.

The current safe preview path is the existing signed-in browser under CUA. Its page-asset bundle capability excludes JavaScript, so a CSS/media bundle cannot establish these JS/combined budgets. The read-only Vercel deployment-file-tree API was attempted once for portfolio deployment `dpl_CCuZcRms1tJM52Ys6dTydDFz3HFL`; it returned 404 `File tree not found`. No candidate byte receipt was produced. Those APIs describe deployment source files and must not be substituted for emitted assets. If byte access remains unavailable, retain PF38 as unmeasured and run this same comparator after an authorized public release, explicitly labeled **post-release**; that is not a pre-release performance pass.

## 3. Exercise deferral, recovery and motion

- [ ] In Network, prove optional 3D chunks are absent before opening their layers and loaded only on demand. Prove PDF/DOCX parser chunks load for those file types. Check fallback dimensions and layout shifts during load. Clear cache only in the dedicated test profile between cases.
- [ ] Block the identified optional chunk before opening it, verify the named error/fallback, unblock and retry. Confirm selected document, file, finding, scenario and computed results survive. Return to the complete text/table evidence if recovery fails. Repeat for PDF worker failure; verify no endless spinner or empty result.
- [ ] Record 30 seconds of idle CPU after the canvas settles. Repeat while the canvas is offscreen, tab hidden, reduced motion enabled and after navigating away. Identify any continuing application animation frames/timers. Separate browser background throttling from actual application cancellation; verify the returned page reconciles current state correctly.
- [ ] With OS reduced motion on **before arrival**, then toggled during playback, check that final facts remain visible and correct. Exercise Play → Pause → Step → Replay → Show outcome, rapid input changes, resize and navigation. Static geometry, displayed numbers, selected evidence and exports must still agree. Inspect both Data and RAG canvases and one agent playback, not only the shared hook source.

## 4. Finish PF41 / PF42 acceptance

- [ ] Run complete keyboard journeys: home → catalog/tool → changed input → assumptions/help → result/chart alternative → export/share → return; one lifecycle gate journey; one overlay-heavy tool. Check focus order, visible focus, error announcements, Escape and focus return, disabled state, repeated opening and mobile-menu resize 390→1440→390. Verify the body scroll lock is released.
- [ ] Repeat at 200% zoom, Windows forced colors, and with **an actual screen reader** (record its name/version and browser). Verify landmark/headings, controls/values, dialog semantics, verdict announcements and chart table alternatives. Record failures and fixes individually; do not claim blanket WCAG conformance.
- [ ] Check 320/360/390/430/768/1024/1440 widths, portrait/landscape, long labels and open overlays. Core page content must fit; intentional table/code scrolling must remain contained, labeled and keyboard reachable. Record device/browser and screenshots of failures.
- [ ] On both immutable production previews, GET every canonical sitemap URL and representative dynamic detail routes; test primary links, guide/support pages and all 69 generated industry entries. Exercise the three governance aliases and encoded legacy contact-center URL in a real browser through their final destination. Confirm canonical/OG URL, title, social image and sitemap origin belong to the intended site.
- [ ] For each canonical tool family complete sample → own synthetic input → calculate → inspect → export → reset → import/share reload → browser Back. Verify downloaded JSON/CSV/print contents against the displayed decision, baseline, units and mode. Test empty/invalid/boundary input and stale/incompatible URL state. Do not treat a successful download click as file parity.
- [ ] Open public proof/external links without authentication and record their actual reachable state. Keep configured API-provider checks separate from deterministic demo checks; mark unverified integrations explicitly.
- [ ] After an authorized release, confirm both Vercel deployments succeeded, public footers match their intended SHAs and the two landing identities are correct. Repeat targeted production smoke and save the previous known-good deployment reference for rollback. Neither deployment nor rollback is performed by this checklist.

## Evidence reviewed

`CLAUDE.md`; root/web package manifests; `turbo.json`; `.github/workflows/ci.yml`; `vercel.json`; `apps/web/next.config.mjs`; site metadata/sitemap/layout; Data/RAG optional loaders and file extractors; shared motion helpers; agent playback consumers; Data/RAG canvases; bridge writers; the four `docs/upgrade-*.md` family records; route and site-identity JSON receipts. Requirements: `portfolio-enhancement-backlog.csv` PF38/41/42 and `portfolio-visual-ux-upgrade-plan.html` release gates.
