// ============================================================================
// Realize — pure deterministic ROI model. Inputs are DERIVED from the threaded
// ProgramState (Frame + the data/rag/deploy/governance slices) and tagged with
// their source stage. Degrades gracefully to Frame + defaults when a slice is
// missing, so the chain strengthens as upstream labs are completed.
// ============================================================================
import type { ProgramState } from "@labs/program-core";
import { deriveGovernanceDecision } from "@labs/program-core";
import type {
  RealizeInputs, RoiResult, RiverFlow, SensitivityBar, DossierRow, OverrideKey,
} from "./types";

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
// annual addressable tasks by audience (believable enterprise scale)
const USER_VOLUME: Record<string, number> = {
  Customers: 600000, Employees: 220000, "Frontline staff": 380000,
  Partners: 110000, Analysts: 70000, Developers: 90000, Executives: 18000,
};
const RISK_DISCOUNT: Record<string, number> = { Critical: 0.4, High: 0.3, Medium: 0.2, Low: 0.1 };
const APPETITE_TIER: Record<string, string> = { Conservative: "Low", Balanced: "Medium", Aggressive: "High" };

export function deriveInputs(state: ProgramState): RealizeInputs {
  const i = state.initiative;
  const scores = i.scores ?? { value: 60, feasibility: 60, dataReadiness: 60 };
  const annualTasks = Math.round((USER_VOLUME[i.params?.user ?? "Customers"] ?? 250000) * (0.5 + (i.scope ?? 0.5)));
  // minutes of labor saved per task — a tunable estimate (success-metric units vary,
  // so we default and let the practitioner override in the assumptions panel)
  const minutesSaved = 10;

  // adoption — feasibility + data readiness drive how widely it gets used
  // prefer the Data lab's real readiness when it has run; else Frame's guess
  const dataReadiness = state.data?.readinessScore ?? scores.dataReadiness;
  const adoption = clamp(0.25 + scores.feasibility / 250 + dataReadiness / 400, 0.2, 0.92);

  // quality — Build faithfulness if present, else derived from feasibility/readiness
  const quality = typeof state.rag?.faithfulness === "number"
    ? clamp(state.rag.faithfulness / 100, 0.3, 0.99)
    : clamp((scores.feasibility + scores.dataReadiness) / 200, 0.35, 0.95);

  // run cost — from Deploy if present (already engine-scaled there), else a rough
  // estimate scaled by the chosen engine's relative cost so the ROI still moves.
  const engineCost = typeof state.rag?.modelCostFactor === "number" ? state.rag.modelCostFactor : 1;
  const annualRunCost = typeof state.deploy?.monthlyCostAtTarget === "number"
    ? state.deploy.monthlyCostAtTarget * 12
    : Math.round(annualTasks * 0.04 * engineCost);

  // risk discount — governance tier (Strategy-emitted meta, or a govern-slice
  // override) if present, else from risk appetite; then folded with live ops +
  // build + open-governance-finding risk so Govern and Operate actually move ROI.
  const tier = state.governance?.riskTier ?? i.meta?.governanceTier ?? APPETITE_TIER[i.params?.risk ?? "Balanced"] ?? "Medium";
  const dataPenalty = dataReadiness < 50 ? 0.08 : 0;
  // Ops + build + governance-findings nudge (tier already counted above).
  let extra = 0;
  const drift = state.deploy?.evidence?.driftRisk ?? state.deploy?.driftRisk;
  if ((drift ?? 0) >= 60) extra += 0.05;
  if (typeof state.deploy?.reliability === "number" && state.deploy.reliability < 0.99) extra += 0.04;
  const buildQ = state.rag?.contract?.qualityScore ?? state.rag?.faithfulness;
  if (typeof buildQ === "number" && buildQ < 75) extra += 0.04;
  const govDecision = state.governance?.decision ?? deriveGovernanceDecision(state);
  const openFindings = govDecision.openFindings?.length ?? 0;
  if (openFindings) extra += Math.min(0.08, openFindings * 0.03);
  // Phase 6 — training / generalization risk nudge for trained/fine-tuned models.
  const tc = state.rag?.trainingContract;
  if (tc?.enabled) {
    const ovf = tc.generalizationAssessment.overfittingRisk;
    if (ovf === "critical") extra += 0.08; else if (ovf === "high") extra += 0.05;
    if ((tc.generalizationAssessment.generalizationScore ?? 100) < 70) extra += 0.03;
    if (!tc.datasetReadiness.holdoutSetAvailable) extra += 0.02;
  }
  const riskDiscount = clamp((RISK_DISCOUNT[tier] ?? 0.2) + dataPenalty + extra, 0.05, 0.7);

  const investment = Math.round(120000 + (i.scope ?? 0.5) * 260000 + (i.selectedUseCase?.effort ?? 50) * 1500);

  return {
    annualTasks: { value: annualTasks, source: "frame", basis: `${i.params?.user ?? "users"} · annual addressable tasks` },
    minutesSavedPerTask: { value: minutesSaved, source: "frame", basis: "estimate · tune in assumptions" },
    laborRatePerHour: 60,
    adoption: { value: Math.round(adoption * 100) / 100, source: "data", basis: state.data ? "Data lab readiness + feasibility" : "feasibility + data readiness (derived)" },
    quality: { value: Math.round(quality * 100) / 100, source: "build", basis: state.rag ? "RAG faithfulness" : "derived from feasibility/readiness" },
    annualRunCost: { value: annualRunCost, source: "deploy", basis: state.deploy ? "Deploy monthly cost × 12" : "estimate" },
    riskDiscount: { value: Math.round(riskDiscount * 100) / 100, source: "govern", basis: `risk tier ${tier}${extra > 0 ? " + live ops/govern risk" : ""}` },
    investment,
  };
}

export type Overrides = Partial<Record<OverrideKey, number>>;

export function applyOverrides(inp: RealizeInputs, ov: Overrides): RealizeInputs {
  return {
    ...inp,
    minutesSavedPerTask: ov.minutesSavedPerTask != null ? { ...inp.minutesSavedPerTask, value: ov.minutesSavedPerTask, basis: "manual override" } : inp.minutesSavedPerTask,
    adoption: ov.adoption != null ? { ...inp.adoption, value: ov.adoption, basis: "manual override" } : inp.adoption,
    quality: ov.quality != null ? { ...inp.quality, value: ov.quality, basis: "manual override" } : inp.quality,
    laborRatePerHour: ov.laborRatePerHour ?? inp.laborRatePerHour,
    investment: ov.investment ?? inp.investment,
  };
}

export function computeRoi(inp: RealizeInputs): RoiResult {
  const addressable = inp.annualTasks.value * (inp.minutesSavedPerTask.value / 60) * inp.laborRatePerHour;
  const adoptionLoss = addressable * (1 - inp.adoption.value);
  const afterAdoption = addressable * inp.adoption.value;
  const qualityLoss = afterAdoption * (1 - inp.quality.value);
  const realized = afterAdoption * inp.quality.value;
  const runCost = inp.annualRunCost.value;
  const grossValue = realized - runCost;
  const riskDiscountAmt = Math.max(0, grossValue) * inp.riskDiscount.value;
  const riskAdjustedValue = grossValue - riskDiscountAmt;
  const roiPct = (riskAdjustedValue / Math.max(1, inp.investment + runCost)) * 100;
  const paybackMonths = riskAdjustedValue > 0 ? clamp(inp.investment / (riskAdjustedValue / 12), 0, 120) : Infinity;
  const npv3yr = [1, 2, 3].reduce((s, y) => s + riskAdjustedValue / Math.pow(1.1, y), 0) - inp.investment;
  return {
    addressable, adoptionLoss, qualityLoss, realized, runCost, riskDiscountAmt, grossValue,
    riskAdjustedValue, roiPct: Math.round(roiPct), paybackMonths: Math.round(paybackMonths * 10) / 10,
    npv3yr: Math.round(npv3yr),
  };
}

export function valueRiver(inp: RealizeInputs, r: RoiResult): RiverFlow[] {
  return [
    { key: "addressable", label: "Addressable value", amount: Math.round(r.addressable), kind: "in", source: "frame" },
    { key: "adoption", label: "Adoption gap", amount: Math.round(r.adoptionLoss), kind: "leak", source: "data" },
    { key: "quality", label: "Quality gap", amount: Math.round(r.qualityLoss), kind: "leak", source: "build" },
    { key: "runcost", label: "Run cost", amount: Math.round(r.runCost), kind: "leak", source: "deploy" },
    { key: "risk", label: "Risk discount", amount: Math.round(r.riskDiscountAmt), kind: "leak", source: "govern" },
    { key: "realized", label: "Risk-adjusted value", amount: Math.round(r.riskAdjustedValue), kind: "out", source: "govern" },
  ];
}

const SENS: { key: OverrideKey; label: string }[] = [
  { key: "adoption", label: "Adoption" },
  { key: "quality", label: "Answer quality" },
  { key: "minutesSavedPerTask", label: "Time saved / task" },
  { key: "laborRatePerHour", label: "Labor rate" },
  { key: "investment", label: "Build investment" },
];

export function sensitivity(inp: RealizeInputs): SensitivityBar[] {
  const base = computeRoi(inp).riskAdjustedValue;
  const cur: Record<OverrideKey, number> = {
    adoption: inp.adoption.value, quality: inp.quality.value,
    minutesSavedPerTask: inp.minutesSavedPerTask.value, laborRatePerHour: inp.laborRatePerHour, investment: inp.investment,
  };
  return SENS.map(({ key, label }) => {
    const low = computeRoi(applyOverrides(inp, { [key]: cur[key] * 0.85 })).riskAdjustedValue;
    const high = computeRoi(applyOverrides(inp, { [key]: cur[key] * 1.15 })).riskAdjustedValue;
    return { key, label, low: Math.round(low), high: Math.round(high), swing: Math.round(Math.abs(high - low)) };
  }).sort((a, b) => b.swing - a.swing);
}

export function dossier(state: ProgramState, inp: RealizeInputs, r: RoiResult): DossierRow[] {
  const i = state.initiative;
  const s = i.scores ?? { value: 0, feasibility: 0, dataReadiness: 0 };
  const usd = (n: number) => "$" + Math.round(n).toLocaleString();
  return [
    { stage: "frame", label: "The bet", metric: i.name ?? "Initiative", value: `V ${s.value} · F ${s.feasibility} · D ${s.dataReadiness}`, basis: i.sharpenedProblem ?? "" },
    { stage: "data", label: "Data readiness", metric: "Fuel", value: `${state.data?.readinessScore ?? s.dataReadiness}/100`, basis: "is the data good enough?" },
    { stage: "build", label: "Answer quality", metric: "Engine", value: `${Math.round(inp.quality.value * 100)}% faithful`, basis: inp.quality.basis },
    { stage: "deploy", label: "Reliability & run cost", metric: "Ops", value: `${state.deploy?.reliability ? (state.deploy.reliability * 100).toFixed(1) + "%" : "—"} · ${usd(inp.annualRunCost.value)}/yr`, basis: inp.annualRunCost.basis },
    { stage: "govern", label: "Risk tier", metric: "Guardrails", value: `${state.governance?.riskTier ?? "Medium"} · −${Math.round(inp.riskDiscount.value * 100)}%`, basis: inp.riskDiscount.basis },
    { stage: "govern", label: "Risk-adjusted value", metric: "Outcome", value: `${usd(r.riskAdjustedValue)}/yr · ${r.roiPct}% ROI · ${Number.isFinite(r.paybackMonths) ? r.paybackMonths + "mo" : "no"} payback`, basis: "every number traces above" },
  ];
}
