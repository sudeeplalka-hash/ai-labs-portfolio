// ============================================================================
// Phase 6, Training / fine tuning / generalization readiness. Deterministic,
// client side decision + readiness engine. NO real training or fine tuning is
// performed; this is readiness, decisioning, and risk only.
// ============================================================================
import type {
  ProgramState, TrainingReadinessContract, TrainingDatasetReadiness, FineTuneDecisionMemo,
  GeneralizationAssessment, TrainingReadinessStatus, GeneralizationRiskLevel,
} from "./types";

// ---- Is a trained / fine tuned model relevant to this initiative? -----------
export function trainingRelevant(s: ProgramState): boolean {
  const meta = s.initiative?.meta;
  const tags = meta?.capabilityTags ?? [];
  return tags.includes("Fine tuning") || tags.includes("Training data") || tags.includes("Classification")
    || meta?.primaryAiPattern === "Classification" || meta?.primaryAiPattern === "Recommendation";
}

function approachFor(s: ProgramState): FineTuneDecisionMemo["recommendedApproach"] {
  const meta = s.initiative?.meta;
  const tags = meta?.capabilityTags ?? [];
  const p = meta?.primaryAiPattern;
  if (tags.includes("Fine tuning")) return "fine tuning";
  if (p === "Classification") return "traditional-ml";
  if (p === "Agentic workflow" || p === "Workflow automation") return "hybrid";
  if (p === "Summarization") return "prompting";
  return "rag";
}

// ---- Fine tune vs RAG vs prompt decision memo -------------------------------
export function deriveFineTuneMemo(s: ProgramState): FineTuneDecisionMemo {
  const approach = approachFor(s);
  const base = {
    dataRequired: ["Evaluation cases", "Golden test set"],
    evaluationRequired: ["Quality gates", "Regression checks"],
    governanceRequired: ["Human review for high risk outputs", "Audit evidence"],
    operationalMonitoringRequired: ["Quality drift", "Cost / latency"],
  };
  const MEMO: Record<FineTuneDecisionMemo["recommendedApproach"], Partial<FineTuneDecisionMemo> & { headline: string }> = {
    "rag": {
      headline: "RAG first, fine tuning later only if needed",
      rationale: ["Answers require current source evidence and citations", "Knowledge changes often; retrieval keeps it fresh", "Governance requires traceable evidence"],
      whyNotPromptOnly: ["Prompt-only answers lack grounding and citations"],
      whyNotRagOnly: [],
      whyNotFineTune: ["Fine tuning can memorize outdated guidance; source freshness matters more", "Higher governance burden and harder rollback"],
      dataRequired: ["Approved corpus + metadata", "Chunking", "Retrieval evals", "Golden dataset"],
      costRisk: "low" as const, deliveryComplexity: "medium" as const,
    },
    "prompting": {
      headline: "Prompting is sufficient for now",
      rationale: ["Task is mostly instruction-following", "Low risk; no private knowledge required"],
      whyNotPromptOnly: [], whyNotRagOnly: ["No large knowledge base to ground against"], whyNotFineTune: ["No labeled data; task is simple and stable enough for prompting"],
      dataRequired: ["Prompt templates", "Evaluation cases"],
      costRisk: "low" as const, deliveryComplexity: "low" as const,
    },
    "fine tuning": {
      headline: "Fine tuning is warranted, with strict data controls",
      rationale: ["Consistent tone/style/format is required", "Task is stable and repeated", "Labeled examples exist"],
      whyNotPromptOnly: ["Prompting is too brittle for the required consistency"],
      whyNotRagOnly: ["Behavior/format cannot be fixed by retrieval alone"],
      whyNotFineTune: [],
      dataRequired: ["High-quality labeled examples", "Train/validation/test split", "Holdout set", "Eval rubric", "Monitoring plan"],
      costRisk: "high" as const, deliveryComplexity: "high" as const,
    },
    "traditional-ml": {
      headline: "Traditional ML (classifier) fits this prediction task",
      rationale: ["Task is prediction/classification", "Structured data with labels", "Thresholds and explainability matter"],
      whyNotPromptOnly: ["Classification needs measured accuracy, not free text"],
      whyNotRagOnly: ["Retrieval doesn't produce calibrated class scores"],
      whyNotFineTune: ["An LLM fine tune is heavier than needed for structured classification"],
      dataRequired: ["Structured dataset", "Labels", "Feature definitions", "Validation/test sets", "Drift monitoring"],
      costRisk: "medium" as const, deliveryComplexity: "medium" as const,
    },
    "hybrid": {
      headline: "Hybrid, RAG for evidence, prompts for responses, tools for actions",
      rationale: ["Workflow needs multiple techniques", "RAG provides evidence, an agent executes actions"],
      whyNotPromptOnly: ["Actions and evidence need more than a prompt"],
      whyNotRagOnly: ["Retrieval alone can't execute governed actions"],
      whyNotFineTune: ["Fine tuning adds cost without solving orchestration"],
      dataRequired: ["Mixed data assets", "Eval datasets", "Monitoring signals", "Governance controls"],
      costRisk: "high" as const, deliveryComplexity: "high" as const,
    },
  };
  const m = MEMO[approach];
  return {
    recommendedApproach: approach,
    headline: m.headline,
    rationale: m.rationale ?? [],
    whyNotPromptOnly: m.whyNotPromptOnly ?? [],
    whyNotRagOnly: m.whyNotRagOnly ?? [],
    whyNotFineTune: m.whyNotFineTune ?? [],
    dataRequired: m.dataRequired ?? base.dataRequired,
    evaluationRequired: base.evaluationRequired,
    governanceRequired: base.governanceRequired,
    operationalMonitoringRequired: base.operationalMonitoringRequired,
    costRisk: m.costRisk ?? "low",
    deliveryComplexity: m.deliveryComplexity ?? "medium",
  };
}

// ---- Dataset readiness ------------------------------------------------------
export function deriveDatasetReadiness(s: ProgramState): TrainingDatasetReadiness {
  const approach = approachFor(s);
  const required = approach === "fine tuning" || approach === "traditional-ml";
  if (!required) {
    return {
      required: false, status: "not-required", labeledExamplesAvailable: false, labeledExampleCount: 0,
      labelQualityScore: 0, labelConsistencyScore: 0, trainValidationTestSplit: "not-required",
      trainPercent: 0, validationPercent: 0, testPercent: 0, holdoutSetAvailable: false,
      classBalanceScore: 0, edgeCaseCoverageScore: 0, leakageRisk: "low", overfittingRisk: "low",
      generalizationReadiness: 0, representativeCoverage: 0, driftMonitoringRequired: false,
      recommendedAction: "Training dataset not required, this initiative is better served by RAG, evaluation datasets, and monitoring, because answers must stay grounded in current source documents.",
      blockers: [], cautions: [],
    };
  }
  return {
    required: true, status: "ready-with-cautions", labeledExamplesAvailable: true, labeledExampleCount: 2400,
    labelQualityScore: 82, labelConsistencyScore: 78, trainValidationTestSplit: "partial",
    trainPercent: 70, validationPercent: 15, testPercent: 15, holdoutSetAvailable: false,
    classBalanceScore: 62, edgeCaseCoverageScore: 58, leakageRisk: "medium", overfittingRisk: "medium",
    generalizationReadiness: 68, representativeCoverage: 66, driftMonitoringRequired: true,
    recommendedAction: "Add a clean holdout set, rebalance the minority class, and run a train/test leakage check before training.",
    blockers: [], cautions: ["Minority class underrepresented", "Possible train/test overlap", "No clean holdout set"],
  };
}

// ---- Generalization assessment + scenarios ----------------------------------
export const GENERALIZATION_SCENARIOS = [
  { name: "Healthy generalization", train: 91, validation: 88, test: 87, risk: "low" as GeneralizationRiskLevel },
  { name: "Overfitting risk", train: 98, validation: 74, test: 71, risk: "high" as GeneralizationRiskLevel },
  { name: "Underfitting risk", train: 62, validation: 60, test: 59, risk: "medium" as GeneralizationRiskLevel },
];

export function deriveGeneralizationAssessment(s: ProgramState): GeneralizationAssessment {
  const required = deriveDatasetReadiness(s).required;
  if (!required) {
    return { overfittingRisk: "low", generalizationScore: 0, trainPerformance: 0, validationPerformance: 0, testPerformance: 0, performanceGap: 0, riskTriggers: [], recommendedControls: ["Prefer RAG with strong retrieval and citation evaluation over fine tuning."] };
  }
  const train = 92, validation = 78, test = 75;
  return {
    overfittingRisk: "medium", generalizationScore: 71, trainPerformance: train, validationPerformance: validation, testPerformance: test,
    performanceGap: train - test,
    riskTriggers: ["Training score much higher than validation/test", "Minority class underrepresented", "Possible train/test leakage", "Edge cases thin"],
    recommendedControls: ["Keep a clean holdout set", "Add edge-case examples", "Deduplicate examples", "Monitor class-level performance", "Run eval regression before release"],
  };
}

// ---- Data purpose readiness (Data Lab) --------------------------------------
export interface DataPurposeRow { purpose: string; required: boolean; status: TrainingReadinessStatus; why: string }
export function deriveDataPurposes(s: ProgramState): DataPurposeRow[] {
  const approach = approachFor(s);
  const dr = s.data?.handoff?.dataReadinessScore ?? s.data?.readinessScore ?? 65;
  const corpusStatus: TrainingReadinessStatus = dr >= 75 ? "ready" : dr >= 55 ? "ready-with-cautions" : "not-ready";
  const ftReq = approach === "fine tuning";
  const mlReq = approach === "traditional-ml";
  const agentic = (s.initiative?.meta?.capabilityTags ?? []).includes("Agentic workflow");
  return [
    { purpose: "RAG corpus", required: approach === "rag" || approach === "hybrid", status: corpusStatus, why: "Used for retrieval and citations" },
    { purpose: "Evaluation dataset", required: true, status: "ready-with-cautions", why: "Needed for quality gates" },
    { purpose: "Golden test set", required: true, status: "ready-with-cautions", why: "Needed for regression comparison" },
    { purpose: "Fine tuning dataset", required: ftReq, status: ftReq ? "ready-with-cautions" : "not-required", why: ftReq ? "Behavior/format consistency" : "RAG currently preferred" },
    { purpose: "Supervised training dataset", required: mlReq, status: mlReq ? "ready-with-cautions" : "not-required", why: mlReq ? "Prediction/classification task" : "Use case is not a classifier" },
    { purpose: "Telemetry logs", required: true, status: "ready-with-cautions", why: "Needed for AI Ops and drift" },
    { purpose: "Business outcome data", required: true, status: "ready-with-cautions", why: "Needed for Realize ROI" },
    { purpose: "Tool / action logs", required: agentic, status: agentic ? "ready-with-cautions" : "not-required", why: agentic ? "Needed to audit agent actions" : "No agentic actions in scope" },
  ];
}

// ---- Contract builder -------------------------------------------------------
export function buildTrainingReadinessContract(s: ProgramState): TrainingReadinessContract {
  const datasetReadiness = deriveDatasetReadiness(s);
  const decisionMemo = deriveFineTuneMemo(s);
  const generalizationAssessment = deriveGeneralizationAssessment(s);
  const enabled = datasetReadiness.required;

  const evaluationRequirements = enabled
    ? ["Holdout evaluation before release", "Class-level performance report", "Eval regression vs prior model"]
    : ["Retrieval + citation evals", "Answer quality gates"];
  const opsMonitoringRequirements = enabled
    ? ["Model drift monitoring", "Class-level performance monitoring", "Holdout performance tracking", "Retraining trigger on drift"]
    : ["Answer-quality drift monitoring"];
  const governanceControls = enabled
    ? ["Clean train/validation/test split", "Holdout evaluation before release", "Leakage check", "Class-level performance reporting", "Rollback plan for the trained model", "Human review for high risk cases"]
    : ["Prefer RAG with citation evidence; no fine tune governance burden required yet"];

  return { enabled, datasetReadiness, decisionMemo, generalizationAssessment, evaluationRequirements, opsMonitoringRequirements, governanceControls };
}

// ---- Phase C · Learning curve (train vs validation) --------------------------
// Deterministic model of the single most-recognized ML visual: training accuracy
// keeps climbing while validation accuracy plateaus, and, with too little data,
// starts falling. No model is trained; the curve makes overfitting *visible* and
// reacts to dataset size so a slider can tell the story interactively.

export interface LearningCurvePoint { epoch: number; train: number; validation: number }

export interface LearningCurve {
  points: LearningCurvePoint[];
  /** First epoch where validation stops improving while training keeps rising. */
  divergenceEpoch: number | null;
  /** Train − validation accuracy at the final epoch (percentage points). */
  finalGap: number;
  overfittingRisk: "low" | "medium" | "high";
  note: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Simulated accuracy curves over 12 epochs for a labeled dataset of `datasetSize`
 * examples (defaults to the initiative's dataset readiness count). Larger datasets
 * diverge later and gap less; tiny datasets overfit early and hard. */
export function deriveLearningCurve(s: ProgramState, datasetSize?: number): LearningCurve {
  const ds = deriveDatasetReadiness(s);
  const n = Math.max(50, datasetSize ?? (ds.labeledExampleCount || 2400));
  const EPOCHS = 12;

  // Divergence starts later with more data; slope of validation decay is gentler.
  const divergence = Math.min(10, Math.max(3, Math.round(2 + 2.2 * Math.log10(n / 100))));
  const decay = Math.min(3, Math.max(0.3, 3.6 - Math.log10(n)));
  const baseGap = Math.min(6, Math.max(1, 250 / Math.sqrt(n)));

  const points: LearningCurvePoint[] = [];
  let val = 0;
  for (let e = 1; e <= EPOCHS; e++) {
    const train = 100 - 42 * Math.exp(-e / 2.6);
    if (e <= divergence) {
      val = train - baseGap;
    } else {
      val = val - decay; // validation degrades once the model starts memorizing
    }
    points.push({ epoch: e, train: r1(train), validation: r1(Math.max(40, val)) });
  }

  const last = points[EPOCHS - 1];
  const finalGap = r1(last.train - last.validation);
  const overfittingRisk: LearningCurve["overfittingRisk"] = finalGap >= 18 ? "high" : finalGap >= 9 ? "medium" : "low";
  const note =
    overfittingRisk === "high"
      ? `With ~${n.toLocaleString()} labeled examples, validation accuracy turns down around epoch ${divergence}, the model is memorizing, not learning. Stop early, add data, or regularize.`
      : overfittingRisk === "medium"
        ? `Validation plateaus near epoch ${divergence} while training keeps climbing, a ${finalGap}pt gap. Usable with early stopping and a clean holdout.`
        : `Training and validation stay close (${finalGap}pt gap), the dataset supports what the model is being asked to learn.`;

  return { points, divergenceEpoch: divergence, finalGap, overfittingRisk, note };
}
