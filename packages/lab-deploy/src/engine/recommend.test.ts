import { describe, it, expect } from "vitest";
import { computeOps, recommendOperatingPoint } from "./model";
import type { Baseline, DeployLevers } from "./types";

const b: Baseline = {
  baseCostPerQuery: 0.012, baseLatencyMs: 650, capacityQps: 6, hallucination: 0.15,
  escalationUnitCost: 2, suggestedVolume: 2000, sloReliability: 0.995, sloLatencyMs: 2000,
  targetCostPerQuery: 0.02, riskTier: "Balanced",
};

describe("recommendOperatingPoint", () => {
  it("finds a green, cheaper config than a needlessly expensive current one", () => {
    const current: DeployLevers = { volumePerDay: 2000, tier: "large", cachePct: 0, reranker: true };
    const rec = recommendOperatingPoint(b, current);
    expect(rec.found).toBe(true);
    expect(rec.ops.zone).toBe("green");
    expect(rec.levers.cachePct).toBe(60);             // max cache is the cheapest compute among green configs
    expect(rec.ops.monthlyCost).toBeLessThanOrEqual(computeOps(b, current).monthlyCost);
    expect(rec.monthlySavings).toBeGreaterThan(0);
    expect(computeOps(b, rec.levers)).toEqual(rec.ops); // the recommendation re-computes to the reported ops
  });

  it("never proposes a red config and reports positive savings only", () => {
    const rec = recommendOperatingPoint(b, { volumePerDay: 8000, tier: "small", cachePct: 30, reranker: false });
    expect(rec.ops.zone).not.toBe("red");
    expect(rec.monthlySavings).toBeGreaterThanOrEqual(0);
  });

  it("flags found=false when the load is beyond any safe config", () => {
    const rec = recommendOperatingPoint(b, { volumePerDay: 200000, tier: "small", cachePct: 0, reranker: false });
    expect(rec.found).toBe(false); // saturated: every config is red at this volume
  });

  it("is deterministic", () => {
    const c: DeployLevers = { volumePerDay: 2000, tier: "large", cachePct: 0, reranker: true };
    expect(recommendOperatingPoint(b, c)).toEqual(recommendOperatingPoint(b, c));
  });
});
