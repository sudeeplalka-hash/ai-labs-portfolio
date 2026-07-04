import { describe, it, expect } from "vitest";
import { evaluate, type PKey } from "./protocol";

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
