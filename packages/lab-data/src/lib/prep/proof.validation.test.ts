import { describe, it, expect } from "vitest";
import { runProof } from "./proof";
import { CORPUS_SAMPLES } from "../../data/sampleCorpus";

// Validates the cleaning-to-quality proof against the sample corpus it was
// authored for: the raw corpus must demonstrably suffer from the stale copy,
// and the cleaned corpus must measurably improve — otherwise the panel has no
// honest story to tell.

const files = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content }));

describe("cleaning-to-quality proof (golden-set validation)", () => {
  it("raw corpus suffers: stale evidence appears and accuracy is imperfect", () => {
    const r = runProof(files, new Set(), new Map());
    expect(r.cleanedDiffers).toBe(false);
    expect(r.raw.staleHits).toBeGreaterThan(0);
    expect(r.raw.accuracyPct).toBeLessThan(100);
  });

  it("resolving duplicates measurably improves retrieval", () => {
    const r = runProof(
      files,
      new Set(["travel_policy_v2.7_legacy.txt", "customers_master.csv"]),
      new Map([["travel_policy_v3.1_current.txt", ["Travel policy"]]]),
    );
    expect(r.cleanedDiffers).toBe(true);
    expect(r.cleaned.accuracyPct).toBeGreaterThanOrEqual(r.raw.accuracyPct);
    expect(r.cleaned.accuracyPct).toBe(100);
    expect(r.cleaned.staleHits).toBe(0);
    // The stale-answer trap flips to the authoritative copy once cleaned.
    const q2 = r.rows.find((x) => x.id === "q2")!;
    expect(q2.rawCorrect).toBe(false);
    expect(q2.cleanedCorrect).toBe(true);
    expect(q2.cleanedTopFile).toBe("travel_policy_v3.1_current.txt");
  });

  it("is deterministic: identical inputs, identical numbers", () => {
    const a = runProof(files, new Set(), new Map());
    const b = runProof(files, new Set(), new Map());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
