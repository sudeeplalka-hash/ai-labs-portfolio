// Corpus content signals (Corpus Intelligence · Phase 0).
// Two new deterministic scores that extend the rulebook categories in Phase 1:
//
//  - contentConcentration: how much of a document is repeated phrasing
//    (boilerplate, templates, copy-paste). Visible math: share of distinct
//    3-grams among all 3-grams; score = round(100 * distinctShare).
//
//  - topicalCohesion: how tightly the corpus holds together topically.
//    Visible math: mean cosine similarity of each document vector to the
//    corpus centroid; score = round(100 * meanCosine). Per-document cosines
//    are returned so outliers can be flagged (Atlas overlay, Phase 3+).
//
// Pure functions, no state, no randomness.

import { dot, l2normalize } from "@labs/kit";

export interface ConcentrationResult {
  /** 0..100 — higher = more distinct content, lower = repetitive/boilerplate. */
  score: number;
  /** 0..1 share of trigram occurrences that repeat an earlier trigram. */
  repeatedShare: number;
  /** Most-repeated trigrams (up to 5), for the finding detail line. */
  topRepeats: string[];
}

export function contentConcentration(tokens: string[]): ConcentrationResult {
  if (tokens.length < 3) return { score: 100, repeatedShare: 0, topRepeats: [] };
  const counts = new Map<string, number>();
  const total = tokens.length - 2;
  for (let i = 0; i < total; i++) {
    const g = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const distinct = counts.size;
  const repeatedShare = (total - distinct) / total;
  const topRepeats = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([g]) => g);
  return { score: Math.round(100 * (1 - repeatedShare)), repeatedShare, topRepeats };
}

export interface CohesionResult {
  /** 0..100 — higher = documents share a topical center. */
  score: number;
  /** Cosine of each document vector to the corpus centroid (input order). */
  perDoc: number[];
}

export function topicalCohesion(vectors: number[][]): CohesionResult {
  if (vectors.length === 0) return { score: 100, perDoc: [] };
  if (vectors.length === 1) return { score: 100, perDoc: [1] };
  const d = vectors[0].length;
  if (d === 0) return { score: 100, perDoc: vectors.map(() => 1) };
  const unit = vectors.map(l2normalize);
  const centroid = new Array(d).fill(0);
  for (const v of unit) for (let j = 0; j < d; j++) centroid[j] += v[j];
  const c = l2normalize(centroid);
  const perDoc = unit.map((v) => Math.max(0, Math.min(1, dot(v, c))));
  const mean = perDoc.reduce((a, b) => a + b, 0) / perDoc.length;
  return { score: Math.round(100 * mean), perDoc };
}
