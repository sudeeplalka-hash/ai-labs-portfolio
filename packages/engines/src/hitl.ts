// Human-in-the-loop review policy (GAP-08 · HITL Approval Simulator).
// 20 work items (four deliberately-engineered edge cases that would error if
// auto-approved) and a review policy per autonomy level. Autonomy is set per risk
// tier, not per enthusiasm — the edges show what each level lets slip.

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
