// ============================================================================
// Operate (stage 07) — day-2 continuous operations engine.
// Deterministic, seeded, client-side. Boundary (SPEC-OPERATE-STAGE-V2 §2):
// Deploy owns day-0/1 (release readiness — see operate.ts); THIS module owns
// day-2 forever: drift over time, canary decay, staleness, agent behavior,
// cost creep, the incident lifecycle, and the loop-back decision.
// Every series is authored math, labeled SIMULATED in the UI — never telemetry.
// ============================================================================
import type { ProgramState } from "./types";

// ---- Seeded PRNG (mulberry32) — same initiative ⇒ same operations history ----
function seedFrom(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n: number) => Math.round(n * 100) / 100;

export const OPS_WEEKS = 12;
/** The authored incident lands here — week 7. */
export const INCIDENT_WEEK = 7;

export interface OpsWeek {
  week: number;
  // Layer 1 · system SLOs (deliberately healthy throughout — the trap)
  availabilityPct: number;
  p95Ms: number;
  errorRatePct: number;
  // Layer 2 · model quality
  canaryPassPct: number;   // scheduled evals vs the golden set inherited from Build
  groundingPct: number;
  schemaFailPct: number;
  // Layer 3 · RAG signals
  indexStaleDays: number;
  retrievalRecallPct: number;
  citationRatePct: number;
  // Layer 4 · agent & cost
  loopAnomalies: number;
  toolErrorRatePct: number;
  costPerTaskUsd: number;
  cacheHitPct: number;
}

export interface OpsSeries {
  weeks: OpsWeek[];
  canaryBaselinePct: number; // from Build's contract when present
  seedKey: string;
}

/** Deterministic 12-week operations history for the program that flowed down the spine. */
export function deriveOpsSeries(s: ProgramState): OpsSeries {
  const name = s.initiative?.name ?? s.initiative?.meta?.primaryAiPattern ?? "program";
  const seedKey = String(name);
  const rnd = mulberry32(seedFrom(seedKey));
  // Canary baseline traces to Build: faithfulness from the RAG contract when it exists.
  const canaryBaselinePct = Math.min(96, Math.max(80, s.rag?.contract?.faithfulness ?? 91));

  const weeks: OpsWeek[] = [];
  for (let w = 1; w <= OPS_WEEKS; w++) {
    const postOnset = Math.max(0, w - 4);            // decay begins week 5 — silently
    const incident = w >= INCIDENT_WEEK;             // schema change upstream at week 7
    weeks.push({
      week: w,
      // SLOs: green the whole time, small noise only. That is the point.
      availabilityPct: r2(99.9 - rnd() * 0.25),
      p95Ms: Math.round(420 + rnd() * 60 - 20),
      errorRatePct: r2(0.2 + rnd() * 0.25),
      // Model quality: baseline, then a quiet slide; the incident steepens it.
      canaryPassPct: r2(Math.max(58, canaryBaselinePct - postOnset * 1.2 - (incident ? (w - INCIDENT_WEEK + 1) * 2.4 : 0) - rnd())),
      groundingPct: r2(Math.max(60, 93 - postOnset * 0.8 - (incident ? (w - INCIDENT_WEEK + 1) * 1.6 : 0) - rnd())),
      schemaFailPct: r2(0.6 + postOnset * 0.15 + (incident ? 0.9 : 0) + rnd() * 0.2),
      // RAG: staleness accumulates; the week-7 source-schema change breaks refresh.
      indexStaleDays: Math.round(incident ? 14 + (w - INCIDENT_WEEK + 1) * 7 : Math.min(14, w * 1.6)),
      retrievalRecallPct: r2(Math.max(55, 91 - postOnset * 0.9 - (incident ? (w - INCIDENT_WEEK + 1) * 2.1 : 0))),
      citationRatePct: r2(Math.max(50, 94 - postOnset * 1.0 - (incident ? (w - INCIDENT_WEEK + 1) * 1.8 : 0))),
      // Agents & cost: fingerprints wobble at the incident; cost creeps regardless.
      loopAnomalies: incident ? 3 + Math.round(rnd() * 3) : Math.round(rnd() * 1.2),
      toolErrorRatePct: r2(0.8 + (incident ? 1.4 : 0) + rnd() * 0.3),
      costPerTaskUsd: r2(0.042 * Math.pow(1.02, w - 1) + (incident ? 0.006 : 0)), // 2%/wk prompt creep
      cacheHitPct: r2(Math.max(38, 72 - w * 1.1 - (incident ? 4 : 0))),
    });
  }
  return { weeks, canaryBaselinePct, seedKey };
}

// ---- Signal detection --------------------------------------------------------
export type OpsSignalKey = "silent-drift" | "staleness-breach" | "cost-creep" | "agent-anomaly";
export type OpsSeverity = "high" | "med" | "low";
export interface OpsSignal {
  key: OpsSignalKey;
  week: number;            // first week the detector fires
  severity: OpsSeverity;
  title: string;
  evidence: string;        // what the numbers show
  monitorHint: string;     // what a real monitor would key on
}

/** Threshold + trend detectors. High governance tiers tighten the staleness threshold. */
export function detectSignals(series: OpsSeries, governanceTier?: string): OpsSignal[] {
  const out: OpsSignal[] = [];
  const wk = series.weeks;
  const base = series.canaryBaselinePct;
  const staleLimit = /high|1/i.test(governanceTier ?? "") ? 14 : 21;

  // Silent drift: canary down ≥8pts from baseline while every SLO is still green.
  const drift = wk.find((w) => base - w.canaryPassPct >= 8 && w.availabilityPct >= 99.5 && w.errorRatePct < 1);
  if (drift) out.push({
    key: "silent-drift", week: drift.week, severity: "high",
    title: "Silent drift — SLOs green, answers degrading",
    evidence: `Canary pass ${drift.canaryPassPct}% vs baseline ${base}% (−${r2(base - drift.canaryPassPct)}pts) while availability ${drift.availabilityPct}% and error rate ${drift.errorRatePct}%.`,
    monitorHint: "Scheduled canary evals vs the Build golden set; alert on trend vs baseline, not absolute SLOs.",
  });

  const stale = wk.find((w) => w.indexStaleDays > staleLimit);
  if (stale) out.push({
    key: "staleness-breach", week: stale.week, severity: "high",
    title: `Index staleness breach (> ${staleLimit} days${staleLimit === 14 ? " · high-tier threshold" : ""})`,
    evidence: `Corpus ${stale.indexStaleDays} days behind the source of truth; retrieval recall ${stale.retrievalRecallPct}%.`,
    monitorHint: "Corpus age vs source-system watermark; refresh-job success rate.",
  });

  const first = wk[0].costPerTaskUsd;
  const creep = wk.find((w) => (w.costPerTaskUsd - first) / first > 0.15);
  if (creep) out.push({
    key: "cost-creep", week: creep.week, severity: "med",
    title: "Cost per task creeping (+15% vs week 1)",
    evidence: `$${creep.costPerTaskUsd.toFixed(3)}/task vs $${first.toFixed(3)} at week 1; cache hit ${creep.cacheHitPct}%.`,
    monitorHint: "Cost/task trend + cache-hit decay + prompt token count per release.",
  });

  const anomaly = wk.find((w) => w.loopAnomalies >= 3 || w.toolErrorRatePct > 1.8);
  if (anomaly) out.push({
    key: "agent-anomaly", week: anomaly.week, severity: "med",
    title: "Agent behavior anomaly",
    evidence: `${anomaly.loopAnomalies} loop anomalies and tool-error rate ${anomaly.toolErrorRatePct}% in week ${anomaly.week} — action fingerprints shifted.`,
    monitorHint: "Repeated-action fingerprints, tool-call error rate, iteration-count distribution.",
  });

  return out.sort((a, b) => a.week - b.week);
}

// ---- Value at risk (the money bridge to Realize) ------------------------------
export interface ValueAtRisk {
  annualValueUsd: number;
  adoptionPct: number;
  degradationPct: number;
  valueAtRiskUsd: number; // annualized $ exposed while the breach stays open
  basis: string;
}

export function valueAtRisk(s: ProgramState, series: OpsSeries): ValueAtRisk {
  // Defensive reads: Realize's model when present (riskAdjustedValue $/yr, adoption 0–1), honest defaults otherwise.
  const outcomes = s.outcomes as { riskAdjustedValue?: number; adoption?: number } | undefined;
  const annualValueUsd = outcomes?.riskAdjustedValue ?? 1_400_000;
  const adoptionPct = Math.round((outcomes?.adoption ?? 0.63) * 100);
  const last = series.weeks[series.weeks.length - 1];
  const degradationPct = Math.max(0, r2(((series.canaryBaselinePct - last.canaryPassPct) / series.canaryBaselinePct) * 100));
  const valueAtRiskUsd = Math.round(annualValueUsd * (adoptionPct / 100) * (degradationPct / 100));
  return {
    annualValueUsd, adoptionPct, degradationPct, valueAtRiskUsd,
    basis: `annual value $${(annualValueUsd / 1e6).toFixed(1)}M × adoption ${adoptionPct}% × quality degradation ${degradationPct}%`,
  };
}

// ---- The authored day-2 incident arc ------------------------------------------
export type LoopTarget = "frame" | "build" | "deploy";
export interface RemediationOption {
  key: "retrain" | "reindex" | "rollback" | "rescope";
  label: string;
  costUsd: number;
  timeWeeks: number;
  risk: OpsSeverity;
  loopTarget: LoopTarget;
  rationale: string;
  tradeoff: string;
}
export interface Day2Incident {
  id: string;
  title: string;
  week: number;
  timeline: { at: string; what: string }[];
  blastRadius: string;
  options: RemediationOption[];
}

export function deriveDay2Incident(s: ProgramState): Day2Incident {
  const name = s.initiative?.name ?? "the assistant";
  return {
    id: "INC-OP-007",
    title: "Upstream source schema change → stale index → silent answer decay",
    week: INCIDENT_WEEK,
    timeline: [
      { at: `Week ${INCIDENT_WEEK}, Mon`, what: "Source system ships a schema change; the nightly refresh job starts silently skipping two document types." },
      { at: `Week ${INCIDENT_WEEK}, Wed`, what: "Index staleness passes threshold; canary evals begin sliding — SLO dashboards remain fully green." },
      { at: `Week ${INCIDENT_WEEK + 1}, Mon`, what: `Staleness + silent-drift detectors fire together. ${name} is answering from an increasingly outdated corpus.` },
    ],
    blastRadius: "Answer quality on recent-document questions; citation accuracy; user trust (adoption follows quality with a lag).",
    options: [
      { key: "reindex", label: "Re-index", costUsd: 35_000, timeWeeks: 2, risk: "low", loopTarget: "build",
        rationale: "Fix the refresh pipeline against the new schema and rebuild the index. Directly addresses the root cause.",
        tradeoff: "Quality recovers only to the pre-incident trend — the slow pre-week-7 decay still needs a retrain later." },
      { key: "retrain", label: "Retrain / re-tune", costUsd: 120_000, timeWeeks: 6, risk: "med", loopTarget: "build",
        rationale: "Refresh the model against current data and re-baseline the golden set. Fixes decay and drift together.",
        tradeoff: "Six weeks and the eval harness must be re-validated; overkill if the index is the real problem." },
      { key: "rollback", label: "Rollback / restrict", costUsd: 10_000, timeWeeks: 1, risk: "low", loopTarget: "deploy",
        rationale: "Narrow the assistant to document types the index still covers; honest degraded mode.",
        tradeoff: "Value delivered shrinks immediately — buys time, fixes nothing." },
      { key: "rescope", label: "Re-scope", costUsd: 0, timeWeeks: 4, risk: "med", loopTarget: "frame",
        rationale: "The long tail of document types keeps breaking; re-frame the initiative around the top types that carry the value.",
        tradeoff: "Admits the original scope was wrong — the bravest and sometimes the right call." },
    ],
  };
}

// ---- The loop-back contract (what Operate writes) -----------------------------
export interface OperateFeedback {
  decision: RemediationOption;
  toFrame?: { title: string; rationale: string };
  toBuild?: { task: string; evidence: string };
  toDeploy?: { action: string };
  toRealize: { valueAtRiskUsd: number; note: string };
  toGovern: { evidenceNote: string };
  issuedAt: string;
}

export function buildOperateFeedback(s: ProgramState, option: RemediationOption, series: OpsSeries): OperateFeedback {
  const vaR = valueAtRisk(s, series);
  const last = series.weeks[series.weeks.length - 1];
  const evidence = `Canary ${last.canaryPassPct}% vs baseline ${series.canaryBaselinePct}%; index ${last.indexStaleDays} days stale.`;
  return {
    decision: option,
    toFrame: option.loopTarget === "frame"
      ? { title: `Re-scope: ${s.initiative?.name ?? "initiative"} — top document types only`, rationale: "Operate evidence: long-tail sources repeatedly break freshness; value concentrates in the head." }
      : undefined,
    toBuild: option.loopTarget === "build"
      ? { task: option.key === "reindex" ? "Fix refresh pipeline for new source schema; rebuild index; re-run canary set" : "Retrain against current corpus; re-baseline golden set", evidence }
      : undefined,
    toDeploy: option.loopTarget === "deploy" ? { action: "Restrict envelope to covered document types; publish degraded-mode notice" } : undefined,
    toRealize: { valueAtRiskUsd: vaR.valueAtRiskUsd, note: `Value at risk while open: $${Math.round(vaR.valueAtRiskUsd / 1000)}k/yr (${vaR.basis}).` },
    toGovern: { evidenceNote: `Day-2 incident INC-OP-007 · decision: ${option.label} · ${evidence}` },
    issuedAt: new Date().toISOString().slice(0, 10),
  };
}

// ---- Artifacts (markdown; provenance footer per the artifact doctrine) --------
const FOOTER = (s: ProgramState) =>
  `\n---\n*Generated ${new Date().toISOString().slice(0, 10)} · initiative: ${s.initiative?.name ?? "sample program"} · SIMULATED (seeded deterministic series — authored to teach the pattern, not telemetry).*\n`;

export function buildWeeklyOpsReview(s: ProgramState, series: OpsSeries, signals: OpsSignal[]): string {
  const last = series.weeks[series.weeks.length - 1];
  const vaR = valueAtRisk(s, series);
  const lines = [
    `# Weekly Ops Review — Week ${last.week}`,
    ``,
    `## Health by layer`,
    `| Layer | Signal | Value | Read |`,
    `|---|---|---|---|`,
    `| System | Availability / p95 / errors | ${last.availabilityPct}% · ${last.p95Ms}ms · ${last.errorRatePct}% | Green |`,
    `| Model | Canary pass vs baseline | ${last.canaryPassPct}% vs ${series.canaryBaselinePct}% | ${series.canaryBaselinePct - last.canaryPassPct >= 8 ? "**Degrading — silent drift**" : "Holding"} |`,
    `| RAG | Index staleness / recall | ${last.indexStaleDays}d · ${last.retrievalRecallPct}% | ${last.indexStaleDays > 21 ? "**Breach**" : "Watch"} |`,
    `| Agent/Cost | Anomalies / $/task / cache | ${last.loopAnomalies} · $${last.costPerTaskUsd.toFixed(3)} · ${last.cacheHitPct}% | ${last.loopAnomalies >= 3 ? "**Anomalous**" : "Watch"} |`,
    ``,
    `## Open signals`,
    ...(signals.length ? signals.map((sg) => `- **[${sg.severity}] ${sg.title}** (wk ${sg.week}) — ${sg.evidence}`) : ["- None."]),
    ``,
    `## Value at risk`,
    `$${Math.round(vaR.valueAtRiskUsd / 1000)}k/yr — ${vaR.basis}.`,
    ``,
    `## Decision pending`,
    signals.length ? `Remediation call required: retrain / re-index / rollback / re-scope (see incident INC-OP-007).` : `None this week.`,
    FOOTER(s),
  ];
  return lines.join("\n");
}

export function buildIncidentReport(s: ProgramState, incident: Day2Incident, feedback: OperateFeedback): string {
  const o = feedback.decision;
  return [
    `# Incident Report — ${incident.id}`,
    ``,
    `**Title:** ${incident.title}`,
    `**Window:** week ${incident.week} onward · **Blast radius:** ${incident.blastRadius}`,
    ``,
    `## Timeline`,
    ...incident.timeline.map((t) => `- **${t.at}** — ${t.what}`),
    ``,
    `## Options considered`,
    `| Option | Cost | Time | Risk | Loops back to |`,
    `|---|---|---|---|---|`,
    ...incident.options.map((op) => `| ${op.label}${op.key === o.key ? " ✅" : ""} | $${Math.round(op.costUsd / 1000)}k | ${op.timeWeeks}w | ${op.risk} | ${op.loopTarget} |`),
    ``,
    `## Decision & rationale`,
    `**${o.label}** — ${o.rationale}`,
    ``,
    `Tradeoff accepted: ${o.tradeoff}`,
    ``,
    `## Loop-back issued (${feedback.issuedAt})`,
    ...(feedback.toBuild ? [`- → **Build:** ${feedback.toBuild.task} _(evidence: ${feedback.toBuild.evidence})_`] : []),
    ...(feedback.toFrame ? [`- → **Frame:** ${feedback.toFrame.title} — ${feedback.toFrame.rationale}`] : []),
    ...(feedback.toDeploy ? [`- → **Deploy:** ${feedback.toDeploy.action}`] : []),
    `- → **Realize:** ${feedback.toRealize.note}`,
    `- → **Govern:** ${feedback.toGovern.evidenceNote}`,
    FOOTER(s),
  ].join("\n");
}
