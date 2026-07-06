import { describe, it, expect } from "vitest";
import { blankState, demoState } from "./store";
import { deriveDecisionBreakdown, deriveGateFixes, deriveRegulatoryMapping } from "./insights";
import { deriveGovernanceDecision } from "./contracts";
import { computeReleaseReadiness } from "./operate";
import { deriveLearningCurve } from "./training";

describe("deriveDecisionBreakdown", () => {
  it("baseline + Σ deltas === score, and score matches the decision engine", () => {
    for (const s of [demoState(), blankState()]) {
      const b = deriveDecisionBreakdown(s);
      const sum = b.factors.reduce((a, f) => a + f.delta, 0);
      expect(Math.round(b.baseline + sum)).toBe(b.score);
      expect(b.score).toBe(deriveGovernanceDecision(s).score);
    }
  });

  it("has five factors with sources, and deltas are never positive", () => {
    const b = deriveDecisionBreakdown(demoState());
    expect(b.factors).toHaveLength(5);
    for (const f of b.factors) {
      expect(f.delta).toBeLessThanOrEqual(0);
      expect(f.source.length).toBeGreaterThan(0);
    }
  });

  it("names at least one decision driver", () => {
    expect(deriveDecisionBreakdown(demoState()).decisionDrivers.length).toBeGreaterThan(0);
    expect(deriveDecisionBreakdown(blankState()).decisionDrivers[0]).toMatch(/pending/i);
  });
});

describe("deriveGateFixes", () => {
  it("covers exactly the non-passing readiness checks", () => {
    const s = demoState();
    const failing = computeReleaseReadiness(s).checks.filter((c) => c.status !== "pass");
    const fixes = deriveGateFixes(s);
    expect(fixes).toHaveLength(failing.length);
    expect(new Set(fixes.map((f) => f.check))).toEqual(new Set(failing.map((c) => c.label)));
  });

  it("every fix names an action, a target, and an owning stage; failures sort first", () => {
    const fixes = deriveGateFixes(demoState());
    for (const f of fixes) {
      expect(f.action.length).toBeGreaterThan(10);
      expect(f.target.length).toBeGreaterThan(0);
      expect(["frame", "data", "build", "deploy", "govern", "realize"]).toContain(f.stage);
    }
    const firstWarn = fixes.findIndex((f) => f.status === "warn");
    const lastFail = fixes.map((f) => f.status).lastIndexOf("fail");
    if (firstWarn !== -1 && lastFail !== -1) expect(lastFail).toBeLessThan(firstWarn);
  });
});

describe("deriveRegulatoryMapping", () => {
  it("classifies high-stakes archetypes as High risk and low stakes as lighter", () => {
    expect(deriveRegulatoryMapping(demoState("decision-support")).euAiAct.riskClass).toBe("High risk");
    expect(deriveRegulatoryMapping(demoState("classification")).euAiAct.riskClass).not.toBe("High risk");
    expect(deriveRegulatoryMapping(demoState("summarization")).euAiAct.riskClass).toBe("Minimal risk");
    expect(deriveRegulatoryMapping(demoState("knowledge-assistant")).euAiAct.riskClass).toBe("Limited risk");
  });

  it("always maps all four NIST functions with covering artifacts", () => {
    const m = deriveRegulatoryMapping(demoState());
    expect(m.nist.map((n) => n.fn)).toEqual(["GOVERN", "MAP", "MEASURE", "MANAGE"]);
    for (const n of m.nist) expect(n.coveredBy.length).toBeGreaterThan(0);
    expect(m.disclaimer).toMatch(/not legal advice/i);
  });

  it("obligation depth scales with risk class", () => {
    const high = deriveRegulatoryMapping(demoState("decision-support")).euAiAct.obligations.length;
    const min = deriveRegulatoryMapping(demoState("summarization")).euAiAct.obligations.length;
    expect(high).toBeGreaterThan(min);
  });
});

describe("deriveLearningCurve", () => {
  it("training accuracy rises monotonically over 12 epochs", () => {
    const c = deriveLearningCurve(demoState());
    expect(c.points).toHaveLength(12);
    for (let i = 1; i < c.points.length; i++) {
      expect(c.points[i].train).toBeGreaterThanOrEqual(c.points[i - 1].train);
    }
  });

  it("small datasets diverge earlier and gap harder than large ones", () => {
    const s = demoState();
    const small = deriveLearningCurve(s, 300);
    const large = deriveLearningCurve(s, 50000);
    expect(small.divergenceEpoch!).toBeLessThan(large.divergenceEpoch!);
    expect(small.finalGap).toBeGreaterThan(large.finalGap);
    expect(small.overfittingRisk).toBe("high");
    expect(large.overfittingRisk).toBe("low");
  });

  it("is deterministic and validation never exceeds training after divergence", () => {
    const a = deriveLearningCurve(demoState(), 2400);
    const b = deriveLearningCurve(demoState(), 2400);
    expect(a).toEqual(b);
    for (const p of a.points) expect(p.validation).toBeLessThanOrEqual(p.train);
  });
});
