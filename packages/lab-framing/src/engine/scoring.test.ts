import { describe, it, expect } from "vitest";
import { scoreTriangle } from "./scoring";
import { deriveVerdict } from "./verdict";
import type { FramingParams } from "./types";

const base: FramingParams = { user: "Customers", job: "Answer", pain: "Too slow", posture: "Rich & ready", risk: "Balanced" };

describe("scoreTriangle — coupling is the lesson", () => {
  it("produces values in 0..100", () => {
    const s = scoreTriangle(base, 0.5);
    for (const v of [s.value, s.feasibility, s.dataReadiness]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("broadening scope raises Value and lowers Feasibility + Data readiness", () => {
    const narrow = scoreTriangle(base, 0.1);
    const broad = scoreTriangle(base, 1.0);
    expect(broad.value).toBeGreaterThan(narrow.value);
    expect(broad.feasibility).toBeLessThan(narrow.feasibility);
    expect(broad.dataReadiness).toBeLessThan(narrow.dataReadiness);
  });

  it("harder jobs are less feasible at equal scope", () => {
    const easy = scoreTriangle({ ...base, job: "Answer" }, 0.5);
    const hard = scoreTriangle({ ...base, job: "Orchestrate" }, 0.5);
    expect(hard.feasibility).toBeLessThan(easy.feasibility);
  });

  it("weaker data posture lowers Data readiness", () => {
    const rich = scoreTriangle({ ...base, posture: "Rich & ready" }, 0.5);
    const sparse = scoreTriangle({ ...base, posture: "Sparse" }, 0.5);
    expect(sparse.dataReadiness).toBeLessThan(rich.dataReadiness);
  });

  it("a broad, hard, data-hungry bet on sparse data craters feasibility + readiness", () => {
    const s = scoreTriangle({ user: "Customers", job: "Decide", pain: "Impossible today", posture: "Sparse", risk: "Aggressive" }, 1.0);
    expect(s.value).toBeGreaterThan(60);
    expect(s.feasibility).toBeLessThan(40);
    expect(s.dataReadiness).toBeLessThan(40);
  });
});

describe("deriveVerdict", () => {
  it("flags data as the bottleneck when readiness is the weak axis", () => {
    const p: FramingParams = { ...base, posture: "Sparse", job: "Extract" };
    const v = deriveVerdict(p, scoreTriangle(p, 0.6));
    expect(["Data is the bottleneck", "Aimed too wide"]).toContain(v.headline);
  });

  it("forces human review on an aggressive bet with weak data", () => {
    const p: FramingParams = { user: "Customers", job: "Decide", pain: "Impossible today", posture: "Sparse", risk: "Aggressive" };
    const v = deriveVerdict(p, scoreTriangle(p, 1.0));
    expect(v.humanReview).toBe(true);
  });
});
