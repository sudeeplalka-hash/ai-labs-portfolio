// Phase B, cross-stage read-only selectors. Pure functions over ProgramState
// that derive the program's headline numbers and release blockers on the fly
// (from the same deterministic engines the stages use), so the rail and the
// contract loop never depend on which pages have been visited.

import type { ProgramState, StageKey } from "./types";
import { resolveDataHandoff, resolveBuildContract, deriveGovernanceDecision, deriveOpenFindings } from "./contracts";
import { computeReleaseReadiness } from "./operate";
import { deriveOpsSeries, detectSignals, valueAtRisk } from "./operate-day2";

export interface StageHeadline {
  key: StageKey;
  /** Short display value for the rail chip (e.g. "74", "Approved w/ conditions"). */
  value: string | null;
  /** Unit suffix rendered after the value (R2.3): "/100", " signals". Includes
   * its own leading separator so the chip can concatenate directly. */
  unit?: string | null;
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

  // hasLive is true here, so the resolvers always return an artifact; both are
  // the SAME resolution release readiness uses (R1.1, one truth per fact).
  const handoff = resolveDataHandoff(s)!;
  const contract = resolveBuildContract(s)!;
  const rr = computeReleaseReadiness(s);
  const decision = s.governance?.decision ?? deriveGovernanceDecision(s);

  const blocked = handoff.blockedSources?.length ?? 0;
  const gates = contract.failedGates?.length ?? 0;
  const roi = s.outcomes?.roi;
  const payback = s.outcomes?.paybackMonths;

  const opsSeries = deriveOpsSeries(s);
  const opsSignals = detectSignals(opsSeries, s.initiative?.meta?.governanceTier);
  const opsVaR = valueAtRisk(s, opsSeries);

  // R2.3: every chip carries its unit, and every tooltip names the metric, so
  // "75 · 74 · 91 · 69 · Approved · 180% · 4" reads as scored facts, not codes.
  return [
    { key: "frame", value: overall !== null ? `${overall}` : "✓", unit: overall !== null ? "/100" : null,
      detail: s.initiative.name ? `${s.initiative.name} · opportunity score ${overall ?? "N/A"}/100` : null },
    { key: "data", value: `${handoff.dataReadinessScore}`, unit: "/100",
      detail: `Data readiness ${handoff.dataReadinessScore}/100${blocked ? ` · ${blocked} blocked source(s)` : ""}` },
    { key: "build", value: contract.qualityScore !== undefined ? `${contract.qualityScore}` : null, unit: contract.qualityScore !== undefined ? "/100" : null,
      detail: gates ? `Build quality ${contract.qualityScore}/100 · ${gates} gate(s) failing` : `Build quality ${contract.qualityScore}/100` },
    { key: "deploy", value: `${rr.score}`, unit: "/100", detail: `Release readiness ${rr.score}/100 · ${rr.recommendation}` },
    { key: "govern", value: short(decision.decision), unit: null,
      detail: decision.score !== undefined ? `Governance score ${decision.score}/100` : null },
    {
      key: "realize",
      value: roi !== undefined ? `${roi}%` : null,
      unit: null,
      detail: roi !== undefined
        ? `Risk adjusted ROI ${roi}%${payback !== undefined && Number.isFinite(payback) ? ` · payback ${Math.round(payback)}mo` : ""}`
        : "visit Realize to compute ROI",
    },
    {
      key: "operate",
      value: `${opsSignals.length}`,
      unit: opsSignals.length === 1 ? " signal" : " signals",
      detail: opsSignals.length
        ? `${opsSignals.length} open signal(s) · $${Math.round(opsVaR.valueAtRiskUsd / 1000)}k/yr at risk`
        : "Open signals: 0 · systems steady",
    },
  ];
}

export interface ReleaseBlocker { text: string; source: StageKey }

/** "What is blocking release?", the ranked union of failing evidence across
 * stages: Data exclusions, Build gate failures, Operate readiness blockers, and
 * Critical/High governance findings. Deduped, most actionable first. */
export function selectReleaseBlockers(s: ProgramState): ReleaseBlocker[] {
  if (!s.initiative?.name) return [];
  const out: ReleaseBlocker[] = [];

  (resolveBuildContract(s)?.failedGates ?? []).forEach((g) => out.push({ text: `Build gate failing: ${g}`, source: "build" }));
  // R1.3: readiness blockers carry the stage that owns the fix (a data gap
  // routes to Data, an eval gap to Build), no more "fix in Deploy" for all.
  computeReleaseReadiness(s).blockerItems.forEach((b) => out.push({ text: b.text, source: b.stage }));
  deriveOpenFindings(s)
    .filter((f) => f.severity === "Critical" || f.severity === "High")
    .forEach((f) => out.push({
      text: f.finding,
      source: f.dueStage === "Data" ? "data" : f.dueStage === "Operate" ? "deploy" : f.dueStage === "Govern" ? "govern" : "build",
    }));
  (s.governance?.decision?.releaseBlockers ?? []).forEach((b) => out.push({ text: b, source: "govern" }));

  const seen = new Set<string>();
  return out.filter((b) => {
    const k = b.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 8);
}
