// ============================================================================
// Success Metric Forge (BRIEF §7 Move 5). Suggests a falsifiable metric shape
// keyed to the chosen pain, plus sensible baseline/target/coverage defaults.
// ============================================================================
import type { FramingParams, MetricShape } from "./types";

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
};

export function suggestedShape(p: FramingParams): MetricShape {
  return SHAPE_BY_PAIN[p.pain] ?? "Reduce time";
}

export function metricDefaults(shape: MetricShape, p: FramingParams) {
  const baseline =
    shape === "Cut cost" ? "$4.00 / request"
    : shape === "% within threshold" ? "72% accurate"
    : shape === "Increase rate" ? "35% self-served"
    : "8 hrs";
  const target =
    shape === "Cut cost" ? "$1.20 / request"
    : shape === "% within threshold" ? "≥ 90% accurate"
    : shape === "Increase rate" ? "≥ 70% self-served"
    : "under 2 hrs";
  const coverage = `60% of ${p.user.toLowerCase()} requests`;
  return { baseline, target, coverage };
}
