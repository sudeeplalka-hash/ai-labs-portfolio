// ============================================================================
// Success Metric Forge (BRIEF §7 Move 5). Suggests a falsifiable metric shape
// keyed to the chosen pain, plus sensible baseline/target/coverage defaults.
// ============================================================================
import type { FramingParams, MetricShape, RiskKey } from "./types";
import { PAINS } from "./params";

export const METRIC_SHAPES: MetricShape[] = ["Reduce time", "Increase rate", "Cut cost", "% within threshold"];

const SHAPE_BY_PAIN: Record<FramingParams["pain"], MetricShape> = {
  "Too slow": "Reduce time",
  "Inconsistent": "% within threshold",
  "Too expensive": "Cut cost",
  "Hard to scale": "Increase rate",
  "Error prone": "% within threshold",
  "Knowledge trapped": "Reduce time",
  "Poor experience": "Increase rate",
  "Impossible today": "Increase rate",
  "Costly mistakes": "% within threshold",
  "Compliance exposure": "% within threshold",
  "Trust erosion": "Increase rate",
};

export function suggestedShape(p: FramingParams): MetricShape {
  return SHAPE_BY_PAIN[p.pain] ?? "Reduce time";
}

// Risk appetite sets how bold the falsifiable target is: Conservative proposes
// a number you can very likely hit, Aggressive one you might genuinely miss.
// (A hypothesis nobody could fail is not a hypothesis.)
const TARGET_BY_RISK: Record<MetricShape, Record<RiskKey, string>> = {
  "Reduce time": { Conservative: "under 4 hrs", Balanced: "under 2 hrs", Aggressive: "under 1 hr" },
  "Increase rate": { Conservative: "≥ 55% self-served", Balanced: "≥ 70% self-served", Aggressive: "≥ 85% self-served" },
  "Cut cost": { Conservative: "$2.00 / request", Balanced: "$1.20 / request", Aggressive: "$0.60 / request" },
  "% within threshold": { Conservative: "≥ 85% accurate", Balanced: "≥ 90% accurate", Aggressive: "≥ 95% accurate" },
};

export function metricDefaults(shape: MetricShape, p: FramingParams) {
  const baseline =
    shape === "Cut cost" ? "$4.00 / request"
    : shape === "% within threshold" ? "72% accurate"
    : shape === "Increase rate" ? "35% self-served"
    : "8 hrs";
  const target = TARGET_BY_RISK[shape][p.risk];
  const coverage = `60% of ${p.user.toLowerCase()} requests`;
  // Correctness-mode pains add the safeguard clause the hypothesis must also
  // hold: the win only counts if nothing unreviewed slips through.
  const guardrail =
    p.pain === "Compliance exposure" ? "every answer carries an audit-trail entry"
    : PAINS[p.pain].mode === "correctness" ? `no unreviewed answer reaches ${p.user.toLowerCase()}`
    : undefined;
  return { baseline, target, coverage, guardrail };
}
