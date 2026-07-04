import { describe, it, expect } from "vitest";
import { prob, riskAdj, recommend, STAGE_PROB, type Initiative } from "./portfolio";

const mk = (over: Partial<Initiative> = {}): Initiative => ({
  id: "x", name: "X", domain: "Finserv", stage: "scaling",
  expValueM: 2, spendM: 1, risk: 0.4, planVar: 0, ...over,
});

describe("prob", () => {
  it("maps each stage to its published probability", () => {
    expect(prob(mk({ stage: "discovery" }))).toBe(0.15);
    expect(prob(mk({ stage: "pilot" }))).toBe(0.30);
    expect(prob(mk({ stage: "scaling" }))).toBe(0.60);
    expect(prob(mk({ stage: "production" }))).toBe(0.85);
  });
});

describe("riskAdj", () => {
  it("equals expected value × P(stage) − spend", () => {
    expect(riskAdj(mk({ expValueM: 4, spendM: 1.2, stage: "production" }))).toBeCloseTo(2.2, 6); // 4·0.85 − 1.2
  });
  it("goes negative when spend exceeds risk-adjusted value", () => {
    expect(riskAdj(mk({ expValueM: 1, spendM: 1, stage: "pilot" }))).toBeLessThan(0); // 0.3 − 1
  });
});

describe("recommend", () => {
  it("kills any initiative with negative risk-adjusted value", () => {
    expect(recommend(mk({ expValueM: 1, spendM: 1.1, stage: "pilot" }))).toBe("kill");
  });
  it("scales a mature, low-risk, high-return initiative", () => {
    expect(recommend(mk({ stage: "production", expValueM: 4, spendM: 0.5, risk: 0.3 }))).toBe("scale");
  });
  it("will not scale an early-stage initiative even with strong economics", () => {
    expect(recommend(mk({ stage: "pilot", expValueM: 10, spendM: 0.5, risk: 0.2 }))).toBe("hold");
  });
  it("will not scale when risk is at or above the 0.6 ceiling", () => {
    expect(recommend(mk({ stage: "production", expValueM: 4, spendM: 0.5, risk: 0.6 }))).toBe("hold");
  });
  it("treats the 1.5× spend threshold as inclusive (>=)", () => {
    // choose expValue so risk-adjusted value is exactly 1.5 at spend 1
    const i = mk({ stage: "production", spendM: 1, risk: 0.3, expValueM: 2.5 / 0.85 });
    expect(riskAdj(i)).toBeCloseTo(1.5, 6);
    expect(recommend(i)).toBe("scale");
  });
  it("holds a positive-but-modest scaling initiative below the scale bar", () => {
    // scaling: 2·0.6 = 1.2 − 1 = 0.2 > 0, but 0.2 < 1.5·1 → hold
    expect(recommend(mk({ stage: "scaling", expValueM: 2, spendM: 1, risk: 0.4 }))).toBe("hold");
  });
});

describe("STAGE_PROB", () => {
  it("increases monotonically with maturity", () => {
    expect(STAGE_PROB.discovery).toBeLessThan(STAGE_PROB.pilot);
    expect(STAGE_PROB.pilot).toBeLessThan(STAGE_PROB.scaling);
    expect(STAGE_PROB.scaling).toBeLessThan(STAGE_PROB.production);
  });
});
