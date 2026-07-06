import { describe, it, expect } from "vitest";
import { evaluate, sensitivity, bespokeCost, protocolCost, crossoverConsumers, protocolAffinity, affinityRadar, whyNotOthers, recommendationCard, explainRecommendation, type PKey, type SensitivityQuestion, type ProtocolAxis } from "./protocol";

const ans = (q1: number, q2: number, q3: number, q4: number, q5: number, q6: number) => ({ q1, q2, q3, q4, q5, q6 });

describe("evaluate", () => {
  it("recommends function-calling for the minimal case (few tools, one consumer, one agent)", () => {
    expect(evaluate(ans(0, 0, 0, 0, 0, 0)).primary).toBe("fc");
  });
  it("recommends MCP when many systems & consumers but low coordination", () => {
    expect(evaluate(ans(2, 2, 0, 2, 2, 2)).primary).toBe("mcp");
  });
  it("recommends A2A when agent coordination dominates", () => {
    expect(evaluate(ans(0, 1, 2, 0, 0, 2)).primary).toBe("a2a");
  });
  it("always returns a runner-up distinct from the primary", () => {
    for (let q = 0; q <= 2; q++) {
      const r = evaluate(ans(q, q, q, q, q, q));
      expect(r.runnerUp).not.toBe(r.primary);
    }
  });
  it("produces finite scores and a hybrid bounded by the weaker of MCP/A2A plus governance", () => {
    const { scores } = evaluate(ans(2, 2, 2, 2, 2, 2));
    for (const k of Object.keys(scores) as PKey[]) expect(Number.isFinite(scores[k])).toBe(true);
    expect(scores.hybrid).toBeCloseTo(Math.min(scores.mcp, scores.a2a) * 1.15 + 2 * 0.7, 6);
  });
  it("ranks primary as the true max score", () => {
    const { scores, primary } = evaluate(ans(1, 2, 0, 1, 2, 1));
    const max = Math.max(...Object.values(scores));
    expect(scores[primary]).toBeCloseTo(max, 6);
  });
});

describe("sensitivity", () => {
  const QS: SensitivityQuestion[] = [
    { key: "q1", q: "Scale?", opts: ["low", "med", "high"] },
    { key: "q2", q: "Noise?", opts: ["a", "b", "c"] },
  ];

  it("finds the first alternative answer that flips the call, per question", () => {
    const primaryOf = (a: Record<string, number>) => (a.q1 >= 1 ? "X" : "Y");
    const flips = sensitivity({ q1: 0, q2: 0 }, QS, primaryOf);
    expect(flips).toEqual([{ key: "q1", q: "Scale?", to: "med", newPrimary: "X" }]);
  });

  it("returns an empty array when no single answer flips the call (robust)", () => {
    expect(sensitivity({ q1: 1, q2: 1 }, QS, () => "MCP")).toEqual([]);
  });

  it("returns the first flipping option, skipping alternatives that don't flip", () => {
    // primary changes only at q1===2, so q1===1 must be skipped and q1===2 reported.
    const primaryOf = (a: Record<string, number>) => (a.q1 === 2 ? "Z" : "X");
    expect(sensitivity({ q1: 0, q2: 0 }, QS, primaryOf)).toEqual([
      { key: "q1", q: "Scale?", to: "high", newPrimary: "Z" },
    ]);
  });

  it("never reports the current answer as a flip", () => {
    const primaryOf = (a: Record<string, number>) => (a.q2 === 1 ? "B" : "A");
    const flips = sensitivity({ q1: 0, q2: 1 }, QS, primaryOf); // q2 already the 'B' answer
    expect(flips.every((f) => f.to !== "b")).toBe(true);
  });

  it("is self-consistent with the engine's own scoring", () => {
    const QN: SensitivityQuestion[] = [1, 2, 3, 4, 5, 6].map((n) => ({ key: `q${n}`, q: `q${n}`, opts: ["0", "1", "2"] }));
    const answers = { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1 };
    const primaryOf = (a: Record<string, number>): PKey => evaluate(a).primary;
    const base = primaryOf(answers);
    const flips = sensitivity(answers, QN, primaryOf);
    expect(flips.length).toBeLessThanOrEqual(QN.length);
    for (const f of flips) {
      const moved = primaryOf({ ...answers, [f.key]: Number(f.to) }); // `to` encodes the option index
      expect(moved).toBe(f.newPrimary);
      expect(moved).not.toBe(base);
    }
  });
});

describe("integration economics", () => {
  it("bespoke cost grows as producers × consumers", () => {
    expect(bespokeCost(7, 4)).toBe(28);
    expect(bespokeCost(7, 4, 2)).toBe(56);
  });

  it("protocol cost grows as producers + consumers, plus fixed overhead", () => {
    expect(protocolCost(7, 4)).toBe(11);
    expect(protocolCost(7, 4, { protocolFixed: 5 })).toBe(16);
  });

  it("finds the crossover consumer count (bespoke == protocol there)", () => {
    const n = 7;
    const c = crossoverConsumers(n)!;
    expect(c).toBeCloseTo(7 / 6, 6); // (n)/(n-1)
    expect(bespokeCost(n, c)).toBeCloseTo(protocolCost(n, c), 6);
  });

  it("a fixed protocol overhead pushes the crossover to the right", () => {
    const bare = crossoverConsumers(7)!;
    const withFixed = crossoverConsumers(7, { protocolFixed: 6 })!;
    expect(withFixed).toBeGreaterThan(bare);
    expect(withFixed).toBeCloseTo(13 / 6, 6); // (7 + 6)/(7 - 1)
  });

  it("past the crossover, the protocol is cheaper; before it, bespoke is", () => {
    const n = 10, c = crossoverConsumers(n)!;
    expect(bespokeCost(n, Math.ceil(c) + 1)).toBeGreaterThan(protocolCost(n, Math.ceil(c) + 1));
    expect(bespokeCost(n, 1)).toBeLessThan(protocolCost(n, 1));
  });

  it("returns null when the protocol never wins by adding consumers (single producer)", () => {
    expect(crossoverConsumers(1)).toBeNull();
  });
});

// A small, transparent scorer for the affinity probes: mcp likes q1 (up), fc likes q1
// (down), a2a likes q3 (up), hybrid flat. Lets us assert the finite-difference probing
// without depending on the real weighted model.
const AXES: ProtocolAxis[] = [
  { key: "q1", label: "Tools" },
  { key: "q3", label: "Coordination" },
];
const stubScore = (a: Record<string, number>): Record<PKey, number> => ({
  fc: (2 - a.q1) * 1.7,
  mcp: a.q1 * 1.6,
  a2a: a.q3 * 2.4,
  hybrid: 0,
});

describe("protocolAffinity", () => {
  it("measures each protocol's responsiveness to each dimension by probing the scorer", () => {
    const aff = protocolAffinity(stubScore, AXES);
    expect(aff.mcp.q1).toBeCloseTo(3.2, 6); // 2*1.6 - 0
    expect(aff.fc.q1).toBeCloseTo(-3.4, 6); // 0 - 2*1.7 (fc likes the LOW end)
    expect(aff.a2a.q3).toBeCloseTo(4.8, 6); // 2*2.4 - 0
  });
  it("gives zero responsiveness on a dimension a protocol ignores", () => {
    const aff = protocolAffinity(stubScore, AXES);
    expect(aff.fc.q3).toBeCloseTo(0, 6);  // fc doesn't depend on q3
    expect(aff.mcp.q3).toBeCloseTo(0, 6);
    expect(aff.hybrid.q1).toBeCloseTo(0, 6);
  });
});

describe("affinityRadar", () => {
  it("maps neutral (0) responsiveness to the 50 mid-ring", () => {
    const radar = affinityRadar({ fc: { q1: 0 }, mcp: { q1: 0 }, a2a: { q1: 0 }, hybrid: { q1: 0 } }, [{ key: "q1", label: "T" }]);
    expect(radar.mcp[0]).toBe(50);
  });
  it("sends the global-max favor to 100 and its mirror opposition to 0", () => {
    const aff = protocolAffinity(stubScore, AXES);
    const radar = affinityRadar(aff, AXES);
    // a2a.q3 (=4.8) is the largest |affinity| -> its radar value is 100
    const q3i = AXES.findIndex((x) => x.key === "q3");
    expect(radar.a2a[q3i]).toBeCloseTo(100, 6);
    // fc opposes q1 -> below the mid-ring; mcp favors q1 -> above it
    const q1i = AXES.findIndex((x) => x.key === "q1");
    expect(radar.fc[q1i]).toBeLessThan(50);
    expect(radar.mcp[q1i]).toBeGreaterThan(50);
  });
  it("keeps every value within [0,100]", () => {
    const radar = affinityRadar(protocolAffinity(stubScore, AXES), AXES);
    for (const k of ["fc", "mcp", "a2a", "hybrid"] as PKey[])
      for (const v of radar[k]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
  });
});

describe("whyNotOthers", () => {
  const AX6: ProtocolAxis[] = [
    { key: "q1", label: "Tools" },
    { key: "q3", label: "Coordination" },
  ];
  it("names the dimension that most separates the primary from each rival, per the answers", () => {
    const aff = protocolAffinity(stubScore, AX6);
    // Many tools, no coordination -> MCP is primary; it beats fc on Tools, beats a2a on Tools too.
    const answers = { q1: 2, q3: 0 };
    const wn = whyNotOthers(aff, answers, AX6, "mcp");
    const fcReason = wn.find((w) => w.protocol === "fc")!;
    expect(fcReason.axisKey).toBe("q1"); // your tool breadth is why not function-calling
    expect(fcReason.gap).toBeGreaterThan(0);
    expect(wn.some((w) => w.protocol === "mcp")).toBe(false); // never explains itself
  });
  it("returns one reason per rival protocol", () => {
    const aff = protocolAffinity(stubScore, AX6);
    const wn = whyNotOthers(aff, { q1: 2, q3: 0 }, AX6, "mcp");
    expect(wn.map((w) => w.protocol).sort()).toEqual(["a2a", "fc", "hybrid"]);
  });
});

describe("recommendationCard", () => {
  const label = (k: PKey) => ({ fc: "Function calling", mcp: "MCP", a2a: "A2A", hybrid: "Hybrid" }[k]);

  it("builds sorted fit bars normalized to the leader (100%) and flags the primary", () => {
    const card = recommendationCard({ fc: 2, mcp: 8, a2a: 6, hybrid: 4 }, "mcp", "a2a", label);
    expect(card.bars.map((b) => b.key)).toEqual(["mcp", "a2a", "hybrid", "fc"]);
    expect(card.bars[0]).toMatchObject({ key: "mcp", pct: 100, primary: true });
    expect(card.bars[1].pct).toBe(75); // 6/8
    expect(card.bars.filter((b) => b.primary)).toHaveLength(1);
  });

  it("computes the margin over the runner-up", () => {
    const card = recommendationCard({ fc: 2, mcp: 8, a2a: 6, hybrid: 4 }, "mcp", "a2a", label);
    expect(card.margin).toBe(2);
    expect(card.primaryLabel).toBe("MCP");
    expect(card.runnerUpLabel).toBe("A2A");
  });

  it("reads confidence from the leader's margin over the runner-up", () => {
    expect(recommendationCard({ fc: 1, mcp: 10, a2a: 5, hybrid: 2 }, "mcp", "a2a", label).confidence).toBe("clear");   // 5/10
    expect(recommendationCard({ fc: 1, mcp: 10, a2a: 8.5, hybrid: 2 }, "mcp", "a2a", label).confidence).toBe("close");  // 1.5/10
    expect(recommendationCard({ fc: 1, mcp: 10, a2a: 9.6, hybrid: 2 }, "mcp", "a2a", label).confidence).toBe("toss-up"); // 0.4/10
  });
});

describe("explainRecommendation", () => {
  const label = (k: PKey) => ({ fc: "Function calling", mcp: "MCP", a2a: "A2A", hybrid: "Hybrid" }[k]);
  const card = recommendationCard({ fc: 2, mcp: 8, a2a: 6, hybrid: 4 }, "mcp", "a2a", label);
  const whyNot = [
    { protocol: "fc" as PKey, axisKey: "q1", axisLabel: "Tools", gap: 3 },
    { protocol: "a2a" as PKey, axisKey: "q1", axisLabel: "Tools", gap: 2 },
    { protocol: "hybrid" as PKey, axisKey: "q4", axisLabel: "Governance", gap: 1 },
  ];

  it("leads with the verdict and confidence, then dedupes driver dimensions", () => {
    const lines = explainRecommendation(card, whyNot, [], label);
    expect(lines[0].kind).toBe("verdict");
    expect(lines[0].text).toContain("MCP");
    const drivers = lines.filter((l) => l.kind === "driver");
    expect(drivers.map((d) => d.text.match(/"([^"]+)"/)![1])).toEqual(["Tools", "Governance"]); // deduped
  });

  it("adds a robust line when nothing flips the call", () => {
    const lines = explainRecommendation(card, whyNot, [], label);
    expect(lines.some((l) => l.kind === "robust")).toBe(true);
    expect(lines.some((l) => l.kind === "flip")).toBe(false);
  });

  it("adds the first flip when the call is sensitive", () => {
    const flips = [{ key: "q3", q: "Coordination needs?", to: "Many agents collaborate", newPrimary: "a2a" as PKey }];
    const lines = explainRecommendation(card, whyNot, flips, label);
    const flip = lines.find((l) => l.kind === "flip")!;
    expect(flip.text).toContain("A2A");
    expect(flip.text).toContain("Coordination needs?");
  });
});
