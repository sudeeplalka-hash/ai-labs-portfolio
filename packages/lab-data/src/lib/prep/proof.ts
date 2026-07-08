// Cleaning-to-quality proof (Corpus Intelligence · Phase 5 · F-8).
//
// The claim the whole Data stage rests on, made measurable in the browser:
// resolving duplicates/stale versions and confirming topic tags changes what
// retrieval returns. We run the SAME deterministic baseline retriever
// (BM25, the algorithm family behind Build's baseline mode) over the corpus
// twice, raw vs cleaned, against a small authored golden set whose answers
// live in specific files, then report the measured deltas. No models, no
// randomness: identical inputs give identical numbers, and every formula is
// in this file.

export interface ProofFileInput {
  name: string;
  text: string;
  /** Human-confirmed topic labels for this file (cleaned snapshot only). */
  topics?: string[];
}

export interface ProofQuestion {
  id: string;
  question: string;
  /** The file that actually answers it (current/authoritative). */
  expectedFile: string;
  /** A superseded/duplicate file that competes with a stale answer. */
  trapFile?: string;
  /** Optional topic hint: matches a confirmed topic label (case-insensitive). */
  topicHint?: string;
}

export interface ProofMetrics {
  correct: number;
  total: number;
  accuracyPct: number;
  /** Questions with any top-3 evidence from a superseded/trap file. */
  staleHits: number;
  staleSharePct: number;
}

export interface ProofRow {
  id: string;
  question: string;
  rawTopFile: string;
  cleanedTopFile: string;
  rawCorrect: boolean;
  cleanedCorrect: boolean;
  rawStaleEvidence: boolean;
  cleanedStaleEvidence: boolean;
}

export interface ProofResult {
  raw: ProofMetrics;
  cleaned: ProofMetrics;
  rows: ProofRow[];
  /** True when the cleaned snapshot actually differed (exclusions/tags). */
  cleanedDiffers: boolean;
}

// Golden questions authored against the sample corpus content. Each answer
// verifiably lives in expectedFile; traps point at the superseded copies.
export const PROOF_QUESTIONS: ProofQuestion[] = [
  { id: "q1", question: "What is the daily meal allowance for domestic travel?", expectedFile: "travel_policy_v3.1_current.txt", trapFile: "travel_policy_v2.7_legacy.txt", topicHint: "policy" },
  { id: "q2", question: "Over what amount do expenses require manager approval?", expectedFile: "travel_policy_v3.1_current.txt", trapFile: "travel_policy_v2.7_legacy.txt", topicHint: "policy" },
  { id: "q3", question: "Which class must air travel be booked in for flights under six hours?", expectedFile: "travel_policy_v3.1_current.txt", trapFile: "travel_policy_v2.7_legacy.txt", topicHint: "policy" },
  { id: "q4", question: "When did the current authoritative travel policy become effective?", expectedFile: "travel_policy_v3.1_current.txt", trapFile: "travel_policy_v2.7_legacy.txt", topicHint: "policy" },
  { id: "q5", question: "What must new vendors complete before any contract is signed?", expectedFile: "vendor_onboarding_kb.md", topicHint: "vendor" },
  { id: "q6", question: "How quickly does the procurement team review vendor submissions?", expectedFile: "vendor_onboarding_kb.md", topicHint: "vendor" },
  { id: "q7", question: "What are the standard vendor payment terms?", expectedFile: "vendor_onboarding_kb.md", topicHint: "vendor" },
  { id: "q8", question: "What is the main remaining engineering risk under peak load?", expectedFile: "eng_update_q2.md", topicHint: "engineering" },
];

// ---- retrieval mechanics (visible math) ------------------------------------

const STOP = new Set(["the", "and", "for", "are", "was", "with", "that", "this", "from", "you", "your", "all", "any", "not", "but", "what", "which", "must", "does", "did", "when", "how", "over", "under"]);

function tok(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((t) => !STOP.has(t));
}

interface Chunk {
  file: string;
  idx: number;
  terms: string[];
  topics: string[];
}

/** Window chunker: ~120 tokens per chunk, paragraph-first. */
function chunkFile(f: ProofFileInput): Chunk[] {
  const paras = f.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      chunks.push({ file: f.name, idx: chunks.length, terms: buf, topics: f.topics ?? [] });
      buf = [];
    }
  };
  for (const p of paras) {
    const t = tok(p);
    if (buf.length + t.length > 120) flush();
    buf = buf.concat(t);
  }
  flush();
  return chunks.length ? chunks : [{ file: f.name, idx: 0, terms: tok(f.text), topics: f.topics ?? [] }];
}

/** Okapi BM25 (k1 = 1.5, b = 0.75) with an OPTIONAL, disclosed topic bonus:
 * when a question carries a topicHint and a chunk's file was human-tagged with
 * a matching label, its score is multiplied by 1.15. */
export function rankChunks(chunks: Chunk[], query: string, topicHint?: string): { file: string; score: number }[] {
  const k1 = 1.5;
  const b = 0.75;
  const N = chunks.length;
  const avgLen = chunks.reduce((a, c) => a + c.terms.length, 0) / Math.max(1, N);
  const df = new Map<string, number>();
  for (const c of chunks) for (const t of new Set(c.terms)) df.set(t, (df.get(t) ?? 0) + 1);

  const qTerms = tok(query);
  const scored = chunks.map((c) => {
    const counts = new Map<string, number>();
    for (const t of c.terms) counts.set(t, (counts.get(t) ?? 0) + 1);
    let score = 0;
    for (const q of qTerms) {
      const n = df.get(q) ?? 0;
      if (n === 0) continue;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const tf = counts.get(q) ?? 0;
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * c.terms.length) / Math.max(1, avgLen))));
    }
    if (topicHint && c.topics.some((t) => t.toLowerCase().includes(topicHint.toLowerCase()))) {
      score *= 1.15;
    }
    return { file: c.file, idx: c.idx, score };
  });
  return scored.sort((a, z) => z.score - a.score || a.file.localeCompare(z.file) || a.idx - z.idx);
}

function evaluate(files: ProofFileInput[], questions: ProofQuestion[]): { metrics: ProofMetrics; perQ: { top: string; correct: boolean; stale: boolean }[] } {
  const present = new Set(files.map((f) => f.name));
  const chunks = files.flatMap(chunkFile);
  const perQ = questions.map((q) => {
    const ranked = rankChunks(chunks, q.question, q.topicHint);
    const top3 = ranked.slice(0, 3);
    const top = top3[0]?.file ?? "\u2014";
    const correct = top === q.expectedFile;
    const stale = !!q.trapFile && present.has(q.trapFile) && top3.some((r) => r.file === q.trapFile);
    return { top, correct, stale };
  });
  const correct = perQ.filter((r) => r.correct).length;
  const staleHits = perQ.filter((r) => r.stale).length;
  return {
    metrics: {
      correct,
      total: questions.length,
      accuracyPct: Math.round((correct / questions.length) * 100),
      staleHits,
      staleSharePct: Math.round((staleHits / questions.length) * 100),
    },
    perQ,
  };
}

/** Run the proof: raw corpus vs cleaned (exclusions removed, topics attached). */
export function runProof(
  files: { name: string; text: string }[],
  excludedNames: Set<string>,
  topicsByFile: Map<string, string[]>,
  questions: ProofQuestion[] = PROOF_QUESTIONS,
): ProofResult {
  const raw: ProofFileInput[] = files.map((f) => ({ name: f.name, text: f.text }));
  const cleaned: ProofFileInput[] = files
    .filter((f) => !excludedNames.has(f.name))
    .map((f) => ({ name: f.name, text: f.text, topics: topicsByFile.get(f.name) ?? [] }));

  const r = evaluate(raw, questions);
  const c = evaluate(cleaned, questions);
  const rows: ProofRow[] = questions.map((q, i) => ({
    id: q.id,
    question: q.question,
    rawTopFile: r.perQ[i].top,
    cleanedTopFile: c.perQ[i].top,
    rawCorrect: r.perQ[i].correct,
    cleanedCorrect: c.perQ[i].correct,
    rawStaleEvidence: r.perQ[i].stale,
    cleanedStaleEvidence: c.perQ[i].stale,
  }));
  const cleanedDiffers = excludedNames.size > 0 || [...topicsByFile.values()].some((t) => t.length > 0);
  return { raw: r.metrics, cleaned: c.metrics, rows, cleanedDiffers };
}
