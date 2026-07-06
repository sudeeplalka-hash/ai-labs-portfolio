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

// ROI tornado, the sensitivity view for a business case. Swing each driver ±`swing` and read
// the NPV at each extreme; the bar with the widest low↔high spread is the assumption the case
// most depends on. Sorted widest-first (tornado convention). Built on the same npv/cashflows
// the KPIs show, so the chart and the headline can't disagree. Pure.
export interface TornadoBar {
  key: string;
  label: string;
  low: number;
  high: number;
  swing: number; // |high - low|
}
export function roiTornado(p: RoiInputs, swing = 0.3, horizon: number = HORIZON_YEARS): TornadoBar[] {
  const r = p.rate / 100;
  const at = (mods: Partial<RoiInputs>, rate = r) => npv(cashflows({ ...p, ...mods }, horizon), rate);
  const raw: Omit<TornadoBar, "swing">[] = [
    { key: "annualValue", label: "Annual value", low: at({ annualValue: p.annualValue * (1 - swing) }), high: at({ annualValue: p.annualValue * (1 + swing) }) },
    { key: "rampMonths", label: "Adoption ramp", low: at({ rampMonths: p.rampMonths * (1 + swing) }), high: at({ rampMonths: p.rampMonths * (1 - swing) }) },
    { key: "runCost", label: "Run cost", low: at({ runCost: p.runCost * (1 + swing) }), high: at({ runCost: p.runCost * (1 - swing) }) },
    { key: "investment", label: "Upfront investment", low: at({ investment: p.investment * (1 + swing) }), high: at({ investment: p.investment * (1 - swing) }) },
    { key: "rate", label: "Discount rate", low: at({}, r * (1 + swing)), high: at({}, r * (1 - swing)) },
  ];
  return raw.map((b) => ({ ...b, swing: Math.abs(b.high - b.low) })).sort((a, b) => b.swing - a.swing);
}
