// ============================================================================
// Deploy / Operations — domain types. The engine is pure + deterministic; it
// derives a baseline from the threaded ProgramState and projects it across
// load (the Scale Dial) and time (drift, incidents).
// ============================================================================

export type ModelTier = "small" | "large";

export interface DeployLevers {
  volumePerDay: number; // 100 .. 200_000
  tier: ModelTier;
  cachePct: number;     // 0 .. 60
  reranker: boolean;
}

export interface Baseline {
  baseCostPerQuery: number;   // $ compute, small tier, no cache, at p50
  baseLatencyMs: number;      // p50 at low load, small tier
  capacityQps: number;        // small-tier throughput ceiling (queries/sec)
  hallucination: number;      // 0..1, drives human escalation
  escalationUnitCost: number; // $ per escalated query (human review)
  suggestedVolume: number;    // production queries/day implied by Framing
  sloReliability: number;     // e.g. 0.995
  sloLatencyMs: number;       // p95 target
  targetCostPerQuery: number; // from the success metric, or a budget
  riskTier: string;           // display
}

export type Zone = "green" | "amber" | "red";

export interface OpsResult {
  costPerQuery: number;
  monthlyCost: number;
  computeCost: number;
  escalationCost: number;
  escalationRate: number;
  p50: number;
  p95: number;
  p99: number;
  utilization: number;
  errorRatePct: number;
  reliability: number;
  errorBudgetPct: number; // 100 = budget intact, <0 = blown
  zone: Zone;
}

export interface EnvelopeCell { volume: number; cachePct: number; zone: Zone }
export interface DriftPoint { week: number; quality: number; refreshed: boolean }
export type IncidentType = "spike" | "regression" | "outage";
export interface IncidentTick { t: number; p95: number; errorRatePct: number; phase: "normal" | "incident" | "mitigating" | "recovered" }
export interface IncidentRun { ticks: IncidentTick[]; mttrMin: number; budgetBurnPct: number; label: string }

export interface DeployVerdict {
  tone: "healthy" | "watch" | "risk" | "info";
  headline: string;
  detail: string;
}
