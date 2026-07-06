import { describe, it, expect } from "vitest";
import { scatterLayout } from "./scatter";

const base = { width: 100, height: 100, padL: 10, padR: 10, padT: 10, padB: 10, xDomain: [0, 10] as [number, number], yDomain: [0, 100] as [number, number] };

describe("scatterLayout", () => {
  it("places data in the plot rect with y inverted", () => {
    const l = scatterLayout([{ x: 0, y: 0 }, { x: 10, y: 100 }, { x: 5, y: 50 }], base);
    expect(l.placed[0]).toEqual({ x: 10, y: 90 });  // x-min → left(10); y-min → bottom(90)
    expect(l.placed[1]).toEqual({ x: 90, y: 10 });  // x-max → right(90); y-max → top(10)
    expect(l.placed[2]).toEqual({ x: 50, y: 50 });  // midpoints
  });

  it("exposes the plot rect and scale functions", () => {
    const l = scatterLayout([], base);
    expect(l.plot).toEqual({ left: 10, right: 90, top: 10, bottom: 90 });
    expect(l.toX(5)).toBe(50);
    expect(l.toY(50)).toBe(50);
  });

  it("produces nice linear ticks with pixel positions", () => {
    const l = scatterLayout([], base);
    expect(l.yTicks.map((t) => t.value)).toContain(0);
    expect(l.yTicks.map((t) => t.value)).toContain(100);
    for (const t of l.yTicks) expect(t.px).toBe(l.toY(t.value));
  });

  it("supports a log y-axis (powers-of-ten ticks, geometric placement)", () => {
    const l = scatterLayout([{ x: 5, y: 10 }], { ...base, yDomain: [1, 100], yScale: "log" });
    expect(l.yTicks.map((t) => t.value)).toEqual([1, 10, 100]);
    expect(l.placed[0].y).toBeCloseTo(50, 6); // y=10 is the geometric mean of [1,100] → mid pixel
  });
});
