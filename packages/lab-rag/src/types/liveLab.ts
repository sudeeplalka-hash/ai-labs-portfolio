// Types for the Live RAG Evaluator Lab — a client-side, deterministic RAG simulation.

export type ProcessingStatus = "Pending" | "Running" | "Complete" | "Warning" | "Failed";

export type QualityGateStatus = "Passed" | "Warning" | "Failed";

export type RetrievalMode = "lexical" | "embedding";

export type QueryStage = "retrieving" | "generating" | "evaluating";

export interface LiveLabDocument {
  id: string;
  name: string;
  sourceType: "upload" | "paste" | "sample";
  fileType: string;
  rawText: string;
  characterCount: number;
  estimatedTokens: number;
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  heading?: string;
  text: string;
  characterCount: number;
  estimatedTokens: number;
  metadata: {
    source: string;
    section?: string;
    createdAt: string;
  };
}

export interface RetrievedLiveChunk extends DocumentChunk {
  rank: number;
  relevanceScore: number;
  matchReasons: string[];
  citationLabel: string;
  usedInAnswer: boolean;
}

export interface GeneratedLiveAnswer {
  answer: string;
  citations: string[];
  mode: "simulated" | "llm";
  caveats: string[];
  /** Human-readable engine label, e.g. "OpenAI · gpt-4o-mini" — recorded per trace. */
  engineLabel?: string;
}

export interface LiveEvaluationResult {
  retrievalRelevance: number;
  citationCoverage: number;
  citationAccuracy: number;
  faithfulness: number;
  answerCompleteness: number;
  contextUtilization: number;
  hallucinationRisk: number;
  overallQuality: number;
  humanReviewRequired: boolean;
  qualityGateStatus: QualityGateStatus;
  failureReasons: string[];
  evaluatorSummary: string;
  userFriendlyExplanation: string[];
}

export interface LiveTraceStep {
  step: string;
  status: ProcessingStatus;
  durationMs: number;
  explanation: string;
  technicalDetail?: string;
}

export interface LiveRagLabTrace {
  id: string;
  documentId: string;
  documentName: string;
  question: string;
  retrievedChunks: RetrievedLiveChunk[];
  generatedAnswer: GeneratedLiveAnswer;
  evaluation: LiveEvaluationResult;
  timeline: LiveTraceStep[];
  latencyMs: number;
  estimatedCost: number;
  createdAt: string;
}

export interface LiveLabMetrics {
  questionsAsked: number;
  averageOverallQuality: number;
  averageRetrievalRelevance: number;
  averageFaithfulness: number;
  averageCitationAccuracy: number;
  averageHallucinationRisk: number;
  humanReviewRequiredCount: number;
  averageLatency: number;
  averageEstimatedCost: number;
  failedQualityGates: number;
  warningQualityGates: number;
  passedQualityGates: number;
}

export interface SampleDocument {
  id: string;
  name: string;
  fileType: string;
  description: string;
  sampleQuestions: string[];
  rawText: string;
}
