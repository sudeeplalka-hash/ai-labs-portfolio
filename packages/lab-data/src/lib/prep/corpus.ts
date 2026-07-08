import type { GateVerdict, PrepReport } from "./types";
import { buildReport, computeGate, hasUnclearedBlocker, scoreWithFixes } from "./engine";
import type { ProfileId } from "./profiles";

// Corpus-level analysis: profile many files at once, find near-duplicates and
// stale-version pairs, and project documents into 2D for the star-map. This is
// the dedup / conflict / coverage lens, a different question than the RAG lab's
// query-relative embedding view.

import { contentConcentration, topicalCohesion } from "./signals";
import type { CheckResult } from "./types";

export interface CorpusFile {
  id: string;
  name: string;
  report: PrepReport;
  score: number;
  gate: GateVerdict;
  tokens: number;
  x: number; // 0..100 for SVG plotting
  y: number;
}

export type PairKind = "duplicate" | "stale-version" | "near-duplicate";

export interface DupPair {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  similarity: number;
  kind: PairKind;
  note: string;
}

export interface CorpusHealth {
  total: number;
  approved: number;
  conditional: number;
  hold: number;
  rejected: number;
  readyPct: number;
  avgScore: number;
  duplicates: number;
  conflicts: number;
}

export interface CorpusReport {
  files: CorpusFile[];
  pairs: DupPair[];
  health: CorpusHealth;
}

export interface CorpusInput {
  name: string;
  text: string;
  size: number;
}

// ---- text features ----
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((t) => !STOP.has(t));
}
const STOP = new Set(["the", "and", "for", "are", "was", "with", "that", "this", "from", "you", "your", "all", "any", "not", "but"]);

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

const hasVersionMarker = (name: string) => /v\d|version|legacy|old|draft|backup|archive|\bcopy\b|superseded/i.test(name);

// deterministic PRNG
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildVocab(tokenLists: string[][], limit = 48): string[] {
  const freq = new Map<string, number>();
  for (const toks of tokenLists) for (const t of new Set(toks)) freq.set(t, (freq.get(t) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((e) => e[0]);
}

function tfVector(tokens: string[], vocab: string[]): number[] {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const v = vocab.map((w) => counts.get(w) ?? 0);
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / norm);
}

function project(vectors: number[][], dim: number): { x: number; y: number }[] {
  const r1 = mulberry32(101);
  const r2 = mulberry32(202);
  const a1 = Array.from({ length: dim }, () => r1() * 2 - 1);
  const a2 = Array.from({ length: dim }, () => r2() * 2 - 1);
  const raw = vectors.map((v) => ({
    x: v.reduce((s, x, i) => s + x * a1[i], 0),
    y: v.reduce((s, x, i) => s + x * a2[i], 0),
  }));
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const scale = (val: number, arr: number[]) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    if (max - min < 1e-9) return 50;
    return 8 + ((val - min) / (max - min)) * 84; // pad to 8..92
  };
  return raw.map((p) => ({ x: scale(p.x, xs), y: scale(p.y, ys) }));
}

export function analyzeCorpus(inputs: CorpusInput[], profileId: ProfileId = "general"): CorpusReport {
  const tokenLists = inputs.map((f) => tokenize(f.text));
  const sets = tokenLists.map((t) => new Set(t));
  const vocab = buildVocab(tokenLists);
  const vectors = tokenLists.map((t) => tfVector(t, vocab));
  const coords = project(vectors, vocab.length);

  // Corpus-level guideline checks (Phase 1): concentration is per-document,
  // cohesion is relative to the whole corpus, so both live here rather than in
  // the single-file engine. Visible math in ./signals.ts.
  const cohesion = inputs.length >= 3 ? topicalCohesion(vectors) : null;

  const files: CorpusFile[] = inputs.map((f, i) => {
    const report = buildReport(f.name, f.text, f.size, profileId);

    const conc = contentConcentration(tokenLists[i]);
    const concLevel = conc.score >= 85 ? "healthy" : conc.score >= 65 ? "watch" : conc.score >= 40 ? "risk" : "critical";
    const concCheck: CheckResult = {
      id: "concentration",
      guideline: "concentration",
      name: "Content concentration",
      level: concLevel,
      detail:
        concLevel === "healthy"
          ? `Distinct content: ${conc.score}/100 of 3-gram phrases are unique.`
          : `${Math.round(conc.repeatedShare * 100)}% of phrasing repeats${conc.topRepeats[0] ? ` (top: \u201c${conc.topRepeats[0]}\u201d)` : ""}.`,
      downstream: "Repeated passages crowd the retrieval window with low-information chunks and inflate token spend.",
      fix: concLevel === "healthy" ? undefined : { id: "concentration", label: "Deduplicate repeated passages", delta: 6 },
    };
    report.checks.push(concCheck);

    if (cohesion) {
      const cos = cohesion.perDoc[i];
      const cohLevel = cos >= 0.45 ? "healthy" : cos >= 0.3 ? "watch" : "risk";
      report.checks.push({
        id: "cohesion",
        guideline: "cohesion",
        name: "Topical cohesion",
        level: cohLevel,
        detail:
          cohLevel === "healthy"
            ? `On-topic: cosine ${cos.toFixed(2)} to the corpus centroid.`
            : `Topical outlier: cosine ${cos.toFixed(2)} to the corpus centroid, review whether this belongs in the knowledge base.`,
        downstream: "Off-topic documents surface as irrelevant evidence and dilute retrieval relevance.",
        // No in-lab fix: the honest remediations are exclusion or corpus rescope
        // (Resolution workflow, Phase 2). Until then it can only be accepted.
      });
    }

    const score = scoreWithFixes(report.checks, new Set());
    const gate = computeGate(score, hasUnclearedBlocker(report.checks, new Set()));
    return { id: `f${i}`, name: f.name, report, score, gate, tokens: tokenLists[i].length, x: coords[i].x, y: coords[i].y };
  });

  // pairwise duplicate / stale-version detection
  const pairs: DupPair[] = [];
  for (let i = 0; i < inputs.length; i++) {
    for (let j = i + 1; j < inputs.length; j++) {
      const sim = jaccard(sets[i], sets[j]);
      if (sim < 0.45) continue;
      const versioned = hasVersionMarker(inputs[i].name) || hasVersionMarker(inputs[j].name);
      let kind: PairKind;
      let note: string;
      const pctTxt = `${Math.round(sim * 100)}% overlap`;
      if (sim >= 0.97) {
        kind = "duplicate";
        note = `Near identical (${pctTxt}). Keep one authoritative copy; embedding both biases retrieval.`;
      } else if (versioned && sim >= 0.5) {
        kind = "stale-version";
        note = `Looks like a version pair (${pctTxt}) that differs. Quarantine the older copy, this is the conflicting answer risk the RAG Evaluator would otherwise surface.`;
      } else {
        kind = "near-duplicate";
        note = `Overlaps by ${pctTxt}. Review for redundancy before ingestion.`;
      }
      pairs.push({ aId: `f${i}`, bId: `f${j}`, aName: inputs[i].name, bName: inputs[j].name, similarity: sim, kind, note });
    }
  }

  const counts = { Approved: 0, Conditional: 0, Hold: 0, Rejected: 0 } as Record<GateVerdict["gate"], number>;
  for (const f of files) counts[f.gate.gate]++;
  const total = files.length;
  const health: CorpusHealth = {
    total,
    approved: counts.Approved,
    conditional: counts.Conditional,
    hold: counts.Hold,
    rejected: counts.Rejected,
    readyPct: total ? Math.round((counts.Approved / total) * 100) : 0,
    avgScore: total ? Math.round(files.reduce((a, f) => a + f.score, 0) / total) : 0,
    duplicates: pairs.filter((p) => p.kind === "duplicate" || p.kind === "near-duplicate").length,
    conflicts: pairs.filter((p) => p.kind === "stale-version").length,
  };

  return { files, pairs, health };
}
