import type { OperationalRecord } from "@rag/types";

// 10 weekly operational records. P95 latency rises after reranker rollout (week 6+).
export const operations: OperationalRecord[] = [
  { id: "op-1", date: "2026-04-13", avgLatencyMs: 2100, p95LatencyMs: 3100, retrievalLatencyMs: 520, rerankingLatencyMs: 0, generationLatencyMs: 1180, evaluationLatencyMs: 240, costPerQuery: 0.026, tokenUsage: 3100, cacheHitRate: 31, errorRate: 0.9, timeoutRate: 0.3 },
  { id: "op-2", date: "2026-04-20", avgLatencyMs: 2180, p95LatencyMs: 3250, retrievalLatencyMs: 540, rerankingLatencyMs: 0, generationLatencyMs: 1210, evaluationLatencyMs: 250, costPerQuery: 0.028, tokenUsage: 3180, cacheHitRate: 33, errorRate: 0.8, timeoutRate: 0.3 },
  { id: "op-3", date: "2026-04-27", avgLatencyMs: 2240, p95LatencyMs: 3350, retrievalLatencyMs: 560, rerankingLatencyMs: 0, generationLatencyMs: 1240, evaluationLatencyMs: 250, costPerQuery: 0.029, tokenUsage: 3220, cacheHitRate: 35, errorRate: 0.8, timeoutRate: 0.4 },
  { id: "op-4", date: "2026-05-04", avgLatencyMs: 2300, p95LatencyMs: 3500, retrievalLatencyMs: 580, rerankingLatencyMs: 0, generationLatencyMs: 1260, evaluationLatencyMs: 260, costPerQuery: 0.03, tokenUsage: 3280, cacheHitRate: 36, errorRate: 0.7, timeoutRate: 0.4 },
  { id: "op-5", date: "2026-05-11", avgLatencyMs: 2520, p95LatencyMs: 4300, retrievalLatencyMs: 590, rerankingLatencyMs: 700, generationLatencyMs: 1280, evaluationLatencyMs: 280, costPerQuery: 0.038, tokenUsage: 3400, cacheHitRate: 38, errorRate: 0.9, timeoutRate: 0.7 },
  { id: "op-6", date: "2026-05-18", avgLatencyMs: 2600, p95LatencyMs: 4400, retrievalLatencyMs: 600, rerankingLatencyMs: 720, generationLatencyMs: 1300, evaluationLatencyMs: 290, costPerQuery: 0.04, tokenUsage: 3460, cacheHitRate: 39, errorRate: 1.0, timeoutRate: 0.8 },
  { id: "op-7", date: "2026-05-25", avgLatencyMs: 2580, p95LatencyMs: 4350, retrievalLatencyMs: 595, rerankingLatencyMs: 710, generationLatencyMs: 1290, evaluationLatencyMs: 285, costPerQuery: 0.041, tokenUsage: 3440, cacheHitRate: 41, errorRate: 0.9, timeoutRate: 0.7 },
  { id: "op-8", date: "2026-06-01", avgLatencyMs: 2620, p95LatencyMs: 4300, retrievalLatencyMs: 600, rerankingLatencyMs: 700, generationLatencyMs: 1300, evaluationLatencyMs: 290, costPerQuery: 0.042, tokenUsage: 3480, cacheHitRate: 43, errorRate: 0.8, timeoutRate: 0.6 },
  { id: "op-9", date: "2026-06-08", avgLatencyMs: 2590, p95LatencyMs: 4250, retrievalLatencyMs: 595, rerankingLatencyMs: 690, generationLatencyMs: 1290, evaluationLatencyMs: 285, costPerQuery: 0.042, tokenUsage: 3470, cacheHitRate: 45, errorRate: 0.7, timeoutRate: 0.5 },
  { id: "op-10", date: "2026-06-15", avgLatencyMs: 2600, p95LatencyMs: 4250, retrievalLatencyMs: 600, rerankingLatencyMs: 695, generationLatencyMs: 1295, evaluationLatencyMs: 285, costPerQuery: 0.042, tokenUsage: 3480, cacheHitRate: 46, errorRate: 0.7, timeoutRate: 0.5 },
];

// Quality vs cost / latency scatter points (one per evaluation run).
export const qualityTradeoffs = [
  { run: "v1", quality: 64, cost: 0.021, p95: 2.9 },
  { run: "v2", quality: 69, cost: 0.026, p95: 3.1 },
  { run: "v3", quality: 73, cost: 0.029, p95: 3.3 },
  { run: "v4", quality: 76, cost: 0.038, p95: 4.3 },
  { run: "v5", quality: 76, cost: 0.041, p95: 4.4 },
  { run: "v6", quality: 78, cost: 0.042, p95: 4.25 },
];

export const opsRecommendations = [
  { id: "or-1", title: "Bring P95 latency under the 4s SLA", severity: "High", detail: "Reranking added ~700ms and pushed P95 to 4.25s. Cache reranker scores for repeat queries and reduce rerank candidate count from 50 to 30." },
  { id: "or-2", title: "Raise cache hit rate", severity: "Medium", detail: "Cache hit rate climbed to 46% but most policy lookups are repetitive. A normalized query cache could push this above 60% and cut both latency and cost." },
  { id: "or-3", title: "Hold cost per query under target", severity: "Low", detail: "At $0.042 the system is under the $0.045 target, but adding more evaluation passes will erode the margin. Sample evaluation on low risk traffic." },
];
