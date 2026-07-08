import { describe, it, expect } from "vitest";
import { contentConcentration, topicalCohesion, parsabilityProfile, languageProfile } from "./signals";
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

describe("parsabilityProfile", () => {
  it("clean prose in a text file is healthy", () => {
    const text = "Adjusters review coverage terms and document their decisions.\nAppeals go to the review board within five business days.\n";
    const r = parsabilityProfile(text, text.length);
    expect(r.level).toBe("healthy");
    expect(r.reasons).toEqual([]);
    expect(r.extractionYield).toBeCloseTo(1, 5);
  });

  it("a large binary file with almost no extracted text is critical (scanned/image-heavy)", () => {
    const r = parsabilityProfile("Cover page", 500_000);
    expect(r.level).toBe("critical");
    expect(r.reasons.join(" ")).toMatch(/scanned or image-heavy/);
  });

  it("replacement characters raise the encoding reason", () => {
    const text = ("normal text " + "\uFFFD").repeat(200);
    const r = parsabilityProfile(text, text.length);
    expect(["risk", "critical"]).toContain(r.level);
    expect(r.reasons.join(" ")).toMatch(/replacement/i);
  });

  it("repeated header/footer lines raise the boilerplate reason", () => {
    const body = Array.from({ length: 30 }, (_, i) => `CONFIDENTIAL - ACME CORP - PAGE HEADER\nUnique paragraph line number ${i} with content.`).join("\n");
    const r = parsabilityProfile(body, body.length);
    expect(r.boilerplateLineShare).toBeGreaterThan(0.3);
    expect(r.reasons.join(" ")).toMatch(/repeat verbatim/);
  });
});

describe("languageProfile (heuristic)", () => {
  it("detects English with high confidence on ordinary prose", () => {
    const r = languageProfile("The adjusters review the coverage terms and document the decisions that are made for the claims in the system.");
    expect(r.primary).toBe("English");
    expect(r.confidence).toBe("high");
    expect(r.scriptMix[0].script).toBe("Latin");
  });

  it("detects Spanish over English on Spanish prose", () => {
    const r = languageProfile("Los ajustadores revisan los términos de la cobertura y documentan las decisiones que se toman para los reclamos en el sistema con una política clara para el cliente.");
    expect(r.primary).toBe("Spanish");
  });

  it("reports non-Latin scripts by script name", () => {
    const r = languageProfile("Политика рассмотрения претензий и споров по покрытию для клиентов компании.");
    expect(r.primary).toBe("Cyrillic script");
    expect(r.confidence).toBe("high");
  });

  it("empty/whitespace input is Unknown, and results are deterministic", () => {
    expect(languageProfile("   ").primary).toBe("Unknown");
    const text = "The quick brown fox jumps over the lazy dog and the horse.";
    expect(languageProfile(text)).toEqual(languageProfile(text));
  });
});
