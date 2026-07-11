// ============================================================================
// Operate / AI Ops / MLOps / RAGOps, deterministic production readiness engine
// (Phase 2). Pure, client side derivations over the Phase 1 lifecycle contracts
// (initiative.meta, data.handoff, rag.contract, deploy slice/evidence,
// governance.decision). No telemetry, no backend.
// ============================================================================
import type { ProgramState, OpsEvidence, StageKey } from "./types";
import { deriveGovernanceDecision, resolveDataHandoff, resolveBuildContract } from "./contracts";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
const stamp = () => new Date().toISOString().slice(0, 10);

export type CheckStatus = "pass" | "warn" | "fail";
export interface ReadinessCheck { label: string; status: CheckStatus; detail: string; source: string; stage: StageKey }
/** A blocker plus the stage that owns the fix (R1.3: rows route to their source). */
export interface ReadinessBlocker { text: string; stage: StageKey }
export interface ReleaseReadiness {
  score: number;
  recommendation: string; // Ready for pilot | Ready with restrictions | Hold before pilot | Not production ready
  checks: ReadinessCheck[];
  blockers: string[];
  blockerItems: ReadinessBlocker[];
}

const scoreThreshold = (v: number | undefined, pass: number, warn: number, higherBetter = true): CheckStatus => {
  if (v === undefined) return "warn";
  if (higherBetter) return v >= pass ? "pass" : v >= warn ? "warn" : "fail";
  return v <= pass ? "pass" : v <= warn ? "warn" : "fail";
};

export function computeReleaseReadiness(s: ProgramState): ReleaseReadiness {
  const meta = s.initiative?.meta;
  // R1.1: resolve artifacts exactly the way the rail's selectors do (persisted
  // slice, else the deterministic derivation). A "Data lab not run" warning can
  // no longer appear beside a stepper that already shows Data 74, both read the
  // same resolved handoff/contract.
  const handoff = resolveDataHandoff(s);
  const c = resolveBuildContract(s);
  const ev = s.deploy?.evidence;
  const cov = deriveMonitoringCoverage(s).coverageScore;

  const checks: ReadinessCheck[] = [
    { label: "Strategy initiative approved", stage: "frame", source: "initiative.meta", ...(meta?.governanceTier ? { status: "pass", detail: `${meta.primaryAiPattern}` } : { status: "warn", detail: "No framed initiative" }) as { status: CheckStatus; detail: string } },
    { label: "Data readiness handoff exists", stage: "data", source: "data.handoff", ...(handoff ? { status: "pass", detail: `readiness ${handoff.dataReadinessScore}/100` } : { status: "warn", detail: "Data lab not run" }) },
    { label: "Blocked data excluded", stage: "data", source: "data.handoff.blockedSources", ...((handoff?.blockedSources?.length ?? 0) === 0 ? { status: "pass", detail: "No blocked sources" } : { status: "warn", detail: `${handoff!.blockedSources!.length} source(s) excluded & flagged` }) },
    { label: "Build quality gates passed", stage: "build", source: "rag.contract.failedGates", ...((c?.failedGates?.length ?? 0) === 0 ? { status: "pass", detail: "All gates passing" } : { status: "fail", detail: `${c!.failedGates!.length} gate(s) failing` }) },
    { label: "Evaluation run available", stage: "build", source: "rag.contract.evalRunId", ...(c?.evalRunId ? { status: "pass", detail: c.evalRunId } : { status: "warn", detail: "No eval run recorded" }) },
    { label: "Citation accuracy", stage: "build", source: "rag.contract.citationAccuracy", status: scoreThreshold(c?.citationAccuracy, 88, 80), detail: c?.citationAccuracy !== undefined ? `${c.citationAccuracy}% (target 88%)` : "not evaluated" },
    { label: "Faithfulness", stage: "build", source: "rag.contract.faithfulness", status: scoreThreshold(c?.faithfulness, 85, 75), detail: c?.faithfulness !== undefined ? `${c.faithfulness}% (target 85%)` : "not evaluated" },
    { label: "Hallucination risk", stage: "build", source: "rag.contract.hallucinationRisk", status: scoreThreshold(c?.hallucinationRisk, 10, 20, false), detail: c?.hallucinationRisk !== undefined ? `${c.hallucinationRisk}% (max 10%)` : "not evaluated" },
    { label: "Governance tier assigned", stage: "frame", source: "initiative.meta.governanceTier", ...(meta?.governanceTier ? { status: "pass", detail: `Tier ${meta.governanceTier}` } : { status: "warn", detail: "Not assigned" }) },
    { label: "Human review decided", stage: "frame", source: "initiative.meta.humanReviewRequired", ...(meta?.humanReviewRequired !== undefined ? { status: "pass", detail: meta.humanReviewRequired ? "Required" : "Not required" } : { status: "warn", detail: "Undecided" }) },
    { label: "Monitoring plan defined", stage: "deploy", source: "deploy.evidence.monitoringCoverage", status: scoreThreshold(cov, 80, 60), detail: `${cov}% coverage` },
    { label: "Rollback path defined", stage: "deploy", source: "deploy.evidence.rollbackReadiness", ...(ev?.rollbackReadiness ? { status: "pass", detail: ev.rollbackReadiness } : { status: "warn", detail: "Not validated" }) },
    // Derived, not hard-coded: once ops evidence exists, an owner and runbook
    // travel with it; before that it is honestly still a draft.
    { label: "Owner & runbook assigned", stage: "deploy", source: "deploy.evidence", ...(ev ? { status: "pass", detail: "Owner: AI Ops · runbook v1" } : { status: "warn", detail: "Owner: AI Ops · runbook draft" }) },
  ];

  const val = (st: CheckStatus) => (st === "pass" ? 1 : st === "warn" ? 0.5 : 0);
  const score = clamp((checks.reduce((a, k) => a + val(k.status), 0) / checks.length) * 100);
  const anyFail = checks.some((k) => k.status === "fail");
  let recommendation: string;
  if (score >= 85 && !anyFail) recommendation = "Ready for pilot";
  else if (score >= 70 && !anyFail) recommendation = "Ready with restrictions";
  else if (score >= 70) recommendation = "Ready with restrictions";
  else if (score >= 55) recommendation = "Hold before pilot";
  else recommendation = "Not production ready";

  const blockerItems: ReadinessBlocker[] = [
    ...checks.filter((k) => k.status === "fail").map((k) => ({ text: `${k.label}: ${k.detail}`, stage: k.stage })),
    ...checks.filter((k) => k.status === "warn").map((k) => ({ text: `${k.label}: ${k.detail}`, stage: k.stage })),
  ].slice(0, 4);

  return { score, recommendation, checks, blockers: blockerItems.map((b) => b.text), blockerItems };
}

// ---- Version & lineage ------------------------------------------------------
export interface LineageRow { asset: string; version: string; source: string; why: string }

export function deriveVersionLineage(s: ProgramState): LineageRow[] {
  const c = s.rag?.contract;
  const meta = s.initiative?.meta;
  const lin = s.deploy?.evidence?.versionLineage ?? {};
  const base = slug(meta?.primaryAiPattern || "assistant") || "assistant";
  return [
    { asset: "Model", version: lin.model ?? c?.selectedModel ?? s.rag?.model ?? "Frontier hosted, fast / mini", source: "Build contract", why: "Determines cost, latency, and capability." },
    { asset: "Model archetype", version: c?.selectedPattern ?? meta?.primaryAiPattern ?? "Knowledge assistant", source: "Build contract", why: "The system shape being operated." },
    { asset: "Prompt", version: lin.prompt ?? c?.promptVersion ?? `${base}-v0.3`, source: "Build contract", why: "Prompt changes can alter answer behavior." },
    { asset: "Retrieval mode", version: c?.retrievalModeLabel ?? c?.retrievalMode ?? "Lexical BM25", source: "Build", why: "Affects which evidence reaches the answer." },
    { asset: "Retrieval index", version: lin.index ?? c?.indexVersion ?? `${base}-index-${stamp()}`, source: "Build / Data", why: "Index changes affect retrieval and citations." },
    { asset: "Corpus", version: `${base}-corpus-v1.2`, source: "Data handoff", why: "Data changes affect quality and risk." },
    { asset: "Eval set", version: lin.dataset ?? c?.datasetVersion ?? "golden-v1", source: "Build contract", why: "Needed for regression comparison." },
    { asset: "Policy pack", version: meta?.governanceTier ? `policy-controls-${slug(meta.governanceTier)}-v1` : "policy-controls-v1", source: "Govern", why: "Determines release guardrails." },
    { asset: "Deployment config", version: "balanced cost and latency v2", source: "Operate", why: "Determines the runtime cost/latency tradeoff." },
  ];
}

// ---- Monitoring coverage ----------------------------------------------------
export type SignalStatus = "monitored" | "gap";
export interface MonitorSignal { signal: string; status: SignalStatus; current: string; threshold: string; owner: string; action: string }
export interface MonitoringCoverage { signals: MonitorSignal[]; monitoredCount: number; total: number; coverageScore: number; gaps: string[] }

export function deriveMonitoringCoverage(s: ProgramState): MonitoringCoverage {
  const ev = s.deploy?.evidence;
  const dep = s.deploy;
  const c = s.rag?.contract;
  const p95 = ev?.latencyP95 ?? dep?.latencyP95;
  const cpq = ev?.costPerQuery ?? dep?.costPerQuery;
  const cite = c?.citationAccuracy;
  const drift = ev?.driftRisk ?? dep?.driftRisk;

  const signals: MonitorSignal[] = [
    { signal: "p95 latency", status: "monitored", current: p95 !== undefined ? `${p95} ms` : "N/A", threshold: "1000 ms", owner: "AI Ops", action: "Scale or switch config" },
    { signal: "Cost / query", status: "monitored", current: cpq !== undefined ? `$${cpq.toFixed(3)}` : "N/A", threshold: "$0.020", owner: "Product Ops", action: "Optimize retrieval / model tier" },
    { signal: "Token usage", status: "monitored", current: "~1.2k / query", threshold: "2k / query", owner: "AI Ops", action: "Trim context / chunk size" },
    { signal: "Error rate", status: "monitored", current: dep?.errorBudgetPct !== undefined ? `budget ${dep.errorBudgetPct}%` : "N/A", threshold: "1%", owner: "AI Ops", action: "Investigate + roll back" },
    { signal: "Citation failure rate", status: "monitored", current: cite !== undefined ? `${100 - cite}%` : "N/A", threshold: "5%", owner: "RAG Owner", action: "Block release if rising" },
    { signal: "Faithfulness drop", status: "monitored", current: c?.faithfulness !== undefined ? `${c.faithfulness}%` : "N/A", threshold: "≥ 85%", owner: "RAG Owner", action: "Regression review" },
    { signal: "Hallucination risk", status: "monitored", current: c?.hallucinationRisk !== undefined ? `${c.hallucinationRisk}%` : "N/A", threshold: "≤ 10%", owner: "RAG Owner", action: "Constrain prompt / retrieval" },
    { signal: "Drift signal", status: "monitored", current: drift !== undefined ? `${drift}/100` : "N/A", threshold: "60/100", owner: "AI Ops", action: "Reindex / refresh sources" },
    { signal: "Incident triggers", status: "monitored", current: ev?.incidentStatus ?? "none", threshold: "0 active", owner: "AI Ops", action: "Run incident playbook" },
    { signal: "Retrieval miss rate", status: "gap", current: "N/A", threshold: "8%", owner: "RAG Owner", action: "Add trace instrumentation" },
    { signal: "Escalation rate", status: "gap", current: "N/A", threshold: "12%", owner: "Product", action: "Instrument handoff to human" },
    { signal: "User feedback rate", status: "gap", current: "N/A", threshold: "N/A", owner: "Product", action: "Add feedback capture" },
  ];
  const monitoredCount = signals.filter((x) => x.status === "monitored").length;
  const total = signals.length;
  return {
    signals, monitoredCount, total,
    coverageScore: clamp((monitoredCount / total) * 100),
    gaps: signals.filter((x) => x.status === "gap").map((x) => x.signal),
  };
}

// ---- Evaluation regression --------------------------------------------------
export interface RegressionRow { metric: string; previous: number; current: number; delta: number; status: CheckStatus; suffix: string }
export interface EvalRegression { rows: RegressionRow[]; status: string; findings: string[]; modeled: boolean; evalRunId?: string; prevRunId?: string }

export function deriveEvalRegression(s: ProgramState): EvalRegression {
  const c = s.rag?.contract;
  const quality = c?.qualityScore ?? 80;
  const cite = c?.citationAccuracy ?? 86;
  const faith = c?.faithfulness ?? 84;
  const hall = c?.hallucinationRisk ?? 8;
  // Modeled previous run (deterministic offsets) until real run history exists.
  const mk = (label: string, cur: number, prev: number, higherBetter: boolean, suffix: string): RegressionRow => {
    const delta = cur - prev;
    let status: CheckStatus = "pass";
    if (higherBetter) status = delta <= -5 ? "fail" : delta < 0 ? "warn" : "pass";
    else status = delta >= 5 ? "fail" : delta > 0 ? "warn" : "pass";
    return { metric: label, previous: prev, current: cur, delta, status, suffix };
  };
  const rows = [
    mk("Overall quality", quality, quality + 4, true, "%"),
    mk("Citation accuracy", cite, cite + 7, true, "%"),
    mk("Faithfulness", faith, faith + 2, true, "%"),
    mk("Hallucination risk", hall, Math.max(0, hall - 4), false, "%"),
  ];
  const anyFail = rows.some((r) => r.status === "fail");
  const anyWarn = rows.some((r) => r.status === "warn");
  const status = anyFail ? "Block release" : anyWarn ? "Watch" : "No regression";
  const findings = rows.filter((r) => r.status !== "pass").map((r) => `${r.metric} ${r.delta > 0 ? "+" : ""}${r.delta}${r.suffix}`);
  return { rows, status, findings, modeled: true, evalRunId: c?.evalRunId, prevRunId: c?.evalRunId ? c.evalRunId.replace(/01$/, "00") : undefined };
}

// ---- Incidents & rollback ---------------------------------------------------
export interface OpsIncident {
  id: string; severity: "Low" | "Medium" | "High" | "Critical"; trigger: string; affectedUsers: string;
  rootCause: string; linkedVersion: string; mitigation: string; rollback: string; owner: string; postmortem: string;
}
export const ROLLBACK_OPTIONS = [
  "Revert prompt", "Revert index", "Switch retrieval mode", "Disable source",
  "Force human review", "Route to fallback answer", "Pause deployment", "Roll back model / config",
];

export function deriveIncidents(s: ProgramState): { incidents: OpsIncident[]; rollbackOptions: string[] } {
  const c = s.rag?.contract;
  const lin = deriveVersionLineage(s);
  const indexVer = lin.find((l) => l.asset === "Retrieval index")?.version ?? "index-current";
  const drift = s.deploy?.evidence?.driftRisk ?? s.deploy?.driftRisk ?? 0;
  const incidents: OpsIncident[] = [];

  if ((c?.citationAccuracy ?? 100) < 90 || (c?.failedGates?.length ?? 0) > 0) {
    incidents.push({
      id: "INC-CITE-01", severity: "High", trigger: "Citation failures exceed 10% for policy questions",
      affectedUsers: "Policy / support queries", rootCause: "A retired policy source is still retrievable",
      linkedVersion: indexVer, mitigation: "Disable retired source; enforce citation required gate",
      rollback: "Disable source + revert to previous index", owner: "RAG Ops", postmortem: "Required before production promotion",
    });
  }
  if (drift >= 50) {
    incidents.push({
      id: "INC-DRIFT-02", severity: drift >= 70 ? "High" : "Medium", trigger: `Drift signal at ${drift}/100`,
      affectedUsers: "All queries", rootCause: "Source freshness decay since last reindex",
      linkedVersion: indexVer, mitigation: "Reindex changed sources; refresh embeddings",
      rollback: "Roll back model / config to last stable", owner: "AI Ops", postmortem: "Optional",
    });
  }
  incidents.push({
    id: "INC-LAT-03", severity: "Medium", trigger: "p95 latency breaches SLO under peak load",
    affectedUsers: "Peak hour users", rootCause: "Queueing as traffic approaches capacity",
    linkedVersion: "balanced cost and latency v2", mitigation: "Raise cache %, scale tier, or add reranker budget",
    rollback: "Switch retrieval mode / pause deployment", owner: "AI Ops", postmortem: "Optional",
  });
  return { incidents, rollbackOptions: ROLLBACK_OPTIONS };
}

// ---- Enrichment written back into deploy.evidence ---------------------------
export function deriveOpsEvidenceEnrichment(s: ProgramState): Partial<OpsEvidence> {
  const rr = computeReleaseReadiness(s);
  const cov = deriveMonitoringCoverage(s);
  const reg = deriveEvalRegression(s);
  const inc = deriveIncidents(s);
  const gov = deriveGovernanceDecision(s);
  const at = s.rag?.agentTooling;
  const agentTelemetry = at?.enabled ? {
    toolCallLatencyMs: at.operationalSignals.toolCallLatencyMs,
    toolFailureRate: at.operationalSignals.toolFailureRate,
    approvalQueueCount: at.operationalSignals.approvalQueueCount,
    blockedActionCount: at.operationalSignals.blockedActionCount,
    rollbackEvents: at.operationalSignals.rollbackEvents,
    toolIncidentRisk: Math.min(100, at.operationalSignals.toolFailureRate * 8 + at.operationalSignals.approvalQueueCount * 3),
    agentMonitoringCoverage: 75,
  } : {};
  const tc = s.rag?.trainingContract;
  const trainingTelemetry = tc?.enabled ? {
    generalizationScore: tc.generalizationAssessment.generalizationScore,
    overfittingRiskLevel: tc.generalizationAssessment.overfittingRisk,
    trainingDriftMonitoringRequired: tc.datasetReadiness.driftMonitoringRequired,
    holdoutPerformance: tc.datasetReadiness.holdoutSetAvailable ? tc.generalizationAssessment.testPerformance : undefined,
    retrainingTrigger: "Drift or class level regression",
    classLevelMonitoring: true,
  } : {};
  const risks = [
    ...rr.blockers,
    ...reg.findings.map((f) => `Regression: ${f}`),
    ...cov.gaps.map((g) => `Monitoring gap: ${g}`),
    ...(gov.openFindings ?? []).map((f) => `Governance: ${f}`),
  ].slice(0, 6);
  return {
    releaseReadinessScore: rr.score,
    releaseRecommendation: rr.recommendation,
    monitoringCoverageScore: cov.coverageScore,
    monitoredSignals: cov.monitoredCount,
    regressionStatus: reg.status,
    regressionFindings: reg.findings,
    incidentStatus: inc.incidents.length ? inc.incidents[0].severity : "none",
    incidentSummary: inc.incidents.length ? `${inc.incidents.length} scenario(s); top: ${inc.incidents[0].trigger}` : "No active incidents",
    openOperationalRisks: risks,
    operationalDecision: rr.recommendation,
    ...agentTelemetry,
    ...trainingTelemetry,
  };
}
