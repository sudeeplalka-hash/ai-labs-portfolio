// Phase B — cross-stage read-only selectors. Pure functions over ProgramState
// that derive the program's headline numbers and release blockers on the fly
// (from the same deterministic engines the stages use), so the rail and the
// contract loop never depend on which pages have been visited.

import type { ProgramState, StageKey } from "./types";
import { buildDataReadinessHandoff, buildBuildOutputContract, deriveGovernanceDecision, deriveOpenFindings } from "./contracts";
import { computeReleaseReadiness } from "./operate";
import { deriveOpsSeries, detectSignals, valueAtRisk } from "./operate-day2";

export interface StageHeadline {
  key: StageKey;
  /** Short display value for the rail chip (e.g. "74", "Approved w/ conditions"). */
  value: string | null;
  /** One-line context shown as tooltip / secondary text. */
  detail: string | null;
}

const short = (decision?: string): string | null => {
  if (!decision) return null;
  return decision
    .replace("Approved for pilot", "Approved")
    .replace("Approved with restrictions", "Approved w/ limits")
    .replace("Human review required", "Human review")
    .replace("Hold pending remediation", "On hold")
    .replace("Not approved", "Not approved");
};

/** One headline per stage. All-null until an initiative is framed. */
export function selectStageHeadlines(s: ProgramState): StageHeadline[] {
  const hasLive = !!s.initiative?.name;
  if (!hasLive) {
    return (["frame", "data", "build", "deploy", "govern", "realize", "operate"] as StageKey[]).map((key) => ({ key, value: null, detail: null }));
  }

  const sc = s.initiative.scores;
  const overall = sc ? Math.round(sc.value * 0.4 + sc.feasibility * 0.3 + sc.dataReadiness * 0.3) : null;

  const handoff = s.data?.handoff ?? buildDataReadinessHandoff(s);
  const contract = s.rag?.contract ?? buildBuildOutputContract(s);
  const rr = computeReleaseReadiness(s);
  const decision = s.governance?.decision ?? deriveGovernanceDecision(s);

  const blocked = handoff.blockedSources?.length ?? 0;
  const gates = contract.failedGates?.length ?? 0;
  const roi = s.outcomes?.roi;
  const payback = s.outcomes?.paybackMonths;

  const opsSeries = deriveOpsSeries(s);
  const opsSignals = detectSignals(opsSeries, s.initiative?.meta?.governanceTier);
  const opsVaR = valueAtRisk(s, opsSeries);

  return [
    { key: "frame", value: overall !== null ? `${overall}` : "✓", detail: s.initiative.name },
    { key: "data", value: `${handoff.dataReadinessScore}`, detail: blocked ? `${blocked} blocked source(s)` : "readiness /100" },
    { key: "build", value: contract.qualityScore !== undefined ? `${contract.qualityScore}` : null, detail: gates ? `${gates} gate(s) failing` : "quality /100" },
    { key: "deploy", value: `${rr.score}`, detail: rr.recommendation },
    { key: "govern", value: short(decision.decision), detail: decision.score !== undefined ? `score ${decision.score}/100` : null },
    {
      key: "realize",
      value: roi !== undefined ? `${roi}%` : null,
      detail: roi !== undefined
        ? (payback !== undefined && Number.isFinite(payback) ? `payback ${Math.round(payback)}mo` : "risk-adjusted ROI")
        : "visit Realize to compute ROI",
    },
    {
      key: "operate",
      value: `${opsSignals.length}`,
      detail: opsSignals.length
        ? `${opsSignals.length} signal(s) · $${Math.round(opsVaR.valueAtRiskUsd / 1000)}k/yr at risk`
        : "systems steady",
    },
  ];
}

export interface ReleaseBlocker { text: string; source: StageKey }

/** "What is blocking release?" — the ranked union of failing evidence across
 * stages: Data exclusions, Build gate failures, Operate readiness blockers, and
 * Critical/High governance findings. Deduped, most actionable first. */
export function selectReleaseBlockers(s: ProgramState): ReleaseBlocker[] {
  if (!s.initiative?.name) return [];
  const out: ReleaseBlocker[] = [];

  (s.rag?.contract?.failedGates ?? []).forEach((g) => out.push({ text: `Build gate failing: ${g}`, source: "build" }));
  computeReleaseReadiness(s).blockers.forEach((b) => out.push({ text: b, source: "deploy" }));
  deriveOpenFindings(s)
    .filter((f) => f.severity === "Critical" || f.severity === "High")
    .forEach((f) => out.push({ text: f.finding, source: f.dueStage === "Data" ? "data" : f.dueStage === "Operate" ? "deploy" : "build" }));
  (s.governance?.decision?.releaseBlockers ?? []).forEach((b) => out.push({ text: b, source: "govern" }));

  const seen = new Set<string>();
  return out.filter((b) => {
    const k = b.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 8);
}
