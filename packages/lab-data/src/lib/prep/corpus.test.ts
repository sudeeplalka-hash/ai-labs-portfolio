import { describe, it, expect } from "vitest";
import { analyzeCorpus } from "./corpus";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";

const inputs = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length }));

describe("analyzeCorpus", () => {
  const r = analyzeCorpus(inputs);

  it("profiles every file", () => {
    expect(r.files).toHaveLength(CORPUS_SAMPLES.length);
    expect(r.health.total).toBe(CORPUS_SAMPLES.length);
  });

  it("detects an exact duplicate pair", () => {
    expect(r.pairs.some((p) => p.kind === "duplicate")).toBe(true);
  });

  it("detects a stale-version conflict pair", () => {
    const sv = r.pairs.find((p) => p.kind === "stale-version");
    expect(sv).toBeDefined();
    expect(sv?.aName + sv?.bName).toMatch(/policy/i);
  });

  it("spreads documents in the 2D projection", () => {
    const distinctX = new Set(r.files.map((f) => f.x.toFixed(2))).size;
    expect(distinctX).toBeGreaterThanOrEqual(4);
    r.files.forEach((f) => {
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThanOrEqual(100);
    });
  });

  it("rolls up corpus health", () => {
    expect(r.health.duplicates).toBeGreaterThanOrEqual(1);
    expect(r.health.conflicts).toBeGreaterThanOrEqual(1);
    expect(r.health.readyPct).toBeGreaterThanOrEqual(0);
    expect(r.health.readyPct).toBeLessThanOrEqual(100);
  });
});

describe("corpus-level guideline checks (Phase 1)", () => {
  it("every file carries a concentration check; corpora of 3+ carry cohesion", () => {
    const r = analyzeCorpus(inputs);
    for (const f of r.files) {
      expect(f.report.checks.some((c) => c.guideline === "concentration")).toBe(true);
      expect(f.report.checks.some((c) => c.guideline === "cohesion")).toBe(true);
    }
  });

  it("boilerplate-heavy input triggers a concentration finding with a fix", () => {
    const spam = { name: "template-spam.txt", text: ("This document is confidential and proprietary to the company. ").repeat(40) };
    const r = analyzeCorpus([...inputs.slice(0, 2), spam]);
    const f = r.files.find((x) => x.name === "template-spam.txt")!;
    const check = f.report.checks.find((c) => c.guideline === "concentration")!;
    expect(check.level).not.toBe("healthy");
    expect(check.fix?.id).toBe("concentration");
  });

  it("an off-topic document is flagged as a cohesion outlier", () => {
    const offtopic = {
      name: "recipe.txt",
      text: "Preheat the oven to 220 degrees. Slice tomatoes basil mozzarella. Bake the dough eight minutes, add toppings, finish with olive oil and oregano. Serve the pizza hot with a side salad and lemon dressing.",
    };
    const r = analyzeCorpus([...inputs.slice(0, 4), offtopic]);
    const f = r.files.find((x) => x.name === "recipe.txt")!;
    const check = f.report.checks.find((c) => c.guideline === "cohesion")!;
    expect(check.level).not.toBe("healthy");
  });

  it("two-file corpora skip the cohesion check (not enough signal)", () => {
    const r = analyzeCorpus(inputs.slice(0, 2));
    for (const f of r.files) {
      expect(f.report.checks.some((c) => c.guideline === "cohesion")).toBe(false);
    }
  });
});
