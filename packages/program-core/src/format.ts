// ============================================================================
// Shared display formatters (Refinement R1.4). ONE style decision for money
// and duration, used by the story spine, the stage strips, the Realize verdict,
// and any component that prints a program number, so the same fact can never
// render two ways ($2.4M/yr vs $2,545k/yr was the bug this file retires).
//
// The style: $2.5M at or above one million, $281k at or above one thousand,
// whole dollars below. Sign-aware. Months pluralize ("1 month", "8 months").
// Pure, dependency-free, unit-tested in format.test.ts.
// ============================================================================

/** $2.5M / $281k / $12. One decimal for millions (a trailing .0 is trimmed). */
export function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  // Round first so 999,600 promotes to $1M instead of printing $1000k.
  const k = Math.round(a / 1_000);
  if (k >= 1_000) {
    const m = (a / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}$${m}M`;
  }
  if (a >= 1_000) return `${sign}$${k}k`;
  return `${sign}$${Math.round(a)}`;
}

/** "$2.5M/yr", the annual-value spelling used by verdicts, strips, and chips. */
export function formatMoneyPerYear(n: number): string {
  return `${formatMoney(n)}/yr`;
}

/** "1 month" / "8 months". Rounds to whole months. */
export function formatMonths(m: number): string {
  const r = Math.round(m);
  return `${r} month${r === 1 ? "" : "s"}`;
}

/** "8mo" chip spelling for rails and compact chips (same rounding as formatMonths). */
export function formatMonthsShort(m: number): string {
  return `${Math.round(m)}mo`;
}
