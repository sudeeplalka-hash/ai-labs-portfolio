// Business-case finance engine (C3-5 · ROI Builder).
// Cash-flow model → NPV / IRR / payback. IRR is solved by bisection (no closed
// form); payback interpolates within the crossing year. Pure and deterministic.

export const HORIZON_YEARS = 3;

export interface RoiInputs {
  investment: number;
  annualValue: number;
  rampMonths: number;
  runCost: number;
  rate: number; // percent, e.g. 12
}

// Average adoption across the 12 months of year `t`, ramping linearly to full over
// `rampMonths`. Bounded in [0, 1].
export function avgAdoption(t: number, rampMonths: number): number {
  let s = 0;
  for (let m = 0; m < 12; m++) s += Math.min(1, ((t - 1) * 12 + m + 1) / rampMonths);
  return s / 12;
}

// Cash-flow vector: index 0 = -investment; years 1..horizon = value×adoption − runCost.
export function cashflows(p: RoiInputs, horizon: number = HORIZON_YEARS): number[] {
  const cf = [-p.investment];
  for (let t = 1; t <= horizon; t++) cf.push(p.annualValue * avgAdoption(t, p.rampMonths) - p.runCost);
  return cf;
}

export function npv(cf: number[], r: number): number {
  return cf.reduce((a, c, t) => a + c / Math.pow(1 + r, t), 0);
}

// Internal rate of return via 90 rounds of bisection over [-0.9, 5].
export function irr(cf: number[]): number {
  let lo = -0.9, hi = 5;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    npv(cf, mid) > 0 ? (lo = mid) : (hi = mid);
  }
  return (lo + hi) / 2;
}

// Payback period in years (fractional), interpolated within the crossing period.
// Returns null if cumulative cash flow never turns non-negative on a positive flow.
export function payback(cf: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cf.length; t++) {
    const prev = cum;
    cum += cf[t];
    if (cum >= 0 && cf[t] > 0) return t - 1 + -prev / cf[t];
  }
  return null;
}
