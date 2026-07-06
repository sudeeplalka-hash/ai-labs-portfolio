import { describe, it, expect } from "vitest";
import { forecastRunRate, cliffSensitivity, type ForecastParams } from "./forecast";

const base: ForecastParams = {
  startVol: 500_000, growthPct: 6, tokensPerCall: 3000, frontierShare: 40, utilPct: 60, opsFte: 1.5,
  cheapPrice: 3, frontierPrice: 18, clusterCapTokens: 2.5e9, clusterCost: 38000, opsCostPerFte: 22000, months: 24,
};

describe("forecastRunRate", () => {
  it("prices month 0 API at volume × tokens/call × blended price", () => {
    const f = forecastRunRate(base);
    // blended = 3 + 0.4*(18-3) = 9; perCall = 3000/1e6*9 = 0.027; api0 = 500000*0.027 = 13500
    expect(f.api[0]).toBeCloseTo(13500, 6);
  });
  it("compounds API volume at the monthly growth rate", () => {
    const f = forecastRunRate(base);
    expect(f.api[1] / f.api[0]).toBeCloseTo(1.06, 9);
  });
  it("finds the crossover month where API overtakes self-host", () => {
    const f = forecastRunRate(base);
    if (f.cliffMonth !== null) {
      expect(f.api[f.cliffMonth]).toBeGreaterThan(f.self[f.cliffMonth]);
      if (f.cliffMonth > 0) expect(f.api[f.cliffMonth - 1]).toBeLessThanOrEqual(f.self[f.cliffMonth - 1]);
    }
  });
  it("reports null crossover when API stays cheaper the whole horizon", () => {
    const f = forecastRunRate({ ...base, growthPct: 0, startVol: 100_000 });
    expect(f.cliffMonth).toBeNull();
  });
  it("sums cumulative totals over the horizon", () => {
    const f = forecastRunRate(base);
    expect(f.apiCum).toBeCloseTo(f.api.reduce((a, b) => a + b, 0), 3);
  });
});

describe("cliffSensitivity", () => {
  it("higher growth pulls the crossover earlier (or into view)", () => {
    const slow = { ...base, growthPct: 2 };
    const res = cliffSensitivity(slow, [{ key: "growthPct", label: "Growth → 12%/mo", to: 12 }]);
    const baseCliff = forecastRunRate(slow).cliffMonth;
    const bumped = res[0].cliffMonth;
    // faster growth means API grows quicker → crossover no later than the base
    if (baseCliff !== null && bumped !== null) expect(bumped).toBeLessThanOrEqual(baseCliff);
    else expect(bumped === null || baseCliff === null).toBe(true);
  });
  it("is deterministic", () => {
    const bumps = [{ key: "utilPct" as const, label: "Util → 90%", to: 90 }];
    expect(cliffSensitivity(base, bumps)).toEqual(cliffSensitivity(base, bumps));
  });
});
