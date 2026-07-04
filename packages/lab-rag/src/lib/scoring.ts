import type {
  ClaimVerification,
  EvaluationRun,
  GateStatus,
  QualityGate,
  QueryTrace,
  ReleaseRecommendation,
  RiskLevel,
} from "@rag/types";
import { THRESHOLDS } from "@rag/lib/constants";

export interface OverallScoreInputs {
  retrievalQuality: number;
  faithfulness: number;
  citationAccuracy: number;
  hallucinationRisk: number;
  operationalReliability: number;
  governanceReadiness: number;
}

// Weighted overall quality score, matching the published evaluation formula.
export function calculateOverallQualityScore(m: OverallScoreInputs): number {
  const score =
    m.retrievalQuality * 0.25 +
    m.faithfulness * 0.25 +
    m.citationAccuracy * 0.2 +
    (100 - m.hallucinationRisk) * 0.15 +
    m.operationalReliability * 0.1 +
    m.governanceReadiness * 0.05;
  return Math.round(score * 10) / 10;
}

export interface ReadinessLevel {
  level: number;
  name: string;
}

export function calculateProductionReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return { level: 5, name: "Enterprise Scale" };
  if (score >= 80) return { level: 4, name: "Production Managed" };
  if (score >= 65) return { level: 3, name: "Controlled Pilot" };
  if (score >= 50) return { level: 2, name: "Measured Prototype" };
  return { level: 1, name: "Basic Demo" };
}

export interface RegressionResult {
  status: "No Regression" | "Watch" | "Regression";
  reasons: string[];
}

// Compare a run against its predecessor using the documented regression rules.
export function calculateRegressionStatus(
  current: EvaluationRun,
  previous?: EvaluationRun,
): RegressionResult {
  if (!previous) return { status: "No Regression", reasons: ["No prior run to compare against."] };
  const reasons: string[] = [];
  const c = current.metrics;
  const p = previous.metrics;

  const overallDrop = p.overallScore - c.overallScore;
  const citationDrop = p.citationAccuracy - c.citationAccuracy;

  let regression = false;
  let watch = false;

  if (overallDrop > THRESHOLDS.maxOverallRegression) {
    regression = true;
    reasons.push(`Overall score dropped ${overallDrop.toFixed(1)} pts (limit ${THRESHOLDS.maxOverallRegression}).`);
  }
  if (citationDrop > THRESHOLDS.maxCitationRegression) {
    regression = true;
    reasons.push(`Citation accuracy dropped ${citationDrop.toFixed(1)} pts (limit ${THRESHOLDS.maxCitationRegression}).`);
  }
  if (c.criticalFailures > p.criticalFailures) {
    regression = true;
    reasons.push(`Critical failures increased from ${p.criticalFailures} to ${c.criticalFailures}.`);
  }
  if (c.p95LatencyMs > THRESHOLDS.p95LatencyMs && c.p95LatencyMs > p.p95LatencyMs) {
    watch = true;
    reasons.push(`P95 latency rose to ${(c.p95LatencyMs / 1000).toFixed(2)}s, above the ${(THRESHOLDS.p95LatencyMs / 1000).toFixed(0)}s target.`);
  }
  if (c.highRiskPassRate < p.highRiskPassRate - 2) {
    watch = true;
    reasons.push(`High-risk pass rate fell ${(p.highRiskPassRate - c.highRiskPassRate).toFixed(1)} pts.`);
  }
  if (c.costPerQuery > THRESHOLDS.costPerQuery) {
    watch = true;
    reasons.push(`Cost per query ($${c.costPerQuery.toFixed(3)}) exceeds target ($${THRESHOLDS.costPerQuery.toFixed(3)}).`);
  }

  if (reasons.length === 0) reasons.push("All tracked metrics are within regression tolerances.");
  if (regression) return { status: "Regression", reasons };
  if (watch) return { status: "Watch", reasons };
  return { status: "No Regression", reasons };
}

// Release decision hierarchy based on gate severity and status.
export function getReleaseRecommendation(gates: QualityGate[]): ReleaseRecommendation {
  const anyCriticalFailed = gates.some((g) => g.severity === "Critical" && g.status === "Failed");
  if (anyCriticalFailed) return "Block";
  const anyHighFailed = gates.some((g) => g.severity === "High" && g.status === "Failed");
  if (anyHighFailed) return "Hold";
  const anyFailed = gates.some((g) => g.status === "Failed");
  if (anyFailed) return "Hold";
  const anyWarning = gates.some((g) => g.status === "Warning");
  if (anyWarning) return "Promote with Monitoring";
  return "Promote";
}

export function summarizeGates(gates: QualityGate[]): Record<GateStatus, number> {
  return gates.reduce(
    (acc, g) => {
      acc[g.status] += 1;
      return acc;
    },
    { Passed: 0, Warning: 0, Failed: 0, "Not Evaluated": 0 } as Record<GateStatus, number>,
  );
}

export function calculateRiskDistribution(traces: QueryTrace[]): Record<RiskLevel, number> {
  return traces.reduce(
    (acc, t) => {
      acc[t.riskLevel] += 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<RiskLevel, number>,
  );
}

// Share of claims (0-100) that are fully or partially supported.
export function calculateClaimSupportScore(claims: ClaimVerification[]): number {
  if (claims.length === 0) return 0;
  const weight: Record<string, number> = {
    Supported: 1,
    "Partially Supported": 0.5,
    "Not Enough Evidence": 0.25,
    Unsupported: 0,
    Contradicted: 0,
  };
  const total = claims.reduce((sum, c) => sum + (weight[c.supportStatus] ?? 0), 0);
  return Math.round((total / claims.length) * 100);
}
