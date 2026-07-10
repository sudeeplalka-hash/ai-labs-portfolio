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
    expect(`${sv!.aName} ${sv!.bName}`).toMatch(/policy/i);
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
    const spamText = ("This document is confidential and proprietary to the company. ").repeat(40);
    const spam = { name: "template-spam.txt", text: spamText, size: spamText.length };
    const r = analyzeCorpus([...inputs.slice(0, 2), spam]);
    const f = r.files.find((x) => x.name === "template-spam.txt")!;
    const check = f.report.checks.find((c) => c.guideline === "concentration")!;
    expect(check.level).not.toBe("healthy");
    expect(check.fix?.id).toBe("concentration");
  });

  it("an off-topic document is flagged as a cohesion outlier", () => {
    const offtopicText =
      "Preheat the oven to 220 degrees. Slice tomatoes basil mozzarella. Bake the dough eight minutes, add toppings, finish with olive oil and oregano. Serve the pizza hot with a side salad and lemon dressing.";
    const offtopic = { name: "recipe.txt", text: offtopicText, size: offtopicText.length };
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

describe("PCA projection (Corpus Atlas, Phase 3)", () => {
  const r = analyzeCorpus(inputs);

  it("is deterministic and keeps every axis inside the plot band", () => {
    const again = analyzeCorpus(inputs);
    expect(again.files.map((f) => [f.x, f.y, f.z])).toEqual(r.files.map((f) => [f.x, f.y, f.z]));
    for (const f of r.files) {
      for (const v of [f.x, f.y, f.z]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("distance means similarity: a duplicate pair sits closer than the average pair", () => {
    const dup = r.pairs.find((p) => p.kind === "duplicate")!;
    const byId = new Map(r.files.map((f) => [f.id, f]));
    const d = (aId: string, bId: string) => {
      const a = byId.get(aId)!;
      const b = byId.get(bId)!;
      return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    };
    const dupDist = d(dup.aId, dup.bId);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < r.files.length; i++) {
      for (let j = i + 1; j < r.files.length; j++) {
        sum += d(r.files[i].id, r.files[j].id);
        count++;
      }
    }
    expect(dupDist).toBeLessThan(sum / count);
  });

  it("tiny corpora still render via the deterministic fallback", () => {
    const two = analyzeCorpus(inputs.slice(0, 2));
    for (const f of two.files) {
      expect(Number.isFinite(f.x)).toBe(true);
      expect(f.z).toBe(50);
    }
  });
});

describe("freshness heuristic (UX pass)", () => {
  it("a versioned tabular export (crm_export_v2.csv) is NOT flagged as stale", () => {
    const r = analyzeCorpus(inputs);
    const f = r.files.find((x) => x.name === "crm_export_v2.csv")!;
    expect(f.report.checks.some((c) => c.guideline === "freshness" && c.level !== "healthy")).toBe(false);
  });

  it("an explicitly stale-marked prose file still gets the freshness flag", () => {
    const r = analyzeCorpus(inputs);
    const f = r.files.find((x) => x.name === "travel_policy_v2.7_legacy.txt")!;
    expect(f.report.checks.some((c) => c.guideline === "freshness" && c.level !== "healthy")).toBe(true);
  });

  it("a bare version number on a prose file still hints (v3.1 current)", () => {
    const r = analyzeCorpus(inputs);
    const f = r.files.find((x) => x.name === "travel_policy_v3.1_current.txt")!;
    expect(f.report.checks.some((c) => c.guideline === "freshness")).toBe(true);
  });
});
