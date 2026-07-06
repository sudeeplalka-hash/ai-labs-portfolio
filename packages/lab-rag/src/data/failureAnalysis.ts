import type { FailureCategory, FailingDocument, FailureHeatmapCell } from "@rag/types";

export const failureCategories: FailureCategory[] = [
  { id: "f-citation", name: "Incorrect citation", count: 14, percentage: 23, severity: "High", likelyRootCause: "Citations map to topically related but non-supporting chunks; no claim-to-evidence overlap check.", recommendedFix: "Require token/semantic overlap between claim and cited span before surfacing a citation." },
  { id: "f-stale", name: "Stale source", count: 11, percentage: 18, severity: "High", likelyRootCause: "Retired document versions (Travel v2.7, AI Governance v1.3) remain in the index and outrank current versions.", recommendedFix: "Add freshness metadata and down-weight or exclude superseded versions at retrieval time." },
  { id: "f-unsupported", name: "Unsupported claim", count: 9, percentage: 15, severity: "Critical", likelyRootCause: "Model compresses multi-condition policies into a single condition, producing confident but unsupported claims.", recommendedFix: "Enforce claim-level grounding and refuse partial answers on critical-risk policies." },
  { id: "f-conflict", name: "Conflicting documents", count: 7, percentage: 11, severity: "High", likelyRootCause: "Overlapping guidance across travel/expense and AI governance documents without precedence rules.", recommendedFix: "Define document precedence and surface conflicts explicitly with current-version preference." },
  { id: "f-partial", name: "Partial context", count: 6, percentage: 10, severity: "Medium", likelyRootCause: "Required evidence ranked below the context cutoff (e.g. FIN-2.5 at rank 3).", recommendedFix: "Increase top-k for high risk domains and add metadata-filtered retrieval." },
  { id: "f-overgen", name: "Prompt overgeneralization", count: 5, percentage: 8, severity: "Medium", likelyRootCause: "Prompt encourages helpful completeness, leading to invented pre-approvals and scope expansion.", recommendedFix: "Constrain the prompt to answer only within retrieved scope; add an 'insufficient evidence' path." },
  { id: "f-missing", name: "Missing citation", count: 5, percentage: 8, severity: "Medium", likelyRootCause: "Material claims generated without any attached citation.", recommendedFix: "Block answers where material claims lack a citation; require coverage above threshold." },
  { id: "f-retrieval", name: "Retrieval miss", count: 4, percentage: 7, severity: "High", likelyRootCause: "Sparse coverage for ambiguous or multi-hop queries that need query decomposition.", recommendedFix: "Expand query rewriting and add multi-query retrieval for multi-hop questions." },
];

export const failingDocuments: FailingDocument[] = [
  { id: "fd-1", documentName: "Employee Travel Policy", version: "v2.7 (retired)", failedQueries: 8, dominantFailureMode: "Stale source conflicting with v3.2", riskLevel: "High", recommendedFix: "Remove retired version from the index or hard-filter by effective date." },
  { id: "fd-2", documentName: "AI Usage Governance Standard", version: "v1.3", failedQueries: 7, dominantFailureMode: "Ambiguous multi-condition sections; unsupported claims", riskLevel: "Critical", recommendedFix: "Revise ambiguous sections and add structured condition lists for grounding." },
  { id: "fd-3", documentName: "Finance Approval Matrix", version: "v1.6", failedQueries: 6, dominantFailureMode: "Unclear approval thresholds across tiers", riskLevel: "Critical", recommendedFix: "Clarify tier thresholds and chunk the matrix so each tier is independently retrievable." },
  { id: "fd-4", documentName: "Travel Policy Addendum", version: "v1.4", failedQueries: 4, dominantFailureMode: "Overlapping reimbursement guidance with main policy", riskLevel: "Medium", recommendedFix: "Merge the addendum into v3.2 or mark precedence explicitly." },
];

// Failure counts by domain and category for the heatmap.
export const failureHeatmap: FailureHeatmapCell[] = [
  { domain: "Finance", values: { "Incorrect citation": 4, "Stale source": 3, "Unsupported claim": 2, "Conflicting documents": 3, "Partial context": 2 } },
  { domain: "Compliance", values: { "Incorrect citation": 3, "Stale source": 4, "Unsupported claim": 4, "Conflicting documents": 2, "Partial context": 1 } },
  { domain: "Security", values: { "Incorrect citation": 2, "Stale source": 1, "Unsupported claim": 2, "Conflicting documents": 1, "Partial context": 2 } },
  { domain: "Legal", values: { "Incorrect citation": 3, "Stale source": 1, "Unsupported claim": 1, "Conflicting documents": 1, "Partial context": 1 } },
  { domain: "HR", values: { "Incorrect citation": 1, "Stale source": 2, "Unsupported claim": 0, "Conflicting documents": 0, "Partial context": 0 } },
  { domain: "Support", values: { "Incorrect citation": 1, "Stale source": 0, "Unsupported claim": 0, "Conflicting documents": 0, "Partial context": 0 } },
];

export const heatmapCategories = [
  "Incorrect citation",
  "Stale source",
  "Unsupported claim",
  "Conflicting documents",
  "Partial context",
];
