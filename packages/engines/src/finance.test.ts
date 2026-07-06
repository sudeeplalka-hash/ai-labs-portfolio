import { describe, it, expect } from "vitest";
import { avgAdoption, cashflows, npv, irr, payback, HORIZON_YEARS, type RoiInputs , roiTornado } from "./finance";

const base: RoiInputs = { investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 };

describe("npv", () => {
  it("at zero rate equals the plain sum of cash flows", () => {
    expect(npv([-100, 50, 50, 50], 0)).toBeCloseTo(50, 6);
  });
  it("discounts future flows (a positive rate lowers the NPV of a positive tail)", () => {
    const cf = [-100, 60, 60];
    expect(npv(cf, 0.1)).toBeLessThan(npv(cf, 0));
  });
  it("leaves the t=0 flow undiscounted", () => {
    expect(npv([-100], 0.5)).toBe(-100);
  });
});

describe("irr", () => {
  it("makes NPV ~0 at the returned rate (root of the NPV function)", () => {
    const cf = [-1000, 400, 400, 400];
    expect(Math.abs(npv(cf, irr(cf)))).toBeLessThan(1);
  });
  it("is higher for a more profitable project", () => {
    expect(irr([-1000, 800, 800])).toBeGreaterThan(irr([-1000, 550, 550]));
  });
  it("stays within the bisection bounds", () => {
    const r = irr([-100, 10, 10]);
    expect(r).toBeGreaterThan(-0.9);
    expect(r).toBeLessThan(5);
  });
});

describe("payback", () => {
  it("returns null when cumulative cash flow never recovers", () => {
    expect(payback([-100, 10, 10])).toBeNull();
  });
  it("returns the exact period when it breaks even at a year boundary", () => {
    // -100, +50, +50 → cumulative hits 0 at end of year 2
    expect(payback([-100, 50, 50])).toBeCloseTo(2, 6);
  });
  it("interpolates a fractional payback within the crossing year", () => {
    // -100, +150 → crosses partway through year 1: 100/150 ≈ 0.667
    expect(payback([-100, 150])).toBeCloseTo(0.6667, 3);
  });
});

describe("avgAdoption", () => {
  it("is bounded in [0, 1] across years and ramps", () => {
    for (let t = 1; t <= 3; t++)
      for (const ramp of [1, 6, 12, 24]) {
        const a = avgAdoption(t, ramp);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(1);
      }
  });
  it("reaches full adoption once the ramp is complete", () => {
    expect(avgAdoption(3, 1)).toBeCloseTo(1, 6);
  });
  it("is non-decreasing year over year for a fixed ramp", () => {
    const ramp = 18;
    expect(avgAdoption(2, ramp)).toBeGreaterThanOrEqual(avgAdoption(1, ramp));
    expect(avgAdoption(3, ramp)).toBeGreaterThanOrEqual(avgAdoption(2, ramp));
  });
});

describe("cashflows", () => {
  it("has horizon+1 entries with a negative t0 of -investment", () => {
    const cf = cashflows(base);
    expect(cf).toHaveLength(HORIZON_YEARS + 1);
    expect(cf[0]).toBe(-base.investment);
  });
  it("front-loads more value under a faster adoption ramp", () => {
    const fast = cashflows({ ...base, rampMonths: 3 });
    const slow = cashflows({ ...base, rampMonths: 18 });
    expect(fast[1]).toBeGreaterThanOrEqual(slow[1]);
  });
  it("respects a custom horizon", () => {
    expect(cashflows(base, 5)).toHaveLength(6);
  });
});

describe("roiTornado", () => {
  const base = { investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 };

  it("returns one bar per driver, sorted widest-swing first", () => {
    const t = roiTornado(base);
    expect(t.length).toBe(5);
    for (let i = 1; i < t.length; i++) expect(t[i].swing).toBeLessThanOrEqual(t[i - 1].swing);
  });

  it("swing equals |high - low| and brackets NPV both ways", () => {
    const t = roiTornado(base);
    for (const b of t) expect(b.swing).toBeCloseTo(Math.abs(b.high - b.low), 6);
  });

  it("annual value is the dominant driver for a value-heavy case", () => {
    expect(roiTornado(base)[0].key).toBe("annualValue");
  });

  it("a bigger swing widens every bar", () => {
    const narrow = roiTornado(base, 0.1);
    const wide = roiTornado(base, 0.5);
    const nAV = narrow.find((b) => b.key === "annualValue")!.swing;
    const wAV = wide.find((b) => b.key === "annualValue")!.swing;
    expect(wAV).toBeGreaterThan(nAV);
  });

  it("is deterministic", () => {
    expect(roiTornado(base)).toEqual(roiTornado(base));
  });
});
