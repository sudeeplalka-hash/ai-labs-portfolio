// Axis scale + tick helpers — pure math so any chart can map a data value to a pixel
// position and render "nice" ticks, on a linear or log axis. Framework-agnostic and tested;
// a chart imports these instead of re-deriving the arithmetic inline.

/** Linear map from data [d0,d1] to range [r0,r1]. Degenerate domain maps to r0. */
export function linScale(v: number, d0: number, d1: number, r0: number, r1: number): number {
  if (d1 === d0) return r0;
  return r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/** Base-10 log map from [d0,d1] to [r0,r1]. Values at or below `floor` are clamped to it,
 *  so a zero-valued point lands at the axis origin instead of producing -Infinity. */
export function logScale(v: number, d0: number, d1: number, r0: number, r1: number, floor = 1e-6): number {
  const lo = Math.log10(Math.max(floor, d0));
  const hi = Math.log10(Math.max(floor, d1));
  if (hi === lo) return r0;
  const lv = Math.log10(Math.max(floor, v));
  return r0 + ((lv - lo) / (hi - lo)) * (r1 - r0);
}

/** "Nice" ticks covering [min,max] with about `count` steps, snapped to 1/2/5×10^k. Ascending. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!isFinite(min) || !isFinite(max) || max <= min || count < 1) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + 1e-9; t += step) ticks.push(Number(t.toFixed(10)));
  return ticks;
}

/** Log-axis ticks: the powers of ten spanning [min,max] (enclosing decade edges included). */
export function logTicks(min: number, max: number, floor = 1e-6): number[] {
  const lo = Math.floor(Math.log10(Math.max(floor, min)));
  const hi = Math.ceil(Math.log10(Math.max(floor, max)));
  const ticks: number[] = [];
  for (let e = lo; e <= hi; e++) ticks.push(Math.pow(10, e));
  return ticks;
}
