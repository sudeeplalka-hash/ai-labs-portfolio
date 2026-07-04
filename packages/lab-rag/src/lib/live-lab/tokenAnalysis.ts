import { contentWords, estimateTokens } from "./textUtils";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

export type TokenRole = "matched" | "miss" | "common";

export interface TokenInfo {
  text: string;
  role: TokenRole;
}

export interface ContextChunkTokens {
  label: string;
  tokens: number;
}

export interface TokenAnalysis {
  questionTokens: TokenInfo[];
  questionTokenCount: number;
  contentCount: number;
  matchedCount: number;
  missCount: number;
  coverage: number; // matched / content, %
  contextChunks: ContextChunkTokens[];
  contextTokens: number;
  inputTokens: number;
  outputTokens: number;
  estCost: number;
  documentTokens: number;
  compression: number; // contextTokens / documentTokens, %
}

// Break a trace into a token-level view: which question tokens were matched in
// the retrieved context, how the context window is composed, and the resulting
// token economics. Deterministic.
export function analyzeTokens(trace: LiveRagLabTrace, documentTokens: number): TokenAnalysis {
  const retrievedWords = new Set<string>();
  for (const c of trace.retrievedChunks) {
    for (const w of contentWords(c.text)) retrievedWords.add(w.replace(/[^a-z0-9]/g, ""));
  }

  const rawTokens = trace.question.split(/\s+/).filter(Boolean);
  const questionTokens: TokenInfo[] = rawTokens.map((tok) => {
    const clean = tok.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isContent = clean.length > 0 && contentWords(clean).length > 0;
    if (!isContent) return { text: tok, role: "common" };
    return { text: tok, role: retrievedWords.has(clean) ? "matched" : "miss" };
  });

  const contentCount = questionTokens.filter((t) => t.role !== "common").length;
  const matchedCount = questionTokens.filter((t) => t.role === "matched").length;
  const missCount = questionTokens.filter((t) => t.role === "miss").length;

  const contextChunks: ContextChunkTokens[] = trace.retrievedChunks.map((c) => ({
    label: c.citationLabel,
    tokens: c.estimatedTokens,
  }));
  const contextTokens = contextChunks.reduce((s, c) => s + c.tokens, 0);
  const inputTokens = estimateTokens(trace.question) + contextTokens + 80;
  const outputTokens = estimateTokens(trace.generatedAnswer.answer);

  return {
    questionTokens,
    questionTokenCount: estimateTokens(trace.question),
    contentCount,
    matchedCount,
    missCount,
    coverage: contentCount ? Math.round((matchedCount / contentCount) * 100) : 0,
    contextChunks,
    contextTokens,
    inputTokens,
    outputTokens,
    estCost: trace.estimatedCost,
    documentTokens,
    compression: documentTokens ? Math.round((contextTokens / documentTokens) * 100) : 0,
  };
}
