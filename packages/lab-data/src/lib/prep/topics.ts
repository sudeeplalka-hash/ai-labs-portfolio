// Topic groups (Phase 4 · F-7). Deterministic k-means (from @labs/kit) over
// the corpus term-frequency vectors, with SUGGESTED labels from each group's
// dominant vocabulary terms and an explicit "unsure" state where the signal
// is thin. The human stays the labeler: suggestions only become metadata when
// a person confirms or renames them in the lab.

import { kmeans } from "@labs/kit";

export interface TopicGroup {
  id: string;
  /** Suggested label from top terms, e.g. "claims · coverage". */
  suggestedLabel: string;
  /** True when the group's term signal is too thin to trust the suggestion. */
  unsure: boolean;
  memberIds: string[];
  memberNames: string[];
  topTerms: string[];
}

export function deriveTopicGroups(
  fileIds: string[],
  fileNames: string[],
  vectors: number[][],
  vocab: string[],
): TopicGroup[] {
  const n = vectors.length;
  const dim = vocab.length;
  if (n < 4 || dim < 6) return [];

  const k = Math.min(4, Math.max(2, Math.round(n / 3)));
  const assign = kmeans(vectors, k);

  const groups: TopicGroup[] = [];
  for (let c = 0; c < k; c++) {
    const idx = assign.map((a, i) => (a === c ? i : -1)).filter((i) => i >= 0);
    if (idx.length === 0) continue;

    const sum = new Array(dim).fill(0);
    for (const i of idx) for (let j = 0; j < dim; j++) sum[j] += vectors[i][j];
    const ranked = sum
      .map((w, j) => [w, j] as [number, number])
      .sort((a, b) => b[0] - a[0])
      .filter(([w]) => w > 0)
      .slice(0, 4)
      .map(([, j]) => vocab[j]);

    const totalMass = sum.reduce((a, b) => a + b, 0);
    const topMass = ranked.slice(0, 2).reduce((a, t) => a + sum[vocab.indexOf(t)], 0);
    // Thin signal: singleton group, no usable terms, or a flat term profile.
    const unsure = idx.length < 2 || ranked.length < 2 || (totalMass > 0 && topMass / totalMass < 0.12);

    groups.push({
      id: `t${c}`,
      suggestedLabel: unsure ? "Unsure" : ranked.slice(0, 2).join(" \u00b7 "),
      unsure,
      memberIds: idx.map((i) => fileIds[i]),
      memberNames: idx.map((i) => fileNames[i]),
      topTerms: ranked,
    });
  }

  // Stable order: confident groups first, larger first, then id.
  return groups.sort((a, b) => Number(a.unsure) - Number(b.unsure) || b.memberIds.length - a.memberIds.length || a.id.localeCompare(b.id));
}
