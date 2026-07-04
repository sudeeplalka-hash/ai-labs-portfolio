import { describe, it, expect } from "vitest";
import { generateBacklog } from "./backlog";
import type { FramingParams } from "./types";

const base: FramingParams = { user: "Customers", job: "Answer", pain: "Too slow", posture: "Scattered", risk: "Balanced" };

describe("generateBacklog", () => {
  it("is deterministic for identical params", () => {
    expect(generateBacklog(base)).toEqual(generateBacklog(base));
  });

  it("spans all four buckets", () => {
    const buckets = new Set(generateBacklog(base).map((u) => u.bucket));
    expect(buckets).toEqual(new Set(["Wins", "Core", "Differentiators", "Foundations"]));
  });

  it("keeps value and effort within bounds", () => {
    for (const uc of generateBacklog(base)) {
      expect(uc.value).toBeGreaterThanOrEqual(20);
      expect(uc.value).toBeLessThanOrEqual(95);
      expect(uc.effort).toBeGreaterThanOrEqual(15);
      expect(uc.effort).toBeLessThanOrEqual(92);
    }
  });

  it("aggressive risk floats Differentiators above conservative", () => {
    const sumDiff = (p: FramingParams) =>
      generateBacklog(p).filter((u) => u.bucket === "Differentiators").reduce((a, u) => a + u.value, 0);
    expect(sumDiff({ ...base, risk: "Aggressive" })).toBeGreaterThan(sumDiff({ ...base, risk: "Conservative" }));
  });

  it("poor data posture raises Foundations effort", () => {
    const eff = (p: FramingParams) =>
      generateBacklog(p).filter((u) => u.bucket === "Foundations").reduce((a, u) => a + u.effort, 0);
    expect(eff({ ...base, posture: "Sparse" })).toBeGreaterThan(eff({ ...base, posture: "Rich & ready" }));
  });
});
