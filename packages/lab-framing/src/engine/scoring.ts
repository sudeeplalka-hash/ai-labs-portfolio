// ============================================================================
// Coupled scoring (BRIEF §8). Pure + deterministic.
//   Value          ↑ pain × user volume × job frequency; ↑ as scope broadens
//   Feasibility    ↑ as scope narrows + simpler job; ↓ with scope × difficulty
//   Data Readiness  blend(self-rated posture, data-need by job); ↓ as scope broadens
// ============================================================================
import type { FramingParams, TriangleScores } from "./types";
import { USERS, JOBS, PAINS, POSTURE } from "./params";

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export function scoreTriangle(p: FramingParams, scope: number): TriangleScores {
  const u = USERS[p.user];
  const j = JOBS[p.job];
  const pn = PAINS[p.pain];
  const po = POSTURE[p.posture];

  const valueCore = pn.sev * (0.55 + 0.45 * u.vol) * (0.55 + 0.45 * j.freq);
  const value = 100 * clamp(0.3 + 0.55 * valueCore + 0.18 * (scope - 0.5));

  const feasibility = 100 * clamp(0.95 - 0.4 * j.diff - 0.45 * scope * (0.5 + 0.5 * j.diff));

  const dataReadiness = 100 * clamp(0.55 * po.self + 0.45 * (1 - 0.7 * j.need) - 0.18 * (scope - 0.5));

  return {
    value: Math.round(value),
    feasibility: Math.round(feasibility),
    dataReadiness: Math.round(dataReadiness),
  };
}

// Targets each axis is measured against (drives ScoreBar coloring + verdict).
export const SCORE_TARGETS = { value: 65, feasibility: 60, dataReadiness: 60 } as const;
