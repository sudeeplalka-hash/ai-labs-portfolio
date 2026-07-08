// ============================================================================
// Cross-stage selectors (Phase 1, lifecycle coherence).
// Pure, read-only helpers that let a downstream stage consume upstream contracts
// from the shared ProgramState, with a `hasLive` flag so a stage can fall back to
// its own demo data when the loop hasn't been run.
// ============================================================================
import type {
  ProgramState, GovernanceTier, GovernanceDecision, DataReadinessHandoff, BuildOutputContract,
 RemediationEntry,
} from "./types";
import { isAgenticInitiative, TOOL_REGISTRY, MISUSE_EVALS } from "./agents";
import { deriveFineTuneMemo, deriveDatasetReadiness, deriveGeneralizationAssessment } from "./training";

const has = (v: unknown) => v !== undefined && v !== null;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ---- Data → Build: readiness handoff ----------------------------------------
const PATTERN_SOURCES: Record<string, { approved: string[]; conditional: string[] }> = {
  "Search / knowledge assistant": { approved: ["Help-center articles", "Resolved support tickets", "Product documentation"], conditional: ["Internal wiki (stale sections)"] },
  "Summarization": { approved: ["Meeting transcripts", "Case notes"], conditional: ["Email threads (mixed quality)"] },
  "Classification": { approved: ["Historical labeled records", "Intake forms"], conditional: ["Free-text notes (unlabeled)"] },
  "Decision support": { approved: ["Policy documents", "Historical outcomes"], conditional: ["CRM records (partial coverage)"] },
  "Agentic workflow": { approved: ["System runbooks", "Workflow logs"], conditional: ["Tool/API schemas (draft)"] },
};

/** Deterministic Data Readiness Handoff derived from the live initiative
 *  (framing data-readiness score + pattern + governance controls). Emitted by the
 *  Data lab and consumed by Build/RAG. Provenance: derived, offline. */
export function buildDataReadinessHandoff(s: ProgramState): DataReadinessHandoff {
  const init = s.initiative;
  const meta = init?.meta;
  const pattern = meta?.primaryAiPattern || "Search / knowledge assistant";
  const readiness = s.data?.readinessScore ?? init?.scores?.dataReadiness ?? 60;
  const sensitive = !!meta?.auditEvidenceRequired || meta?.governanceTier === "High" || meta?.governanceTier === "Critical";

  const tmpl = PATTERN_SOURCES[pattern] ?? PATTERN_SOURCES["Search / knowledge assistant"];
  const blocked = sensitive ? ["Raw customer PII export"] : [];
  const rejected = readiness < 55 ? ["Unversioned scraped web content"] : [];

  const risks: string[] = [];
  if (sensitive) risks.push("Sensitive data present, redaction & access control required before indexing");
  if (readiness < 70) risks.push("Coverage gaps in the corpus could cap answer completeness");
  if (pattern.includes("Classification") || pattern.includes("Agentic")) risks.push("Label/schema quality drives downstream accuracy");

  const backlog: string[] = [];
  if (sensitive) backlog.push("Run PII scan + redaction pass on approved sources");
  if (readiness < 75) backlog.push("Fill top coverage gaps in the knowledge base");
  backlog.push("Stamp source + version metadata on every document");

  // Structured entries (Phase 1): prefer the live corpus backlog bridged from
  // the Data lab session; otherwise synthesize from the template backlog so
  // demo archetypes and threaded initiatives carry the same shape.
  const liveBacklog = s.data?.corpusBacklog;
  const remediationEntries: RemediationEntry[] = liveBacklog?.length
    ? liveBacklog.slice(0, 8)
    : backlog.map((b): RemediationEntry => ({
        finding: b,
        guideline: /PII|redaction/i.test(b) ? "privacy" : /coverage/i.test(b) ? "taxonomy" : "provenance",
        severity: /PII|redaction/i.test(b) ? "risk" : "watch",
        recommendation: b,
        status: "open",
      }));

  const band = readiness >= 75 ? "Proceed to Build with standard retrieval controls."
    : readiness >= 60 ? "Proceed to Build with conditional sources flagged and citations enforced."
    : "Remediate coverage and provenance gaps before Build.";

  return {
    initiativeName: init?.name ?? null,
    dataReadinessScore: clamp(readiness),
    ingestionReadyPercent: clamp(readiness - 8),
    approvedSources: tmpl.approved,
    conditionalSources: tmpl.conditional,
    blockedSources: blocked,
    rejectedSources: rejected,
    sensitivityRestrictions: sensitive ? ["Redact PII/PHI before indexing", "Access-controlled retrieval by role"] : [],
    metadataRequirements: ["Source + version on every chunk", "Last-updated timestamp", "Sensitivity label"],
    chunkingRequirements: pattern.includes("Summar") ? "Section-aware chunks; preserve document structure." : "512-token chunks, 64 overlap; keep policy clauses intact.",
    evalDatasetReadiness: clamp(readiness - 15),
    knownDataRisks: risks,
    remediationBacklog: backlog,
    remediationEntries,
    recommendation: band,
    createdAt: new Date().toISOString(),
  };
}

// ---- Build/RAG → AI Ops: build output contract ------------------------------
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
const todayStamp = () => new Date().toISOString().slice(0, 10);

/** Deterministic Build Output Contract from the rag slice + initiative pattern.
 *  Emitted by Build/RAG, consumed by AI Ops (and surfaced in Govern/Realize). */
export function buildBuildOutputContract(s: ProgramState): BuildOutputContract {
  const rag = s.rag ?? {};
  const meta = s.initiative?.meta;
  const pattern = meta?.primaryAiPattern || "Search / knowledge assistant";
  const faithfulness = rag.faithfulness ?? 84;
  const citationAccuracy = rag.citationAccuracy ?? 86;
  const hallucinationRisk = rag.hallucination ?? 8;
  const quality = clamp((faithfulness + citationAccuracy + (100 - hallucinationRisk)) / 3);

  const failedGates: string[] = [];
  if (faithfulness < 85) failedGates.push("Faithfulness < 85");
  if (citationAccuracy < 85) failedGates.push("Citation accuracy < 85");
  if (hallucinationRisk > 10) failedGates.push("Hallucination risk > 10");

  const failureModes: string[] = [];
  if (quality < 90) failureModes.push("Prompt overgeneralization");
  if (citationAccuracy < 90) failureModes.push("Missing/weak citations");
  if ((s.data?.handoff?.knownDataRisks?.length ?? 0) > 0) failureModes.push("Partial context from data gaps");

  const release = failedGates.length === 0 && quality >= 85 ? "Ready for pilot"
    : failedGates.length <= 1 && quality >= 75 ? "Ready with restrictions"
    : "Hold, strengthen quality before release";

  // Phase 3, retrieval substrate lineage from the chosen mode + data handoff.
  const mode = rag.retrievalMode ?? "lexical";
  const MODE: Record<string, { label: string; hybrid: boolean; rerank: boolean; qDelta: number; latMult: number; costMult: number; fail: string[] }> = {
    "lexical": { label: "Lexical BM25", hybrid: false, rerank: false, qDelta: -6, latMult: 0.8, costMult: 0.9, fail: ["Semantic miss when wording differs from source"] },
    "simulated-vector": { label: "Simulated vector retrieval", hybrid: false, rerank: false, qDelta: 2, latMult: 1.0, costMult: 1.0, fail: ["May retrieve vague semantic neighbors"] },
    "hybrid": { label: "Hybrid lexical + vector", hybrid: true, rerank: false, qDelta: 6, latMult: 1.15, costMult: 1.1, fail: ["Weight tuning required"] },
    "hybrid rerank": { label: "Hybrid + rerank", hybrid: true, rerank: true, qDelta: 10, latMult: 1.35, costMult: 1.2, fail: ["Higher latency from rerank pass"] },
  };
  const m = MODE[mode] ?? MODE["lexical"];
  const handoff = s.data?.handoff;
  const blocked = handoff?.blockedSources ?? [];
  const vectorReadiness = mode === "lexical" ? "Not required"
    : (handoff && (handoff.dataReadinessScore ?? 0) >= 75 && blocked.length <= 1) ? "Partial" : "Missing";
  const retrievalRisks = [
    ...(blocked.length ? [`${blocked.length} blocked source(s) excluded from evidence`] : []),
    ...(m.hybrid ? ["Local deterministic embeddings, not a production vector store"] : []),
    ...((handoff?.knownDataRisks ?? []).slice(0, 1)),
  ].slice(0, 4);
  const baseLatency = Math.round(1400 * (rag.modelLatencyFactor ?? 1));

  // Phase 5, agent / tool calling fields (only when the initiative is agentic).
  const agentic = isAgenticInitiative(s);
  const agentEvalStatus = MISUSE_EVALS.some((e) => e.result === "fail") ? "fail" : MISUSE_EVALS.some((e) => e.result === "warning") ? "warning" : "pass";
  const agentFields = agentic ? {
    agenticWorkflowEnabled: true,
    toolsEnabled: true,
    toolSchemaCount: TOOL_REGISTRY.length,
    restrictedActionCount: TOOL_REGISTRY.reduce((n, t) => n + t.restrictedActions.length, 0),
    approvalRequiredCount: TOOL_REGISTRY.filter((t) => t.approvalMode !== "none" && t.approvalMode !== "blocked").length,
    toolMisuseEvalStatus: agentEvalStatus,
    agenticRiskLevel: "high",
    agentReleaseRecommendation: "Approved with human in the loop; financial actions blocked",
  } : {};

  // Phase 6, training / fine tuning fields.
  const tMemo = deriveFineTuneMemo(s);
  const tDs = deriveDatasetReadiness(s);
  const tGen = deriveGeneralizationAssessment(s);
  const highOverfit = tGen.overfittingRisk === "high" || tGen.overfittingRisk === "critical";
  const trainingFields = {
    trainingRequired: tDs.required,
    fineTuningRecommended: tMemo.recommendedApproach === "fine tuning",
    recommendedApproach: tMemo.recommendedApproach,
    ...(tDs.required ? {
      trainingReadinessStatus: tDs.status,
      overfittingRisk: tGen.overfittingRisk,
      generalizationScore: tGen.generalizationScore,
      datasetSplitStatus: tDs.trainValidationTestSplit,
      trainingEvalRequired: ["Holdout evaluation", "Class-level performance", "Eval regression"],
      trainingGovernanceControls: ["Clean train/validation/test split", "Holdout evaluation", "Leakage check", "Rollback plan"],
      trainingReleaseRecommendation: highOverfit ? "Hold, reduce overfitting risk before release" : "Approved with holdout evaluation",
    } : {}),
  };

  return {
    selectedModel: rag.model ?? "Frontier hosted, fast / mini",
    selectedPattern: pattern,
    retrievalMode: mode,
    retrievalModeLabel: m.label,
    promptVersion: `${slug(pattern)}-v0.3`,
    indexVersion: `${slug(pattern)}-index-${todayStamp()}`,
    datasetVersion: "golden-v1",
    evalRunId: `eval-${todayStamp()}-01`,
    qualityScore: quality,
    citationAccuracy,
    faithfulness,
    hallucinationRisk,
    failedGates,
    knownFailureModes: failureModes,
    costEstimate: rag.costPerAnswer,
    latencyEstimateMs: baseLatency,
    releaseRecommendation: release,
    createdAt: new Date().toISOString(),
    // retrieval substrate
    vectorReadiness,
    hybridSearchEnabled: m.hybrid,
    rerankEnabled: m.rerank,
    retrievalQuality: clamp(quality + m.qDelta),
    retrievalFailureModes: m.fail,
    retrievalLatencyEstimateMs: Math.round(baseLatency * m.latMult),
    retrievalCostEstimate: rag.costPerAnswer !== undefined ? Math.round(rag.costPerAnswer * m.costMult * 1000) / 1000 : undefined,
    topRetrievalRisks: retrievalRisks,
    ...agentFields,
    ...trainingFields,
  };
}

/** Inputs Govern needs from the live initiative (Strategy + Data + Build + Ops +
 *  Realize). `hasLive` is true once Strategy has stamped a governance tier. */
export interface GovernInputs {
  hasLive: boolean;
  initiativeName: string | null;
  primaryAiPattern?: string;
  capabilityTags?: string[];
  governanceTier?: GovernanceTier;
  governanceTierRationale?: string;
  operationalCriticality?: string;
  humanReviewRequired?: boolean;
  auditEvidenceRequired?: boolean;
  businessOutcome?: string | null;
  targetUsers?: string;
  // Data
  blockedSources?: string[];
  conditionalSources?: string[];
  approvedSources?: string[];
  rejectedSources?: string[];
  sensitivityRestrictions?: string[];
  dataReadinessScore?: number;
  knownDataRisks?: string[];
  remediationBacklog?: string[];
  remediationEntries?: RemediationEntry[];
  dataRecommendation?: string;
  // Build
  selectedModel?: string;
  retrievalMode?: string;
  evalRunId?: string;
  failedGates?: string[];
  knownFailureModes?: string[];
  qualityScore?: number;
  citationAccuracy?: number;
  faithfulness?: number;
  hallucinationRisk?: number;
  buildRelease?: string;
  // Ops
  releaseReadinessScore?: number;
  releaseRecommendation?: string;
  driftRisk?: number;
  incidentStatus?: string;
  incidentSummary?: string;
  sloStatus?: string;
  latencyP95?: number;
  costPerQuery?: number;
  monitoringCoverageScore?: number;
  regressionStatus?: string;
  regressionFindings?: string[];
  rollbackReadiness?: string;
  openOperationalRisks?: string[];
  versionLineage?: Record<string, string>;
  // Realize
  roi?: number;
  riskAdjustedValue?: number;
  paybackMonths?: number;
  adoption?: number;
  valueLeakage?: string;
  recommendedNextAction?: string;
}

export function selectGovernInputs(s: ProgramState): GovernInputs {
  const meta = s.initiative?.meta;
  const handoff = s.data?.handoff;
  const c = s.rag?.contract;
  const ev = s.deploy?.evidence;
  const o = s.outcomes;
  return {
    hasLive: has(meta?.governanceTier) || has(s.initiative?.name),
    initiativeName: s.initiative?.name ?? null,
    primaryAiPattern: meta?.primaryAiPattern,
    capabilityTags: meta?.capabilityTags,
    governanceTier: meta?.governanceTier,
    governanceTierRationale: meta?.governanceTierRationale,
    operationalCriticality: meta?.operationalCriticality,
    humanReviewRequired: meta?.humanReviewRequired,
    auditEvidenceRequired: meta?.auditEvidenceRequired,
    businessOutcome: s.initiative?.valueHypothesis ?? null,
    targetUsers: s.initiative?.params?.user,
    blockedSources: handoff?.blockedSources,
    conditionalSources: handoff?.conditionalSources,
    approvedSources: handoff?.approvedSources,
    rejectedSources: handoff?.rejectedSources,
    sensitivityRestrictions: handoff?.sensitivityRestrictions,
    dataReadinessScore: handoff?.dataReadinessScore ?? s.data?.readinessScore,
    knownDataRisks: handoff?.knownDataRisks,
    remediationBacklog: handoff?.remediationBacklog,
    remediationEntries: handoff?.remediationEntries,
    dataRecommendation: handoff?.recommendation,
    selectedModel: c?.selectedModel ?? s.rag?.model,
    retrievalMode: c?.retrievalModeLabel ?? c?.retrievalMode,
    evalRunId: c?.evalRunId,
    failedGates: c?.failedGates,
    knownFailureModes: c?.knownFailureModes,
    qualityScore: c?.qualityScore,
    citationAccuracy: c?.citationAccuracy,
    faithfulness: c?.faithfulness,
    hallucinationRisk: c?.hallucinationRisk,
    buildRelease: c?.releaseRecommendation,
    releaseReadinessScore: ev?.releaseReadinessScore,
    releaseRecommendation: ev?.releaseRecommendation ?? ev?.operationalDecision,
    driftRisk: ev?.driftRisk ?? s.deploy?.driftRisk,
    incidentStatus: ev?.incidentStatus,
    incidentSummary: ev?.incidentSummary,
    sloStatus: ev?.sloStatus,
    latencyP95: ev?.latencyP95 ?? s.deploy?.latencyP95,
    costPerQuery: ev?.costPerQuery ?? s.deploy?.costPerQuery,
    monitoringCoverageScore: ev?.monitoringCoverageScore ?? ev?.monitoringCoverage,
    regressionStatus: ev?.regressionStatus,
    regressionFindings: ev?.regressionFindings,
    rollbackReadiness: ev?.rollbackReadiness,
    openOperationalRisks: ev?.openOperationalRisks,
    versionLineage: ev?.versionLineage,
    roi: o?.roi,
    riskAdjustedValue: o?.riskAdjustedValue,
    paybackMonths: o?.paybackMonths,
    adoption: o?.adoption,
    valueLeakage: o?.valueLeakage,
    recommendedNextAction: o?.recommendedNextAction,
  };
}

// ---- Govern scorecard / findings / controls (Phase 4) -----------------------
export type GovLevel = "good" | "warn" | "bad";
export interface ScorecardDim { key: string; dimension: string; status: string; level: GovLevel; score: number; why: string; source: string; findings: string[] }
export type Severity = "Critical" | "High" | "Medium" | "Low";
export interface GovFinding { severity: Severity; finding: string; evidenceSource: string; impact: string; requiredAction: string; owner: string; dueStage: string; status: string }
export interface GovControl { name: string; triggeredBy: string; owner: string; status: string; requiredBeforePilot: boolean; evidenceSource: string }

const worst = (a: GovLevel, b: GovLevel): GovLevel => (a === "bad" || b === "bad" ? "bad" : a === "warn" || b === "warn" ? "warn" : "good");

export function deriveGovernanceScorecard(s: ProgramState): ScorecardDim[] {
  const g = selectGovernInputs(s);
  // Use case risk (Strategy)
  const tier = g.governanceTier ?? "Medium";
  const ucLevel: GovLevel = tier === "Critical" ? "bad" : tier === "High" ? "warn" : "good";
  // Data risk
  const dataFindings: string[] = [];
  if ((g.blockedSources?.length ?? 0) > 0) dataFindings.push(`${g.blockedSources!.length} blocked source(s)`);
  if ((g.sensitivityRestrictions?.length ?? 0) > 0) dataFindings.push("Sensitivity restrictions apply");
  if ((g.knownDataRisks?.length ?? 0) > 0) dataFindings.push(`${g.knownDataRisks!.length} known data risk(s)`);
  const dataLevel: GovLevel = (g.dataReadinessScore ?? 60) < 60 || (g.blockedSources?.length ?? 0) > 1 ? "bad" : dataFindings.length ? "warn" : "good";
  // Build quality
  const buildFindings: string[] = [];
  if ((g.failedGates?.length ?? 0) > 0) buildFindings.push(`${g.failedGates!.length} failed gate(s)`);
  if ((g.citationAccuracy ?? 100) < 88) buildFindings.push(`Citation accuracy ${g.citationAccuracy}%`);
  if ((g.hallucinationRisk ?? 0) > 10) buildFindings.push(`Hallucination risk ${g.hallucinationRisk}%`);
  const buildLevel: GovLevel = (g.failedGates?.length ?? 0) > 0 || (g.hallucinationRisk ?? 0) >= 25 ? "bad" : buildFindings.length ? "warn" : "good";
  // Operational risk
  const opsFindings: string[] = [];
  if ((g.driftRisk ?? 0) >= 60) opsFindings.push("High drift risk");
  if (g.sloStatus === "breached") opsFindings.push("SLO breached");
  if (g.regressionStatus === "Block release") opsFindings.push("Eval regression blocker");
  else if (g.regressionStatus === "Watch") opsFindings.push("Eval regression watch");
  if ((g.monitoringCoverageScore ?? 100) < 80) opsFindings.push("Monitoring gaps");
  const opsLevel: GovLevel = g.sloStatus === "breached" || g.regressionStatus === "Block release" ? "bad" : opsFindings.length ? "warn" : "good";
  // Audit readiness
  const auditFindings: string[] = [];
  if (g.auditEvidenceRequired && (g.qualityScore ?? 0) < 80) auditFindings.push("Quality below audit bar");
  if (!g.evalRunId) auditFindings.push("No eval run recorded");
  if (g.auditEvidenceRequired && !g.versionLineage) auditFindings.push("Version lineage incomplete");
  const auditLevel: GovLevel = g.auditEvidenceRequired && auditFindings.length >= 2 ? "bad" : auditFindings.length ? "warn" : "good";

  const lvlScore = (l: GovLevel) => (l === "good" ? 90 : l === "warn" ? 65 : 35);
  const label = (l: GovLevel, riskWord = false) => riskWord ? (l === "good" ? "Low" : l === "warn" ? "Medium" : "High") : (l === "good" ? "Pass" : l === "warn" ? "Warning" : "Blocker");
  return [
    { key: "usecase", dimension: "Use case risk", status: tier, level: ucLevel, score: lvlScore(ucLevel), why: "Higher tiers demand stronger controls and human oversight.", source: "Strategy metadata", findings: [g.governanceTierRationale ?? `Tier ${tier}`] },
    { key: "data", dimension: "Data risk", status: label(dataLevel), level: dataLevel, score: lvlScore(dataLevel), why: "Blocked or sensitive data must be excluded or controlled before use.", source: "Data handoff", findings: dataFindings },
    { key: "build", dimension: "Build quality", status: label(buildLevel), level: buildLevel, score: lvlScore(buildLevel), why: "Weak faithfulness or citations let unsupported answers reach users.", source: "Build contract", findings: buildFindings },
    { key: "ops", dimension: "Operational risk", status: label(opsLevel), level: opsLevel, score: lvlScore(opsLevel), why: "Drift, regressions, and SLO breaches erode trust in production.", source: "Ops evidence", findings: opsFindings },
    { key: "audit", dimension: "Audit readiness", status: label(auditLevel), level: auditLevel, score: lvlScore(auditLevel), why: "Governance evidence must be complete to defend the decision.", source: "Evidence pack", findings: auditFindings },
  ];
}

export function deriveOpenFindings(s: ProgramState): GovFinding[] {
  const g = selectGovernInputs(s);
  const out: GovFinding[] = [];
  if ((g.citationAccuracy ?? 100) < 88) out.push({ severity: "High", finding: "Citation accuracy below pilot threshold", evidenceSource: "Build/RAG contract", impact: "Unsupported or incorrect answers may reach users", requiredAction: "Improve retrieval/citation quality before pilot", owner: "RAG Owner", dueStage: "Build", status: "Open" });
  if ((g.hallucinationRisk ?? 0) > 10) out.push({ severity: (g.hallucinationRisk ?? 0) >= 25 ? "Critical" : "High", finding: "Hallucination risk above target", evidenceSource: "Build/RAG contract", impact: "Fabricated content risk in answers", requiredAction: "Constrain prompt/retrieval; add abstention path", owner: "RAG Owner", dueStage: "Build", status: "Open" });
  (g.blockedSources ?? []).forEach((src) => out.push({ severity: "High", finding: `Blocked source: ${src}`, evidenceSource: "Data handoff", impact: "Source cannot be indexed or retrieved", requiredAction: "Keep excluded until redaction and access controls complete", owner: "Data Owner", dueStage: "Data", status: "Open" }));
  (g.remediationEntries ?? [])
    .filter((e) => e.status === "open" && (e.severity === "critical" || e.severity === "risk"))
    .slice(0, 4)
    .forEach((e) => out.push({
      severity: e.severity === "critical" ? "High" : "Medium",
      finding: `Data remediation open: ${e.finding}${e.file ? ` (${e.file})` : ""}`,
      evidenceSource: "Data handoff backlog",
      impact: "Unremediated data quality issue carries into retrieval and answers",
      requiredAction: e.recommendation ?? "Complete the remediation or accept the risk in the Data lab",
      owner: "Data Owner",
      dueStage: "Data",
      status: "Open",
    }));
  if ((g.monitoringCoverageScore ?? 100) < 80) out.push({ severity: "Medium", finding: "Monitoring coverage gap", evidenceSource: "Operate", impact: "Retrieval misses and user feedback not fully monitored", requiredAction: "Add instrumentation before production", owner: "AI Ops", dueStage: "Operate", status: "In review" });
  if (g.regressionStatus === "Block release") out.push({ severity: "High", finding: "Evaluation regression blocker", evidenceSource: "Operate", impact: "Quality worsened vs prior run", requiredAction: "Investigate and fix before release", owner: "RAG Owner", dueStage: "Build", status: "Open" });
  if ((g.driftRisk ?? 0) >= 60) out.push({ severity: "Medium", finding: "High operational drift risk", evidenceSource: "Operate", impact: "Answers may go stale as sources change", requiredAction: "Reindex and add drift monitoring", owner: "AI Ops", dueStage: "Operate", status: "In review" });
  if (g.auditEvidenceRequired && (g.qualityScore ?? 0) < 80) out.push({ severity: "Medium", finding: "Audit evidence incomplete for tier", evidenceSource: "Governance", impact: "Decision harder to defend in review", requiredAction: "Raise quality and complete lineage before sign off", owner: "Governance", dueStage: "Govern", status: "Open" });
  // Phase 5, agent / tool calling findings.
  const at = s.rag?.agentTooling;
  if (at?.enabled) {
    if (at.misuseEvals.some((e) => e.result === "fail")) out.push({ severity: "High", finding: "Agent tool misuse evaluation failing", evidenceSource: "Build/Agents", impact: "Unsafe or unapproved tool use could reach production", requiredAction: "Resolve failing misuse evals before enabling the agent", owner: "RAG Owner", dueStage: "Build", status: "Open" });
    if (at.toolSchemas.some((t) => t.riskLevel === "high" && t.approvalMode === "none")) out.push({ severity: "High", finding: "High risk tool missing an approval path", evidenceSource: "Build/Agents", impact: "Risky action could execute without human oversight", requiredAction: "Add an approval gate to all high risk tools", owner: "Governance", dueStage: "Govern", status: "Open" });
  }
  // Phase 6, training / generalization findings.
  const tc = s.rag?.trainingContract;
  if (tc?.enabled) {
    const gen = tc.generalizationAssessment;
    if (gen.overfittingRisk === "high" || gen.overfittingRisk === "critical") out.push({ severity: "High", finding: "Overfitting risk is high", evidenceSource: "Build/Training", impact: "Model may look strong in testing but fail on real cases", requiredAction: "Add holdout set, edge cases, and dedupe before release", owner: "RAG Owner", dueStage: "Build", status: "Open" });
    if (!tc.datasetReadiness.holdoutSetAvailable) out.push({ severity: "Medium", finding: "Training dataset lacks a clean holdout set", evidenceSource: "Build/Training", impact: "Generalization cannot be verified before release", requiredAction: "Create a clean holdout evaluation set", owner: "Data Owner", dueStage: "Data", status: "Open" });
    if (tc.datasetReadiness.classBalanceScore < 70) out.push({ severity: "Medium", finding: "Class imbalance may affect minority cases", evidenceSource: "Build/Training", impact: "Underrepresented classes may perform poorly", requiredAction: "Rebalance and report class level performance", owner: "RAG Owner", dueStage: "Build", status: "In review" });
  }
  return out;
}

export function deriveRequiredControls(s: ProgramState): GovControl[] {
  const g = selectGovernInputs(s);
  const out: GovControl[] = [];
  const add = (name: string, triggeredBy: string, owner: string, source: string, required: boolean) => out.push({ name, triggeredBy, owner, status: "Required", requiredBeforePilot: required, evidenceSource: source });
  const highTier = g.governanceTier === "High" || g.governanceTier === "Critical";
  if (highTier) { add("Human review before external use", `Governance tier ${g.governanceTier}`, "Governance", "Strategy", true); add("Release approval + periodic governance review", `Governance tier ${g.governanceTier}`, "Governance", "Strategy", true); }
  if ((g.sensitivityRestrictions?.length ?? 0) > 0 || (g.blockedSources?.length ?? 0) > 0) { add("Redaction before indexing", "Sensitive/blocked data", "Data Owner", "Data", true); add("Role-based retrieval + retrieval logging", "Sensitive data", "AI Ops", "Data", true); }
  if ((g.citationAccuracy ?? 100) < 88) { add("Citation enforcement + abstention on weak evidence", "Citation accuracy below target", "RAG Owner", "Build", true); }
  if ((g.hallucinationRisk ?? 0) > 10) { add("Confidence threshold + fallback + human escalation", "Elevated hallucination risk", "RAG Owner", "Build", true); }
  if ((g.monitoringCoverageScore ?? 100) < 80) { add("Retrieval-miss + citation-failure + feedback monitoring", "Monitoring coverage gap", "AI Ops", "Operate", false); }
  if (!g.rollbackReadiness || /weak|not/i.test(g.rollbackReadiness)) { add("Prompt / index / source / model rollback plan", "Rollback readiness", "AI Ops", "Operate", false); }
  if (g.auditEvidenceRequired) { add("Audit logging + evidence pack retention", "Audit evidence required", "Governance", "Govern", true); }
  // Phase 5, agent / tool calling controls.
  if (s.rag?.agentTooling?.enabled) {
    add("Human approval for customer-facing drafts", "Agentic workflow", "Support Lead", "Build/Agents", true);
    add("Financial actions blocked (no AI refund approval)", "Critical tool risk", "Finance", "Build/Agents", true);
    add("Tool-call audit logging on every call", "Agentic workflow", "AI Ops", "Build/Agents", true);
  }
  // Phase 6, training / generalization controls.
  if (s.rag?.trainingContract?.enabled) {
    add("Clean train/validation/test split + leakage check", "Trained/fine tuned model", "Data Owner", "Build/Training", true);
    add("Holdout evaluation before release", "Generalization risk", "RAG Owner", "Build/Training", true);
    add("Class-level performance reporting + drift monitoring", "Trained model", "AI Ops", "Operate", true);
    add("Rollback plan for the trained model", "Fine tune rollback burden", "AI Ops", "Operate", false);
  }
  return out;
}

/** Derive a full governance decision from live state. Used by Govern (display +
 *  persistence) and Realize (risk-adjust). Deterministic; conservative when missing. */
export function deriveGovernanceDecision(s: ProgramState): GovernanceDecision {
  const g = selectGovernInputs(s);
  const card = deriveGovernanceScorecard(s);
  const rich = deriveOpenFindings(s);
  const controls = deriveRequiredControls(s);
  const findings = rich.map((f) => f.finding);

  const tier = g.governanceTier;
  const highTier = tier === "High" || tier === "Critical";
  const hasBlocker = card.some((d) => d.level === "bad") || rich.some((f) => f.severity === "Critical");
  const critical = rich.filter((f) => f.severity === "Critical").map((f) => f.finding);
  const blockers = [
    ...(g.blockedSources?.length ? [`${g.blockedSources.length} blocked data source(s)`] : []),
    ...((g.failedGates?.length ?? 0) > 0 ? [`${g.failedGates!.length} failed build gate(s)`] : []),
    ...(g.sloStatus === "breached" ? ["SLO breached under load"] : []),
    ...(g.regressionStatus === "Block release" ? ["Eval regression blocker"] : []),
    ...critical,
  ];

  let decision: string;
  if (!has(tier)) decision = "Not assessed";
  else if ((g.hallucinationRisk ?? 0) >= 25 && (g.operationalCriticality === "High") ) decision = "Not approved";
  else if (blockers.length > 0) decision = "Hold pending remediation";
  else if (highTier && (g.humanReviewRequired || findings.length > 0)) decision = "Human review required";
  else if (findings.length > 0 || (g.conditionalSources?.length ?? 0) > 0 || g.humanReviewRequired) decision = "Approved with restrictions";
  else decision = "Approved for pilot";

  const score = Math.round(card.reduce((a, d) => a + d.score, 0) / card.length);
  const rationale = has(tier)
    ? `Tier ${tier} with ${blockers.length} blocker(s) and ${findings.length} open finding(s). ${g.governanceTierRationale ?? ""}`.trim()
    : "No framed initiative, assessment pending.";
  const conditions = [
    ...controls.filter((c) => c.requiredBeforePilot).map((c) => c.name),
    ...(g.conditionalSources?.length ? ["Flag conditional data sources in retrieval"] : []),
  ].slice(0, 6);
  const evidenceUsed = [
    g.initiativeName ? `Strategy: ${g.primaryAiPattern} · tier ${tier}` : "",
    g.dataReadinessScore !== undefined ? `Data: readiness ${g.dataReadinessScore}/100` : "",
    g.qualityScore !== undefined ? `Build: quality ${g.qualityScore}/100 · eval ${g.evalRunId ?? "N/A"}` : "",
    g.releaseReadinessScore !== undefined ? `Operate: readiness ${g.releaseReadinessScore}/100 · ${g.releaseRecommendation ?? ""}` : "",
    g.roi !== undefined ? `Realize: ${Math.round(g.roi)}% risk adjusted ROI` : "",
  ].filter(Boolean);

  const auditReadiness = card.find((d) => d.key === "audit")?.level === "good" ? "Ready" : card.find((d) => d.key === "audit")?.level === "warn" ? "Partial" : "Incomplete";
  const nextReview = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  return {
    tier,
    decision,
    score,
    rationale,
    evidenceUsed,
    openFindings: findings,
    requiredControls: controls.map((c) => c.name),
    releaseBlockers: blockers,
    approvalConditions: conditions,
    humanReviewRequired: g.humanReviewRequired,
    auditReady: auditReadiness === "Ready",
    auditReadiness,
    nextReviewDate: nextReview,
    owner: "Governance Lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Context Realize consumes to risk-adjust ROI: governance + ops + build signals.
 *  Returns a 0..1 `riskDiscountFactor` (higher = discount value more). */
export interface RealizeContext {
  hasLive: boolean;
  governanceTier?: GovernanceTier;
  governanceDecision?: string;
  openFindings: string[];
  buildQuality?: number;
  buildCostPerAnswer?: number;
  opsDriftRisk?: number;
  opsReliability?: number;
  opsCostPerQuery?: number;
  /** Extra multiplicative risk discount (0..~0.35) sourced from govern + ops. */
  externalRiskDiscount: number;
  riskDrivers: string[];
}

export function selectRealizeContext(s: ProgramState): RealizeContext {
  const g = selectGovernInputs(s);
  const decision = s.governance?.decision ?? deriveGovernanceDecision(s);
  const drivers: string[] = [];
  let discount = 0;

  const tier = g.governanceTier;
  if (tier === "Critical") { discount += 0.15; drivers.push("Critical governance tier"); }
  else if (tier === "High") { discount += 0.1; drivers.push("High governance tier"); }
  else if (tier === "Medium") { discount += 0.04; }

  const findings = decision.openFindings ?? [];
  if (findings.length) { discount += Math.min(0.12, findings.length * 0.04); drivers.push(`${findings.length} open governance finding(s)`); }

  const drift = g.driftRisk ?? s.deploy?.driftRisk;
  if ((drift ?? 0) >= 60) { discount += 0.06; drivers.push("High operational drift risk"); }

  const rel = s.deploy?.reliability;
  if (has(rel) && (rel as number) < 0.99) { discount += 0.05; drivers.push("Reliability below 99%"); }

  const q = g.qualityScore ?? s.rag?.contract?.qualityScore;
  if (has(q) && (q as number) < 75) { discount += 0.05; drivers.push("Build quality below target"); }

  return {
    hasLive: g.hasLive || has(s.rag?.contract) || has(s.deploy?.evidence),
    governanceTier: tier,
    governanceDecision: decision.decision,
    openFindings: findings,
    buildQuality: q,
    buildCostPerAnswer: s.rag?.contract?.costEstimate ?? s.rag?.costPerAnswer,
    opsDriftRisk: drift,
    opsReliability: rel,
    opsCostPerQuery: s.deploy?.evidence?.costPerQuery ?? s.deploy?.costPerQuery,
    externalRiskDiscount: Math.min(0.35, discount),
    riskDrivers: drivers,
  };
}
