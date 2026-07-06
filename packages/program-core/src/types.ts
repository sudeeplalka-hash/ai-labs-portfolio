// ============================================================================
// The program contract (the spine). Lab-agnostic on purpose: framing-specific
// enums live in apps/framing, but the shared initiative shape lives here so
// every lab can read/write it.
// ============================================================================

export type StageKey = "frame" | "data" | "build" | "deploy" | "govern" | "realize" | "operate";
export type StageStatus = "locked" | "active" | "done";

export interface TriangleScores {
  value: number;
  feasibility: number;
  dataReadiness: number;
}

/** Common framing dimensions, kept as loose strings so core stays decoupled from
 *  the framing lab's enums. */
export interface InitiativeParams {
  user?: string;
  job?: string;
  pain?: string;
  posture?: string;
  risk?: string;
}

export interface SelectedUseCase {
  id: number;
  title: string;
  desc?: string;
  bucket: string;
  value: number;
  effort: number;
}

export interface SuccessMetric {
  shape: string;
  baseline: string;
  target: string;
  coverage: string;
}

// ---- Strategy-emitted initiative metadata (Phase 1) -------------------------
export type GovernanceTier = "Low" | "Medium" | "High" | "Critical";
export type Criticality = "Low" | "Medium" | "High";

/** The classification + downstream-plan Strategy stamps on an initiative so every
 *  later stage knows what kind of system this is and what controls it needs. */
export interface BuildPathRecommendation {
  path: string;          // e.g. "RAG knowledge assistant with governed retrieval"
  why: string;
  requiredStages: string[]; // e.g. ["Data readiness", "Build/RAG evaluation", ...]
}
export interface InitiativeMeta {
  primaryAiPattern?: string;
  capabilityTags?: string[];
  buildPathRecommendation?: BuildPathRecommendation;
  governanceTier?: GovernanceTier;
  governanceTierRationale?: string;
  operationalCriticality?: Criticality;
  humanReviewRequired?: boolean;
  auditEvidenceRequired?: boolean;
}

export interface Initiative {
  name: string | null;
  rawAmbition: string;
  sharpenedProblem: string | null;
  params: InitiativeParams | null;
  selectedUseCase: SelectedUseCase | null;
  scope: number; // 0..1
  successMetric: SuccessMetric | null;
  scores: TriangleScores;
  valueHypothesis: string | null;
  createdAt: string | null;
  meta?: InitiativeMeta; // Phase 1, Strategy classification + downstream plan
}

// ---- Stage handoff contracts (Phase 1) --------------------------------------
// Each stage emits a structured contract the next stage consumes. All optional
// so labs degrade gracefully when an upstream stage hasn't run.

/** Data → Build/RAG. What data can be trusted, and under what restrictions. */
export interface DataReadinessHandoff {
  initiativeName?: string | null;
  dataReadinessScore?: number;      // 0..100 (broader readiness)
  ingestionReadyPercent?: number;   // 0..100 (share ingest-ready now)
  approvedSources?: string[];
  conditionalSources?: string[];
  blockedSources?: string[];
  rejectedSources?: string[];
  sensitivityRestrictions?: string[];
  metadataRequirements?: string[];
  chunkingRequirements?: string;
  evalDatasetReadiness?: number;    // 0..100
  knownDataRisks?: string[];
  remediationBacklog?: string[];
  recommendation?: string;
  createdAt?: string;
}

/** Build/RAG → AI Ops. The evaluated system + its release recommendation. */
export interface BuildOutputContract {
  selectedModel?: string;
  selectedPattern?: string;
  retrievalMode?: string;
  promptVersion?: string;
  indexVersion?: string;
  datasetVersion?: string;
  evalRunId?: string;
  qualityScore?: number;            // 0..100
  citationAccuracy?: number;
  faithfulness?: number;
  hallucinationRisk?: number;
  failedGates?: string[];
  knownFailureModes?: string[];
  costEstimate?: number;            // $/answer
  latencyEstimateMs?: number;
  releaseRecommendation?: string;
  createdAt?: string;
  // Phase 3, retrieval substrate lineage (consumed by Operate + Govern).
  retrievalModeLabel?: string;
  vectorReadiness?: string;         // "Ready" | "Partial" | "Missing" | "Not required"
  hybridSearchEnabled?: boolean;
  rerankEnabled?: boolean;
  retrievalQuality?: number;        // 0..100
  retrievalFailureModes?: string[];
  retrievalLatencyEstimateMs?: number;
  retrievalCostEstimate?: number;
  topRetrievalRisks?: string[];
  // Phase 5, agent / tool calling (present when the initiative is agentic).
  agenticWorkflowEnabled?: boolean;
  toolsEnabled?: boolean;
  toolSchemaCount?: number;
  restrictedActionCount?: number;
  approvalRequiredCount?: number;
  toolMisuseEvalStatus?: string;   // "pass" | "warning" | "fail"
  agenticRiskLevel?: string;       // ToolRiskLevel
  agentReleaseRecommendation?: string;
  // Phase 6, training / fine tuning (present when applicable).
  trainingRequired?: boolean;
  fineTuningRecommended?: boolean;
  recommendedApproach?: string;    // prompting | rag | fine tuning | traditional-ml | hybrid
  trainingReadinessStatus?: string;
  overfittingRisk?: string;
  generalizationScore?: number;
  datasetSplitStatus?: string;
  trainingEvalRequired?: string[];
  trainingGovernanceControls?: string[];
  trainingReleaseRecommendation?: string;
}

/** AI Ops → Govern / Realize. Operational readiness evidence. */
export interface OpsEvidence {
  sloStatus?: string;               // "within" | "at risk" | "breached"
  latencyP95?: number;
  costPerQuery?: number;
  errorBudgetPct?: number;
  driftRisk?: number;               // 0..100
  incidentStatus?: string;
  monitoringCoverage?: number;      // 0..100
  rollbackReadiness?: string;
  versionLineage?: Record<string, string>;
  operationalDecision?: string;     // "Ready for pilot" | "Ready with restrictions" | "Hold" | "Not production ready"
  createdAt?: string;
  // Phase 2, richer operational evidence for Govern (Phase 4) + Realize.
  releaseReadinessScore?: number;   // 0..100
  releaseRecommendation?: string;   // "Ready for pilot" | "Ready with restrictions" | "Hold before pilot" | "Not production ready"
  monitoredSignals?: number;
  monitoringCoverageScore?: number; // 0..100
  regressionStatus?: string;        // "No regression" | "Watch" | "Block release"
  regressionFindings?: string[];
  errorBudgetStatus?: string;
  incidentSummary?: string;
  openOperationalRisks?: string[];
  // Phase 5, agent / tool-call telemetry (present when the initiative is agentic).
  toolCallLatencyMs?: number;
  toolFailureRate?: number;
  approvalQueueCount?: number;
  blockedActionCount?: number;
  rollbackEvents?: number;
  toolIncidentRisk?: number;
  agentMonitoringCoverage?: number;
  // Phase 6, training / generalization telemetry (present when a trained/fine tuned model).
  generalizationScore?: number;
  overfittingRiskLevel?: string;
  trainingDriftMonitoringRequired?: boolean;
  holdoutPerformance?: number;
  retrainingTrigger?: string;
  classLevelMonitoring?: boolean;
}

/** Govern → Realize. The governance decision + open risk. */
export interface GovernanceDecision {
  tier?: GovernanceTier;
  decision?: string;                // "Approved for pilot" | "Approved with restrictions" | "Human review required" | "Hold pending remediation" | "Not approved"
  openFindings?: string[];
  requiredControls?: string[];
  humanReviewRequired?: boolean;
  auditReady?: boolean;
  createdAt?: string;
  // Phase 4, full governance review.
  score?: number;                   // 0..100 governance score
  rationale?: string;
  evidenceUsed?: string[];
  releaseBlockers?: string[];
  approvalConditions?: string[];
  nextReviewDate?: string;
  owner?: string;
  auditReadiness?: string;          // "Ready" | "Partial" | "Incomplete"
  updatedAt?: string;
}

// ---- Agent / tool calling contracts (Phase 5) -------------------------------
export type ToolRiskLevel = "low" | "medium" | "high" | "critical";
export type ToolApprovalMode = "none" | "human-review" | "manager-approval" | "policy-owner-approval" | "blocked";
export type ToolExecutionStatus = "allowed" | "requires-approval" | "blocked" | "executed" | "failed" | "rolled-back";

export interface ToolSchema {
  id: string;
  name: string;
  description: string;
  category: "retrieval" | "summarization" | "routing" | "drafting" | "case-management" | "policy-check" | "external-action";
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  allowedRoles: string[];
  restrictedActions: string[];
  riskLevel: ToolRiskLevel;
  approvalMode: ToolApprovalMode;
  auditRequired: boolean;
  rollbackAvailable: boolean;
  owner: string;
}

export interface ToolCallStep {
  id: string;
  stepNumber: number;
  label: string;
  type: "intent" | "retrieve" | "select-tool" | "policy-check" | "approval" | "execute" | "log" | "respond";
  toolId?: string;
  status: ToolExecutionStatus;
  evidence?: string;
  policyCheck?: string;
  approvalRequired?: boolean;
  blockedReason?: string;
  latencyMs?: number;
  costEstimate?: number;
}

export interface AgentWorkflowTrace {
  id: string;
  name: string;
  userRequest: string;
  intent: string;
  selectedTools: string[];
  steps: ToolCallStep[];
  finalStatus: ToolExecutionStatus;
  finalResponse: string;
  auditLogId: string;
  rollbackPlan?: string;
  risks: string[];
}

export interface AgentMisuseEval {
  id: string;
  name: string;
  category: "wrong-tool" | "missing-approval" | "unsafe-action" | "hallucinated-tool-output" | "action-without-evidence" | "policy-boundary-violation";
  severity: ToolRiskLevel;
  expectedBehavior: string;
  observedBehavior: string;
  result: "pass" | "warning" | "fail";
  recommendedControl: string;
}

export interface AgentToolingContract {
  enabled: boolean;
  toolSchemas: ToolSchema[];
  workflowTraces: AgentWorkflowTrace[];
  misuseEvals: AgentMisuseEval[];
  permissionBoundaries: { allowedActions: string[]; restrictedActions: string[]; blockedActions: string[] };
  approvalRequirements: string[];
  auditEvidence: string[];
  operationalSignals: { toolCallLatencyMs: number; toolFailureRate: number; approvalQueueCount: number; rollbackEvents: number; blockedActionCount: number };
  governanceFindings: string[];
}

// ---- Training / fine tuning / generalization readiness (Phase 6) ------------
export type TrainingReadinessStatus = "ready" | "ready-with-cautions" | "not-ready" | "not-required";
export type DatasetSplitStatus = "complete" | "partial" | "missing" | "not-required";
export type GeneralizationRiskLevel = "low" | "medium" | "high" | "critical";

export interface TrainingDatasetReadiness {
  required: boolean;
  status: TrainingReadinessStatus;
  labeledExamplesAvailable: boolean;
  labeledExampleCount: number;
  labelQualityScore: number;
  labelConsistencyScore: number;
  trainValidationTestSplit: DatasetSplitStatus;
  trainPercent: number;
  validationPercent: number;
  testPercent: number;
  holdoutSetAvailable: boolean;
  classBalanceScore: number;
  edgeCaseCoverageScore: number;
  leakageRisk: GeneralizationRiskLevel;
  overfittingRisk: GeneralizationRiskLevel;
  generalizationReadiness: number;
  representativeCoverage: number;
  driftMonitoringRequired: boolean;
  recommendedAction: string;
  blockers: string[];
  cautions: string[];
}

export interface FineTuneDecisionMemo {
  recommendedApproach: "prompting" | "rag" | "fine tuning" | "traditional-ml" | "hybrid";
  headline: string;
  rationale: string[];
  whyNotPromptOnly: string[];
  whyNotRagOnly: string[];
  whyNotFineTune: string[];
  dataRequired: string[];
  evaluationRequired: string[];
  governanceRequired: string[];
  operationalMonitoringRequired: string[];
  costRisk: "low" | "medium" | "high";
  deliveryComplexity: "low" | "medium" | "high";
}

export interface GeneralizationAssessment {
  overfittingRisk: GeneralizationRiskLevel;
  generalizationScore: number;
  trainPerformance: number;
  validationPerformance: number;
  testPerformance: number;
  performanceGap: number;
  riskTriggers: string[];
  recommendedControls: string[];
}

export interface TrainingReadinessContract {
  enabled: boolean;
  datasetReadiness: TrainingDatasetReadiness;
  decisionMemo: FineTuneDecisionMemo;
  generalizationAssessment: GeneralizationAssessment;
  evaluationRequirements: string[];
  opsMonitoringRequirements: string[];
  governanceControls: string[];
}

// Per-stage outputs each lab writes back. Optional: a stage fills its slice when
// the visitor completes it; downstream labs read what's there and degrade gracefully.
export interface DataSlice { readinessScore?: number; gaps?: number; status?: string; handoff?: DataReadinessHandoff }
export interface RagSlice {
  faithfulness?: number; citationAccuracy?: number; hallucination?: number; costPerAnswer?: number; status?: string;
  // Engine chosen in Build · RAG → Model Fit. Carried so Deploy and Realize can
  // name the model behind their cost/latency and ROI numbers.
  model?: string; modelDeployment?: string; modelCostNote?: string; modelLatencyNote?: string;
  // Relative cost/latency multipliers (vs 1.0 baseline) so the chosen engine
  // actually drives Deploy's envelope and Realize's ROI. modelCapability (0..100)
  // lets a stronger engine escalate less (lower the dominant escalation cost).
  modelCostFactor?: number; modelLatencyFactor?: number; modelCapability?: number;
  contract?: BuildOutputContract; // Phase 1, Build Output Contract for AI Ops
  retrievalMode?: string;         // Phase 3, chosen retrieval mode (lexical | simulated-vector | hybrid | hybrid rerank)
  agentTooling?: AgentToolingContract; // Phase 5, agent / tool calling contract
  trainingContract?: TrainingReadinessContract; // Phase 6, training / fine tuning readiness
}
export interface DeploySlice {
  costPerQuery?: number; monthlyCostAtTarget?: number;
  latencyP95?: number; latencyP99?: number;
  reliability?: number; errorBudgetPct?: number; driftRisk?: number; status?: string;
  evidence?: OpsEvidence; // Phase 1, Ops Evidence for Govern / Realize
}
export interface GovernanceSlice { riskTier?: string; controls?: number; status?: string; decision?: GovernanceDecision }
export interface OutcomesSlice {
  roi?: number; adoption?: number; riskAdjustedValue?: number; paybackMonths?: number;
  // Phase 1, richer realization outcomes for the iteration loop.
  addressableValue?: number; realizedValue?: number; npv3yr?: number;
  valueLeakage?: string; recommendedNextAction?: string; createdAt?: string;
}
/** Realize → Strategy. The iteration feedback shown on the next planning pass. */
export interface IterationSlice {
  lastOutcomeSummary?: string;
  recommendedNextAction?: string;
  assumptionsToRevise?: string[];
}

/** Operate → the loop. The day two remediation decision, persisted so Frame / Build /
 * Govern can surface it cross-stage (written by the Operate stage on decision). */
export interface OperateSlice {
  decisionLabel?: string;   // "Reindex" · "Retrain / re-tune" · "Rollback / restrict" · "Rescope"
  loopTarget?: StageKey;    // where the loop-back points: frame | build | deploy
  nextAction?: string;      // the concrete next action (mirrors iteration.recommendedNextAction)
  valueAtRiskUsd?: number;  // annualized $ exposed while the breach stays open
  evidenceNote?: string;    // one-line record for Govern's audit pack
  buildTask?: string;       // the retrain / reindex task, when loopTarget is build
  issuedAt?: string;
}

export interface ProgramState {
  initiative: Initiative;
  progress: Record<StageKey, StageStatus>;
  data?: DataSlice;
  rag?: RagSlice;
  deploy?: DeploySlice;
  governance?: GovernanceSlice;
  outcomes?: OutcomesSlice;
  iteration?: IterationSlice; // Phase 1, Realize→Strategy feedback
  operate?: OperateSlice;     // Operate → the loop: the persisted day two remediation decision
  /** True when the curated sample program was loaded into live state. */
  seededSample?: boolean;
}

/** A value plus where it came from, the traceability spine for Realize. */
export interface Traced<T> { value: T; source: StageKey; basis: string }

export interface PortfolioEntry {
  id: string;
  name: string;
  scores: TriangleScores;
  bucket: string;
  scope: number;
  createdAt: string;
}

/** Lab viewing mode. Live = connected to the threaded initiative + upstream
 * slices. Demo = a standalone sandbox seeded with sample data, ignoring upstream. */
export type Mode = "live" | "demo";

/** Payload carried between labs (localStorage same-origin, or ?initiative= URL). */
export interface HandoffPayload {
  name: string | null;
  sharpenedProblem: string | null;
  scores: TriangleScores;
  scope: number;
  posture: string | null;
  risk: string | null;
  valueHypothesis: string | null;
  createdAt: string | null;
}
