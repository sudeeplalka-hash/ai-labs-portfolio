# Hosted build recovery

The two Vercel previews of `967cf6c` completed dependency installation, then failed before the application build: Turbo 2.0.9 could not execute `node_modules/.pnpm/turbo-linux-64@2.0.9/node_modules/turbo-linux-64/bin/turbo` (`spawnSync EACCES`, errno `-13`). The earlier optional Canvas native-install failure was nonfatal; installation continued to completion.

## Confirmed cache evidence

- The repository tracks 6,521 files under `.pnpm-store`; the existing ignore entry does not remove already tracked files.
- The `turbo-linux-64@2.0.9` store index at `.pnpm-store/v3/files/97/dc128048eb085335686d7acc8b41b19db4e99961492c75a3007c0a0b247efd17c885d118746496e8a189ac64a7e51e5395a811fcf810de6da1cf88080d2ad3-index.json` declares `bin/turbo` mode `493` (octal `0755`).
- That executable's integrity hash resolves to `.pnpm-store/v3/files/e2/d0254f58771b31f35d64e40fc95ef3563a360e603e6cb9e648045960280e5ea35a65ce86ca831bff15f1a39051e6cad64f9cbd1b1f48ada007b758c397d9d0-exec`. Git tracks it as `100644`, so checkout removes its executable permission.
- Installed pnpm 9.7.0 verifies the stored file's content hash and size. Its `writeBufferToCafs` returns an existing hash-identical file without resetting its mode. Content integrity therefore does not repair the lost execute bit.

## Targeted correction

`vercel.json` now installs with a fresh, uniquely named `/tmp/portfolio-pnpm-store.*` store for each hosted build. The explicit store argument bypasses the committed cache; `--force` recreates installed dependencies rather than retaining a restored module tree. `--frozen-lockfile` keeps the dependency graph fixed.

Turbo, pnpm, Node configuration, application dependencies, build command and optional Canvas behavior are unchanged. The tracked historical cache is left untouched in this focused correction. No application code or scoring engine changes are included.

## Validation boundary

The JSON configuration and shell command syntax were checked, and the exact stored-executable mode mismatch was verified against Git. No local Next production build was run. The next Vercel preview must confirm that Turbo executes and the application compiles successfully; local source checks cannot establish hosted Linux execution success.
