// ============================================================================
// Govern, audit evidence pack (Phase 4). Assembles a defensible, traceable
// evidence record from the live lifecycle contracts. Pure + client side.
// ============================================================================
import type { ProgramState } from "./types";
import { selectGovernInputs, deriveGovernanceDecision } from "./contracts";

export interface EvidenceItem { label: string; value: string }
export interface EvidenceSection { key: string; label: string; items: EvidenceItem[] }

const fmtUsd = (n?: number) => (n === undefined ? "N/A" : Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`);
const list = (a?: string[]) => (a && a.length ? a.join(", ") : "none");

export function buildAuditEvidencePack(s: ProgramState): EvidenceSection[] {
  const g = selectGovernInputs(s);
  const d = s.governance?.decision ?? deriveGovernanceDecision(s);
  const sections: EvidenceSection[] = [
    {
      key: "strategy", label: "Strategy evidence", items: [
        { label: "Initiative", value: g.initiativeName ?? "N/A" },
        { label: "AI pattern", value: g.primaryAiPattern ?? "N/A" },
        { label: "Capability tags", value: list(g.capabilityTags) },
        { label: "Governance tier", value: g.governanceTier ?? "N/A" },
        { label: "Tier rationale", value: g.governanceTierRationale ?? "N/A" },
        { label: "Human review", value: g.humanReviewRequired ? "Required" : "Not required" },
        { label: "Audit evidence", value: g.auditEvidenceRequired ? "Required" : "Not required" },
      ],
    },
    {
      key: "data", label: "Data evidence", items: [
        { label: "Data readiness", value: g.dataReadinessScore !== undefined ? `${g.dataReadinessScore}/100` : "N/A" },
        { label: "Approved sources", value: list(g.approvedSources) },
        { label: "Conditional sources", value: list(g.conditionalSources) },
        { label: "Blocked sources", value: list(g.blockedSources) },
        { label: "Sensitivity restrictions", value: list(g.sensitivityRestrictions) },
        { label: "Known data risks", value: list(g.knownDataRisks) },
        { label: "Handoff recommendation", value: g.dataRecommendation ?? "N/A" },
      ],
    },
    {
      key: "build", label: "Build evidence", items: [
        { label: "Model", value: g.selectedModel ?? "N/A" },
        { label: "Retrieval mode", value: g.retrievalMode ?? "N/A" },
        { label: "Eval run", value: g.evalRunId ?? "N/A" },
        { label: "Quality score", value: g.qualityScore !== undefined ? `${g.qualityScore}/100` : "N/A" },
        { label: "Citation accuracy", value: g.citationAccuracy !== undefined ? `${g.citationAccuracy}%` : "N/A" },
        { label: "Faithfulness", value: g.faithfulness !== undefined ? `${g.faithfulness}%` : "N/A" },
        { label: "Hallucination risk", value: g.hallucinationRisk !== undefined ? `${g.hallucinationRisk}%` : "N/A" },
        { label: "Failed gates", value: list(g.failedGates) },
        { label: "Known failure modes", value: list(g.knownFailureModes) },
      ],
    },
    {
      key: "operate", label: "Operate evidence", items: [
        { label: "Release readiness", value: g.releaseReadinessScore !== undefined ? `${g.releaseReadinessScore}/100` : "N/A" },
        { label: "Release recommendation", value: g.releaseRecommendation ?? "N/A" },
        { label: "Monitoring coverage", value: g.monitoringCoverageScore !== undefined ? `${g.monitoringCoverageScore}%` : "N/A" },
        { label: "Regression status", value: g.regressionStatus ?? "N/A" },
        { label: "SLO status", value: g.sloStatus ?? "N/A" },
        { label: "Drift risk", value: g.driftRisk !== undefined ? `${g.driftRisk}/100` : "N/A" },
        { label: "Incident summary", value: g.incidentSummary ?? "N/A" },
        { label: "Rollback readiness", value: g.rollbackReadiness ?? "N/A" },
        { label: "Version lineage", value: g.versionLineage ? Object.entries(g.versionLineage).map(([k, v]) => `${k}: ${v}`).join(" · ") : "N/A" },
        { label: "Day Two remediation decision", value: s.operate?.decisionLabel ?? "N/A" },
        { label: "Day Two loop back target", value: s.operate?.loopTarget ?? "N/A" },
        { label: "Day Two value at risk", value: s.operate?.valueAtRiskUsd !== undefined ? `${fmtUsd(s.operate.valueAtRiskUsd)}/yr` : "N/A" },
        { label: "Day Two evidence", value: s.operate?.evidenceNote ?? "N/A" },
      ],
    },
    {
      key: "governance", label: "Governance evidence", items: [
        { label: "Decision", value: d.decision ?? "N/A" },
        { label: "Governance score", value: d.score !== undefined ? `${d.score}/100` : "N/A" },
        { label: "Required controls", value: list(d.requiredControls) },
        { label: "Open findings", value: list(d.openFindings) },
        { label: "Release blockers", value: list(d.releaseBlockers) },
        { label: "Approval conditions", value: list(d.approvalConditions) },
        { label: "Audit readiness", value: d.auditReadiness ?? "N/A" },
        { label: "Next review", value: d.nextReviewDate ?? "N/A" },
        { label: "Owner", value: d.owner ?? "N/A" },
      ],
    },
  ];
  const at = s.rag?.agentTooling;
  if (at?.enabled) {
    sections.push({
      key: "agent", label: "Agent / tool evidence", items: [
        { label: "Agent enabled", value: "Yes" },
        { label: "Tool schemas", value: String(at.toolSchemas.length) },
        { label: "Blocked actions", value: at.permissionBoundaries.blockedActions.slice(0, 3).join(", ") },
        { label: "Approvals required", value: at.approvalRequirements.join("; ") || "none" },
        { label: "Misuse evals", value: `${at.misuseEvals.filter((e) => e.result === "pass").length}/${at.misuseEvals.length} pass` },
        { label: "Audit evidence", value: at.auditEvidence.join(", ") },
      ],
    });
  }
  if (g.roi !== undefined || g.riskAdjustedValue !== undefined) {
    sections.push({
      key: "realize", label: "Realize evidence", items: [
        { label: "Risk adjusted value", value: fmtUsd(g.riskAdjustedValue) + "/yr" },
        { label: "ROI", value: g.roi !== undefined ? `${Math.round(g.roi)}%` : "N/A" },
        { label: "Payback", value: g.paybackMonths !== undefined && Number.isFinite(g.paybackMonths) ? `${Math.round(g.paybackMonths)} mo` : "N/A" },
        { label: "Adoption", value: g.adoption !== undefined ? `${Math.round(g.adoption * 100)}%` : "N/A" },
        { label: "Primary value leakage", value: g.valueLeakage ?? "N/A" },
        { label: "Recommended next action", value: g.recommendedNextAction ?? "N/A" },
      ],
    });
  }
  return sections;
}

/** Flatten the evidence pack to a copyable text summary. */
export function auditPackToText(s: ProgramState): string {
  return buildAuditEvidencePack(s)
    .map((sec) => `## ${sec.label}\n${sec.items.map((i) => `- ${i.label}: ${i.value}`).join("\n")}`)
    .join("\n\n");
}
