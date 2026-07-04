import { describe, it, expect } from "vitest";
import { aggregateSessions } from "./aggregate";
import type { LabSession } from "./session";

let n = 0;
function mk(over: Partial<LabSession>): LabSession {
  n += 1;
  return {
    id: `s${n}`,
    ts: Date.UTC(2026, 5, 20 + n),
    name: "file.txt",
    kind: "text",
    source: "single",
    profileId: "general",
    score: 80,
    gate: "Approved",
    piiHits: 0,
    chunks: 2,
    estTokens: 240,
    ...over,
  };
}

const sessions: LabSession[] = [
  mk({ name: "crm.csv", kind: "tabular", gate: "Rejected", score: 14, piiHits: 9, chunks: 8, estTokens: 900, rows: 9, dups: 1, missingPct: 21 }),
  mk({ name: "eng.md", gate: "Approved", score: 95, piiHits: 0, chunks: 1, estTokens: 120 }),
  mk({ name: "kb.md", gate: "Conditional", score: 74, piiHits: 0 }),
];

describe("aggregateSessions", () => {
  it("returns empty when there are no sessions", () => {
    const empty = aggregateSessions([]);
    expect(empty.hasData).toBe(false);
    expect(empty.total).toBe(0);
  });

  it("computes headline metrics", () => {
    const r = aggregateSessions(sessions);
    expect(r.total).toBe(3);
    expect(r.kpis[0].value).toBe("3");
    // 1 of 3 approved
    expect(r.kpis[1].value).toBe("33");
  });

  it("derives quality dimensions from real stats", () => {
    const r = aggregateSessions(sessions);
    const completeness = r.quality.find((q) => q.label === "Completeness");
    const piiClear = r.quality.find((q) => q.label === "PII clearance");
    expect(completeness?.value).toBe(79); // 100 - 21
    expect(piiClear?.value).toBe(67); // 2 of 3 clean
  });

  it("builds a gate distribution and recent-files table", () => {
    const r = aggregateSessions(sessions);
    expect(r.gateDist).toHaveLength(3); // Approved, Conditional, Rejected
    expect(r.files).toHaveLength(3);
    const crm = r.files.find((f) => f.name === "crm.csv");
    expect(crm?.pii).toBe("fail");
    expect(crm?.gate.color).toBe("rose");
  });
});
