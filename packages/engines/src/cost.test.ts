import { describe, it, expect } from "vitest";
import { callCost, monthlyCost, compareModels, savingsLadder, type ModelRate, type CallSpec, type CostLevers } from "./cost";

const sonnet: ModelRate = { id: "sonnet", inputPerMTok: 3, outputPerMTok: 15, cachedInputPerMTok: 0.3 };
const flash: ModelRate = { id: "flash", inputPerMTok: 0.075, outputPerMTok: 0.3 }; // no cache price
const spec: CallSpec = { inputTokens: 3000, outputTokens: 400 };
const none: CostLevers = { cache: false, cacheShare: 0, batch: false, batchShare: 0 };

describe("callCost", () => {
  it("is input×inputPrice + output×outputPrice at list price", () => {
    // 3000/1e6*3 + 400/1e6*15 = 0.009 + 0.006 = 0.015
    expect(callCost(sonnet, spec, none)).toBeCloseTo(0.015, 9);
  });
  it("caching lowers the cacheable input share to the cache-read rate", () => {
    const cached = callCost(sonnet, spec, { cache: true, cacheShare: 1, batch: false, batchShare: 0 });
    // all input repriced 3→0.3: 3000/1e6*0.3 + 0.006 = 0.0009+0.006 = 0.0069
    expect(cached).toBeCloseTo(0.0069, 9);
    expect(cached).toBeLessThan(callCost(sonnet, spec, none));
  });
  it("ignores caching for a model with no cache-read price", () => {
    expect(callCost(flash, spec, { cache: true, cacheShare: 1, batch: false, batchShare: 0 })).toBeCloseTo(callCost(flash, spec, none), 12);
  });
  it("applies the batch discount to the eligible share", () => {
    const batched = callCost(sonnet, spec, { cache: false, cacheShare: 0, batch: true, batchShare: 1, batchDiscount: 0.5 });
    expect(batched).toBeCloseTo(0.015 * 0.5, 9);
  });
});

describe("monthlyCost", () => {
  it("is perCall × calls/day × days", () => {
    expect(monthlyCost(0.015, 5000, 30)).toBeCloseTo(2250, 6);
  });
});

describe("compareModels", () => {
  it("prices a workload across models, cheapest per-call first", () => {
    const rows = compareModels([sonnet, flash], spec, none, 5000);
    expect(rows[0].id).toBe("flash"); // flash is far cheaper
    expect(rows[0].perCall).toBeLessThan(rows[1].perCall);
    expect(rows[1].monthly).toBeCloseTo(monthlyCost(rows[1].perCall, 5000), 6);
  });
});

describe("savingsLadder", () => {
  it("is monotonically non-increasing as leverage stacks, with percent saved", () => {
    const l = savingsLadder(sonnet, spec, { cache: true, cacheShare: 0.6, batch: true, batchShare: 0.3 }, 5000);
    expect(l.map((s) => s.label)).toEqual(["List price", "+ prompt cache", "+ batch"]);
    expect(l[0].monthly).toBeGreaterThanOrEqual(l[1].monthly);
    expect(l[1].monthly).toBeGreaterThanOrEqual(l[2].monthly);
    expect(l[0].savedPct).toBe(0);
    expect(l[2].savedPct).toBeGreaterThan(0);
  });
});
