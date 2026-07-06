import { describe, it, expect } from "vitest";
import { DEFAULT_ITEMS, reviewPolicy, recommendLevel } from "./hitl";

describe("reviewPolicy", () => {
  it("reviews every item at L1 with zero slips and full coverage", () => {
    const r = reviewPolicy(DEFAULT_ITEMS, 1);
    expect(r.reviewedCount).toBe(DEFAULT_ITEMS.length);
    expect(r.slipped).toBe(0);
    expect(r.coveragePct).toBe(100);
  });
  it("L2 (high+med) still catches all four engineered edge cases", () => {
    const r = reviewPolicy(DEFAULT_ITEMS, 2);
    expect(r.slipped).toBe(0);
    expect(r.coveragePct).toBe(100);
  });
  it("L3 (high only) lets the medium-risk edges slip, with exposure", () => {
    const r = reviewPolicy(DEFAULT_ITEMS, 3);
    expect(r.slipped).toBeGreaterThan(0);
    expect(r.exposureK).toBeGreaterThan(0);
    expect(r.coveragePct).toBeLessThan(100);
  });
  it("throughput rises with autonomy level", () => {
    expect(reviewPolicy(DEFAULT_ITEMS, 5).throughput).toBeGreaterThan(reviewPolicy(DEFAULT_ITEMS, 1).throughput);
  });
});

describe("recommendLevel", () => {
  it("returns the highest zero-slip level (the sweet spot)", () => {
    expect(recommendLevel(DEFAULT_ITEMS)).toBe(2);
  });
  it("is deterministic", () => {
    expect(recommendLevel(DEFAULT_ITEMS)).toBe(recommendLevel(DEFAULT_ITEMS));
  });
});
