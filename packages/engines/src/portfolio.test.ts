import { describe, it, expect } from "vitest";
import { prob, riskAdj, recommend, greedyFund, STAGE_PROB, type Initiative } from "./portfolio";

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

describe("greedyFund", () => {
  type Item = { id: string; spendM: number; v: number };
  const val = (i: Item) => i.v;
  // ratios (v/spend): b=4.0, a=3.0, c=0.5; d is non-positive and never eligible.
  const items: Item[] = [
    { id: "a", spendM: 1, v: 3 },
    { id: "b", spendM: 2, v: 8 },
    { id: "c", spendM: 1, v: 0.5 },
    { id: "d", spendM: 1, v: -1 },
  ];

  it("takes items by descending value-per-dollar until the budget can't fit the next", () => {
    const r = greedyFund(items, 3, val);
    expect(r.funded).toEqual(["b", "a"]); // funded in greedy order
    expect(r.spent).toBe(3);
    expect(r.captured).toBeCloseTo(11, 6); // 8 + 3
  });

  it("never funds a non-positive-value item, even with budget to spare", () => {
    const r = greedyFund(items, 100, val);
    expect(r.funded).toEqual(["b", "a", "c"]);
    expect(r.cut).toContain("d");
    expect(r.spent).toBe(4);
    expect(r.captured).toBeCloseTo(11.5, 6);
  });

  it("skips an item that doesn't fit but keeps taking cheaper ones that do", () => {
    const r = greedyFund(items, 2, val); // b fits (2); a would overflow; c would overflow
    expect(r.funded).toEqual(["b"]);
    expect(r.spent).toBe(2);
    expect(r.cut).toEqual(["a", "c", "d"]);
  });

  it("funds nothing at zero budget and reports everything cut", () => {
    const r = greedyFund(items, 0, val);
    expect(r.funded).toEqual([]);
    expect(r.spent).toBe(0);
    expect(r.captured).toBe(0);
    expect(r.cut).toHaveLength(items.length);
  });

  it("is greedy, not a solved optimum — ratio-first can leave value on the table", () => {
    // At budget 4, greedy takes s1(ratio1.8)+s2, capturing 6.4; the optimal single
    // pick `big` would capture 7. The engine is honest about being a first cut.
    const knap = [
      { id: "big", spendM: 4, v: 7 },   // ratio 1.75
      { id: "s1", spendM: 3, v: 5.4 },  // ratio 1.8
      { id: "s2", spendM: 1, v: 1 },    // ratio 1.0
    ];
    const r = greedyFund(knap, 4, (i) => i.v);
    expect(r.funded).toEqual(["s1", "s2"]);
    expect(r.captured).toBeCloseTo(6.4, 6);
    expect(r.captured).toBeLessThan(7); // the optimum greedy did not reach
  });

  it("composes with the engine's own riskAdj as the value function", () => {
    const mk = (over: Partial<Initiative>): Initiative => ({
      id: "x", name: "X", domain: "Finserv", stage: "scaling",
      expValueM: 2, spendM: 1, risk: 0.4, planVar: 0, ...over,
    });
    const book = [
      mk({ id: "p1", stage: "production", expValueM: 4, spendM: 1 }), // riskAdj 2.4
      mk({ id: "p2", stage: "scaling", expValueM: 3, spendM: 1 }),    // riskAdj 0.8
      mk({ id: "p3", stage: "pilot", expValueM: 1, spendM: 1 }),      // riskAdj -0.7 -> never funded
    ];
    const r = greedyFund(book, 1, riskAdj);
    expect(r.funded).toEqual(["p1"]);
    expect(r.captured).toBeCloseTo(2.4, 6);
    expect(r.cut).toContain("p3");
  });
});
