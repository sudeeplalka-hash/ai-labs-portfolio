import { describe, it, expect } from "vitest";
import { deriveAdoptionPlan, projectAdoption, ADOPTION_CEILING, weightSumOf, readinessComposite, readinessGate, planToReachGate, factorSensitivity, scheduleAdoptionPlan, compareReadiness, readinessTrajectory, type PlanItem } from "./adoption";

describe("deriveAdoptionPlan", () => {
  it("always offers a plan with at least two recommended interventions", () => {
    for (const audience of ["Customers", "Employees", "Frontline staff", undefined]) {
      const plan = deriveAdoptionPlan({ audience, adoptionPct: 55 });
      expect(plan.length).toBeGreaterThanOrEqual(5);
      expect(plan.filter((i) => i.recommended).length).toBeGreaterThanOrEqual(2);
      for (const i of plan) {
        expect(i.upliftPts).toBeGreaterThan(0);
        expect(i.upliftPts).toBeLessThanOrEqual(10);
        expect(i.owner.length).toBeGreaterThan(0);
      }
    }
  });

  it("is deterministic and audience-aware", () => {
    const a = deriveAdoptionPlan({ audience: "Employees", adoptionPct: 50 });
    const b = deriveAdoptionPlan({ audience: "Employees", adoptionPct: 50 });
    expect(a).toEqual(b);
    const internal = deriveAdoptionPlan({ audience: "Employees", adoptionPct: 60 });
    const external = deriveAdoptionPlan({ audience: "Customers", adoptionPct: 60 });
    expect(internal.find((i) => i.id === "training")!.recommended).toBe(true);
    expect(external.find((i) => i.id === "training")!.recommended).toBe(false);
  });

  it("weak citations raise the trust intervention", () => {
    const weak = deriveAdoptionPlan({ audience: "Customers", adoptionPct: 60, citationAccuracy: 82 });
    const strong = deriveAdoptionPlan({ audience: "Customers", adoptionPct: 60, citationAccuracy: 95 });
    expect(weak.find((i) => i.id === "trust")!.upliftPts).toBeGreaterThan(strong.find((i) => i.id === "trust")!.upliftPts);
    expect(weak.find((i) => i.id === "trust")!.recommended).toBe(true);
  });
});

describe("projectAdoption", () => {
  it("adds uplifts and caps at the ceiling", () => {
    const plan = deriveAdoptionPlan({ audience: "Employees", adoptionPct: 60 });
    expect(projectAdoption(60, [])).toBe(60);
    expect(projectAdoption(60, plan.slice(0, 2))).toBeGreaterThan(60);
    expect(projectAdoption(88, plan)).toBe(ADOPTION_CEILING);
  });
});

type FK = "a" | "b" | "c";
const KEYS: readonly FK[] = ["a", "b", "c"];

describe("weightSumOf", () => {
  it("sums the weights over the given keys", () => {
    expect(weightSumOf({ a: 0.25, b: 0.2, c: 0.15 }, KEYS)).toBeCloseTo(0.6, 6);
  });
  it("falls back to 1 when the weights sum to zero (divide-by-zero guard)", () => {
    expect(weightSumOf({ a: 0, b: 0, c: 0 }, KEYS)).toBe(1);
  });
});

describe("readinessComposite", () => {
  it("is the weight-normalized average of the factors", () => {
    // weights sum to 1 -> 0.5*80 + 0.3*60 + 0.2*40 = 66
    expect(readinessComposite({ a: 80, b: 60, c: 40 }, { a: 0.5, b: 0.3, c: 0.2 }, KEYS)).toBe(66);
  });
  it("normalizes so weights that don't sum to 1 give the same 0..100 score", () => {
    // same ratios scaled x10 -> identical composite
    expect(readinessComposite({ a: 80, b: 60, c: 40 }, { a: 5, b: 3, c: 2 }, KEYS)).toBe(66);
  });
  it("returns the common value when all factors are equal, for any weights", () => {
    expect(readinessComposite({ a: 70, b: 70, c: 70 }, { a: 1, b: 9, c: 4 }, KEYS)).toBe(70);
  });
  it("rounds to an integer", () => {
    // 0.5*75 + 0.5*70 = 72.5 -> 73
    expect(readinessComposite({ a: 75, b: 70, c: 0 }, { a: 0.5, b: 0.5, c: 0 }, KEYS)).toBe(73);
  });
  it("guards against an all-zero weight vector (no NaN)", () => {
    const c = readinessComposite({ a: 80, b: 60, c: 40 }, { a: 0, b: 0, c: 0 }, KEYS);
    expect(Number.isNaN(c)).toBe(false);
    expect(c).toBe(0);
  });
});

describe("readinessGate", () => {
  it("returns Scale at or above the scale cutoff (inclusive)", () => {
    expect(readinessGate(75, 75, 60)).toBe("Scale");
    expect(readinessGate(92, 75, 60)).toBe("Scale");
  });
  it("returns 'Scale with conditions' from the conditional cutoff up to the scale cutoff", () => {
    expect(readinessGate(60, 75, 60)).toBe("Scale with conditions"); // cond cutoff inclusive
    expect(readinessGate(74, 75, 60)).toBe("Scale with conditions");
  });
  it("returns Hold below the conditional cutoff", () => {
    expect(readinessGate(59, 75, 60)).toBe("Hold");
    expect(readinessGate(0, 75, 60)).toBe("Hold");
  });
  it("honors edited (non-default) cutoffs", () => {
    expect(readinessGate(70, 80, 65)).toBe("Scale with conditions");
    expect(readinessGate(64, 80, 65)).toBe("Hold");
  });
});

describe("planToReachGate", () => {
  const keys = ["a", "b", "c"] as const;
  const weights = { a: 0.5, b: 0.3, c: 0.2 }; // a is the highest-leverage factor

  it("returns no moves when the composite already meets the target", () => {
    const p = planToReachGate({ a: 80, b: 80, c: 80 }, weights, keys, 75);
    expect(p.reachable).toBe(true);
    expect(p.moves).toEqual([]);
    expect(p.totalAdded).toBe(0);
  });

  it("produces a plan whose projected composite clears the gate", () => {
    const p = planToReachGate({ a: 50, b: 50, c: 50 }, weights, keys, 75);
    expect(p.reachable).toBe(true);
    expect(p.projected).toBeGreaterThanOrEqual(75);
  });

  it("spends points on the highest-weight factor first (fewest total points)", () => {
    const p = planToReachGate({ a: 50, b: 50, c: 50 }, weights, keys, 75);
    expect(p.moves[0].key).toBe("a");
  });

  it("moves to the next factor when the first runs out of headroom", () => {
    const p = planToReachGate({ a: 98, b: 40, c: 40 }, weights, keys, 75);
    const moved = p.moves.map((m) => m.key);
    expect(moved).toContain("a");
    expect(moved).toContain("b");
  });

  it("never proposes a factor above the ceiling", () => {
    const p = planToReachGate({ a: 10, b: 10, c: 10 }, weights, keys, 95);
    for (const m of p.moves) expect(m.to).toBeLessThanOrEqual(100);
  });

  it("reports unreachable when the target exceeds the ceiling", () => {
    const p = planToReachGate({ a: 50, b: 50, c: 50 }, weights, keys, 105);
    expect(p.reachable).toBe(false);
  });

  it("applying the moves reproduces the projected composite", () => {
    const factors = { a: 52, b: 60, c: 45 };
    const p = planToReachGate(factors, weights, keys, 75);
    const applied: Record<"a" | "b" | "c", number> = { ...factors };
    for (const m of p.moves) applied[m.key] = m.to;
    expect(readinessComposite(applied, weights, keys)).toBe(p.projected);
  });
});

describe("factorSensitivity", () => {
  const keys = ["a", "b", "c"] as const;
  const weights = { a: 0.5, b: 0.3, c: 0.2 };

  it("impact equals weight-share times headroom, sorted descending", () => {
    const lev = factorSensitivity({ a: 60, b: 40, c: 90 }, weights, keys);
    // a: 0.5*40=20 ; b: 0.3*60=18 ; c: 0.2*10=2
    expect(lev.map((l) => l.key)).toEqual(["a", "b", "c"]);
    expect(lev[0]).toMatchObject({ key: "a", headroom: 40 });
    expect(lev[0].impact).toBeCloseTo(20, 6);
    expect(lev[1].impact).toBeCloseTo(18, 6);
    expect(lev[2].impact).toBeCloseTo(2, 6);
  });

  it("a maxed factor has zero impact and headroom", () => {
    const lev = factorSensitivity({ a: 100, b: 50, c: 50 }, weights, keys);
    const a = lev.find((l) => l.key === "a")!;
    expect(a.impact).toBe(0);
    expect(a.headroom).toBe(0);
  });

  it("impacts sum to (ceiling minus the un-rounded weighted average)", () => {
    const factors = { a: 52, b: 66, c: 45 };
    const W = weightSumOf(weights, keys);
    const avg = keys.reduce((s, k) => s + weights[k] * factors[k], 0) / W;
    const total = factorSensitivity(factors, weights, keys).reduce((s, l) => s + l.impact, 0);
    expect(total).toBeCloseTo(100 - avg, 6);
  });
});

describe("scheduleAdoptionPlan", () => {
  const items: PlanItem[] = [
    { key: "trust", label: "Trust", score: 40 },
    { key: "training", label: "Training", score: 55 },
    { key: "comms", label: "Comms", score: 65 },
  ];

  it("returns an empty schedule for no items", () => {
    expect(scheduleAdoptionPlan([])).toEqual([]);
  });

  it("orders weakest-first and starts the weakest on day 0", () => {
    const spans = scheduleAdoptionPlan(items);
    expect(spans.map((s) => s.key)).toEqual(["trust", "training", "comms"]);
    expect(spans[0].startDay).toBe(0);
  });

  it("gives the weakest factor the longest run and marks the first two 'focus'", () => {
    const spans = scheduleAdoptionPlan(items);
    const weakest = spans[0].durationDays;
    for (const s of spans.slice(1)) expect(weakest).toBeGreaterThanOrEqual(s.durationDays);
    expect(spans[0].intensity).toBe("focus");
    expect(spans[1].intensity).toBe("focus");
    expect(spans[2].intensity).toBe("support");
  });

  it("keeps every span inside the horizon with at least the minimum duration", () => {
    const spans = scheduleAdoptionPlan(items, { horizonDays: 14, minDays: 3 });
    for (const s of spans) {
      expect(s.startDay).toBeGreaterThanOrEqual(0);
      expect(s.endDay).toBeLessThanOrEqual(14);
      expect(s.durationDays).toBeGreaterThanOrEqual(3);
      expect(s.endDay).toBe(s.startDay + s.durationDays);
    }
  });

  it("is deterministic", () => {
    expect(scheduleAdoptionPlan(items)).toEqual(scheduleAdoptionPlan(items));
  });
});

describe("compareReadiness", () => {
  const keys = ["a", "b", "c"] as const;
  const weights = { a: 0.5, b: 0.3, c: 0.2 };

  it("reports both composites, verdicts, and the signed gap", () => {
    const cmp = compareReadiness({ a: 50, b: 50, c: 50 }, { a: 80, b: 80, c: 80 }, weights, keys, 75, 60);
    expect(cmp.compositeA).toBe(50);
    expect(cmp.compositeB).toBe(80);
    expect(cmp.compositeDelta).toBe(30);
    expect(cmp.verdictA).toBe("Hold");
    expect(cmp.verdictB).toBe("Scale");
  });

  it("names the driver as the factor with the largest weighted delta", () => {
    // a moves +10 (weight .5 -> contrib 5), b moves +20 (weight .3 -> contrib 6) => b drives
    const cmp = compareReadiness({ a: 40, b: 40, c: 40 }, { a: 50, b: 60, c: 40 }, weights, keys, 75, 60);
    expect(cmp.driver!.key).toBe("b");
    expect(cmp.deltas[0].key).toBe("b");
  });

  it("returns a null driver when the populations are identical", () => {
    const cmp = compareReadiness({ a: 60, b: 60, c: 60 }, { a: 60, b: 60, c: 60 }, weights, keys, 75, 60);
    expect(cmp.driver).toBeNull();
    expect(cmp.compositeDelta).toBe(0);
  });

  it("contributions sum to the un-rounded composite gap", () => {
    const A = { a: 52, b: 66, c: 45 };
    const B = { a: 70, b: 55, c: 80 };
    const W = weightSumOf(weights, keys);
    const gap = keys.reduce((s, k) => s + weights[k] * (B[k] - A[k]), 0) / W;
    const cmp = compareReadiness(A, B, weights, keys, 75, 60);
    const total = cmp.deltas.reduce((s, d) => s + d.contribution, 0);
    expect(total).toBeCloseTo(gap, 6);
  });
});

describe("readinessTrajectory", () => {
  const keys = ["a", "b", "c"] as const;
  const weights = { a: 0.5, b: 0.3, c: 0.2 };
  const factors = { a: 50, b: 50, c: 50 };
  const moves = [ { key: "a" as const, from: 50, to: 90 }, { key: "b" as const, from: 50, to: 80 } ];

  it("samples one composite per day across the horizon (0..14 inclusive)", () => {
    const t = readinessTrajectory(factors, moves, weights, keys, 75);
    expect(t.points).toHaveLength(15);
    expect(t.points[0].day).toBe(0);
    expect(t.points[14].day).toBe(14);
  });

  it("rises monotonically as the fixes land (all moves are increases)", () => {
    const t = readinessTrajectory(factors, moves, weights, keys, 75);
    for (let i = 1; i < t.points.length; i++) expect(t.points[i].composite).toBeGreaterThanOrEqual(t.points[i - 1].composite);
  });

  it("starts at the current composite and ends at the fully-applied composite", () => {
    const t = readinessTrajectory(factors, moves, weights, keys, 75);
    expect(t.startComposite).toBe(readinessComposite(factors, weights, keys));
    expect(t.endComposite).toBe(readinessComposite({ a: 90, b: 80, c: 50 }, weights, keys));
  });

  it("reports the first day the composite reaches the target", () => {
    const t = readinessTrajectory(factors, moves, weights, keys, 75);
    expect(t.gateDay).not.toBeNull();
    expect(t.points[t.gateDay as number].composite).toBeGreaterThanOrEqual(75);
  });

  it("returns a flat line and no gate day when there are no moves", () => {
    const t = readinessTrajectory(factors, [], weights, keys, 75);
    expect(new Set(t.points.map((p) => p.composite)).size).toBe(1);
    expect(t.gateDay).toBeNull();
  });
});
