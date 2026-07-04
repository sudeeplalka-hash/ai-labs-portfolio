// Core shared types for the RAG Quality Evaluator Dashboard.

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type Status = "Healthy" | "Watch" | "At Risk" | "Critical";

export type TrendDirection = "up" | "down" | "flat";

export type SupportStatus =
  | "Supported"
  | "Partially Supported"
  | "Unsupported"
  | "Contradicted"
  | "Not Enough Evidence";

export type ReleaseRecommendation =
  | "Promote"
  | "Promote with Monitoring"
  | "Hold"
  | "Block";

export type GateStatus = "Passed" | "Warning" | "Failed" | "Not Evaluated";

export type EvaluationStatus = "Passed" | "Failed" | "Needs Review" | "Skipped";

export type FreshnessStatus = "Current" | "Stale" | "Unknown";

export interface KpiMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  target?: number | string;
  trendValue?: number;
  trendDirection?: TrendDirection;
  status: Status;
  interpretation: string;
  description: string;
}

export interface SourceDocument {
  id: string;
  name: string;
  version: string;
  domain: string;
  owner: string;
  lastUpdated: string;
  freshnessStatus: FreshnessStatus;
  riskLevel: RiskLevel;
  description: string;
}

export interface RetrievedChunk {
  id: string;
  sourceDocument: string;
  documentVersion: string;
  chunkId: string;
  rank: number;
  relevanceScore: number;
  usedInAnswer: boolean;
  citationMatched: boolean;
  freshnessStatus: FreshnessStatus;
  text: string;
}

export interface ClaimVerification {
  id: string;
  claim: string;
  supportStatus: SupportStatus;
  confidence: number;
  sourceDocument?: string;
  citationId?: string;
  evidenceSnippet?: string;
  reviewerNote?: string;
}

export interface TraceTimelineStep {
  step: string;
  durationMs: number;
  status: "Completed" | "Warning" | "Failed";
  notes: string;
}

export interface TraceScores {
  contextRelevance: number;
  retrievalCompleteness: number;
  faithfulness: number;
  completeness: number;
  citationAccuracy: number;
  claimSupport: number;
  hallucinationRisk: number;
  piiRisk: number;
  complianceRisk: number;
}

export interface QueryTrace {
  id: string;
  question: string;
  originalQuery: string;
  rewrittenQuery: string;
  category: string;
  queryType: string;
  riskLevel: RiskLevel;
  expectedSource: string;
  generatedAnswer: string;
  expectedAnswer: string;
  retrievedChunks: RetrievedChunk[];
  claimVerifications: ClaimVerification[];
  scores: TraceScores;
  failureReasons: string[];
  humanReviewRequired: boolean;
  evaluationStatus: EvaluationStatus;
  timeline: TraceTimelineStep[];
}

export interface GoldenDatasetItem {
  id: string;
  question: string;
  expectedAnswer: string;
  requiredSourceDocument: string;
  requiredCitation: string;
  category: string;
  queryType: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Edge Case";
  riskLevel: RiskLevel;
  owner: string;
  lastUpdated: string;
  testStatus: EvaluationStatus;
  humanReviewRequired: boolean;
}

export interface EvaluationRunMetrics {
  overallScore: number;
  retrievalQuality: number;
  faithfulness: number;
  citationAccuracy: number;
  hallucinationRisk: number;
  passRate: number;
  highRiskPassRate: number;
  criticalFailures: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  costPerQuery: number;
}

export interface EvaluationRun {
  id: string;
  runName: string;
  runDate: string;
  modelVersion: string;
  embeddingModel: string;
  retrieverStrategy: string;
  rerankerEnabled: boolean;
  promptVersion: string;
  datasetVersion: string;
  testCaseCount: number;
  metrics: EvaluationRunMetrics;
  regressionStatus: "No Regression" | "Watch" | "Regression";
  releaseRecommendation: ReleaseRecommendation;
  notes: string;
}

export interface FailureCategory {
  id: string;
  name: string;
  count: number;
  percentage: number;
  severity: RiskLevel;
  likelyRootCause: string;
  recommendedFix: string;
}

export interface FailingDocument {
  id: string;
  documentName: string;
  version: string;
  failedQueries: number;
  dominantFailureMode: string;
  riskLevel: RiskLevel;
  recommendedFix: string;
}

export interface FailureHeatmapCell {
  domain: string;
  values: Record<string, number>;
}

export interface RetrievalExperiment {
  id: string;
  strategy: string;
  chunkingStrategy: string;
  chunkSize: number | string;
  overlap: number | string;
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  ndcg: number;
  retrievalScore: number;
  faithfulnessScore: number;
  latencyMs: number;
  costPerQuery: number;
  recommendation: string;
}

export interface OperationalRecord {
  id: string;
  date: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  retrievalLatencyMs: number;
  rerankingLatencyMs: number;
  generationLatencyMs: number;
  evaluationLatencyMs: number;
  costPerQuery: number;
  tokenUsage: number;
  cacheHitRate: number;
  errorRate: number;
  timeoutRate: number;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  threshold: string;
  currentValue: string;
  status: GateStatus;
  severity: RiskLevel;
  remediation: string;
}

export interface MaturityLevel {
  level: number;
  name: string;
  description: string;
  capabilities: string[];
  evidence?: string[];
  gaps?: string[];
}

export interface AnswerMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  status: Status;
  interpretation: string;
}

export interface AnswerFailureExample {
  id: string;
  title: string;
  failureMode: string;
  riskLevel: RiskLevel;
  question: string;
  generatedAnswer: string;
  whatWentWrong: string;
  expectedBehavior: string;
}

export interface ChecklistItem {
  id: string;
  item: string;
  status: "Complete" | "In Progress" | "Not Started";
  notes: string;
}
