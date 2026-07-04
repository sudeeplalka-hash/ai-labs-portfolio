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
