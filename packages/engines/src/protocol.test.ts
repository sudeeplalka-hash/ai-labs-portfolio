import { describe, it, expect } from "vitest";
import { evaluate, sensitivity, bespokeCost, protocolCost, crossoverConsumers, type PKey, type SensitivityQuestion } from "./protocol";

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
