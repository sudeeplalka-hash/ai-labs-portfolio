import { describe, it, expect } from "vitest";
import { LAB_ROUTES, labHref } from "./labs";
import { STORYLINES } from "./storylines";
import { ALL_USE_CASES } from "./use-cases";

describe("LAB_ROUTES", () => {
  it("covers all 23 labs with a name, an absolute href, and a collection", () => {
    expect(Object.keys(LAB_ROUTES)).toHaveLength(23);
    for (const [id, r] of Object.entries(LAB_ROUTES)) {
      expect(r.name.length, id).toBeGreaterThan(0);
      expect(r.href.startsWith("/"), id).toBe(true);
      expect(r.collection.length, id).toBeGreaterThan(0);
    }
  });
  it("has a unique href per lab", () => {
    const hrefs = Object.values(LAB_ROUTES).map((r) => r.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("labHref", () => {
  it("returns the plain route with no use-case", () => {
    expect(labHref("EL-04")).toBe("/engagement/raid-radar");
  });
  it("appends a trailing-slash-clean ?uc= for a use-case deep link", () => {
    expect(labHref("EL-04", "el04-insurance-claims")).toBe("/engagement/raid-radar/?uc=el04-insurance-claims");
  });
  it("falls back to / for an unknown lab", () => {
    expect(labHref("NOPE")).toBe("/");
  });
});

describe("STORYLINES integrity", () => {
  it("has at least three storylines", () => {
    expect(STORYLINES.length).toBeGreaterThanOrEqual(3);
  });
  it("points every step at a real lab", () => {
    for (const s of STORYLINES) for (const step of s.steps) {
      expect(LAB_ROUTES[step.labId], `${s.id} → ${step.labId}`).toBeDefined();
    }
  });
  it("references only use-case ids that exist in the registry", () => {
    const ids = new Set(ALL_USE_CASES.map((u) => u.id));
    for (const s of STORYLINES) for (const step of s.steps) {
      if (step.ucId) expect(ids.has(step.ucId), `${s.id} → ${step.ucId}`).toBe(true);
    }
  });
});
