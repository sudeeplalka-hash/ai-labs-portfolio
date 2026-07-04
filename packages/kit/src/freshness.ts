// Freshness metadata — powers "last verified" / "as of" stamps (§A4.4, §B3).
// The visual component (FreshnessStamp) lives in @labs/design-system and consumes
// these helpers; the dates and formatting rules live here so they stay data, not copy.

export interface Freshness {
  /** ISO date the lab's facts were last verified. */
  lastVerified: string;
  /** Optional "as of" date for time-sensitive content (pricing, regulation). */
  asOf?: string;
  /** Optional note, e.g. "EU AI Act status as of July 2026". */
  note?: string;
}

export function formatStampDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function daysSince(iso: string, now: Date = new Date()): number {
  const d = new Date(iso + "T00:00:00Z");
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

/** Stamps older than this many days are flagged stale on the quarterly sweep. */
export const STALE_AFTER_DAYS = 100;

export function isStale(iso: string, now: Date = new Date()): boolean {
  return daysSince(iso, now) > STALE_AFTER_DAYS;
}
