// Delivery estimation (EL-08). Three-point / PERT with an honest confidence ladder: the mean
// is a coin-flip (P50); a defensible commit adds contingency to hit P80/P90. Plus margin under
// a scope change (absorb silently vs. hold via change order). Pure, the same arithmetic the
// studio shows, so the committed number and the chart can't drift.
export interface ThreePoint {
  o: number; // optimistic
  m: number; // most likely
  p: number; // pessimistic
}
export const pertMean = (t: ThreePoint): number => (t.o + 4 * t.m + t.p) / 6;
export const pertStd = (t: ThreePoint): number => (t.p - t.o) / 6;

// One-sided z for a confidence level (P50 = 0, P80 ≈ 0.84, P90 ≈ 1.28, P95 ≈ 1.645).
export const Z = { p50: 0, p80: 0.84, p90: 1.28, p95: 1.645 } as const;

export interface PertEstimate {
  mean: number;
  std: number;
  p50: number;
  p80: number;
  p90: number;
}
export function pertEstimate(t: ThreePoint): PertEstimate {
  const mean = pertMean(t);
  const std = pertStd(t);
  return { mean, std, p50: mean, p80: mean + Z.p80 * std, p90: mean + Z.p90 * std };
}
/** Estimate (e.g. weeks) that covers the given one-sided confidence level. */
export const confidenceEstimate = (t: ThreePoint, z: number): number => pertMean(t) + z * pertStd(t);

/** Gross margin %: revenue = billedEffort × billRate; cost = costEffort × costRate. */
export function marginPct(costEffort: number, billedEffort: number, billRate: number, costRate: number): number {
  const rev = billedEffort * billRate;
  return rev > 0 ? Math.round(((rev - costEffort * costRate) / rev) * 100) : 0;
}
