import { describe, it, expect } from "vitest";
import { getRetriever, hasStrongRetrieval, DEFAULT_TOP_K } from "@rag/lib/live-lab/retrieval";
import type { DocumentChunk } from "@rag/types/liveLab";

// BM25 behavior locks for the lexical retriever. The SAME Okapi parameters
// (k1 = 1.5, b = 0.75) and IDF shape are implemented independently in
// lab-data's proof engine; its sibling suite pins the raw formula numerically:
//   packages/lab-data/src/lib/prep/bm25-parity.test.ts
// This side locks the observable behavior (rank order, TF saturation, length
// normalization) because relevanceScore is normalized, not raw. If either
// implementation drifts from Okapi BM25, its own suite fails.

function mk(id: string, text: string): DocumentChunk {
  return {
    id, documentId: "doc", chunkIndex: 0, text,
    characterCount: text.length, estimatedTokens: Math.round(text.length / 4),
    metadata: { source: "test", createdAt: "" },
  };
}

const lexical = () => getRetriever("lexical");

describe("Bm25Retriever behavior locks", () => {
  it("ranks the only chunk containing the query term first", () => {
    const res = lexical().retrieve("zebra", [
      mk("A", "alpha zebra window"),
      mk("B", "alpha window curtain"),
      mk("C", "alpha curtain window"),
    ], 3);
    expect(res[0].id).toBe("A");
    expect(res[0].relevanceScore).toBeGreaterThan(res[1].relevanceScore);
  });

  it("saturates term frequency (tf=4 scores less than 4x tf=1) — the k1 contract", () => {
    const res = lexical().retrieve("omega", [
      mk("D", "omega omega omega omega"),
      mk("E", "omega window curtain fabric"),
    ], 2);
    const d = res.find((r) => r.id === "D")!;
    const e = res.find((r) => r.id === "E")!;
    expect(d.relevanceScore).toBeGreaterThan(e.relevanceScore);
    expect(d.relevanceScore).toBeLessThan(4 * e.relevanceScore);
  });

  it("normalizes by document length (same tf, shorter doc wins) — the b contract", () => {
    const res = lexical().retrieve("sigma", [
      mk("G", "sigma window curtain fabric velvet cotton linen wool silk denim"),
      mk("F", "sigma window curtain"),
    ], 2);
    expect(res[0].id).toBe("F");
  });

  it("is deterministic", () => {
    const chunks = [mk("A", "alpha zebra window"), mk("B", "alpha window curtain")];
    const a = lexical().retrieve("zebra window", chunks, 2);
    const b = lexical().retrieve("zebra window", chunks, 2);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("respects topK and labels citations sequentially", () => {
    const chunks = ["alpha zebra", "zebra window", "zebra curtain", "zebra fabric"].map((t, i) => mk(`k${i}`, t));
    const res = lexical().retrieve("zebra", chunks, 2);
    expect(res).toHaveLength(2);
    expect(res.map((r) => r.rank)).toEqual([1, 2]);
    expect(res.map((r) => r.citationLabel)).toEqual(["C1", "C2"]);
    expect(DEFAULT_TOP_K).toBe(5);
  });

  it("keeps relevance scores in the published 0.04..0.98 band", () => {
    const res = lexical().retrieve("zebra", [mk("A", "alpha zebra window"), mk("B", "unrelated words entirely")], 2);
    for (const r of res) {
      expect(r.relevanceScore).toBeGreaterThanOrEqual(0.04);
      expect(r.relevanceScore).toBeLessThanOrEqual(0.98);
    }
  });

  it("empty corpus returns empty, not a crash", () => {
    expect(lexical().retrieve("anything", [], 5)).toEqual([]);
  });
});

describe("embedding placeholder honesty", () => {
  it("delegates to BM25 verbatim until a real embedding retriever exists", () => {
    const chunks = [mk("A", "alpha zebra window"), mk("B", "alpha window curtain"), mk("C", "curtain fabric velvet")];
    const lex = getRetriever("lexical").retrieve("zebra curtain", chunks, 3);
    const emb = getRetriever("embedding").retrieve("zebra curtain", chunks, 3);
    expect(JSON.stringify(emb)).toBe(JSON.stringify(lex));
  });
});

describe("hasStrongRetrieval", () => {
  it("is true iff any chunk clears the 0.45 threshold", () => {
    const base = mk("A", "text");
    expect(hasStrongRetrieval([{ ...base, rank: 1, relevanceScore: 0.44, matchReasons: [], citationLabel: "C1", usedInAnswer: false }])).toBe(false);
    expect(hasStrongRetrieval([{ ...base, rank: 1, relevanceScore: 0.45, matchReasons: [], citationLabel: "C1", usedInAnswer: false }])).toBe(true);
  });
});
