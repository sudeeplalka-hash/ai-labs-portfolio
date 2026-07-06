import type { RetrievalExperiment } from "@rag/types";

// Strategy experiments. Hybrid + reranking wins on quality; reranking adds latency.
export const retrievalExperiments: RetrievalExperiment[] = [
  { id: "rx-1", strategy: "Semantic search only", chunkingStrategy: "Fixed", chunkSize: 500, overlap: 100, precisionAtK: 0.62, recallAtK: 0.68, mrr: 0.61, ndcg: 0.66, retrievalScore: 68, faithfulnessScore: 72, latencyMs: 520, costPerQuery: 0.021, recommendation: "Baseline. Misses keyword-heavy policy lookups." },
  { id: "rx-2", strategy: "Keyword search only", chunkingStrategy: "Fixed", chunkSize: 500, overlap: 100, precisionAtK: 0.58, recallAtK: 0.6, mrr: 0.55, ndcg: 0.59, retrievalScore: 60, faithfulnessScore: 66, latencyMs: 240, costPerQuery: 0.012, recommendation: "Fast and cheap but weak on paraphrased questions." },
  { id: "rx-3", strategy: "Hybrid search", chunkingStrategy: "Fixed", chunkSize: 500, overlap: 100, precisionAtK: 0.74, recallAtK: 0.79, mrr: 0.73, ndcg: 0.77, retrievalScore: 81, faithfulnessScore: 79, latencyMs: 610, costPerQuery: 0.029, recommendation: "Strong balance. Adopted as the retrieval baseline." },
  { id: "rx-4", strategy: "Hybrid + reranking", chunkingStrategy: "Fixed", chunkSize: 500, overlap: 100, precisionAtK: 0.83, recallAtK: 0.86, mrr: 0.82, ndcg: 0.85, retrievalScore: 87, faithfulnessScore: 84, latencyMs: 1320, costPerQuery: 0.038, recommendation: "Best quality. Adds ~700ms; pushes P95 latency over SLA." },
  { id: "rx-5", strategy: "Query rewriting + hybrid", chunkingStrategy: "Fixed", chunkSize: 500, overlap: 100, precisionAtK: 0.79, recallAtK: 0.84, mrr: 0.78, ndcg: 0.82, retrievalScore: 84, faithfulnessScore: 82, latencyMs: 780, costPerQuery: 0.031, recommendation: "Improves ambiguous and multi-hop recall at moderate cost." },
  { id: "rx-6", strategy: "Metadata-filtered retrieval", chunkingStrategy: "Section-based", chunkSize: "section", overlap: "n/a", precisionAtK: 0.85, recallAtK: 0.82, mrr: 0.83, ndcg: 0.84, retrievalScore: 86, faithfulnessScore: 85, latencyMs: 700, costPerQuery: 0.03, recommendation: "Best for high risk policy lookups; filters out stale versions." },
];

// Chunking sweep with hybrid + reranking held constant.
export const chunkingExperiments: RetrievalExperiment[] = [
  { id: "ck-1", strategy: "Hybrid + reranking", chunkingStrategy: "Fixed", chunkSize: 300, overlap: 50, precisionAtK: 0.86, recallAtK: 0.78, mrr: 0.83, ndcg: 0.83, retrievalScore: 84, faithfulnessScore: 81, latencyMs: 1180, costPerQuery: 0.034, recommendation: "High precision but misses full context on multi-part answers." },
  { id: "ck-2", strategy: "Hybrid + reranking", chunkingStrategy: "Fixed", chunkSize: 500, overlap: 100, precisionAtK: 0.83, recallAtK: 0.86, mrr: 0.82, ndcg: 0.85, retrievalScore: 87, faithfulnessScore: 84, latencyMs: 1320, costPerQuery: 0.038, recommendation: "Best overall balance. Current production setting." },
  { id: "ck-3", strategy: "Hybrid + reranking", chunkingStrategy: "Fixed", chunkSize: 800, overlap: 150, precisionAtK: 0.76, recallAtK: 0.88, mrr: 0.78, ndcg: 0.83, retrievalScore: 84, faithfulnessScore: 83, latencyMs: 1480, costPerQuery: 0.044, recommendation: "Better completeness but lower precision and higher cost." },
  { id: "ck-4", strategy: "Hybrid + reranking", chunkingStrategy: "Section-based", chunkSize: "section", overlap: "n/a", precisionAtK: 0.85, recallAtK: 0.84, mrr: 0.84, ndcg: 0.86, retrievalScore: 86, faithfulnessScore: 85, latencyMs: 1260, costPerQuery: 0.037, recommendation: "Strong for structured policy docs; preserves clause boundaries." },
  { id: "ck-5", strategy: "Hybrid + reranking", chunkingStrategy: "Semantic", chunkSize: "variable", overlap: "n/a", precisionAtK: 0.84, recallAtK: 0.85, mrr: 0.83, ndcg: 0.85, retrievalScore: 86, faithfulnessScore: 85, latencyMs: 1390, costPerQuery: 0.041, recommendation: "Comparable quality; higher indexing complexity." },
];

// Retrieval metric cards for the page header.
export const retrievalMetricCards = [
  { id: "precision", label: "Precision@5", value: 0.83, target: 0.8, format: "ratio", interpretation: "83% of top-5 chunks are relevant after reranking, above the 0.80 target." },
  { id: "recall", label: "Recall@5", value: 0.86, target: 0.85, format: "ratio", interpretation: "Required evidence appears in the top 5 for 86% of queries." },
  { id: "mrr", label: "MRR", value: 0.82, target: 0.78, format: "ratio", interpretation: "The first relevant chunk usually appears near the top of results." },
  { id: "ndcg", label: "NDCG", value: 0.85, target: 0.82, format: "ratio", interpretation: "Graded ranking quality is strong; reranking ordered evidence well." },
  { id: "topk", label: "Top-K Success Rate", value: 88, target: 90, format: "pct", interpretation: "88% of queries had all required evidence within top-K; below the 90% target." },
  { id: "empty", label: "Empty Retrieval Rate", value: 2.4, target: 3, format: "pct-low", interpretation: "Few queries return no useful chunks; within tolerance." },
  { id: "utilization", label: "Context Utilization", value: 71, target: 70, format: "pct", interpretation: "71% of packed context is used in answers; some over-retrieval remains." },
  { id: "lift", label: "Reranker Lift", value: 7.4, target: 5, format: "pct", interpretation: "Reranking lifted retrieval quality by 7.4 points over hybrid baseline." },
];
