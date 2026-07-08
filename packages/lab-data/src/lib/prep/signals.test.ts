import { describe, it, expect } from "vitest";
import { contentConcentration, topicalCohesion } from "./signals";
import { l2normalize } from "@labs/kit";

const words = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean);

describe("contentConcentration", () => {
  it("distinct prose scores near 100", () => {
    const t = words("adjusters review coverage terms document decisions escalate disputed liability to the board within five business days");
    const r = contentConcentration(t);
    expect(r.score).toBeGreaterThanOrEqual(95);
    expect(r.repeatedShare).toBeLessThan(0.05);
  });

  it("heavy boilerplate scores low and names the repeated phrase", () => {
    const t = words(("this document is confidential and proprietary ").repeat(20));
    const r = contentConcentration(t);
    expect(r.score).toBeLessThan(15);
    expect(r.topRepeats.length).toBeGreaterThan(0);
    expect(r.topRepeats[0]).toContain("confidential");
  });

  it("tiny inputs are neutral, and the function is deterministic", () => {
    expect(contentConcentration(["one", "two"])).toEqual({ score: 100, repeatedShare: 0, topRepeats: [] });
    const t = words("alpha beta gamma alpha beta gamma alpha beta gamma");
    expect(contentConcentration(t)).toEqual(contentConcentration(t));
  });

  it("score equals the documented formula", () => {
    const t = words("a b c a b c"); // trigrams: abc bca cab abc -> 4 total, 3 distinct
    const r = contentConcentration(t);
    expect(r.repeatedShare).toBeCloseTo(1 / 4, 12);
    expect(r.score).toBe(Math.round(100 * (1 - 1 / 4)));
  });
});

describe("topicalCohesion", () => {
  it("identical vectors cohere at 100", () => {
    const v = l2normalize([1, 2, 3, 4]);
    const r = topicalCohesion([v.slice(), v.slice(), v.slice()]);
    expect(r.score).toBe(100);
    for (const c of r.perDoc) expect(c).toBeCloseTo(1, 9);
  });

  it("orthogonal vectors score far lower than aligned ones", () => {
    const aligned = topicalCohesion([[1, 0, 0], [0.9, 0.1, 0], [0.95, 0.05, 0]]);
    const spread = topicalCohesion([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(spread.score).toBeLessThan(aligned.score);
    expect(spread.perDoc.length).toBe(3);
  });

  it("outlier document has the lowest per-doc cosine", () => {
    const r = topicalCohesion([[1, 0, 0], [0.98, 0.02, 0], [0, 0, 1]]);
    const min = Math.min(...r.perDoc);
    expect(r.perDoc[2]).toBe(min);
  });

  it("edge cases: empty, single, zero-dim", () => {
    expect(topicalCohesion([])).toEqual({ score: 100, perDoc: [] });
    expect(topicalCohesion([[3, 4]])).toEqual({ score: 100, perDoc: [1] });
  });
});
