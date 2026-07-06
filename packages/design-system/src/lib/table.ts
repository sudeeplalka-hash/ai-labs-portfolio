// Table sort helpers, a small, tested primitive so any lab's data table can get
// clickable, stable sorting without re-deriving the logic. Pure.

export type SortDir = "asc" | "desc";
export interface SortState {
  key: string;
  dir: SortDir;
}

/** Stable sort by a numeric or string accessor; returns a new array (input untouched). */
export function sortBy<T>(items: T[], accessor: (t: T) => number | string, dir: SortDir = "asc"): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const av = accessor(a.item);
      const bv = accessor(b.item);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return cmp !== 0 ? cmp * sign : a.i - b.i; // ties keep original order (stable)
    })
    .map((x) => x.item);
}

/** Header-click cycle: a new column starts descending (numbers "biggest first");
 *  clicking the active column flips the direction. */
export function nextSort(current: SortState | null, key: string): SortState {
  if (!current || current.key !== key) return { key, dir: "desc" };
  return { key, dir: current.dir === "desc" ? "asc" : "desc" };
}
