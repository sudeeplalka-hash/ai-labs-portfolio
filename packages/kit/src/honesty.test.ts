import { describe, it, expect } from "vitest";
import { assertUseCases, coverageFrom, INDUSTRIES, firstHand, studied, type UseCase } from "./industries";
import { ALL_USE_CASES, USE_CASE_COVERAGE, USE_CASES_BY_LAB } from "./use-cases";

const validUc = (over: Partial<UseCase> = {}): UseCase => ({
  id: "t1", labId: "EL-04", industry: "insurance", provenance: studied,
  title: "T", oneLiner: "o", context: "c", theDecision: "d", whatMostMiss: "w", stakes: "s", takeaway: "t",
  sources: ["a credible source"], lastVerified: "2026-07-03", payload: {}, ...over,
});

describe("assertUseCases, honesty enforced at load", () => {
  it("accepts a well-formed use case", () => {
    expect(() => assertUseCases([validUc()])).not.toThrow();
  });
  it("throws when sources is empty", () => {
    expect(() => assertUseCases([validUc({ sources: [] })])).toThrow(/sources/);
  });
  it("throws when lastVerified is not an ISO date", () => {
    expect(() => assertUseCases([validUc({ lastVerified: "July 2026" })])).toThrow(/ISO/i);
  });
  it("throws on a firsthand claim without owner sign off", () => {
    const unsigned = { kind: "firsthand", ownerSignedOff: false } as unknown as UseCase["provenance"];
    expect(() => assertUseCases([validUc({ provenance: unsigned })])).toThrow(/firsthand/i);
  });
  it("passes the signed firsthand constant", () => {
    expect(() => assertUseCases([validUc({ provenance: firstHand })])).not.toThrow();
  });
});

describe("coverageFrom, computed, never asserted", () => {
  it("counts totals and firsthand per industry and rolls up the summary", () => {
    const cov = coverageFrom([
      validUc({ industry: "insurance", provenance: studied }),
      validUc({ industry: "insurance", provenance: firstHand }),
      validUc({ industry: "telecom", provenance: firstHand }),
    ]);
    expect(cov.byIndustry.insurance.total).toBe(2);
    expect(cov.byIndustry.insurance.firstHand).toBe(1);
    expect(cov.industries).toBe(2);
    expect(cov.scenarios).toBe(3);
    expect(cov.firstHandDomains).toBe(2);
  });
  it("reports zero firsthand domains when everything is studied", () => {
    const cov = coverageFrom([validUc({ industry: "retail", provenance: studied })]);
    expect(cov.firstHandDomains).toBe(0);
  });
});

describe("the shipped use case registry", () => {
  it("has 69 use cases across 23 labs", () => {
    expect(Object.keys(USE_CASES_BY_LAB)).toHaveLength(23);
    expect(ALL_USE_CASES).toHaveLength(69);
  });
  it("gives every lab exactly 3 use cases", () => {
    for (const [lab, list] of Object.entries(USE_CASES_BY_LAB)) expect(list.length, lab).toBe(3);
  });
  it("gives every use case ≥1 source, an ISO date, and a known industry", () => {
    for (const uc of ALL_USE_CASES) {
      expect(uc.sources.length, uc.id).toBeGreaterThan(0);
      expect(uc.lastVerified, uc.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(INDUSTRIES[uc.industry], `${uc.id} industry`).toBeDefined();
    }
  });
  it("keeps every use case id unique", () => {
    const ids = ALL_USE_CASES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("keeps computed coverage in step with the registry", () => {
    expect(USE_CASE_COVERAGE.scenarios).toBe(ALL_USE_CASES.length);
  });
});
