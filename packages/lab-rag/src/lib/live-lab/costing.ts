import { estimateTokens } from "./textUtils";
import type { RetrievedLiveChunk } from "@rag/types/liveLab";

export const DEFAULT_MODEL_COST_PROFILE = {
  modelName: "Simulated GPT-4o-mini profile",
  inputPerMillion: 0.15,
  outputPerMillion: 0.6,
};

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  modelName: string;
}

// Estimate cost from token counts using a sample pricing profile (no provider needed).
export function estimateCost(
  question: string,
  retrievedChunks: RetrievedLiveChunk[],
  answer: string,
  profile = DEFAULT_MODEL_COST_PROFILE,
): CostEstimate {
  const questionTokens = estimateTokens(question);
  const contextTokens = retrievedChunks.reduce((sum, c) => sum + c.estimatedTokens, 0);
  const inputTokens = questionTokens + contextTokens + 80; // + system prompt overhead
  const outputTokens = estimateTokens(answer);

  const estimatedCost =
    (inputTokens / 1_000_000) * profile.inputPerMillion +
    (outputTokens / 1_000_000) * profile.outputPerMillion;

  return {
    inputTokens,
    outputTokens,
    estimatedCost: Math.round(estimatedCost * 1_000_000) / 1_000_000,
    modelName: profile.modelName,
  };
}
