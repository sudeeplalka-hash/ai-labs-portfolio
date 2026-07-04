import { describe, it, expect } from "vitest";
import { deriveAdoptionPlan, projectAdoption, ADOPTION_CEILING } from "./adoption";

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
