// Version & Duplicate Resolution engine (Corpus Intelligence · Phase 2).
// Groups the pairwise duplicate/version/near-duplicate detections into
// connected SETS, and recommends a deterministic resolution per set:
// which copy to keep, which to exclude, and why. Pure functions; the UI
// layer owns acceptance/override, and accepted exclusions flow to the
// Data Readiness Handoff as blocked sources.

import type { CorpusFile, DupPair, PairKind } from "./corpus";
import { hasVersionMarker } from "./corpus";

export type SetKind = "duplicate" | "version" | "overlap";

export interface DuplicateSet {
  /** Stable id: sorted member file-ids joined with "+". */
  id: string;
  memberIds: string[];
  memberNames: string[];
  kind: SetKind;
  maxSimilarity: number;
  /** Pairs inside this set (for edge → set focus and detail rendering). */
  pairs: DupPair[];
  recommendation: SetRecommendation;
}

export interface SetRecommendation {
  action: "keep-one" | "quarantine-stale" | "review-overlap";
  keepId: string;
  keepName: string;
  dropIds: string[];
  dropNames: string[];
  why: string;
}

const KIND_RANK: Record<PairKind, number> = { duplicate: 0, "stale-version": 1, "near-duplicate": 2 };

/** Names that explicitly claim staleness. A bare version number (v3.1) is NOT
 * staleness, "legacy/old/superseded/draft/backup/copy" is. */
// NB: \b treats "_" as a word character, so "policy_v1_old.txt" would slip
// past /\bold\b/. Use an explicit non-letter boundary instead.
const STALE_MARKER = /(?:^|[^a-z])(?:old|copy)(?:[^a-z]|$)|legacy|superseded|draft|backup|archive|deprecated/i;

/** Deterministic "authoritative copy" pick: a stale-marked name loses first
 * (legacy/old/draft/…), then the lower gate score, then the smaller document,
 * then name order. Visible, explainable signals. */
export function pickKeeper(members: CorpusFile[]): CorpusFile {
  return members.slice().sort((a, b) => {
    const am = STALE_MARKER.test(a.name) ? 1 : 0;
    const bm = STALE_MARKER.test(b.name) ? 1 : 0;
    if (am !== bm) return am - bm;
    if (a.score !== b.score) return b.score - a.score;
    if (a.tokens !== b.tokens) return b.tokens - a.tokens;
    return a.name.localeCompare(b.name);
  })[0];
}

/** Union pairs into connected sets and derive a recommendation per set. */
export function deriveDuplicateSets(files: CorpusFile[], pairs: DupPair[]): DuplicateSet[] {
  if (!pairs.length) return [];
  const byId = new Map(files.map((f) => [f.id, f]));

  // Union-find over pair endpoints.
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = parent.get(x) ?? x;
    while (r !== (parent.get(r) ?? r)) r = parent.get(r) ?? r;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const p of pairs) union(p.aId, p.bId);

  const groups = new Map<string, Set<string>>();
  for (const p of pairs) {
    const root = find(p.aId);
    const g = groups.get(root) ?? new Set<string>();
    g.add(p.aId);
    g.add(p.bId);
    groups.set(root, g);
  }

  const sets: DuplicateSet[] = [];
  for (const g of groups.values()) {
    const memberIds = [...g].sort();
    const members = memberIds.map((id) => byId.get(id)).filter((f): f is CorpusFile => !!f);
    if (members.length < 2) continue;
    const setPairs = pairs
      .filter((p) => g.has(p.aId) && g.has(p.bId))
      .slice()
      .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || b.similarity - a.similarity);
    const dominant = setPairs[0];
    const kind: SetKind = dominant.kind === "duplicate" ? "duplicate" : dominant.kind === "stale-version" ? "version" : "overlap";
    const keeper = pickKeeper(members);
    const drops = members.filter((m) => m.id !== keeper.id);
    const maxSimilarity = Math.max(...setPairs.map((p) => p.similarity));

    let action: SetRecommendation["action"];
    let why: string;
    if (kind === "duplicate") {
      action = "keep-one";
      why = `Near-identical copies (${Math.round(maxSimilarity * 100)}% overlap). Keep “${keeper.name}” as the authoritative copy; embedding both would double-count the same facts in retrieval.`;
    } else if (kind === "version") {
      action = "quarantine-stale";
      const marked = drops.find((d) => STALE_MARKER.test(d.name) || hasVersionMarker(d.name));
      why = `Version conflict (${Math.round(maxSimilarity * 100)}% overlap). “${keeper.name}” reads as the current copy${marked ? `; “${marked.name}” carries a stale-version marker` : ""}. Two versions answering the same question is the conflicting-answers risk Govern flags.`;
    } else {
      action = "review-overlap";
      why = `Substantial overlap (${Math.round(maxSimilarity * 100)}%). Likely shared boilerplate or a partial extract, review whether both belong before ingestion.`;
    }

    sets.push({
      id: memberIds.join("+"),
      memberIds,
      memberNames: members.map((m) => m.name),
      kind,
      maxSimilarity,
      pairs: setPairs,
      recommendation: {
        action,
        keepId: keeper.id,
        keepName: keeper.name,
        dropIds: drops.map((d) => d.id),
        dropNames: drops.map((d) => d.name),
        why,
      },
    });
  }

  // Severity order: versions (conflicting answers) first, then duplicates, then overlaps.
  const setRank: Record<SetKind, number> = { version: 0, duplicate: 1, overlap: 2 };
  return sets.sort((a, b) => setRank[a.kind] - setRank[b.kind] || b.maxSimilarity - a.maxSimilarity || a.id.localeCompare(b.id));
}

/** Find the set containing a given pair (for Star Map edge → panel focus). */
export function setIdForPair(sets: DuplicateSet[], pair: DupPair): string | null {
  const s = sets.find((x) => x.memberIds.includes(pair.aId) && x.memberIds.includes(pair.bId));
  return s?.id ?? null;
}
