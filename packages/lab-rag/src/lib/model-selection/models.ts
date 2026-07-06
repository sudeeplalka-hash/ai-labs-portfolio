// ============================================================================
// LLM selection, the decision that sits in front of RAG tuning.
//
// Before you tune retrieval, you choose the engine. This module is a small,
// deterministic decision aid: representative model *archetypes* scored on the
// criteria that actually drive an enterprise choice, weighted by a scenario.
//
// The per-criterion scores are illustrative profiles of the landscape (higher =
// better on that axis, with cost/latency/ops already inverted so "higher is
// better" holds everywhere). They are NOT live benchmarks, the point is to make
// the *method* explicit and let the recommendation move as priorities change.
// ============================================================================

export type CriterionId =
  | "capability"
  | "cost"
  | "latency"
  | "context"
  | "dataControl"
  | "portability"
  | "customization"
  | "opsSimplicity";

export interface Criterion {
  id: CriterionId;
  label: string;
  /** One-line meaning, and which direction "good" points. */
  hint: string;
}

export const CRITERIA: Criterion[] = [
  { id: "capability", label: "Capability & quality", hint: "Reasoning depth and answer quality on hard, ambiguous questions." },
  { id: "cost", label: "Cost efficiency", hint: "Cost per query at your volume, higher score means cheaper to run." },
  { id: "latency", label: "Speed / latency", hint: "Time to first/last token, higher score means faster responses." },
  { id: "context", label: "Context headroom", hint: "How much retrieved evidence and history it can hold per call." },
  { id: "dataControl", label: "Data residency & control", hint: "Does data stay inside your boundary, higher means more control." },
  { id: "portability", label: "Portability", hint: "How easily you can switch providers later, higher means less lock-in." },
  { id: "customization", label: "Customizability", hint: "Fine tuning, adapters, and domain specialization you can apply." },
  { id: "opsSimplicity", label: "Operational simplicity", hint: "How little infra/MLOps you must run, higher means less burden." },
];

export type Deployment = "Hosted API" | "Regional hosted" | "Self-hosted (VPC / on-prem)";

export interface ModelOption {
  id: string;
  name: string;
  tagline: string;
  deployment: Deployment;
  openWeights: boolean;
  scores: Record<CriterionId, number>; // 0..100, higher = better
  costNote: string;
  latencyNote: string;
  contextNote: string;
  bestFor: string;
  watchOut: string;
  examples: string; // generic, non-committal examples of the archetype
}

export const MODELS: ModelOption[] = [
  {
    id: "frontier-flagship",
    name: "Frontier hosted, flagship",
    tagline: "Top of the capability curve, via a managed API.",
    deployment: "Hosted API",
    openWeights: false,
    scores: { capability: 96, cost: 32, latency: 55, context: 88, dataControl: 30, portability: 25, customization: 55, opsSimplicity: 96 },
    costNote: "Highest $/query",
    latencyNote: "Moderate",
    contextNote: "Very large context window",
    bestFor: "The hardest reasoning, long-document synthesis, and agentic chains where quality is non-negotiable.",
    watchOut: "Priciest per call, data leaves your boundary, and you inherit vendor lock-in and rate limits.",
    examples: "e.g. the flagship tier of a major hosted provider",
  },
  {
    id: "frontier-fast",
    name: "Frontier hosted, fast / mini",
    tagline: "Most of the quality, a fraction of the cost and latency.",
    deployment: "Hosted API",
    openWeights: false,
    scores: { capability: 80, cost: 76, latency: 92, context: 76, dataControl: 30, portability: 28, customization: 50, opsSimplicity: 96 },
    costNote: "Low to moderate $/query",
    latencyNote: "Fast",
    contextNote: "Large context window",
    bestFor: "High-volume, latency-sensitive workloads that still need solid reasoning, the workhorse default.",
    watchOut: "Lower ceiling on the genuinely hard queries; still hosted, so residency and lock-in remain.",
    examples: "e.g. the fast/mini tier of a major hosted provider",
  },
  {
    id: "open-large",
    name: "Open-weights, large (self-hosted)",
    tagline: "Strong model you run inside your own boundary.",
    deployment: "Self-hosted (VPC / on-prem)",
    openWeights: true,
    scores: { capability: 85, cost: 60, latency: 50, context: 72, dataControl: 96, portability: 95, customization: 96, opsSimplicity: 30 },
    costNote: "Infra cost, no per-token bill",
    latencyNote: "Depends on your GPUs",
    contextNote: "Good context window",
    bestFor: "Regulated or sovereign data, deep customization, and avoiding a per-token vendor bill at scale.",
    watchOut: "Real GPU + MLOps burden, you own capacity, uptime, patching, and evals.",
    examples: "e.g. a large open-weights family hosted in your VPC",
  },
  {
    id: "open-small",
    name: "Open-weights, small (self-hosted / edge)",
    tagline: "Cheap, fast, private, for narrower tasks.",
    deployment: "Self-hosted (VPC / on-prem)",
    openWeights: true,
    scores: { capability: 60, cost: 90, latency: 86, context: 56, dataControl: 96, portability: 95, customization: 92, opsSimplicity: 46 },
    costNote: "Very low $/query",
    latencyNote: "Fast on modest hardware",
    contextNote: "Smaller context window",
    bestFor: "On-prem or edge deployment, cost-critical volume, and well-scoped tasks you can fine tune for.",
    watchOut: "Limited raw reasoning; usually needs fine tuning or tight retrieval to hit quality.",
    examples: "e.g. a small open-weights model on commodity hardware",
  },
  {
    id: "regional-hosted",
    name: "Regional / sovereign hosted",
    tagline: "Managed convenience with a residency guarantee.",
    deployment: "Regional hosted",
    openWeights: false,
    scores: { capability: 75, cost: 56, latency: 66, context: 70, dataControl: 80, portability: 45, customization: 50, opsSimplicity: 86 },
    costNote: "Moderate $/query",
    latencyNote: "Moderate",
    contextNote: "Good context window",
    bestFor: "Meeting data-residency rules without running infrastructure yourself.",
    watchOut: "Smaller model menu, still a managed dependency, and partial lock-in.",
    examples: "e.g. an in-region cloud or sovereign AI offering",
  },
  {
    id: "router",
    name: "Multi-model router",
    tagline: "A gateway that sends each query to the cheapest model that can handle it.",
    deployment: "Hosted API",
    openWeights: false,
    scores: { capability: 88, cost: 80, latency: 68, context: 80, dataControl: 38, portability: 62, customization: 64, opsSimplicity: 54 },
    costNote: "Blended, cheap on easy queries",
    latencyNote: "Moderate (routing hop)",
    contextNote: "Varies by target model",
    bestFor: "Mixed workloads, route easy questions to a cheap model and hard ones to a flagship, optimizing cost and quality together.",
    watchOut: "You own the routing logic, evals, and fallbacks; a misroute quietly costs quality or money.",
    examples: "e.g. a model gateway in front of several providers",
  },
  {
    id: "reasoning",
    name: "Reasoning-specialized tier",
    tagline: "Spends more compute to think through hard, multistep problems.",
    deployment: "Hosted API",
    openWeights: false,
    scores: { capability: 98, cost: 24, latency: 30, context: 86, dataControl: 30, portability: 26, customization: 45, opsSimplicity: 95 },
    costNote: "Very high $/answer",
    latencyNote: "Slow (deliberate)",
    contextNote: "Large context window",
    bestFor: "Genuinely hard analysis, planning, math, or code where a slower, deeper answer is worth it.",
    watchOut: "Slowest and priciest per answer, overkill and frustrating for simple lookups.",
    examples: "e.g. a reasoning-optimized hosted tier",
  },
  {
    id: "multimodal",
    name: "Multimodal generalist",
    tagline: "Handles text plus images, scans, charts, and audio in one pipeline.",
    deployment: "Hosted API",
    openWeights: false,
    scores: { capability: 84, cost: 46, latency: 56, context: 82, dataControl: 30, portability: 30, customization: 50, opsSimplicity: 92 },
    costNote: "Moderate to high $/query",
    latencyNote: "Moderate",
    contextNote: "Large, multimodal context",
    bestFor: "Inputs beyond text, scanned documents, screenshots, diagrams, or audio that retrieval needs to read.",
    watchOut: "Pays a premium for vision/audio; text-only quality can trail a text-specialized peer at the same price.",
    examples: "e.g. a vision + text hosted model",
  },
  {
    id: "fine tuned-specialist",
    name: "Fine tuned small specialist",
    tagline: "An open base trained for one repeatable task.",
    deployment: "Self-hosted (VPC / on-prem)",
    openWeights: true,
    scores: { capability: 70, cost: 88, latency: 86, context: 52, dataControl: 92, portability: 84, customization: 98, opsSimplicity: 40 },
    costNote: "Very low $/query at scale",
    latencyNote: "Fast",
    contextNote: "Smaller context window",
    bestFor: "A narrow, high volume task you can train for, often the best $/quality once it's dialed in.",
    watchOut: "Upfront labeled data and a training/eval loop; brittle outside its trained domain.",
    examples: "e.g. a fine tuned open base for one workflow",
  },
];

// Relative run-cost and latency multipliers vs a typical hosted workhorse (1.0).
// These let a chosen engine actually move Deploy's cost/latency envelope and,
// transitively, Realize's ROI, not just label them.
export const ENGINE_FACTORS: Record<string, { cost: number; latency: number }> = {
  "frontier-flagship": { cost: 3.0, latency: 1.6 },
  "frontier-fast": { cost: 0.7, latency: 0.7 },
  "open-large": { cost: 1.2, latency: 1.3 },
  "open-small": { cost: 0.35, latency: 0.7 },
  "regional-hosted": { cost: 1.1, latency: 1.1 },
  "router": { cost: 0.8, latency: 1.15 },
  "reasoning": { cost: 5.0, latency: 2.6 },
  "multimodal": { cost: 1.5, latency: 1.2 },
  "fine tuned-specialist": { cost: 0.4, latency: 0.7 },
};

export interface Scenario {
  id: string;
  label: string;
  blurb: string;
  weights: Record<CriterionId, number>; // 0..5
}

const W = (
  capability: number, cost: number, latency: number, context: number,
  dataControl: number, portability: number, customization: number, opsSimplicity: number,
): Record<CriterionId, number> => ({ capability, cost, latency, context, dataControl, portability, customization, opsSimplicity });

export const SCENARIOS: Scenario[] = [
  { id: "balanced", label: "Balanced", blurb: "No strong constraint, weigh everything evenly.", weights: W(3, 3, 3, 3, 3, 3, 3, 3) },
  { id: "quality", label: "Max quality", blurb: "Hard reasoning; quality beats cost.", weights: W(5, 1, 2, 4, 1, 1, 1, 2) },
  { id: "volume", label: "High volume / cost", blurb: "Lots of cheap, fast queries.", weights: W(2, 5, 5, 1, 2, 3, 1, 3) },
  { id: "regulated", label: "Regulated / data-sensitive", blurb: "Privacy and residency lead.", weights: W(3, 2, 2, 2, 5, 4, 3, 2) },
  { id: "sovereign", label: "On-prem / sovereign", blurb: "Data must stay in-house.", weights: W(3, 3, 2, 2, 5, 5, 4, 1) },
  { id: "lean", label: "Lean team / low ops", blurb: "Few hands to run infra.", weights: W(3, 4, 3, 2, 1, 2, 1, 5) },
];

export const DEFAULT_SCENARIO = "balanced";

export interface ScoredModel {
  model: ModelOption;
  /** 0..100 weighted fit for the active weights. */
  fit: number;
  /** Per-criterion weighted contribution (weight * score), for rationale. */
  contributions: { id: CriterionId; label: string; weighted: number; score: number; weight: number }[];
}

/** Weighted, normalized fit score for one model. */
export function scoreModel(model: ModelOption, weights: Record<CriterionId, number>): ScoredModel {
  let weightedSum = 0;
  let weightTotal = 0;
  const contributions = CRITERIA.map((c) => {
    const weight = weights[c.id] ?? 0;
    const score = model.scores[c.id] ?? 0;
    weightedSum += weight * score;
    weightTotal += weight;
    return { id: c.id, label: c.label, weighted: weight * score, score, weight };
  });
  const fit = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;
  return { model, fit, contributions };
}

/** Rank all models by fit (desc). Ties break by capability, then cost. */
export function rankModels(weights: Record<CriterionId, number>): ScoredModel[] {
  return MODELS.map((m) => scoreModel(m, weights)).sort(
    (a, b) =>
      b.fit - a.fit ||
      b.model.scores.capability - a.model.scores.capability ||
      b.model.scores.cost - a.model.scores.cost,
  );
}

/** The two criteria a model leads on (highest weighted contribution). */
export function topStrengths(scored: ScoredModel, n = 2): string[] {
  return [...scored.contributions]
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, n)
    .map((c) => c.label);
}

/** A heavily-weighted criterion where this model is weak (score < 55). */
export function keyWeakness(scored: ScoredModel): string | null {
  const weak = [...scored.contributions]
    .filter((c) => c.weight >= 3 && c.score < 55)
    .sort((a, b) => b.weight - a.weight || a.score - b.score)[0];
  return weak ? weak.label : null;
}

/** Suggest a scenario from the framed initiative's posture/risk (Live mode). */
export function suggestScenario(posture?: string | null, risk?: string | null): string {
  const p = (posture ?? "").toLowerCase();
  const r = (risk ?? "").toLowerCase();
  if (/reg|compliance|phi|hipaa|pii|sensitive|high/.test(r)) return "regulated";
  if (/cost|efficien|volume|scale|lean/.test(p)) return "volume";
  if (/quality|ambitious|frontier|innovat/.test(p)) return "quality";
  if (/sovereign|on-?prem|residency/.test(p + r)) return "sovereign";
  return "balanced";
}
