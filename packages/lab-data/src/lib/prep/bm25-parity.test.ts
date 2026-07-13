import { describe, it, expect } from "vitest";
import { rankChunks } from "./proof";

// Numeric pin for the proof engine's Okapi BM25 (k1 = 1.5, b = 0.75).
// The SAME parameters are implemented independently in lab-rag's retriever
// (packages/lab-rag/src/lib/live-lab/retrieval.ts); its sibling suite locks
// the behavior there: packages/lab-rag/src/lib/live-lab/retrieval.test.ts.
// This side pins the RAW score, which fixes k1, b, and the IDF shape exactly:
//   idf   = ln(1 + (N - n + 0.5) / (n + 0.5))
//   score = idf * tf(k1+1) / (tf + k1(1 - b + b*len/avgLen))
// Fixture: N=2 equal-length docs, query term tf=2 in doc A only →
//   idf = ln 2 ≈ 0.693147, tf-part = 5/3.5 ≈ 1.428571, score ≈ 0.990210.
// If either constant or the formula changes, this value moves.

const A = { file: "a.md", idx: 0, terms: ["beta", "beta", "alpha", "gamma"], topics: [] };
const B = { file: "b.md", idx: 0, terms: ["alpha", "delta", "epsilon", "zeta"], topics: [] };

describe("proof BM25 parity pin (k1=1.5, b=0.75)", () => {
  it("reproduces the hand-computed Okapi score exactly", () => {
    const ranked = rankChunks([A, B], "beta");
    expect(ranked[0].file).toBe("a.md");
    expect(ranked[0].score).toBeCloseTo(0.990210, 4);
    expect(ranked[1].score).toBe(0);
  });

  it("applies the disclosed 1.15x topic bonus only on a matching hint", () => {
    const tagged = { ...A, topics: ["Travel policy"] };
    const withHint = rankChunks([tagged, B], "beta", "travel");
    expect(withHint[0].score).toBeCloseTo(0.990210 * 1.15, 4);
    const wrongHint = rankChunks([tagged, B], "beta", "security");
    expect(wrongHint[0].score).toBeCloseTo(0.990210, 4);
  });

  it("breaks score ties deterministically by file name", () => {
    const X = { file: "x.md", idx: 0, terms: ["beta", "gamma"], topics: [] };
    const Y = { file: "y.md", idx: 0, terms: ["beta", "gamma"], topics: [] };
    const ranked = rankChunks([Y, X], "beta");
    expect(ranked[0].score).toBe(ranked[1].score);
    expect(ranked.map((r) => r.file)).toEqual(["x.md", "y.md"]);
  });

  it("is deterministic across runs", () => {
    const r1 = rankChunks([A, B], "beta gamma");
    const r2 = rankChunks([A, B], "beta gamma");
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
