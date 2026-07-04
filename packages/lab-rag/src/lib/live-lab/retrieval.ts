import type { DocumentChunk, RetrievedLiveChunk, RetrievalMode } from "@rag/types/liveLab";
import { contentWords } from "./textUtils";
import { buildBoilerplateSet, boilerplateRatio } from "./boilerplate";
import { expandQuery } from "./queryExpansion";

export const DEFAULT_TOP_K = 5;

export interface Retriever {
  mode: RetrievalMode;
  retrieve(query: string, chunks: DocumentChunk[], topK: number): RetrievedLiveChunk[];
}

// Generic "meta" words that describe documents rather than their subject matter,
// counted at reduced weight so questions like "what is this document about?" do
// not get hijacked by boilerplate that merely contains "document".
const META_WORDS = new Set([
  "document", "documents", "question", "questions", "answer", "answers", "main",
  "overview", "summary", "summarize", "topic", "topics", "trying", "information",
  "detail", "details", "section", "sections", "page", "pages", "content", "file",
]);

export const metaWeight = (w: string) => (META_WORDS.has(w) ? 0.3 : 1);

// BM25 ranking parameters.
const K1 = 1.5;
const B = 0.75;

interface Doc {
  chunk: DocumentChunk;
  terms: string[];
  tf: Map<string, number>;
  len: number;
}

// Industry-standard BM25 lexical retriever: IDF weighting, term-frequency
// saturation (k1), and document-length normalization (b). Deterministic.
export class Bm25Retriever implements Retriever {
  mode: RetrievalMode = "lexical";

  retrieve(query: string, chunks: DocumentChunk[], topK = DEFAULT_TOP_K): RetrievedLiveChunk[] {
    if (!chunks.length) return [];

    const docs: Doc[] = chunks.map((c) => {
      const terms = contentWords(c.text).map((w) => w.replace(/[^a-z0-9]/g, "")).filter((w) => w.length > 1);
      const tf = new Map<string, number>();
      for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
      return { chunk: c, terms, tf, len: terms.length };
    });

    const N = docs.length;
    const avgdl = docs.reduce((s, d) => s + d.len, 0) / Math.max(1, N);

    // Document frequency for IDF.
    const df = new Map<string, number>();
    for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    const idf = (t: string) => Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));

    // Original query terms (full weight) + synonym expansion (half weight).
    const termWeight = new Map<string, number>();
    for (const w of contentWords(query).map((x) => x.replace(/[^a-z0-9]/g, "")).filter((x) => x.length > 1)) {
      termWeight.set(w, 1);
    }
    for (const w of expandQuery(query)) if (!termWeight.has(w)) termWeight.set(w, 0.5);
    const queryTerms = [...termWeight.keys()];

    const repeated = buildBoilerplateSet(chunks.map((c) => c.text));

    const scored = docs.map((d) => {
      let score = 0;
      const matched: string[] = [];
      for (const t of queryTerms) {
        const f = d.tf.get(t);
        if (!f) continue;
        const denom = f + K1 * (1 - B + B * (d.len / (avgdl || 1)));
        score += idf(t) * ((f * (K1 + 1)) / denom) * metaWeight(t) * (termWeight.get(t) ?? 1);
        if (!META_WORDS.has(t) && (termWeight.get(t) ?? 1) === 1) matched.push(t);
      }
      // Phrase bonus: contiguous query bigram present in chunk.
      const cl = d.chunk.text.toLowerCase();
      const ql = query.toLowerCase();
      const qWords = ql.split(/\s+/).filter(Boolean);
      for (let i = 0; i < qWords.length - 1; i++) {
        if (cl.includes(`${qWords[i]} ${qWords[i + 1]}`)) score += 0.6;
      }
      // Boilerplate down-weighting.
      const ratio = boilerplateRatio(d.chunk.text, repeated);
      if (ratio >= 0.6) score *= 0.15;
      else if (ratio >= 0.3) score *= 0.6;

      const reasons: string[] = [];
      if (matched.length) reasons.push(`Matched: ${matched.slice(0, 5).join(", ")}`);
      else if (ratio >= 0.6) reasons.push("Mostly boilerplate (headers/footers)");
      else reasons.push("Weak lexical match");

      return { doc: d, score, reasons };
    });

    const maxScore = Math.max(...scored.map((s) => s.score), 1e-6);
    // Confidence factor so a document with no strong match yields low relevance.
    const confidence = Math.min(1, maxScore / 6);

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s, i) => ({
        ...s.doc.chunk,
        rank: i + 1,
        relevanceScore: Math.round(Math.max(0.04, Math.min(0.98, (s.score / maxScore) * (0.45 + 0.5 * confidence))) * 100) / 100,
        matchReasons: s.reasons,
        citationLabel: `C${i + 1}`,
        usedInAnswer: false,
      }));
  }
}

/*
 * Embedding-mode placeholder. To add real semantic retrieval later, implement
 * the Retriever interface with an embedding model + vector store (OpenAI /
 * Anthropic / Gemini embeddings + pgvector / Pinecone / Weaviate / Chroma) and
 * return it from getRetriever("embedding").
 */
export class EmbeddingRetrieverPlaceholder implements Retriever {
  mode: RetrievalMode = "embedding";
  retrieve(query: string, chunks: DocumentChunk[], topK = DEFAULT_TOP_K): RetrievedLiveChunk[] {
    return new Bm25Retriever().retrieve(query, chunks, topK);
  }
}

export function getRetriever(mode: RetrievalMode = "lexical"): Retriever {
  return mode === "embedding" ? new EmbeddingRetrieverPlaceholder() : new Bm25Retriever();
}

export function hasStrongRetrieval(retrieved: RetrievedLiveChunk[]): boolean {
  return retrieved.some((c) => c.relevanceScore >= 0.45);
}
