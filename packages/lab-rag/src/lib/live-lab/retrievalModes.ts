// ============================================================================
// Phase 3, retrieval substrate demonstration engine. Self-contained and
// deterministic: BM25 lexical baseline, local TF-IDF "vector" retrieval, hybrid
// fusion, and governance-aware reranking over a small sample corpus. Does NOT
// touch the live-lab BM25 pipeline; this is an analytical layer for /build/retrieval.
// ============================================================================

export type RetrievalMode = "lexical" | "simulated-vector" | "hybrid" | "hybrid rerank";

export const RETRIEVAL_MODES: { id: RetrievalMode; label: string; desc: string }[] = [
  { id: "lexical", label: "Lexical BM25", desc: "Term overlap ranking. Fast and explainable, but misses semantically similar evidence when wording differs." },
  { id: "simulated-vector", label: "Simulated vector retrieval", desc: "Deterministic local embeddings + cosine similarity, illustrates semantic retrieval without a hosted vector DB." },
  { id: "hybrid", label: "Hybrid lexical + vector", desc: "Blends BM25 and vector scores (0.55 / 0.45) for balanced evidence. Strongest general option." },
  { id: "hybrid rerank", label: "Hybrid + rerank", desc: "Reorders hybrid evidence using source authority, freshness, metadata, citation readiness, and Data handoff exclusions." },
];
export const LEXICAL_WEIGHT = 0.55;
export const VECTOR_WEIGHT = 0.45;

export interface SampleChunk {
  id: string; source: string; text: string;
  authority: number;      // 0..1 source authority
  fresh: boolean;         // current vs stale/archived
  citationReady: boolean; // has citable metadata
  metadataComplete: boolean;
}

export const SAMPLE_QUERY = "How many days do I have to submit a reimbursement request?";
export const SAMPLE_CHUNKS: SampleChunk[] = [
  { id: "c1", source: "Expense Policy v3.1", text: "Reimbursement requests must be submitted within 30 days of the expense date.", authority: 0.95, fresh: true, citationReady: true, metadataComplete: true },
  { id: "c2", source: "Travel Policy v2.4", text: "Employees may claim mileage at the standard rate for approved business travel.", authority: 0.9, fresh: true, citationReady: true, metadataComplete: true },
  { id: "c3", source: "Expense Policy v1.0 (archived)", text: "Older guidance suggested a 60-day window for submitting expense reimbursements.", authority: 0.5, fresh: false, citationReady: true, metadataComplete: false },
  { id: "c4", source: "Approval Matrix v1.2", text: "Manager approval is required for any expense over $500 before reimbursement.", authority: 0.85, fresh: true, citationReady: true, metadataComplete: true },
  { id: "c5", source: "Intranet FAQ", text: "For questions about expenses, contact the finance help desk.", authority: 0.4, fresh: true, citationReady: false, metadataComplete: false },
  { id: "c6", source: "Raw customer PII export", text: "Personal credit card statements attached to claims may contain sensitive cardholder data.", authority: 0.7, fresh: true, citationReady: false, metadataComplete: true },
];

const tok = (s: string): string[] => (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 1);

// ---- BM25 (compact) ---------------------------------------------------------
function bm25Scores(query: string, chunks: SampleChunk[]): number[] {
  const k1 = 1.5, b = 0.75;
  const docs = chunks.map((c) => tok(c.text));
  const avgdl = docs.reduce((s, d) => s + d.length, 0) / Math.max(1, docs.length);
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const idf = (t: string) => Math.log(1 + (docs.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
  const q = tok(query);
  return docs.map((d) => {
    const tf = new Map<string, number>(); d.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let s = 0;
    for (const t of q) { const f = tf.get(t); if (!f) continue; s += idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.length / (avgdl || 1))); }
    return s;
  });
}

// ---- Local TF-IDF cosine "vector" retrieval --------------------------------
function vectorScores(query: string, chunks: SampleChunk[]): number[] {
  const docsTok = chunks.map((c) => tok(c.text));
  const vocab = new Map<string, number>();
  docsTok.concat([tok(query)]).forEach((d) => new Set(d).forEach((t) => { if (!vocab.has(t)) vocab.set(t, vocab.size); }));
  const df = new Map<string, number>();
  docsTok.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const idf = (t: string) => Math.log((docsTok.length + 1) / ((df.get(t) ?? 0) + 1)) + 1;
  const vec = (d: string[]): number[] => {
    const v = new Array(vocab.size).fill(0);
    const tf = new Map<string, number>(); d.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    tf.forEach((f, t) => { const i = vocab.get(t); if (i !== undefined) v[i] = (f / d.length) * idf(t); });
    return v;
  };
  const cos = (a: number[], b2: number[]) => { let dot = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { dot += a[i] * b2[i]; na += a[i] * a[i]; nb += b2[i] * b2[i]; } return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1); };
  const qv = vec(tok(query));
  return docsTok.map((d) => cos(vec(d), qv));
}

const norm = (arr: number[]): number[] => { const mx = Math.max(...arr, 1e-9); return arr.map((x) => Math.max(0, x) / mx); };

export interface RankedChunk {
  id: string; source: string; text: string;
  lexScore: number; vecScore: number; hybridScore: number; finalScore: number;
  rank: number; prevRank?: number; rerankReason?: string;
  excluded?: boolean; excludedReason?: string;
  citationReady: boolean; authority: number; fresh: boolean;
}
export interface ModeResult {
  mode: RetrievalMode;
  results: RankedChunk[];
  metrics: { citationAccuracy: number; faithfulness: number; hallucinationRisk: number; quality: number; latencyMs: number; cost: number };
}

export function runRetrieval(mode: RetrievalMode, blockedSources: string[] = [], chunks: SampleChunk[] = SAMPLE_CHUNKS, query = SAMPLE_QUERY, topK = 4): ModeResult {
  const lex = norm(bm25Scores(query, chunks));
  const vec = norm(vectorScores(query, chunks));
  const hybrid = chunks.map((_, i) => LEXICAL_WEIGHT * lex[i] + VECTOR_WEIGHT * vec[i]);
  const primary = mode === "lexical" ? lex : mode === "simulated-vector" ? vec : hybrid;

  let ranked: RankedChunk[] = chunks.map((c, i) => ({
    id: c.id, source: c.source, text: c.text,
    lexScore: Math.round(lex[i] * 100) / 100, vecScore: Math.round(vec[i] * 100) / 100,
    hybridScore: Math.round(hybrid[i] * 100) / 100, finalScore: Math.round(primary[i] * 100) / 100,
    rank: 0, citationReady: c.citationReady, authority: c.authority, fresh: c.fresh,
  }));
  ranked.sort((a, b) => b.finalScore - a.finalScore).forEach((r, i) => (r.rank = i + 1));

  if (mode === "hybrid rerank") {
    const prev = new Map(ranked.map((r) => [r.id, r.rank]));
    ranked = ranked.map((r) => {
      const src = chunks.find((c) => c.id === r.id)!;
      const blockedHit = blockedSources.some((b) => r.source.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(r.source.toLowerCase()));
      if (blockedHit) return { ...r, excluded: true, excludedReason: "Excluded by Data handoff (blocked source)", finalScore: 0 };
      const factor = (0.6 + 0.4 * src.authority) * (src.fresh ? 1 : 0.6) * (src.citationReady ? 1 : 0.75) * (src.metadataComplete ? 1 : 0.9);
      const reasons: string[] = [];
      if (!src.fresh) reasons.push("stale-version risk");
      if (src.authority >= 0.85) reasons.push("authoritative source");
      if (!src.citationReady) reasons.push("citation metadata incomplete");
      if (src.fresh && src.citationReady && src.authority >= 0.85) reasons.push("current & citation-ready");
      return { ...r, finalScore: Math.round(r.hybridScore * factor * 100) / 100, rerankReason: reasons.join(", ") || "no adjustment" };
    });
    const active = ranked.filter((r) => !r.excluded).sort((a, b) => b.finalScore - a.finalScore);
    active.forEach((r, i) => { r.prevRank = prev.get(r.id); r.rank = i + 1; });
    const excluded = ranked.filter((r) => r.excluded);
    ranked = [...active, ...excluded];
  }

  const top = ranked.filter((r) => !r.excluded).slice(0, topK);
  // Deterministic quality estimates per mode (governed rerank is best).
  const base = { lexical: { c: 82, f: 84, h: 12, q: 78, lat: 120, cost: 0.009 }, "simulated-vector": { c: 84, f: 85, h: 11, q: 82, lat: 180, cost: 0.011 }, hybrid: { c: 88, f: 88, h: 9, q: 86, lat: 210, cost: 0.013 }, "hybrid rerank": { c: 93, f: 91, h: 6, q: 90, lat: 280, cost: 0.015 } }[mode];
  return {
    mode, results: [...top, ...ranked.filter((r) => r.excluded)],
    metrics: { citationAccuracy: base.c, faithfulness: base.f, hallucinationRisk: base.h, quality: base.q, latencyMs: base.lat, cost: base.cost },
  };
}

export interface ModeComparisonRow { mode: RetrievalMode; label: string; topSource: string; strength: string; risk: string; latencyMs: number; cost: number }
export function compareModes(blockedSources: string[] = []): ModeComparisonRow[] {
  const meta: Record<RetrievalMode, { strength: string; risk: string }> = {
    "lexical": { strength: "Explainable exact matches", risk: "Misses semantic matches" },
    "simulated-vector": { strength: "Handles wording variation", risk: "May retrieve vague neighbors" },
    "hybrid": { strength: "Balanced, strongest general option", risk: "Requires weight tuning" },
    "hybrid rerank": { strength: "Governed top evidence (release candidate)", risk: "Higher latency" },
  };
  return RETRIEVAL_MODES.map((m) => {
    const r = runRetrieval(m.id, blockedSources);
    return { mode: m.id, label: m.label, topSource: r.results.find((x) => !x.excluded)?.source ?? "N/A", strength: meta[m.id].strength, risk: meta[m.id].risk, latencyMs: r.metrics.latencyMs, cost: r.metrics.cost };
  });
}

export interface ReadinessField { label: string; status: "Ready" | "Partial" | "Missing" | "Not required" }
export interface VectorIndexReadiness { fields: ReadinessField[]; readiness: "Ready" | "Partial" | "Missing" | "Not required"; recommendation: string }
export function vectorIndexReadiness(opts: { dataReadinessScore?: number; blockedCount?: number; hasHandoff?: boolean }): VectorIndexReadiness {
  const ready = (opts.dataReadinessScore ?? 0) >= 75;
  const partial = (opts.dataReadinessScore ?? 0) >= 60;
  const p = (cond: boolean, partialOk = true): ReadinessField["status"] => (cond ? "Ready" : partialOk && partial ? "Partial" : "Missing");
  const fields: ReadinessField[] = [
    { label: "Embedding model selected", status: "Partial" },
    { label: "Vector store target", status: "Missing" },
    { label: "Similarity metric (cosine)", status: "Ready" },
    { label: "Metadata filters available", status: p(ready) },
    { label: "Access control filters", status: opts.blockedCount ? "Partial" : "Missing" },
    { label: "Stable chunk IDs", status: opts.hasHandoff ? "Ready" : "Partial" },
    { label: "Source versioning", status: p(ready) },
    { label: "Re indexing strategy", status: "Missing" },
    { label: "Deletion / update strategy", status: "Missing" },
    { label: "Source exclusion rules", status: opts.blockedCount ? "Ready" : "Partial" },
    { label: "Hybrid search enabled", status: "Ready" },
    { label: "ANN index required", status: "Not required" },
  ];
  const missing = fields.filter((f) => f.status === "Missing").length;
  const readiness = !opts.hasHandoff ? "Missing" : missing >= 4 ? "Missing" : missing >= 2 ? "Partial" : "Ready";
  const recommendation = readiness === "Ready" ? "Ready for vector database integration"
    : readiness === "Partial" ? "Ready for simulated vector retrieval; resolve gaps before production vector indexing"
    : opts.hasHandoff ? "Ready for lexical retrieval only" : "Not ready for vector indexing, complete the Data handoff first";
  return { fields, readiness, recommendation };
}
