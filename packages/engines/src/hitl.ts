// Human in the loop review policy (GAP-08 · HITL Approval Simulator).
// 20 work items (four deliberately-engineered edge cases that would error if
// auto-approved) and a review policy per autonomy level. Autonomy is set per risk
// tier, not per enthusiasm, the edges show what each level lets slip.

export type Risk = "high" | "med" | "low";
export interface Item { risk: Risk; edge: boolean; sev: number }

// Edges: high at indices 6 & 14, med at 7 & 15.
export const DEFAULT_ITEMS: Item[] = Array.from({ length: 20 }, (_, i) => {
  const high = [2, 6, 10, 14, 18];
  const med = [1, 4, 7, 9, 12, 15, 17, 19];
  const risk: Risk = high.includes(i) ? "high" : med.includes(i) ? "med" : "low";
  const edge = [6, 14, 7, 15].includes(i);
  return { risk, edge, sev: risk === "high" ? 50 : risk === "med" ? 20 : 5 };
});

export const SAMPLE_INDICES = new Set([3, 7, 11, 16]);

// Levels: 1 review all · 2 review high+med · 3 review high only · 4 sample ~20% · 5 full autonomy.
export function reviewed(level: number, item: Item, idx: number): boolean {
  if (level === 1) return true;
  if (level === 2) return item.risk !== "low";
  if (level === 3) return item.risk === "high";
  if (level === 4) return SAMPLE_INDICES.has(idx);
  return false;
}

// Policy outcome for a given autonomy level: human load, throughput proxy, edge cases slipped,
// exposure (Σ severity of slips), and edge coverage. Plus the recommended level, the highest
// autonomy that still catches every edge case (max throughput at zero slips). Pure; the same
// policy the grid renders, so the recommendation can't disagree with what slips on screen.
export interface PolicyResult {
  reviewedCount: number;
  autoCount: number;
  throughput: number;   // items/hr proxy
  slipped: number;      // edge cases that slipped through unreviewed
  exposureK: number;    // Σ severity of slipped edges ($k)
  coveragePct: number;  // % of edge cases caught
}
export function reviewPolicy(items: Item[], level: number, throughputBase = 100, throughputStep = 0.6): PolicyResult {
  let reviewedCount = 0;
  let slipped = 0;
  let exposureK = 0;
  let edges = 0;
  items.forEach((it, idx) => {
    const rev = reviewed(level, it, idx);
    if (rev) reviewedCount++;
    if (it.edge) {
      edges++;
      if (!rev) { slipped++; exposureK += it.sev; }
    }
  });
  return {
    reviewedCount,
    autoCount: items.length - reviewedCount,
    throughput: Math.round(throughputBase * (1 + (level - 1) * throughputStep)),
    slipped,
    exposureK,
    coveragePct: edges > 0 ? Math.round(((edges - slipped) / edges) * 100) : 100,
  };
}
/** The highest autonomy level that still catches every edge case, max throughput, zero slips. */
export function recommendLevel(items: Item[], maxLevel = 5): number {
  let best = 1;
  for (let l = 1; l <= maxLevel; l++) if (reviewPolicy(items, l).slipped === 0) best = l;
  return best;
}
