// Phase I, the adoption & change plan. Realize names adoption as the biggest
// value leak; this engine derives the treatment: a set of change-management
// interventions tailored to the audience and the program's current evidence,
// each with a modeled adoption uplift. Deterministic, offline, and honest, // uplifts are directional planning numbers, not measurements.

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
        ? "Surface answers inside the tool people already work in, no new tab, no separate login. Adoption follows the path of least resistance."
        : "Put the assistant on the pages and channels customers already use for help, not behind a new destination.",
      upliftPts: 8, owner: internal ? "Product + IT" : "Digital channel owner", horizon: "pre-launch",
      recommended: true,
    },
    {
      id: "champions",
      label: "Executive sponsor + champions network",
      detail: "A named sponsor sets the expectation; 1 to 2 champions per team translate it into daily habit and surface friction early.",
      upliftPts: 6, owner: "Business sponsor", horizon: "launch",
      recommended: low || internal,
    },
    {
      id: "trust",
      label: "Trust by default: citations visible",
      detail: "Show the evidence behind every answer. Users adopt what they can verify, especially in the first weeks when trust is being formed.",
      upliftPts: (inp.citationAccuracy ?? 90) < 90 ? 5 : 3, owner: "Build / RAG owner", horizon: "pre-launch",
      recommended: (inp.citationAccuracy ?? 90) < 90,
    },
    {
      id: "training",
      label: "Role based training + office hours",
      detail: "Short, task specific sessions (\"how to get your answer in 30 seconds\") beat generic demos. Weekly office hours catch the long tail.",
      upliftPts: 5, owner: "Enablement / L&D", horizon: "launch",
      recommended: internal,
    },
    {
      id: "feedback",
      label: "Feedback button with a visible fix loop",
      detail: "One tap feedback, and, critically, visible fixes (\"you flagged it, we fixed it\"). Nothing builds usage like being heard.",
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

// EL-01 · Adoption & change readiness, the weighted composite the gate reads.
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

// Flip-the-gate, the minimal factor increases that lift the composite to a target
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

// Sensitivity tornado, which factor has the most leverage on the composite right now.
// Raising factor k by Δ moves the (weight-normalized) composite by (weight_k/Σw)·Δ, so
// the most a single factor can add is its weight-share × its headroom to the ceiling.
// Ranked, that's where to spend the effort. Neat identity: the impacts sum to
// (ceiling − composite), maxing everything lands exactly at the ceiling. Pure.
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

// Two-week sequencing, turns the flat "fix these weak factors" list into an illustrative
// 14-day plan a steering committee can read as a schedule. The weakest factors start first
// and run longest (duration scales with how far below "healthy" each sits); later factors
// stagger in behind them. Deterministic and clamped to the horizon. This is a *sequencing
// aid*, not a project plan, the ordering and the "weakest gets the most days" rule are the
// honest point; the exact day counts are illustrative.
export interface PlanItem {
  key: string;
  label: string;
  score: number;
}
export interface PlanSpan {
  key: string;
  label: string;
  startDay: number;   // 0-based day index within the horizon
  endDay: number;     // exclusive
  durationDays: number;
  intensity: "focus" | "support";
}
export interface ScheduleOpts {
  horizonDays?: number;
  healthy?: number;
  minDays?: number;
  stagger?: number;
}
export function scheduleAdoptionPlan(items: PlanItem[], opts: ScheduleOpts = {}): PlanSpan[] {
  const horizon = opts.horizonDays ?? 14;
  const healthy = opts.healthy ?? 70;
  const minDays = opts.minDays ?? 3;
  const stagger = opts.stagger ?? 3;
  const sorted = [...items].sort((a, b) => a.score - b.score); // weakest first
  return sorted.map((it, i) => {
    const gap = Math.max(0, healthy - it.score);
    const dur = Math.min(horizon, Math.round(minDays + (gap / healthy) * (horizon - minDays)));
    const start = Math.min(i * stagger, horizon - minDays);
    const end = Math.min(horizon, start + Math.max(minDays, dur));
    return { key: it.key, label: it.label, startDay: start, endDay: end, durationDays: end - start, intensity: i < 2 ? "focus" : "support" };
  });
}

// Compare two populations, put two readiness vectors side by side under the same weights
// and gate, and attribute the composite gap to the factors that drive it. Each factor's
// contribution to (composite B − composite A) is its weight-share × the factor delta; the
// biggest-magnitude contribution is the "driver" of the difference. That turns "our rollout
// scores lower than the benchmark" into "…because sponsorship is 30 points behind." Pure;
// the contributions sum to the (un-rounded) composite gap.
export interface FactorDelta<K extends string = string> {
  key: K;
  a: number;
  b: number;
  delta: number;        // b - a
  contribution: number; // signed contribution to (compositeB - compositeA)
}
export interface ReadinessComparison<K extends string = string> {
  compositeA: number;
  compositeB: number;
  compositeDelta: number; // compositeB - compositeA (rounded composites)
  verdictA: ReadinessVerdict;
  verdictB: ReadinessVerdict;
  deltas: FactorDelta<K>[];      // per factor, largest |contribution| first
  driver: FactorDelta<K> | null; // the factor that moves the gap most (null if identical)
}
export function compareReadiness<K extends string>(
  a: Record<K, number>,
  b: Record<K, number>,
  weights: Record<K, number>,
  keys: readonly K[],
  scaleCut: number,
  condCut: number,
): ReadinessComparison<K> {
  const W = weightSumOf(weights, keys);
  const compositeA = readinessComposite(a, weights, keys);
  const compositeB = readinessComposite(b, weights, keys);
  const deltas = keys
    .map((k) => {
      const delta = b[k] - a[k];
      return { key: k, a: a[k], b: b[k], delta, contribution: (weights[k] / W) * delta };
    })
    .sort((x, y) => Math.abs(y.contribution) - Math.abs(x.contribution));
  const driver = deltas.length > 0 && deltas[0].contribution !== 0 ? deltas[0] : null;
  return {
    compositeA,
    compositeB,
    compositeDelta: compositeB - compositeA,
    verdictA: readinessGate(compositeA, scaleCut, condCut),
    verdictB: readinessGate(compositeB, scaleCut, condCut),
    deltas,
    driver,
  };
}

// Readiness trajectory, ties the flip-the-gate moves and the two-week schedule together
// into one projection: as each factor's fix runs over its scheduled span, its score ramps
// from current to target, and the weighted composite is recomputed day by day. The result
// is the curve to the Scale cutoff, and the day it (illustratively) crosses. Reuses the
// tested scheduler and composite, so the curve and the plan can't drift. Pure.
export interface TrajectoryPoint { day: number; composite: number; }
export interface Trajectory {
  points: TrajectoryPoint[];
  startComposite: number;
  endComposite: number;
  gateDay: number | null; // first day the composite reaches the target
  target: number;
}
export function readinessTrajectory<K extends string>(
  factors: Record<K, number>,
  moves: { key: K; from: number; to: number }[],
  weights: Record<K, number>,
  keys: readonly K[],
  target: number,
  opts: ScheduleOpts = {},
): Trajectory {
  const horizon = opts.horizonDays ?? 14;
  const spans = scheduleAdoptionPlan(moves.map((m) => ({ key: m.key, label: m.key, score: m.from })), opts);
  const spanOf = (k: K) => spans.find((s) => s.key === k);
  const moveOf = (k: K) => moves.find((m) => m.key === k);
  const valueAt = (k: K, day: number): number => {
    const mv = moveOf(k);
    const sp = spanOf(k);
    if (!mv || !sp) return factors[k];
    const frac = day <= sp.startDay ? 0 : day >= sp.endDay ? 1 : (day - sp.startDay) / (sp.endDay - sp.startDay);
    return mv.from + (mv.to - mv.from) * frac;
  };
  const points: TrajectoryPoint[] = [];
  for (let day = 0; day <= horizon; day++) {
    const fs = {} as Record<K, number>;
    for (const k of keys) fs[k] = valueAt(k, day);
    points.push({ day, composite: readinessComposite(fs, weights, keys) });
  }
  const gateHit = points.find((p) => p.composite >= target);
  return {
    points,
    startComposite: points[0].composite,
    endComposite: points[points.length - 1].composite,
    gateDay: gateHit ? gateHit.day : null,
    target,
  };
}
