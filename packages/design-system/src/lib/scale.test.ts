import { describe, it, expect } from "vitest";
import { linScale, logScale, niceTicks, logTicks } from "./scale";

describe("linScale", () => {
  it("maps the endpoints and the midpoint", () => {
    expect(linScale(0, 0, 10, 0, 100)).toBe(0);
    expect(linScale(10, 0, 10, 0, 100)).toBe(100);
    expect(linScale(5, 0, 10, 0, 100)).toBe(50);
  });
  it("supports an inverted range (SVG y grows downward)", () => {
    expect(linScale(0, 0, 10, 200, 0)).toBe(200);
    expect(linScale(10, 0, 10, 200, 0)).toBe(0);
  });
  it("returns r0 for a degenerate domain", () => {
    expect(linScale(5, 4, 4, 10, 90)).toBe(10);
  });
});

describe("logScale", () => {
  it("maps the endpoints", () => {
    expect(logScale(1, 1, 100, 0, 100)).toBeCloseTo(0, 6);
    expect(logScale(100, 1, 100, 0, 100)).toBeCloseTo(100, 6);
  });
  it("puts the geometric mean at the range midpoint", () => {
    expect(logScale(10, 1, 100, 0, 100)).toBeCloseTo(50, 6); // 10 = sqrt(1*100)
  });
  it("clamps zero/negative to the floor (lands at the low end, no -Infinity)", () => {
    const v = logScale(0, 1, 100, 0, 100);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeLessThan(0); // below the axis floor of 1, but finite
  });
});

describe("niceTicks", () => {
  it("covers the range with 1/2/5×10^k steps", () => {
    const t = niceTicks(0, 100, 5);
    expect(t).toEqual([0, 20, 40, 60, 80, 100]);
  });
  it("snaps to a nice step for awkward ranges", () => {
    const t = niceTicks(0, 9.7, 5);
    expect(t[1] - t[0]).toBe(1); // raw 1.94 snaps down to a step of 1
    expect(t[t.length - 1]).toBeLessThanOrEqual(9.7 + 1e-9);
    // a range whose per-step raw lands >=2 snaps to 2
    const t2 = niceTicks(0, 12, 5);
    expect(t2[1] - t2[0]).toBe(2);
  });
  it("is ascending and within the range", () => {
    const t = niceTicks(3, 47, 5);
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThan(t[i - 1]);
    expect(t[t.length - 1]).toBeLessThanOrEqual(47 + 1e-9);
  });
  it("guards degenerate input", () => {
    expect(niceTicks(5, 5)).toEqual([5]);
    expect(niceTicks(10, 0)).toEqual([10]);
  });
});

describe("logTicks", () => {
  it("returns the powers of ten spanning the range", () => {
    expect(logTicks(1, 100)).toEqual([1, 10, 100]);
    expect(logTicks(2, 90)).toEqual([1, 10, 100]); // encloses the decade edges
  });
});
