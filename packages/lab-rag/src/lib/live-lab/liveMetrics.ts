import type { LiveLabMetrics, LiveRagLabTrace } from "@rag/types/liveLab";

const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const r1 = (n: number) => Math.round(n * 10) / 10;

// Aggregate stored traces into live dashboard metrics. Derived, never hardcoded.
export function aggregateLiveMetrics(traces: LiveRagLabTrace[]): LiveLabMetrics {
  const evals = traces.map((t) => t.evaluation);
  return {
    questionsAsked: traces.length,
    averageOverallQuality: r1(avg(evals.map((e) => e.overallQuality))),
    averageRetrievalRelevance: r1(avg(evals.map((e) => e.retrievalRelevance))),
    averageFaithfulness: r1(avg(evals.map((e) => e.faithfulness))),
    averageCitationAccuracy: r1(avg(evals.map((e) => e.citationAccuracy))),
    averageHallucinationRisk: r1(avg(evals.map((e) => e.hallucinationRisk))),
    humanReviewRequiredCount: evals.filter((e) => e.humanReviewRequired).length,
    averageLatency: Math.round(avg(traces.map((t) => t.latencyMs))),
    averageEstimatedCost: Math.round(avg(traces.map((t) => t.estimatedCost)) * 1_000_000) / 1_000_000,
    failedQualityGates: evals.filter((e) => e.qualityGateStatus === "Failed").length,
    warningQualityGates: evals.filter((e) => e.qualityGateStatus === "Warning").length,
    passedQualityGates: evals.filter((e) => e.qualityGateStatus === "Passed").length,
  };
}

const STORAGE_KEY = "rag-live-lab-traces-v1";

// LocalStorage persistence (guarded for SSR). Lets metrics survive reloads and
// feed the Executive Overview live-lab card.
export function loadStoredTraces(): LiveRagLabTrace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LiveRagLabTrace[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredTraces(traces: LiveRagLabTrace[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(traces.slice(0, 50)));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function clearStoredTraces(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
