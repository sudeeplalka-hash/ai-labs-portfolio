import { describe, it, expect } from "vitest";
import { pertMean, pertStd, pertEstimate, confidenceEstimate, marginPct, Z, type ThreePoint } from "./estimate";

const t: ThreePoint = { o: 6, m: 10, p: 20 }; // mean = (6+40+20)/6 = 11; std = (20-6)/6 = 2.333

describe("PERT", () => {
  it("mean is (o + 4m + p)/6 and std is (p - o)/6", () => {
    expect(pertMean(t)).toBeCloseTo(11, 6);
    expect(pertStd(t)).toBeCloseTo(14 / 6, 6);
  });
});

describe("pertEstimate", () => {
  it("ladders P50 < P80 < P90, with P50 at the mean", () => {
    const e = pertEstimate(t);
    expect(e.p50).toBe(e.mean);
    expect(e.p80).toBeGreaterThan(e.p50);
    expect(e.p90).toBeGreaterThan(e.p80);
  });
  it("P80 adds ~0.84σ of contingency over the mean", () => {
    const e = pertEstimate(t);
    expect(e.p80 - e.mean).toBeCloseTo(Z.p80 * e.std, 6);
  });
});

describe("confidenceEstimate", () => {
  it("is monotonic in the confidence z", () => {
    expect(confidenceEstimate(t, Z.p90)).toBeGreaterThan(confidenceEstimate(t, Z.p80));
    expect(confidenceEstimate(t, Z.p50)).toBe(pertMean(t));
  });
});

describe("marginPct", () => {
  it("is the baseline margin when billed effort equals cost effort", () => {
    // rev = 10*12 = 120; cost = 10*7.5 = 75; margin = (120-75)/120 = 37.5 -> 38
    expect(marginPct(10, 10, 12, 7.5)).toBe(38);
  });
  it("drops when scope is absorbed silently (cost effort > billed effort)", () => {
    const baseline = marginPct(10, 10, 12, 7.5);
    const absorbed = marginPct(13, 10, 12, 7.5); // 3 extra weeks eaten, not billed
    expect(absorbed).toBeLessThan(baseline);
  });
});
