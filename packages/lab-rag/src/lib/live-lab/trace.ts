import type {
  GeneratedLiveAnswer,
  LiveEvaluationResult,
  LiveRagLabTrace,
  LiveTraceStep,
  RetrievedLiveChunk,
} from "@rag/types/liveLab";

export interface BuildTraceInput {
  documentId: string;
  documentName: string;
  question: string;
  retrievedChunks: RetrievedLiveChunk[];
  generatedAnswer: GeneratedLiveAnswer;
  evaluation: LiveEvaluationResult;
  stepDurations: { retrieve: number; generate: number; evaluate: number };
  estimatedCost: number;
}

// Assemble the audit trail for a single RAG interaction.
export function buildLiveTrace(input: BuildTraceInput): LiveRagLabTrace {
  const { stepDurations } = input;
  const strongRetrieval = input.retrievedChunks.some((c) => c.relevanceScore >= 0.45);

  const timeline: LiveTraceStep[] = [
    {
      step: "Query received",
      status: "Complete",
      durationMs: 3,
      explanation: "Your question was accepted and normalized for retrieval.",
      technicalDetail: "Lowercased, tokenized, stopwords removed for lexical matching.",
    },
    {
      step: "Evidence retrieved",
      status: strongRetrieval ? "Complete" : "Warning",
      durationMs: stepDurations.retrieve,
      explanation: strongRetrieval
        ? `Retrieved ${input.retrievedChunks.length} candidate chunks ranked by relevance.`
        : `Retrieved ${input.retrievedChunks.length} chunks, but none scored highly, evidence may be weak.`,
      technicalDetail: "Lexical retriever: keyword overlap + term frequency + phrase/heading/policy bonuses.",
    },
    {
      step: "Answer generated",
      status: "Complete",
      durationMs: stepDurations.generate,
      explanation: `A grounded answer was drafted from the top ${input.generatedAnswer.citations.length || "0"} cited chunk(s).`,
      technicalDetail: `Mode: ${input.generatedAnswer.mode}. Citations: ${input.generatedAnswer.citations.join(", ") || "none"}.`,
    },
    {
      step: "Answer evaluated",
      status:
        input.evaluation.qualityGateStatus === "Failed"
          ? "Failed"
          : input.evaluation.qualityGateStatus === "Warning"
          ? "Warning"
          : "Complete",
      durationMs: stepDurations.evaluate,
      explanation: input.evaluation.evaluatorSummary,
      technicalDetail: `Faithfulness ${input.evaluation.faithfulness}%, citation accuracy ${input.evaluation.citationAccuracy}%, hallucination risk ${input.evaluation.hallucinationRisk}%.`,
    },
    {
      step: "Quality gate applied",
      status:
        input.evaluation.qualityGateStatus === "Failed"
          ? "Failed"
          : input.evaluation.qualityGateStatus === "Warning"
          ? "Warning"
          : "Complete",
      durationMs: 2,
      explanation: `Quality gate result: ${input.evaluation.qualityGateStatus}.${
        input.evaluation.humanReviewRequired ? " Human review required." : ""
      }`,
      technicalDetail: "Thresholds: Passed >= 80 overall & <= 20 hallucination & >= 80 citation accuracy.",
    },
  ];

  const latencyMs = stepDurations.retrieve + stepDurations.generate + stepDurations.evaluate + 5;

  return {
    id: `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    documentId: input.documentId,
    documentName: input.documentName,
    question: input.question,
    retrievedChunks: input.retrievedChunks,
    generatedAnswer: input.generatedAnswer,
    evaluation: input.evaluation,
    timeline,
    latencyMs,
    estimatedCost: input.estimatedCost,
    createdAt: new Date().toISOString(),
  };
}
