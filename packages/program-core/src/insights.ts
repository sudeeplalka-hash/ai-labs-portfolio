// Phase C, insight engines. Read-only derivations that turn scores into
// arguments: WHY the governance decision landed where it did, and WHAT would
// make each failing gate pass. Both are pure functions over the same engines
// the stages already use, so they can never disagree with the displayed state.

import type { ProgramState, StageKey } from "./types";
import { selectGovernInputs, deriveGovernanceScorecard, deriveOpenFindings, type GovLevel } from "./contracts";
import { computeReleaseReadiness, type CheckStatus } from "./operate";

// ---- C1 · Governance decision breakdown -------------------------------------

export interface DecisionFactor {
  key: string;
  dimension: string;
  level: GovLevel;
  status: string;
  /** This dimension's own 0..100 score (90 pass · 65 warning · 35 blocker). */
  dimScore: number;
  /** Contribution to the overall score vs the all-clear baseline (≤ 0). */
  delta: number;
  findings: string[];
  source: string;
}

export interface DecisionBreakdown {
  /** The all-clear score: every dimension passing. */
  baseline: number;
  /** Final overall score, always equals baseline + Σ deltas, and matches
   * deriveGovernanceDecision().score (same scorecard, same mean). */
  score: number;
  factors: DecisionFactor[];
  /** Which rules produced the decision band, in plain language. */
  decisionDrivers: string[];
}

/** Why did the decision land here? Per-dimension score deltas plus the named
 * rules that selected the decision band. */
export function deriveDecisionBreakdown(s: ProgramState): DecisionBreakdown {
  const g = selectGovernInputs(s);
  const card = deriveGovernanceScorecard(s);
  const rich = deriveOpenFindings(s);

  const BASE = 90; // lvlScore("good")
  const factors: DecisionFactor[] = card.map((d) => ({
    key: d.key,
    dimension: d.dimension,
    level: d.level,
    status: d.status,
    dimScore: d.score,
    delta: (d.score - BASE) / card.length,
    findings: d.findings,
    source: d.source,
  }));
  const score = Math.round(card.reduce((a, d) => a + d.score, 0) / card.length);

  // Mirror deriveGovernanceDecision's rule chain, naming what fired.
  const drivers: string[] = [];
  const tier = g.governanceTier;
  if (!tier) {
    drivers.push("No framed initiative, assessment pending.");
  } else {
    if ((g.hallucinationRisk ?? 0) >= 25 && g.operationalCriticality === "High")
      drivers.push(`Hallucination risk ${g.hallucinationRisk}% on a High-criticality workflow forces rejection.`);
    if (g.blockedSources?.length) drivers.push(`${g.blockedSources.length} blocked data source(s) must stay excluded.`);
    if (g.failedGates?.length) drivers.push(`${g.failedGates.length} build quality gate(s) failing.`);
    if (g.sloStatus === "breached") drivers.push("SLO breached under load.");
    if (g.regressionStatus === "Block release") drivers.push("Evaluation regression blocks release.");
    rich.filter((f) => f.severity === "Critical").forEach((f) => drivers.push(`Critical finding: ${f.finding}.`));
    if ((tier === "High" || tier === "Critical") && (g.humanReviewRequired || rich.length > 0))
      drivers.push(`Tier ${tier} requires human review while findings remain open.`);
    if (drivers.length === 0 && (rich.length > 0 || (g.conditionalSources?.length ?? 0) > 0 || g.humanReviewRequired))
      drivers.push("Open findings or conditional sources restrict the approval.");
    if (drivers.length === 0) drivers.push("All dimensions pass, evidence supports a pilot.");
  }

  return { baseline: BASE, score, factors, decisionDrivers: drivers.slice(0, 6) };
}

// ---- C2 · Gate-fix recommender ------------------------------------------------

export interface GateFix {
  /** The failing/warning check, as displayed on the readiness board. */
  check: string;
  status: CheckStatus;
  /** Current reading (from the check's own detail). */
  current: string;
  /** What passing looks like. */
  target: string;
  /** The concrete next action. */
  action: string;
  /** The stage that owns the fix. */
  stage: StageKey;
}

const FIX_MAP: Record<string, { stage: StageKey; target: string; action: string }> = {
  "Strategy initiative approved": { stage: "frame", target: "Initiative framed with a governance tier", action: "Frame the initiative in Strategy & Planning, the workshop derives the tier." },
  "Data readiness handoff exists": { stage: "data", target: "Handoff produced", action: "Run the Data lab so it emits the readiness handoff to Build." },
  "Blocked data excluded": { stage: "data", target: "0 blocked sources pending", action: "Keep blocked sources excluded; complete redaction and access controls before re inclusion." },
  "Build quality gates passed": { stage: "build", target: "All gates passing", action: "Open Quality Gates to see which gate fails, then improve retrieval or add an abstention path." },
  "Evaluation run available": { stage: "build", target: "Eval run recorded", action: "Run the Live Evaluator so an eval run id lands in the Build contract." },
  "Citation accuracy": { stage: "build", target: "≥ 88%", action: "Switch to governed rerank and require citation metadata on approved sources." },
  "Faithfulness": { stage: "build", target: "≥ 85%", action: "Tighten retrieval scope and abstain when evidence is weak instead of answering." },
  "Hallucination risk": { stage: "build", target: "≤ 10%", action: "Constrain the prompt to retrieved evidence and penalize uncited claims." },
  "Governance tier assigned": { stage: "frame", target: "Tier assigned", action: "Complete the Strategy workshop, tier derives from pattern, criticality, and data sensitivity." },
  "Human review decided": { stage: "frame", target: "Decision recorded", action: "Set the human review requirement on the initiative in Strategy." },
  "Monitoring plan defined": { stage: "deploy", target: "≥ 80% coverage", action: "Add retrieval miss and user feedback instrumentation to close the monitoring gaps." },
  "Rollback path defined": { stage: "deploy", target: "Rollback validated", action: "Pick and validate a rollback option in Incident & Rollback." },
  "Owner & runbook assigned": { stage: "deploy", target: "Owner + runbook final", action: "Assign the on call owner and finish the operational runbook." },
};

// ---- Phase I · regulatory mapping ---------------------------------------------

export type EuAiActClass = "High risk" | "Limited risk" | "Minimal risk";
export type NistFunction = "GOVERN" | "MAP" | "MEASURE" | "MANAGE";

export interface RegulatoryMapping {
  euAiAct: { riskClass: EuAiActClass; rationale: string; obligations: string[] };
  nist: { fn: NistFunction; intent: string; coveredBy: string[]; status: "covered" | "partial" }[];
  disclaimer: string;
}

/** Deterministic mapping of the initiative to the EU AI Act risk class and the
 * NIST AI RMF functions, derived from the same meta the governance tier uses.
 * Informational orientation, not legal advice (and it says so). */
export function deriveRegulatoryMapping(s: ProgramState): RegulatoryMapping {
  const g = selectGovernInputs(s);
  const meta = s.initiative?.meta;
  const pattern = meta?.primaryAiPattern ?? "Search / knowledge assistant";
  const highStakes = pattern === "Decision support" || pattern === "Classification";
  const highTier = meta?.governanceTier === "High" || meta?.governanceTier === "Critical";
  const highCrit = meta?.operationalCriticality === "High";

  let riskClass: EuAiActClass;
  let rationale: string;
  if (highStakes && (highTier || highCrit)) {
    riskClass = "High risk";
    rationale = `${pattern} outputs influence decisions about individuals (tier ${meta?.governanceTier ?? "N/A"}, criticality ${meta?.operationalCriticality ?? "N/A"}), an Annex III style high risk profile.`;
  } else if (meta?.operationalCriticality === "Low" && !highTier) {
    riskClass = "Minimal risk";
    rationale = `Internal ${pattern.toLowerCase()} with low criticality and human authorship of final outputs, minimal risk profile with voluntary best practice.`;
  } else {
    riskClass = "Limited risk";
    rationale = `A user facing ${pattern.toLowerCase()} that informs rather than decides, transparency obligations apply (users must know they are interacting with AI).`;
  }

  const obligations =
    riskClass === "High risk"
      ? [
          "Risk management system across the lifecycle",
          "Data governance incl. bias examination of training/eval data",
          "Technical documentation + automatic event logging",
          "Human oversight with authority to intervene",
          "Accuracy, robustness & cybersecurity requirements",
          "Conformity assessment before deployment",
        ]
      : riskClass === "Limited risk"
        ? [
            "Disclose AI interaction to users",
            "Mark AI-generated content where applicable",
            "Maintain basic technical documentation",
          ]
        : [
            "Voluntary code of practice",
            "Internal documentation of purpose and boundaries",
          ];

  const evalCovered = !!g.evalRunId;
  const monCovered = (g.monitoringCoverageScore ?? 0) >= 80;
  const nist: RegulatoryMapping["nist"] = [
    { fn: "GOVERN", intent: "Accountability, policies, and risk culture", coveredBy: ["Governance tier + rationale", "Decision engine + required controls", "Audit evidence pack"], status: "covered" },
    { fn: "MAP", intent: "Context, purpose, and risk identification", coveredBy: ["Strategy initiative meta (pattern, criticality)", "Data readiness handoff (sources, sensitivity)"], status: "covered" },
    { fn: "MEASURE", intent: "Evaluate, benchmark, and track AI risks", coveredBy: ["Eval runs + quality gates", "Regression tracking", "Agent misuse evals"], status: evalCovered ? "covered" : "partial" },
    { fn: "MANAGE", intent: "Prioritize, respond, and recover", coveredBy: ["Release readiness gate", "Incident + rollback paths", "Monitoring coverage"], status: monCovered ? "covered" : "partial" },
  ];

  return {
    euAiAct: { riskClass, rationale, obligations },
    nist,
    disclaimer: "Informational orientation derived from the initiative's metadata, a starting map for counsel and compliance, not legal advice.",
  };
}

/** For every readiness check that isn't passing: what it reads now, what
 * passing looks like, the concrete action, and the stage that owns it. */
export function deriveGateFixes(s: ProgramState): GateFix[] {
  const rr = computeReleaseReadiness(s);
  const fixes: GateFix[] = [];
  for (const check of rr.checks) {
    if (check.status === "pass") continue;
    const map = FIX_MAP[check.label];
    fixes.push({
      check: check.label,
      status: check.status,
      current: check.detail,
      target: map?.target ?? "Pass",
      action: map?.action ?? "Review this check on the Operate readiness board.",
      stage: map?.stage ?? "deploy",
    });
  }
  // Hard failures first, then warnings.
  return fixes.sort((a, b) => (a.status === "fail" ? 0 : 1) - (b.status === "fail" ? 0 : 1));
}
