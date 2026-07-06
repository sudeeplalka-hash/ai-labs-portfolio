import { describe, it, expect } from "vitest";
import { projectCanaryBreach } from "./operate-day2";

const decaying = { weeks: [
  { week: 1, canaryPassPct: 91 }, { week: 2, canaryPassPct: 90 }, { week: 3, canaryPassPct: 88 },
  { week: 4, canaryPassPct: 86 }, { week: 5, canaryPassPct: 84 }, { week: 6, canaryPassPct: 82 },
] };

describe("projectCanaryBreach", () => {
  it("projects a future breach week from the trailing decay slope", () => {
    const p = projectCanaryBreach(decaying, 74, 4);
    expect(p.slopePerWeek).toBeLessThan(0);
    expect(p.alreadyBelow).toBe(false);
    expect(p.weeksToBreach).toBeGreaterThan(0);
    expect(p.breachWeek).toBe(6 + (p.weeksToBreach as number));
    // last 82, slope -2 → (82-74)/2 = 4 weeks
    expect(p.weeksToBreach).toBe(4);
    expect(p.breachWeek).toBe(10);
  });

  it("reports alreadyBelow when the last point is at or under the floor", () => {
    const p = projectCanaryBreach(decaying, 85, 4);
    expect(p.alreadyBelow).toBe(true);
    expect(p.weeksToBreach).toBe(0);
    expect(p.breachWeek).toBe(6);
  });

  it("returns no breach when the trend is flat or improving", () => {
    const flat = { weeks: [ { week: 1, canaryPassPct: 90 }, { week: 2, canaryPassPct: 90 }, { week: 3, canaryPassPct: 91 } ] };
    const p = projectCanaryBreach(flat, 74);
    expect(p.breachWeek).toBeNull();
    expect(p.weeksToBreach).toBeNull();
  });

  it("is deterministic", () => {
    expect(projectCanaryBreach(decaying, 74)).toEqual(projectCanaryBreach(decaying, 74));
  });
});
