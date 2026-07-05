// Phase I — the adoption & change plan. Realize names adoption as the biggest
// value leak; this engine derives the treatment: a set of change-management
// interventions tailored to the audience and the program's current evidence,
// each with a modeled adoption uplift. Deterministic, offline, and honest —
// uplifts are directional planning numbers, not measurements.

export interface AdoptionIntervention {
  id: string;
  label: string;
  detail: string;
  /** Modeled adoption uplift in percentage points if executed well. */
  upliftPts: number;
  owner: string;
  horizon: "pre-launch" | "launch" | "first 90 days";
  /** Suggested as part of the default plan for this initiative. */
  recommended: boolean;
}

export interface AdoptionPlanInputs {
  audience?: string | null;      // Strategy params.user
  adoptionPct: number;           // current modeled adoption, 0..100
  citationAccuracy?: number;     // trust lever
  humanReviewRequired?: boolean; // workflow-integration lever
}

export const ADOPTION_TARGET = 75; // healthy-adoption reference, %
export const ADOPTION_CEILING = 90; // no plan gets everyone

export function deriveAdoptionPlan(inp: AdoptionPlanInputs): AdoptionIntervention[] {
  const internal = inp.audience !== "Customers" && inp.audience !== "Partners";
  const low = inp.adoptionPct < 55;
  const gapToTarget = Math.max(0, ADOPTION_TARGET - inp.adoptionPct);

  const plan: AdoptionIntervention[] = [
    {
      id: "workflow",
      label: internal ? "Embed in the existing workflow" : "Meet users where they already are",
      detail: internal
        ? "Surface answers inside the tool people already work in — no new tab, no separate login. Adoption follows the path of least resistance."
        : "Put the assistant on the pages and channels customers already use for help, not behind a new destination.",
      upliftPts: 8, owner: internal ? "Product + IT" : "Digital channel owner", horizon: "pre-launch",
      recommended: true,
    },
    {
      id: "champions",
      label: "Executive sponsor + champions network",
      detail: "A named sponsor sets the expectation; 1–2 champions per team translate it into daily habit and surface friction early.",
      upliftPts: 6, owner: "Business sponsor", horizon: "launch",
      recommended: low || internal,
    },
    {
      id: "trust",
      label: "Trust by default: citations visible",
      detail: "Show the evidence behind every answer. Users adopt what they can verify — especially in the first weeks when trust is being formed.",
      upliftPts: (inp.citationAccuracy ?? 90) < 90 ? 5 : 3, owner: "Build / RAG owner", horizon: "pre-launch",
      recommended: (inp.citationAccuracy ?? 90) < 90,
    },
    {
      id: "training",
      label: "Role-based training + office hours",
      detail: "Short, task-specific sessions (\"how to get your answer in 30 seconds\") beat generic demos. Weekly office hours catch the long tail.",
      upliftPts: 5, owner: "Enablement / L&D", horizon: "launch",
      recommended: internal,
    },
    {
      id: "feedback",
      label: "Feedback button with a visible fix loop",
      detail: "One-tap feedback, and — critically — visible fixes (\"you flagged it, we fixed it\"). Nothing builds usage like being heard.",
      upliftPts: 4, owner: "AI Ops", horizon: "first 90 days",
      recommended: true,
    },
    {
      id: "comms",
      label: "Launch comms + wins broadcast",
      detail: "Announce with a concrete before/after story, then broadcast real wins monthly. Social proof compounds.",
      upliftPts: 3, owner: "Comms / Change lead", horizon: "first 90 days",
      recommended: gapToTarget > 10,
    },
  ];

  return plan;
}

/** Projected adoption after executing the selected interventions, capped. */
export function projectAdoption(currentPct: number, selected: AdoptionIntervention[]): number {
  const uplift = selected.reduce((s, i) => s + i.upliftPts, 0);
  return Math.min(ADOPTION_CEILING, Math.round(currentPct + uplift));
}

// EL-01 · Adoption & change readiness — the weighted composite the gate reads.
// Readiness factors (0..100) combined with visible, editable weights, then
// normalized by the weight sum so the score stays on a 0..100 scale for ANY weights
// (that's what keeps a user-edited "your model" honest). Pure and framework-agnostic;
// tone/labels for the UI live in the component, not here.
export type ReadinessVerdict = "Scale" | "Scale with conditions" | "Hold";

/** Sum of the weights over the given keys; never zero (guards divide-by-zero). */
export const weightSumOf = <K extends string>(weights: Record<K, number>, keys: readonly K[]): number =>
  keys.reduce((a, k) => a + weights[k], 0) || 1;

/** Weight-normalized composite readiness, rounded to an integer 0..100. */
export const readinessComposite = <K extends string>(
  factors: Record<K, number>,
  weights: Record<K, number>,
  keys: readonly K[],
): number =>
  Math.round(keys.reduce((a, k) => a + weights[k] * factors[k], 0) / weightSumOf(weights, keys));

/** The gate verdict from a composite and the two (editable) cutoffs. */
export const readinessGate = (composite: number, scaleCut: number, condCut: number): ReadinessVerdict =>
  composite >= scaleCut ? "Scale" : composite >= condCut ? "Scale with conditions" : "Hold";

// Flip-the-gate — the minimal factor increases that lift the composite to a target
// (e.g. the Scale cutoff). The composite is a weight-normalized average, so each
// point added to a factor moves it by weight / Σweights; the cheapest way to close
// the gap is to spend points on the highest-weight factors that still have headroom.
// Greedy highest-weight-first therefore uses the fewest total points. Deterministic.
export interface GateMove<K extends string = string> {
  key: K;
  from: number;
  to: number;
  /** points added to this factor. */
  add: number;
}
export interface GatePlan<K extends string = string> {
  /** can the target be reached within the ceiling? */
  reachable: boolean;
  /** the factor increases, highest-leverage first. */
  moves: GateMove<K>[];
  /** total points moved across all factors. */
  totalAdded: number;
  /** the composite that results from applying the moves. */
  projected: number;
}

export function planToReachGate<K extends string>(
  factors: Record<K, number>,
  weights: Record<K, number>,
  keys: readonly K[],
  target: number,
  ceiling = 100,
): GatePlan<K> {
  const W = weightSumOf(weights, keys);
  const num = keys.reduce((a, k) => a + weights[k] * factors[k], 0);
  if (Math.round(num / W) >= target) {
    return { reachable: true, moves: [], totalAdded: 0, projected: Math.round(num / W) };
  }
  // Aim for num/W >= target, which guarantees the rounded composite clears the gate.
  let deficit = target * W - num;
  const order = [...keys].sort((a, b) => weights[b] - weights[a]); // highest leverage first
  const next = { ...factors } as Record<K, number>;
  const moves: GateMove<K>[] = [];
  for (const k of order) {
    if (deficit <= 1e-9) break;
    const headroom = ceiling - factors[k];
    if (headroom <= 0 || weights[k] <= 0) continue;
    const add = Math.min(headroom, Math.ceil(deficit / weights[k]));
    if (add <= 0) continue;
    next[k] = factors[k] + add;
    moves.push({ key: k, from: factors[k], to: next[k], add });
    deficit -= weights[k] * add;
  }
  const projected = readinessComposite(next, weights, keys);
  const totalAdded = moves.reduce((a, m) => a + m.add, 0);
  return { reachable: projected >= target, moves, totalAdded, projected };
}

// Sensitivity tornado — which factor has the most leverage on the composite right now.
// Raising factor k by Δ moves the (weight-normalized) composite by (weight_k/Σw)·Δ, so
// the most a single factor can add is its weight-share × its headroom to the ceiling.
// Ranked, that's where to spend the effort. Neat identity: the impacts sum to
// (ceiling − composite) — maxing everything lands exactly at the ceiling. Pure.
export interface FactorLever<K extends string = string> {
  key: K;
  /** composite points gained if this factor is raised to the ceiling. */
  impact: number;
  headroom: number;
  weightShare: number;
}
export function factorSensitivity<K extends string>(
  factors: Record<K, number>,
  weights: Record<K, number>,
  keys: readonly K[],
  ceiling = 100,
): FactorLever<K>[] {
  const W = weightSumOf(weights, keys);
  return keys
    .map((k) => {
      const weightShare = weights[k] / W;
      const headroom = Math.max(0, ceiling - factors[k]);
      return { key: k, weightShare, headroom, impact: weightShare * headroom };
    })
    .sort((a, b) => b.impact - a.impact);
}
