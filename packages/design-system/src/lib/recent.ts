// Recent scenarios, a tiny "keepable" history so a lab can offer jump-back to earlier
// explorations. Entries are keyed by their encoded config (cfg); pushRecent is pure,
// the load/save helpers wrap localStorage (a real Next.js app, not a claude.ai artifact,
// so localStorage is fine). Everything degrades gracefully if storage is unavailable.

export interface RecentEntry {
  cfg: string;
  label: string;
  at: number;
}

/** Prepend an entry, drop any earlier one with the same cfg, and cap to `max`. Pure. */
export function pushRecent(list: RecentEntry[], entry: RecentEntry, max = 6): RecentEntry[] {
  return [entry, ...list.filter((e) => e.cfg !== entry.cfg)].slice(0, Math.max(0, max));
}

export function loadRecent(storeKey: string): RecentEntry[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(storeKey) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveRecent(storeKey: string, list: RecentEntry[]): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(storeKey, JSON.stringify(list));
  } catch {
    /* ignore quota / unavailable */
  }
}
