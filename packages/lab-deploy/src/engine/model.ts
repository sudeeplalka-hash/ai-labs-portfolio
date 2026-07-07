// ============================================================================
// Deploy / Operations, pure deterministic model. Same inputs → same outputs.
// Reads the threaded ProgramState (Frame + Build/Data/Govern slices if present),
// degrades gracefully to Frame + sensible defaults when a slice is missing.
// ============================================================================
import type { ProgramState } from "@labs/program-core";
import type {
  Baseline, DeployLevers, ModelTier, OpsResult, Zone,
  EnvelopeCell, DriftPoint, IncidentType, IncidentRun, IncidentTick, DeployVerdict,
} from "./types";

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

// --- per-job operational character ---
// capacity = sustainable queries/sec for the *as-deployed* footprint (a fixed pilot
// replica, no autoscaling), small on purpose so scaling into production stresses it.
const JOB_PROFILE: Record<string, { cost: number; latency: number; capacity: number }> = {
  Answer: { cost: 0.012, latency: 650, capacity: 6 },
  Summarize: { cost: 0.018, latency: 900, capacity: 4 },
  Extract: { cost: 0.02, latency: 850, capacity: 3.5 },
  Classify: { cost: 0.01, latency: 500, capacity: 7 },
  Decide: { cost: 0.035, latency: 1400, capacity: 1.5 },
  Monitor: { cost: 0.016, latency: 700, capacity: 4.5 },
  Generate: { cost: 0.03, latency: 1600, capacity: 1.8 },
  Orchestrate: { cost: 0.05, latency: 2200, capacity: 1 },
};
const USER_VOLUME: Record<string, number> = {
  Customers: 40000, Employees: 12000, "Frontline staff": 18000,
  Partners: 8000, Analysts: 4000, Developers: 5000, Executives: 1500,
};
const APPETITE_SLO: Record<string, number> = { Conservative: 0.999, Balanced: 0.995, Aggressive: 0.99 };
const APPETITE_TIER: Record<string, string> = { Conservative: "Low", Balanced: "Medium", Aggressive: "High" };

function parseDollar(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/\$?\s*([0-9]+(?:\.[0-9]+)?)/);
  return m ? Number(m[1]) : null;
}

export function deriveBaseline(state: ProgramState): Baseline {
  const i = state.initiative;
  const job = i.params?.job && JOB_PROFILE[i.params.job] ? i.params.job : "Answer";
  const jp = JOB_PROFILE[job];
  const dataReadiness = i.scores?.dataReadiness ?? 55;

  const baseHalluc =
    typeof state.rag?.hallucination === "number"
      ? clamp(state.rag.hallucination / 100, 0.02, 0.4)
      : clamp(0.32 - (dataReadiness / 100) * 0.28, 0.04, 0.32);
  // A stronger engine (Build · Model Fit) hallucinates less, cutting the dominant
  // escalation cost, so a pricier-but-smarter model can be cheaper overall.
  const capMult = typeof state.rag?.modelCapability === "number"
    ? clamp(1.3 - (state.rag.modelCapability / 100) * 0.6, 0.7, 1.3)
    : 1;
  const hallucination = clamp(baseHalluc * capMult, 0.02, 0.5);

  const appetite = i.params?.risk ?? "Balanced";
  const suggested = (USER_VOLUME[i.params?.user ?? "Customers"] ?? 20000) * (0.5 + (i.scope ?? 0.5));
  const targetCost = parseDollar(i.successMetric?.shape === "Cut cost" ? i.successMetric?.target : undefined);

  // Chosen engine (Build · Model Fit) scales the per-query compute cost and base
  // latency, so a pricier/slower engine visibly moves the envelope. The cost
  // target stays on the unscaled job cost, so the budget bar holds steady.
  const engineCost = typeof state.rag?.modelCostFactor === "number" ? state.rag.modelCostFactor : 1;
  const engineLatency = typeof state.rag?.modelLatencyFactor === "number" ? state.rag.modelLatencyFactor : 1;

  return {
    baseCostPerQuery: jp.cost * engineCost,
    baseLatencyMs: Math.round(jp.latency * engineLatency),
    capacityQps: jp.capacity,
    hallucination,
    escalationUnitCost: 2.5,
    suggestedVolume: Math.round(suggested),
    sloReliability: APPETITE_SLO[appetite] ?? 0.995,
    sloLatencyMs: 2000,
    // Budget must account for human-escalation cost (the dominant term); beatable
    // by improving the engine (larger tier / reranker cut escalation).
    targetCostPerQuery: targetCost ?? jp.cost * 1.5 + 2.5 * hallucination * 0.7,
    riskTier: state.governance?.riskTier ?? APPETITE_TIER[appetite] ?? "Medium",
  };
}

function tierMults(tier: ModelTier) {
  return tier === "large"
    ? { cost: 2.6, latency: 1.8, capacity: 0.55, halluc: 0.6 }
    : { cost: 1, latency: 1, capacity: 1, halluc: 1 };
}

export function computeOps(b: Baseline, levers: DeployLevers): OpsResult {
  const t = tierMults(levers.tier);
  const cacheCost = 1 - (levers.cachePct / 100) * 0.85;
  const cacheLat = 1 - (levers.cachePct / 100) * 0.5;
  const rerankCost = levers.reranker ? 0.004 : 0;
  const rerankLat = levers.reranker ? 180 : 0;

  const computeCost = b.baseCostPerQuery * t.cost * cacheCost + rerankCost;
  const hallucEff = b.hallucination * t.halluc * (levers.reranker ? 0.8 : 1);
  const escalationRate = clamp(hallucEff, 0, 1);
  const escalationCost = escalationRate * b.escalationUnitCost;
  const costPerQuery = computeCost + escalationCost;
  const monthlyCost = costPerQuery * levers.volumePerDay * 30;

  const capacity = b.capacityQps * t.capacity;
  const peakQps = (levers.volumePerDay / 86400) * 3; // peak ≈ 3× average
  const utilization = clamp(peakQps / capacity, 0, 2.5);

  const p50 = b.baseLatencyMs * t.latency * cacheLat + rerankLat;
  const qf = utilization < 1 ? 1 / (1 - utilization * 0.9) : 8 + (utilization - 1) * 6;
  const p95 = Math.round(p50 * (1 + 0.5 * utilization * utilization) * clamp(qf, 1, 12));
  const p99 = Math.round(p50 * (1 + 1.1 * utilization * utilization * utilization) * clamp(qf, 1, 16));

  const errorRatePct = utilization <= 1 ? 0.1 + utilization * 0.6 : 0.7 + (utilization - 1) * 14;
  const reliability = clamp(1 - errorRatePct / 100, 0, 1);
  const errorBudgetPct = clamp((1 - (1 - reliability) / Math.max(1e-6, 1 - b.sloReliability)) * 100, -200, 100);

  // Envelope zone is about LOAD (reliability + latency). Cost is a separate lever,
  // surfaced in the KPIs and verdict, not folded into the load envelope.
  let zone: Zone = "amber";
  const meetsRel = reliability >= b.sloReliability;
  const meetsLat = p95 <= b.sloLatencyMs;
  if (meetsRel && meetsLat) zone = "green";
  else if (reliability < b.sloReliability * 0.985 || p95 > b.sloLatencyMs * 1.5 || utilization > 1) zone = "red";

  return {
    costPerQuery: Math.round(costPerQuery * 1000) / 1000,
    monthlyCost: Math.round(monthlyCost),
    computeCost: Math.round(computeCost * 1000) / 1000,
    escalationCost: Math.round(escalationCost * 1000) / 1000,
    escalationRate: Math.round(escalationRate * 1000) / 10, // %
    p50: Math.round(p50), p95, p99,
    utilization: Math.round(utilization * 100) / 100,
    errorRatePct: Math.round(errorRatePct * 100) / 100,
    reliability,
    errorBudgetPct: Math.round(errorBudgetPct),
    zone,
  };
}

const VOLUME_STEPS = [100, 500, 2000, 8000, 25000, 60000, 120000, 200000];
const CACHE_STEPS = [0, 15, 30, 45, 60];

// The Operating Envelope: load (x) × cache% (y) → zone. Tier + reranker fixed to
// the current levers so the user sees how caching/scale shift the safe region.
export function envelopeGrid(b: Baseline, levers: DeployLevers): EnvelopeCell[] {
  const cells: EnvelopeCell[] = [];
  for (const cachePct of CACHE_STEPS) {
    for (const volume of VOLUME_STEPS) {
      const { zone } = computeOps(b, { ...levers, volumePerDay: volume, cachePct });
      cells.push({ volume, cachePct, zone });
    }
  }
  return cells;
}
export const ENVELOPE_VOLUMES = VOLUME_STEPS;
export const ENVELOPE_CACHE = CACHE_STEPS;

// Production drift: quality decays week over week until a refresh threshold fires.
export function driftSeries(b: Baseline, weeks = 16): { points: DriftPoint[]; driftRisk: number } {
  const start = Math.round((1 - b.hallucination) * 100);
  const decayPerWeek = 1 + b.hallucination * 4; // weaker data → faster drift
  const threshold = 80;
  const points: DriftPoint[] = [];
  let q = start;
  for (let w = 0; w <= weeks; w++) {
    let refreshed = false;
    if (q < threshold) { q = start; refreshed = true; }
    points.push({ week: w, quality: Math.round(q), refreshed });
    q -= decayPerWeek;
  }
  const weeksToThreshold = Math.max(1, (start - threshold) / decayPerWeek);
  const driftRisk = clamp(Math.round(100 - weeksToThreshold * 8), 0, 100);
  return { points, driftRisk };
}

export function runIncident(b: Baseline, levers: DeployLevers, type: IncidentType): IncidentRun {
  const base = computeOps(b, levers);
  const ticks: IncidentTick[] = [];
  const detect = 3, mitigate = 8, recover = 15, total = 22;
  const peakLat = type === "outage" ? base.p95 * 6 : type === "spike" ? base.p95 * 3.5 : base.p95 * 2;
  const peakErr = type === "outage" ? 45 : type === "spike" ? 18 : 9;
  for (let t = 0; t <= total; t++) {
    let p95 = base.p95, err = base.errorRatePct, phase: IncidentTick["phase"] = "normal";
    if (t >= detect && t < mitigate) { const r = (t - detect) / (mitigate - detect); p95 = base.p95 + (peakLat - base.p95) * r; err = base.errorRatePct + (peakErr - base.errorRatePct) * r; phase = "incident"; }
    else if (t >= mitigate && t < recover) { const r = (t - mitigate) / (recover - mitigate); p95 = peakLat - (peakLat - base.p95) * r; err = peakErr - (peakErr - base.errorRatePct) * r; phase = "mitigating"; }
    else if (t >= recover) { phase = "recovered"; }
    ticks.push({ t, p95: Math.round(p95), errorRatePct: Math.round(err * 10) / 10, phase });
  }
  const mttrMin = recover - detect;
  const budgetBurnPct = clamp(Math.round((peakErr / 100) * mttrMin * 4), 0, 100);
  const label = type === "outage" ? "Retrieval outage" : type === "spike" ? "Traffic spike (10×)" : "Model regression";
  return { ticks, mttrMin, budgetBurnPct, label };
}

export function deployVerdict(b: Baseline, ops: OpsResult): DeployVerdict {
  if (ops.zone === "red" && ops.utilization > 1)
    return { tone: "risk", headline: "Won't hold at this scale", detail: `Peak load exceeds capacity (${ops.utilization}× ), p99 ${ops.p99}ms, errors ${ops.errorRatePct}%. Add capacity, cache, or shed load.` };
  if (ops.costPerQuery > b.targetCostPerQuery)
    return { tone: "watch", headline: "Over budget at scale", detail: `$${ops.costPerQuery}/query vs target $${b.targetCostPerQuery.toFixed(3)}, escalation from quality is ${ops.escalationRate}% of cost. Improve the engine or raise caching.` };
  if (ops.reliability < b.sloReliability)
    return { tone: "watch", headline: "Below the reliability SLO", detail: `${(ops.reliability * 100).toFixed(2)}% vs ${(b.sloReliability * 100).toFixed(1)}% target, error budget ${ops.errorBudgetPct}%.` };
  return { tone: "healthy", headline: "Production ready at this load", detail: `Within SLO, latency, and budget. Error budget ${ops.errorBudgetPct}% intact.` };
}

// Cheapest-safe operating point, search the controllable levers (tier × cache × reranker)
// at the current volume and return the lowest-monthly-cost configuration that still lands in
// the green zone (meets the reliability + latency SLOs). If nothing is green at this load,
// fall back to the cheapest non-red config and flag found=false. Uses the same computeOps
// the envelope and KPIs show, so the recommendation can't disagree with the chart. Pure.
export interface OperatingPoint {
  levers: DeployLevers;
  ops: OpsResult;
  found: boolean;         // was a green (SLO-meeting) config available at this volume?
  monthlySavings: number; // vs the current levers, never negative
}
export function recommendOperatingPoint(b: Baseline, current: DeployLevers): OperatingPoint {
  const tiers: ModelTier[] = ["small", "large"];
  const rerankers = [false, true];
  const candidates: { levers: DeployLevers; ops: OpsResult }[] = [];
  for (const tier of tiers) {
    for (const cachePct of CACHE_STEPS) {
      for (const reranker of rerankers) {
        const levers: DeployLevers = { ...current, tier, cachePct, reranker };
        const ops = computeOps(b, levers);
        if (ops.zone !== "red") candidates.push({ levers, ops });
      }
    }
  }
  const curOps = computeOps(b, current);
  const greens = candidates.filter((c) => c.ops.zone === "green");
  const pool = greens.length ? greens : candidates;
  if (pool.length === 0) return { levers: current, ops: curOps, found: false, monthlySavings: 0 };
  const best = pool.reduce((a, c) => (c.ops.monthlyCost < a.ops.monthlyCost ? c : a));
  return { levers: best.levers, ops: best.ops, found: greens.length > 0, monthlySavings: Math.max(0, curOps.monthlyCost - best.ops.monthlyCost) };
}
