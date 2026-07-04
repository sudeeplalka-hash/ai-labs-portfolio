# @labs/engines

The pure decision engines behind the labs — extracted from the UI so the **exact formulas the interface shows are unit-tested in isolation**. No React, no DOM; every export is a deterministic function or a piece of typed sample data.

| Module | Powers | Key functions |
|---|---|---|
| `finance` | C3-5 · Business Case / ROI | `cashflows`, `npv`, `irr` (bisection), `payback` (interpolated), `avgAdoption` |
| `portfolio` | C3-1 · Portfolio Dashboard | `riskAdj`, `recommend` (kill/scale/hold), `prob`, `STAGE_PROB` |
| `protocol` | GAP-07 · Protocol Selection | `evaluate` (fc / mcp / a2a / hybrid + runner-up) |
| `hitl` | GAP-08 · Human-in-the-Loop | `reviewed` policy, `DEFAULT_ITEMS` (with the four engineered edge cases) |
| `format` | Artifact engine | `provenanceFooter`, `csvCell`, `toCsv` |

## Run the tests

```bash
pnpm --filter @labs/engines test
# or the whole monorepo:
pnpm test
```

The suites assert the behaviours a reviewer would probe: NPV discounting and the IRR being a true root of the NPV function; payback interpolation at and within year boundaries; the kill/scale/hold thresholds (including the inclusive 1.5×-spend boundary and the 0.6 risk ceiling); each protocol winning its designed quadrant; every autonomy level's review policy and exactly which engineered edges it lets slip; and CSV escaping.

> **Note:** these engines are currently faithful, byte-for-byte copies of the functions still defined inside the lab components. The next step is to have the components import from this package so there is a single, tested source of truth. Until then the copies are kept identical and the tests here validate the shared logic.
